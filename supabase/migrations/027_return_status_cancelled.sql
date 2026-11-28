-- 027_return_status_cancelled.sql
-- A customer can cancel a return request while it is still pending.
-- Separate migration: a new enum value cannot be used in the transaction that adds it.
ALTER TYPE return_status ADD VALUE IF NOT EXISTS 'cancelled';
