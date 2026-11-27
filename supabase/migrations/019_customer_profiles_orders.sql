-- ─────────────────────────────────────────────────────────────────────────────
-- 019_customer_profiles_orders.sql  (A10-T1-1, T1-3)
--
-- 1. Stops new sign-ups from becoming 'staff'.
--    Before this, profiles.role defaulted to 'staff' and handle_new_user did not
--    set a role, so any new auth user (including a customer) passed
--    requireStaff() / is_admin_or_staff().
-- 2. Stores phone on the profile.
-- 3. Links orders to the signed-in customer and stores price breakdown.
-- 4. Removes anonymous order inserts (guest checkout is retired). All order
--    writes go through the service role in POST /api/checkout.
-- 5. Lets a customer read only their own orders.
--
-- Existing profile rows are NOT changed.
-- Staff and admins are created by an admin setting profiles.role explicitly.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Profiles ────────────────────────────────────────────────────────────────

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;

ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'customer';

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Role is always 'customer' here. Never read it from user-supplied metadata.
  INSERT INTO public.profiles (id, email, phone, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NULLIF(NEW.phone, ''),
    NULLIF(left(NEW.raw_user_meta_data ->> 'full_name', 120), ''),
    'customer'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- ─── Orders: owner + price breakdown ─────────────────────────────────────────

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS user_id         UUID REFERENCES auth.users ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS subtotal_amount NUMERIC(10,2),               -- NULL on legacy guest orders
  ADD COLUMN IF NOT EXISTS shipping_fee    NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (shipping_fee >= 0),
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  ADD COLUMN IF NOT EXISTS total_amount    NUMERIC(10,2);               -- NULL on legacy guest orders

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders (user_id, created_at DESC);

-- ─── Orders: RLS ─────────────────────────────────────────────────────────────

-- Guest checkout is retired. Orders are created only by the service role.
DROP POLICY IF EXISTS "orders: anon insert"      ON orders;
DROP POLICY IF EXISTS "order_items: anon insert" ON order_items;

CREATE POLICY "orders: owner read"
  ON orders FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "order_items: owner read"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_items.order_id
        AND o.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "order_status_history: owner read"
  ON order_status_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_status_history.order_id
        AND o.user_id = (SELECT auth.uid())
    )
  );
