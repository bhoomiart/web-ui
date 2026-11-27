-- ─────────────────────────────────────────────────────────────────────────────
-- 022_shipping_rates.sql  (A10-T1-6)
--
-- Per-state shipping rates, edited by admins at /admin/settings/shipping.
--
-- state = '*' is the fallback used when a state has no active rate.
-- free_above: order subtotal at or above this amount ships free (NULL = never).
--
-- Seed values are PLACEHOLDERS (₹120, free above ₹2,000). Replace with real rates.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE shipping_rates (
  state       TEXT PRIMARY KEY,
  fee         NUMERIC(10,2) NOT NULL CHECK (fee >= 0),
  free_above  NUMERIC(10,2) CHECK (free_above IS NULL OR free_above >= 0),
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_shipping_rates_updated_at
  BEFORE UPDATE ON shipping_rates
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE shipping_rates ENABLE ROW LEVEL SECURITY;

-- Rates are not sensitive (the customer sees the fee at checkout).
CREATE POLICY "shipping_rates: public read"
  ON shipping_rates FOR SELECT
  USING (TRUE);

CREATE POLICY "shipping_rates: admin write"
  ON shipping_rates FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Same 36 names as INDIA_STATES in CheckoutPageClient.tsx, plus the fallback.
INSERT INTO shipping_rates (state, fee, free_above)
SELECT s, 120, 2000
FROM unnest(ARRAY[
  '*',
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
  'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh',
  'Dadra & Nagar Haveli and Daman & Diu', 'Delhi', 'Jammu & Kashmir', 'Ladakh',
  'Lakshadweep', 'Puducherry'
]) AS s
ON CONFLICT (state) DO NOTHING;
