-- ─────────────────────────────────────────────────────────────────────────────
-- 029_customer_addresses.sql
--
-- Saved delivery addresses, managed by the customer (address book).
--   * Owner-only RLS: a signed-in customer reads and writes only their own rows.
--   * At most 10 per customer.
--   * Exactly one default per customer, kept by triggers:
--       first address becomes the default
--       marking one as default clears the others
--       deleting the default promotes the most recently updated remaining address
-- Orders keep their own copy of the address (orders.address_*), so editing or
-- deleting a saved address never changes a past order.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE customer_addresses (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  label         TEXT,
  full_name     TEXT NOT NULL,
  phone         TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city          TEXT NOT NULL,
  state         TEXT NOT NULL,
  postal_code   TEXT NOT NULL,
  is_default    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customer_addresses_user ON customer_addresses (user_id, is_default DESC, updated_at DESC);
CREATE UNIQUE INDEX uq_customer_addresses_one_default ON customer_addresses (user_id) WHERE is_default;

CREATE TRIGGER set_customer_addresses_updated_at
  BEFORE UPDATE ON customer_addresses
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Limit + first-address-is-default
CREATE OR REPLACE FUNCTION customer_addresses_before_insert()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE v_count INT;
BEGIN
  SELECT count(*) INTO v_count FROM customer_addresses WHERE user_id = NEW.user_id;
  IF v_count >= 10 THEN
    RAISE EXCEPTION 'ADDRESS_LIMIT';
  END IF;
  IF v_count = 0 THEN
    NEW.is_default := TRUE;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER customer_addresses_before_insert
  BEFORE INSERT ON customer_addresses
  FOR EACH ROW EXECUTE FUNCTION customer_addresses_before_insert();

-- Only one default: clear the others BEFORE the row is written, so the unique index holds
CREATE OR REPLACE FUNCTION customer_addresses_single_default()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.is_default THEN
    UPDATE customer_addresses SET is_default = FALSE
     WHERE user_id = NEW.user_id AND id <> NEW.id AND is_default;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER customer_addresses_single_default
  BEFORE INSERT OR UPDATE OF is_default ON customer_addresses
  FOR EACH ROW EXECUTE FUNCTION customer_addresses_single_default();

-- Deleting the default promotes another address
CREATE OR REPLACE FUNCTION customer_addresses_after_delete()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF OLD.is_default THEN
    UPDATE customer_addresses SET is_default = TRUE
     WHERE id = (
       SELECT id FROM customer_addresses
        WHERE user_id = OLD.user_id ORDER BY updated_at DESC LIMIT 1
     );
  END IF;
  RETURN NULL;
END;
$$;
CREATE TRIGGER customer_addresses_after_delete
  AFTER DELETE ON customer_addresses
  FOR EACH ROW EXECUTE FUNCTION customer_addresses_after_delete();

REVOKE ALL ON FUNCTION customer_addresses_before_insert() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION customer_addresses_single_default() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION customer_addresses_after_delete()  FROM PUBLIC, anon, authenticated;

ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customer_addresses: owner select" ON customer_addresses
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "customer_addresses: owner insert" ON customer_addresses
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "customer_addresses: owner update" ON customer_addresses
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "customer_addresses: owner delete" ON customer_addresses
  FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));
