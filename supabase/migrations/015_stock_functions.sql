-- ─────────────────────────────────────────────────────────────────────────────
-- 015_stock_functions.sql
--
-- PostgreSQL functions for atomic stock operations.
-- Called via Supabase RPC from lib/db/inventory.ts.
-- All three use advisory locks / SELECT FOR UPDATE to prevent race conditions.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── reserve_stock_for_order ─────────────────────────────────────────────────
--
-- Atomically reserves stock for each item in an order.
-- Input: p_items JSONB array of { product_id, variant_id, quantity, order_id }
-- Raises an exception if any item has insufficient available stock.
--
CREATE OR REPLACE FUNCTION reserve_stock_for_order(p_items JSONB)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  item JSONB;
  v_inventory_id UUID;
  v_available    INT;
  v_qty          INT;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_qty := (item->>'quantity')::INT;

    -- Find the inventory row (lock it for the duration of this transaction)
    SELECT id, available_stock
      INTO v_inventory_id, v_available
      FROM inventory
     WHERE product_id = (item->>'product_id')::UUID
       AND (
         variant_id = (item->>'variant_id')::UUID
         OR (variant_id IS NULL AND item->>'variant_id' IS NULL)
       )
     FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'No inventory record for product_id=%', item->>'product_id';
    END IF;

    IF v_available < v_qty THEN
      RAISE EXCEPTION 'Insufficient stock for product_id=%. Available: %, Requested: %',
        item->>'product_id', v_available, v_qty;
    END IF;

    -- Reserve the stock
    UPDATE inventory
       SET reserved_stock = reserved_stock + v_qty
     WHERE id = v_inventory_id;

    -- Record the movement
    INSERT INTO inventory_movements (
      inventory_id, previous_qty, new_qty, change_qty,
      change_type, reason, order_id
    )
    SELECT
      v_inventory_id,
      v_available,
      v_available - v_qty,
      -v_qty,
      'order_reserved',
      'Reserved for order',
      (item->>'order_id')::UUID;
  END LOOP;
END;
$$;

-- ─── release_stock_for_order ─────────────────────────────────────────────────
--
-- Releases all stock reservations associated with an order (on cancellation).
-- Input: p_order_id UUID, p_reason TEXT
--
CREATE OR REPLACE FUNCTION release_stock_for_order(p_order_id UUID, p_reason TEXT DEFAULT 'order_cancelled')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item         RECORD;
  v_inventory_id UUID;
  v_available    INT;
BEGIN
  -- Iterate over each order item that has a reservation
  FOR v_item IN
    SELECT oi.product_id, oi.variant_id, oi.quantity
      FROM order_items oi
     WHERE oi.order_id = p_order_id
  LOOP
    SELECT id, available_stock
      INTO v_inventory_id, v_available
      FROM inventory
     WHERE product_id = v_item.product_id
       AND (
         variant_id = v_item.variant_id
         OR (variant_id IS NULL AND v_item.variant_id IS NULL)
       )
     FOR UPDATE;

    IF NOT FOUND THEN
      CONTINUE; -- Inventory row removed — skip gracefully
    END IF;

    -- Only release up to the amount actually reserved
    UPDATE inventory
       SET reserved_stock = GREATEST(0, reserved_stock - v_item.quantity)
     WHERE id = v_inventory_id;

    INSERT INTO inventory_movements (
      inventory_id, previous_qty, new_qty, change_qty,
      change_type, reason, order_id
    )
    SELECT
      v_inventory_id,
      v_available,
      v_available + v_item.quantity,
      v_item.quantity,
      'order_released',
      p_reason,
      p_order_id;
  END LOOP;
END;
$$;

-- ─── adjust_stock_manual ─────────────────────────────────────────────────────
--
-- Manually adjusts total_stock for an inventory row (admin use only).
-- Input: p_inventory_id UUID, p_change_qty INT (signed), p_change_type TEXT,
--        p_reason TEXT, p_actor_id UUID
-- Raises an exception if the adjustment would take available_stock below zero.
--
CREATE OR REPLACE FUNCTION adjust_stock_manual(
  p_inventory_id UUID,
  p_change_qty   INT,
  p_change_type  TEXT,
  p_reason       TEXT,
  p_actor_id     UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current   RECORD;
  v_new_total INT;
BEGIN
  SELECT total_stock, reserved_stock, available_stock
    INTO v_current
    FROM inventory
   WHERE id = p_inventory_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Inventory record % not found', p_inventory_id;
  END IF;

  v_new_total := v_current.total_stock + p_change_qty;

  IF v_new_total - v_current.reserved_stock < 0 THEN
    RAISE EXCEPTION 'Adjustment would bring available stock below zero. '
      'total=%, reserved=%, change=%',
      v_current.total_stock, v_current.reserved_stock, p_change_qty;
  END IF;

  IF v_new_total < 0 THEN
    RAISE EXCEPTION 'Total stock cannot go below zero';
  END IF;

  UPDATE inventory
     SET total_stock = v_new_total
   WHERE id = p_inventory_id;

  INSERT INTO inventory_movements (
    inventory_id, previous_qty, new_qty, change_qty,
    change_type, reason, actor_id
  )
  VALUES (
    p_inventory_id,
    v_current.available_stock,
    v_new_total - v_current.reserved_stock,
    p_change_qty,
    p_change_type::change_type,
    p_reason,
    p_actor_id
  );
END;
$$;
