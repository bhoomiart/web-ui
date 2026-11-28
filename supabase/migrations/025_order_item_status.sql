-- ─────────────────────────────────────────────────────────────────────────────
-- 025_order_item_status.sql
--
-- Each order line (order_items) now has its own status. orders.status is derived
-- from the lines and is never set directly by the app.
--
--   * order_items.status
--   * order_status_history.order_item_id (NULL = order-level entry)
--   * derive_order_status()      : the one rule that turns line statuses into an order status
--   * apply_item_status()        : change lines, write history, release stock on cancel,
--                                  recompute the order, all in one transaction
--   * create_return_request()    : validate + create a return for delivered lines atomically
--   * release_stock_for_order()  : dropped, replaced by per-line release in apply_item_status
--
-- Service role only (same rule as 024).
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS status order_status NOT NULL DEFAULT 'pending';

ALTER TABLE order_status_history
  ADD COLUMN IF NOT EXISTS order_item_id UUID REFERENCES order_items ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_order_items_order_status ON order_items (order_id, status);
CREATE INDEX IF NOT EXISTS idx_order_status_history_item ON order_status_history (order_item_id);

-- Existing lines take their order's current status.
UPDATE order_items oi SET status = o.status FROM orders o WHERE o.id = oi.order_id;

-- ─── derive_order_status ─────────────────────────────────────────────────────
-- Cancelled lines are ignored. All lines cancelled -> cancelled. Otherwise the
-- order shows the EARLIEST stage any remaining line is still at, so a half-shipped
-- order reads "processing", and an order with one returned line stays "delivered".
CREATE OR REPLACE FUNCTION derive_order_status(p_order_id UUID)
RETURNS order_status
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_ranks TEXT[] := ARRAY[
    'pending','confirmed','cancellation_requested','processing','customization_in_progress',
    'ready_for_dispatch','shipped','delivered','return_requested','return_approved',
    'return_rejected','return_in_transit','returned','refund_requested','refund_under_review',
    'refund_approved','refund_processing','partially_refunded','refunded','refund_rejected'
  ];
  v_status order_status;
BEGIN
  SELECT status INTO v_status
    FROM order_items
   WHERE order_id = p_order_id AND status <> 'cancelled'
   ORDER BY array_position(v_ranks, status::text)
   LIMIT 1;

  IF v_status IS NULL THEN
    RETURN 'cancelled';
  END IF;
  RETURN v_status;
END;
$$;

-- ─── apply_item_status ───────────────────────────────────────────────────────
-- Returns the number of lines that changed.
CREATE OR REPLACE FUNCTION apply_item_status(
  p_order_id  UUID,
  p_item_ids  UUID[],
  p_new_status order_status,
  p_actor_id  UUID,
  p_notes     TEXT DEFAULT NULL
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item         RECORD;
  v_inventory_id UUID;
  v_available    INT;
  v_changed      INT := 0;
  v_prev_order   order_status;
  v_new_order    order_status;
BEGIN
  -- Serialise concurrent changes to the same order
  SELECT status INTO v_prev_order FROM orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order % not found', p_order_id;
  END IF;

  FOR v_item IN
    SELECT id, product_id, variant_id, quantity, status
      FROM order_items
     WHERE order_id = p_order_id AND id = ANY (p_item_ids)
     FOR UPDATE
  LOOP
    IF v_item.status = p_new_status THEN
      CONTINUE;
    END IF;

    UPDATE order_items SET status = p_new_status WHERE id = v_item.id;

    INSERT INTO order_status_history (order_id, order_item_id, previous_status, new_status, actor_id, notes)
    VALUES (p_order_id, v_item.id, v_item.status::text, p_new_status::text, p_actor_id, p_notes);

    -- Cancelling a line gives its reserved stock back
    IF p_new_status = 'cancelled' THEN
      SELECT id, available_stock INTO v_inventory_id, v_available
        FROM inventory
       WHERE product_id = v_item.product_id
         AND (variant_id = v_item.variant_id OR (variant_id IS NULL AND v_item.variant_id IS NULL))
       FOR UPDATE;

      IF FOUND THEN
        UPDATE inventory
           SET reserved_stock = GREATEST(0, reserved_stock - v_item.quantity)
         WHERE id = v_inventory_id;

        INSERT INTO inventory_movements (
          inventory_id, previous_qty, new_qty, change_qty, change_type, reason, order_id
        ) VALUES (
          v_inventory_id, v_available, v_available + v_item.quantity, v_item.quantity,
          'order_released', 'Order line cancelled', p_order_id
        );
      END IF;
    END IF;

    v_changed := v_changed + 1;
  END LOOP;

  IF v_changed > 0 THEN
    v_new_order := derive_order_status(p_order_id);
    IF v_new_order IS DISTINCT FROM v_prev_order THEN
      UPDATE orders SET status = v_new_order WHERE id = p_order_id;
      INSERT INTO order_status_history (order_id, previous_status, new_status, actor_id, notes)
      VALUES (p_order_id, v_prev_order::text, v_new_order::text, p_actor_id, 'Order status follows its items');
    END IF;
  END IF;

  RETURN v_changed;
END;
$$;

-- ─── create_return_request ───────────────────────────────────────────────────
-- Only delivered lines that have never been in a return can be returned.
-- A whole line is returned (no partial quantities).
CREATE OR REPLACE FUNCTION create_return_request(
  p_order_id    UUID,
  p_reason      return_reason,
  p_description TEXT,
  p_item_ids    UUID[]
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_return_id UUID;
  v_item      RECORD;
  v_count     INT := 0;
BEGIN
  PERFORM 1 FROM orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ORDER_NOT_FOUND';
  END IF;

  IF p_item_ids IS NULL OR array_length(p_item_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'NO_ITEMS';
  END IF;

  INSERT INTO return_requests (order_id, reason, description)
  VALUES (p_order_id, p_reason, p_description)
  RETURNING id INTO v_return_id;

  FOR v_item IN
    SELECT id, quantity, status
      FROM order_items
     WHERE order_id = p_order_id AND id = ANY (p_item_ids)
     FOR UPDATE
  LOOP
    IF v_item.status <> 'delivered' THEN
      RAISE EXCEPTION 'ITEM_NOT_RETURNABLE';
    END IF;
    IF EXISTS (SELECT 1 FROM return_request_items WHERE order_item_id = v_item.id) THEN
      RAISE EXCEPTION 'ITEM_ALREADY_RETURNED';
    END IF;
    INSERT INTO return_request_items (return_request_id, order_item_id, quantity)
    VALUES (v_return_id, v_item.id, v_item.quantity);
    v_count := v_count + 1;
  END LOOP;

  -- Every requested id must have matched a line of this order
  IF v_count <> (SELECT count(DISTINCT x) FROM unnest(p_item_ids) AS x) THEN
    RAISE EXCEPTION 'ITEM_NOT_IN_ORDER';
  END IF;

  PERFORM apply_item_status(p_order_id, p_item_ids, 'return_requested', NULL, 'Return requested by customer');
  RETURN v_return_id;
END;
$$;

-- Replaced by the per-line release inside apply_item_status
DROP FUNCTION IF EXISTS release_stock_for_order(UUID, TEXT);

REVOKE ALL ON FUNCTION derive_order_status(UUID)                                   FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION apply_item_status(UUID, UUID[], order_status, UUID, TEXT)   FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION create_return_request(UUID, return_reason, TEXT, UUID[])    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION derive_order_status(UUID)                                 TO service_role;
GRANT EXECUTE ON FUNCTION apply_item_status(UUID, UUID[], order_status, UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION create_return_request(UUID, return_reason, TEXT, UUID[])  TO service_role;
