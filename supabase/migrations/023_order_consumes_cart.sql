-- ─────────────────────────────────────────────────────────────────────────────
-- 023_order_consumes_cart.sql  (A10-T6)
--
-- create_order_with_stock() now also empties the customer's server cart inside
-- the same transaction (new optional parameter p_clear_cart_for).
--
-- Why: checkout reads the server cart, then creates the order. Two requests at
-- once (double click, two tabs) would both read the same cart and both order.
-- Deleting the cart rows is the first write, so the second request waits on the
-- row locks, finds nothing to delete, raises CART_CHANGED, and rolls back
-- without reserving stock.
--
-- The cart must hold exactly the lines being ordered. If another device added or
-- removed a line since validation, the count differs and the order is refused
-- (CART_CHANGED) so the customer sees the new cart before paying.
--
-- Same contract and errors as 020, plus: CART_CHANGED.
-- ─────────────────────────────────────────────────────────────────────────────

DROP FUNCTION IF EXISTS create_order_with_stock(JSONB, JSONB);

CREATE OR REPLACE FUNCTION create_order_with_stock(
  p_order          JSONB,
  p_items          JSONB,
  p_clear_cart_for UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id      UUID := NULLIF(p_order ->> 'user_id', '')::UUID;
  v_order_id     UUID;
  v_order_number TEXT;
  v_attempt      INT := 0;
  v_item         JSONB;
  v_product      RECORD;
  v_inv          RECORD;
  v_qty          INT;
  v_price        NUMERIC(10,2);
  v_sum          NUMERIC(10,2) := 0;
  v_cleared      INT;
  v_subtotal     NUMERIC(10,2) := (p_order ->> 'subtotal')::NUMERIC;
  v_shipping     NUMERIC(10,2) := COALESCE((p_order ->> 'shipping_fee')::NUMERIC, 0);
  v_discount     NUMERIC(10,2) := COALESCE((p_order ->> 'discount_amount')::NUMERIC, 0);
  v_total        NUMERIC(10,2) := (p_order ->> 'total')::NUMERIC;
BEGIN
  IF v_user_id IS NULL
     OR p_items IS NULL
     OR jsonb_typeof(p_items) <> 'array'
     OR jsonb_array_length(p_items) = 0
     OR COALESCE(trim(p_order ->> 'customer_name'), '') = ''
     OR COALESCE(trim(p_order ->> 'phone'), '') = '' THEN
    RAISE EXCEPTION 'INVALID_INPUT';
  END IF;

  IF p_clear_cart_for IS NOT NULL AND p_clear_cart_for <> v_user_id THEN
    RAISE EXCEPTION 'INVALID_INPUT';
  END IF;

  LOOP
    v_attempt := v_attempt + 1;
    v_order_number := 'BA-'
      || to_char(NOW() AT TIME ZONE 'Asia/Kolkata', 'YYYYMMDD')
      || '-' || lpad(floor(random() * 10000)::INT::TEXT, 4, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM orders WHERE order_number = v_order_number);
    IF v_attempt >= 20 THEN
      RAISE EXCEPTION 'INVALID_INPUT' USING DETAIL = 'order number generation failed';
    END IF;
  END LOOP;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    v_qty   := (v_item ->> 'quantity')::INT;
    v_price := (v_item ->> 'unit_price')::NUMERIC;
    IF v_qty IS NULL OR v_qty < 1 OR v_price IS NULL OR v_price < 0 THEN
      RAISE EXCEPTION 'INVALID_INPUT';
    END IF;
    v_sum := v_sum + v_qty * v_price;
  END LOOP;

  IF v_subtotal IS NULL OR v_total IS NULL
     OR v_sum <> v_subtotal
     OR v_total <> v_subtotal + v_shipping - v_discount THEN
    RAISE EXCEPTION 'TOTAL_MISMATCH'
      USING DETAIL = jsonb_build_object('items_sum', v_sum, 'subtotal', v_subtotal, 'total', v_total)::TEXT;
  END IF;

  -- First write: take the cart. A concurrent checkout blocks here, then finds nothing.
  IF p_clear_cart_for IS NOT NULL THEN
    WITH d AS (
      DELETE FROM cart_items
       WHERE cart_id IN (SELECT id FROM carts WHERE user_id = p_clear_cart_for)
      RETURNING 1
    )
    SELECT count(*) INTO v_cleared FROM d;

    IF v_cleared <> jsonb_array_length(p_items) THEN
      RAISE EXCEPTION 'CART_CHANGED'
        USING DETAIL = jsonb_build_object('expected', jsonb_array_length(p_items), 'found', v_cleared)::TEXT;
    END IF;
  END IF;

  INSERT INTO orders (
    order_number, user_id, customer_name, phone, email,
    address_line1, address_line2, city, state, postal_code,
    notes, customization,
    subtotal_amount, shipping_fee, discount_amount, total_amount
  )
  VALUES (
    v_order_number, v_user_id,
    trim(p_order ->> 'customer_name'), trim(p_order ->> 'phone'),
    NULLIF(trim(p_order ->> 'email'), ''),
    NULLIF(trim(p_order ->> 'address_line1'), ''),
    NULLIF(trim(p_order ->> 'address_line2'), ''),
    NULLIF(trim(p_order ->> 'city'), ''),
    NULLIF(trim(p_order ->> 'state'), ''),
    NULLIF(trim(p_order ->> 'postal_code'), ''),
    NULLIF(trim(p_order ->> 'notes'), ''),
    NULLIF(trim(p_order ->> 'customization'), ''),
    v_subtotal, v_shipping, v_discount, v_total
  )
  RETURNING id INTO v_order_id;

  -- Lock rows in a fixed order (product, variant) so two checkouts that share
  -- products cannot deadlock each other.
  FOR v_item IN
    SELECT value
      FROM jsonb_array_elements(p_items)
     ORDER BY value ->> 'product_id', COALESCE(value ->> 'variant_id', '')
  LOOP
    v_qty := (v_item ->> 'quantity')::INT;

    SELECT id, status, availability_type
      INTO v_product
      FROM products
     WHERE id = (v_item ->> 'product_id')::UUID;

    IF NOT FOUND OR v_product.status <> 'active' OR v_product.availability_type = 'out_of_stock' THEN
      RAISE EXCEPTION 'PRODUCT_UNAVAILABLE'
        USING DETAIL = jsonb_build_object('product_id', v_item ->> 'product_id')::TEXT;
    END IF;

    INSERT INTO order_items (order_id, product_id, variant_id, quantity, unit_price, item_total, snapshot)
    VALUES (
      v_order_id,
      (v_item ->> 'product_id')::UUID,
      NULLIF(v_item ->> 'variant_id', '')::UUID,
      v_qty,
      (v_item ->> 'unit_price')::NUMERIC,
      v_qty * (v_item ->> 'unit_price')::NUMERIC,
      COALESCE(v_item -> 'snapshot', '{}'::JSONB)
    );

    IF v_product.availability_type <> 'ready_to_ship' THEN
      CONTINUE;
    END IF;

    SELECT id, available_stock, tracking_enabled
      INTO v_inv
      FROM inventory
     WHERE product_id = v_product.id
       AND variant_id IS NOT DISTINCT FROM NULLIF(v_item ->> 'variant_id', '')::UUID
       FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'NO_INVENTORY'
        USING DETAIL = jsonb_build_object('product_id', v_item ->> 'product_id', 'variant_id', v_item ->> 'variant_id')::TEXT;
    END IF;

    IF NOT v_inv.tracking_enabled THEN
      CONTINUE;
    END IF;

    IF v_inv.available_stock < v_qty THEN
      RAISE EXCEPTION 'INSUFFICIENT_STOCK'
        USING DETAIL = jsonb_build_object(
          'product_id', v_item ->> 'product_id',
          'variant_id', v_item ->> 'variant_id',
          'available',  v_inv.available_stock,
          'requested',  v_qty
        )::TEXT;
    END IF;

    UPDATE inventory
       SET reserved_stock = reserved_stock + v_qty
     WHERE id = v_inv.id;

    INSERT INTO inventory_movements (
      inventory_id, previous_qty, new_qty, change_qty, change_type, reason, order_id
    )
    VALUES (
      v_inv.id,
      v_inv.available_stock,
      v_inv.available_stock - v_qty,
      -v_qty,
      'order_reserved',
      'Reserved for order ' || v_order_number,
      v_order_id
    );
  END LOOP;

  INSERT INTO order_status_history (order_id, new_status, notes)
  VALUES (v_order_id, 'pending', 'Order created');

  RETURN jsonb_build_object('order_id', v_order_id, 'order_number', v_order_number);
END;
$$;

REVOKE ALL ON FUNCTION create_order_with_stock(JSONB, JSONB, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION create_order_with_stock(JSONB, JSONB, UUID) TO service_role;
