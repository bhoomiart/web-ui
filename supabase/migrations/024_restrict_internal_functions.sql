-- ─────────────────────────────────────────────────────────────────────────────
-- 024_restrict_internal_functions.sql  (A10-T7)
--
-- Internal functions were callable by anyone through the public REST API
-- (/rest/v1/rpc/...). With customer accounts that matters, so only the service
-- role may call them. The app already calls the stock functions through the
-- service-role client only (lib/db/inventory.ts).
--
-- NOT changed on purpose: is_admin() and is_admin_or_staff(). Row-level
-- security policies call them as the signed-in role, so that role needs EXECUTE.
--
-- handle_new_user() and rls_auto_enable() are trigger functions. Postgres checks
-- EXECUTE when a trigger is created, not each time it fires, so revoking the
-- public grant does not stop sign-ups from creating a profile.
-- ─────────────────────────────────────────────────────────────────────────────

REVOKE ALL ON FUNCTION adjust_stock_manual(UUID, INT, change_type, TEXT, UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION release_stock_for_order(UUID, TEXT)                     FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION reserve_stock_for_order(JSONB)                          FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION handle_new_user()                                       FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION rls_auto_enable()                                       FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION adjust_stock_manual(UUID, INT, change_type, TEXT, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION release_stock_for_order(UUID, TEXT)                     TO service_role;
GRANT EXECUTE ON FUNCTION reserve_stock_for_order(JSONB)                          TO service_role;
