-- ─────────────────────────────────────────────────────────────────────────────
-- 018_customer_role_enum.sql  (A10-T1-1, part 1 of 2)
--
-- Adds the 'customer' value to user_role.
--
-- Kept in its own migration on purpose: a new enum value cannot be used in the
-- same transaction that adds it, and 019 uses it as a column default.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'customer';
