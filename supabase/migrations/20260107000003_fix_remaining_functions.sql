-- Fix Remaining Function Search Path Warnings
-- Generated: 2026-01-07
-- Set search_path for delete_user and create_organization_with_admin

-- ============================================
-- FIX: Function search_path settings
-- These functions exist in production but need search_path set
-- ============================================

-- Fix delete_user function (try common signatures)
DO $$
DECLARE
  func_sig TEXT;
BEGIN
  -- Find the actual signature of delete_user
  SELECT 
    format('ALTER FUNCTION public.%I(%s) SET search_path = public, pg_temp',
      p.proname,
      pg_get_function_identity_arguments(p.oid))
  INTO func_sig
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' AND p.proname = 'delete_user';
  
  IF func_sig IS NOT NULL THEN
    EXECUTE func_sig;
    RAISE NOTICE 'Fixed delete_user function';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not fix delete_user: %', SQLERRM;
END $$;

-- Fix create_organization_with_admin function
DO $$
DECLARE
  func_sig TEXT;
BEGIN
  -- Find the actual signature of create_organization_with_admin
  SELECT 
    format('ALTER FUNCTION public.%I(%s) SET search_path = public, pg_temp',
      p.proname,
      pg_get_function_identity_arguments(p.oid))
  INTO func_sig
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' AND p.proname = 'create_organization_with_admin';
  
  IF func_sig IS NOT NULL THEN
    EXECUTE func_sig;
    RAISE NOTICE 'Fixed create_organization_with_admin function';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not fix create_organization_with_admin: %', SQLERRM;
END $$;

-- ============================================
-- SUMMARY
-- ============================================
-- This migration dynamically detects function signatures
-- and sets search_path appropriately
--
-- After this migration, only 1 warning should remain:
-- ✅ Leaked password protection (manual setting in Auth dashboard)
--
-- To enable leaked password protection:
-- 1. Go to Supabase Dashboard → Authentication → Settings
-- 2. Scroll to "Password Security"
-- 3. Enable "Leaked Password Protection"
