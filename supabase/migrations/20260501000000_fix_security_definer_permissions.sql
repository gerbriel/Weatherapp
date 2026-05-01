-- ============================================================
-- Security Fix: Revoke public EXECUTE on SECURITY DEFINER functions
-- Date: 2026-05-01
--
-- Supabase linter warnings resolved:
--   1. create_organization_with_admin — callable by anon (should be authenticated only)
--   2. delete_user                    — callable by anon (should be authenticated only)
--   3. handle_new_user                — callable by anon + authenticated (trigger only, never RPC)
--   4. Leaked password protection     — handled via dashboard (see note at bottom)
-- ============================================================


-- ============================================================
-- 1. handle_new_user
--    This is a trigger function fired by auth.users INSERT.
--    It is NEVER meant to be called directly via RPC.
--    Revoke EXECUTE from both anon and authenticated.
-- ============================================================
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;

-- The trigger itself runs as the function owner (SECURITY DEFINER), not the caller,
-- so revoking EXECUTE from roles does NOT break the trigger.


-- ============================================================
-- 2. delete_user
--    Should only be callable by the authenticated user deleting
--    their own account. Revoke from anon.
--    Keep for authenticated (needed for account deletion flow).
-- ============================================================
REVOKE EXECUTE ON FUNCTION public.delete_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.delete_user() FROM PUBLIC;

-- Ensure only authenticated can call it
GRANT EXECUTE ON FUNCTION public.delete_user() TO authenticated;


-- ============================================================
-- 3. create_organization_with_admin
--    Should only be callable by signed-in users.
--    Revoke from anon; keep for authenticated.
-- ============================================================
REVOKE EXECUTE ON FUNCTION public.create_organization_with_admin(text, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.create_organization_with_admin(text, text, text) FROM PUBLIC;

-- Ensure only authenticated can call it
GRANT EXECUTE ON FUNCTION public.create_organization_with_admin(text, text, text) TO authenticated;


-- ============================================================
-- 4. Harden all three functions with explicit search_path
--    (belt-and-suspenders — prevents search_path hijacking attacks)
-- ============================================================

-- handle_new_user (trigger — no args)
ALTER FUNCTION public.handle_new_user()
  SET search_path = public, pg_temp;

-- delete_user (no args)
ALTER FUNCTION public.delete_user()
  SET search_path = public, pg_temp;

-- create_organization_with_admin
ALTER FUNCTION public.create_organization_with_admin(text, text, text)
  SET search_path = public, pg_temp;


-- ============================================================
-- VERIFICATION QUERIES
-- Run these in the Supabase SQL editor to confirm the fix:
--
-- Check who can execute each function:
--
--   SELECT grantee, privilege_type
--   FROM information_schema.routine_privileges
--   WHERE routine_name = 'handle_new_user'
--     AND routine_schema = 'public';
--
--   SELECT grantee, privilege_type
--   FROM information_schema.routine_privileges
--   WHERE routine_name = 'delete_user'
--     AND routine_schema = 'public';
--
--   SELECT grantee, privilege_type
--   FROM information_schema.routine_privileges
--   WHERE routine_name = 'create_organization_with_admin'
--     AND routine_schema = 'public';
--
-- Expected results after fix:
--   handle_new_user        → only postgres/supabase_admin (no anon, no authenticated)
--   delete_user            → authenticated only
--   create_organization_with_admin → authenticated only
-- ============================================================


-- ============================================================
-- 5. Leaked Password Protection
--    This CANNOT be set via SQL — it is a dashboard toggle.
--
--    To enable:
--    1. Supabase Dashboard → Authentication → Sign In / Up
--    2. Scroll to "Password Security"
--    3. Toggle ON "Leaked Password Protection" (HaveIBeenPwned.org)
--    4. Save changes
-- ============================================================
