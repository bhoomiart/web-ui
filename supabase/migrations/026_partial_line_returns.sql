-- ─────────────────────────────────────────────────────────────────────────────
-- 026_partial_line_returns.sql
--
-- A customer can return part of a line (2 of 3 units). The line is split:
--   * the original line keeps the units that stay with the customer
--   * a new line (same product, variant, unit price, snapshot) holds the returned
--     units and carries the return status
-- Order totals do not change (unit_price x quantity is the same across both lines).
-- The new line copies the original's delivered date so the return window is right.
--
-- p_items: JSON array of { "item_id": uuid, "quantity": int }
-- ─────────────────────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS create_return_request(UUID, return_reason, TEXT, UUID[]);

CREATE OR REPLACE FUNCTION create_return_request(
  p_order_id    UUID,
  p_reason      return_reason,
  p_description TEXT,
  p_items       JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_return_id   UUID;
  v_req         JSONB;
  v_line        order_items%ROWTYPE;
  v_qty         INT;
  v_target_id   UUID;
  v_delivered   TIMESTAMPTZ;
  v_target_ids  UUID[] := '{}';
  v_seen        UUID[] := '{}';
BEGIN
  PERFORM 1 FROM orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ORDER_NOT_FOUND';
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'NO_ITEMS';
  END IF;

  INSERT INTO return_requests (order_id, reason, description)
  VALUES (p_order_id, p_reason, p_description)
  RETURNING id INTO v_return_id;

  FOR v_req IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT * INTO v_line
      FROM order_items
     WHERE id = (v_req ->> 'item_id')::UUID AND order_id = p_order_id
     FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'ITEM_NOT_IN_ORDER';
    END IF;
    IF v_line.id = ANY (v_seen) THEN
      RAISE EXCEPTION 'ITEM_DUPLICATE';
    END IF;
    v_seen := v_seen || v_line.id;

    v_qty := (v_req ->> 'quantity')::INT;
    IF v_qty IS NULL OR v_qty < 1 OR v_qty > v_line.quantity THEN
      RAISE EXCEPTION 'INVALID_QUANTITY';
    END IF;
    IF v_line.status <> 'delivered' THEN
      RAISE EXCEPTION 'ITEM_NOT_RETURNABLE';
    END IF;
    IF EXISTS (SELECT 1 FROM return_request_items WHERE order_item_id = v_line.id) THEN
      RAISE EXCEPTION 'ITEM_ALREADY_RETURNED';
    END IF;

    IF v_qty = v_line.quantity THEN
      v_target_id := v_line.id;
    ELSE
      -- Split: the returned units become their own line
      UPDATE order_items
         SET quantity = v_line.quantity - v_qty,
             item_total = v_line.unit_price * (v_line.quantity - v_qty)
       WHERE id = v_line.id;

      INSERT INTO order_items (order_id, product_id, variant_id, quantity, unit_price, item_total, snapshot, status)
      VALUES (p_order_id, v_line.product_id, v_line.variant_id, v_qty, v_line.unit_price,
              v_line.unit_price * v_qty, v_line.snapshot, 'delivered')
      RETURNING id INTO v_target_id;

      SELECT max(created_at) INTO v_delivered
        FROM order_status_history
       WHERE order_item_id = v_line.id AND new_status = 'delivered';

      INSERT INTO order_status_history (order_id, order_item_id, previous_status, new_status, notes, created_at)
      VALUES (p_order_id, v_target_id, NULL, 'delivered',
              'Split from a larger line for a partial return', COALESCE(v_delivered, NOW()));
    END IF;

    INSERT INTO return_request_items (return_request_id, order_item_id, quantity)
    VALUES (v_return_id, v_target_id, v_qty);
    v_target_ids := v_target_ids || v_target_id;
  END LOOP;

  PERFORM apply_item_status(p_order_id, v_target_ids, 'return_requested', NULL, 'Return requested by customer');
  RETURN v_return_id;
END;
$$;

REVOKE ALL ON FUNCTION create_return_request(UUID, return_reason, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION create_return_request(UUID, return_reason, TEXT, JSONB) TO service_role;
