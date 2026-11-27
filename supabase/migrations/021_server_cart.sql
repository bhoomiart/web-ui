-- ─────────────────────────────────────────────────────────────────────────────
-- 021_server_cart.sql  (A10-T1-5)
--
-- Server-side cart for signed-in customers (multi-device).
--
-- - One cart per user.
-- - Prices are NOT stored. They are read live on every cart fetch.
-- - A cart never reserves stock. Reservation happens at order creation only.
-- - Owner-only RLS. Route handlers also validate every write against stock.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE carts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL UNIQUE REFERENCES auth.users ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE cart_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cart_id     UUID NOT NULL REFERENCES carts ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES products ON DELETE CASCADE,
  variant_id  UUID REFERENCES product_variants ON DELETE CASCADE,
  quantity    INT NOT NULL CHECK (quantity BETWEEN 1 AND 99),
  -- NULL variant_id values are distinct in a plain UNIQUE constraint, so
  -- uniqueness uses this generated key. It also gives upserts a conflict target.
  variant_key UUID GENERATED ALWAYS AS (COALESCE(variant_id, '00000000-0000-0000-0000-000000000000'::UUID)) STORED,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (cart_id, product_id, variant_key)
);

CREATE INDEX idx_cart_items_cart    ON cart_items (cart_id);
CREATE INDEX idx_cart_items_product ON cart_items (product_id);

CREATE TRIGGER set_carts_updated_at      BEFORE UPDATE ON carts      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_cart_items_updated_at BEFORE UPDATE ON cart_items FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE carts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "carts: owner all"
  ON carts FOR ALL
  TO authenticated
  USING      (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "cart_items: owner all"
  ON cart_items FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM carts c WHERE c.id = cart_items.cart_id AND c.user_id = (SELECT auth.uid()))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM carts c WHERE c.id = cart_items.cart_id AND c.user_id = (SELECT auth.uid()))
  );
