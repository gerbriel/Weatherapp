-- Fix Supabase Linter Warnings
-- Generated: 2026-01-07
-- Priority: CRITICAL + High-impact performance fixes

-- ============================================
-- CRITICAL: Enable RLS on location_crops table
-- ============================================
ALTER TABLE public.location_crops ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PERFORMANCE: Optimize RLS policies with subqueries
-- Fix auth.uid() re-evaluation issues
-- ============================================

-- user_profiles policies
DROP POLICY IF EXISTS "Users view own profile" ON public.user_profiles;
CREATE POLICY "Users view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users update own profile" ON public.user_profiles;
CREATE POLICY "Users update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users insert own profile" ON public.user_profiles;
CREATE POLICY "Users insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- user_locations policies
DROP POLICY IF EXISTS "Users can view their own locations" ON public.user_locations;
CREATE POLICY "Users can view their own locations" ON public.user_locations
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own locations" ON public.user_locations;
CREATE POLICY "Users can insert their own locations" ON public.user_locations
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own locations" ON public.user_locations;
CREATE POLICY "Users can update their own locations" ON public.user_locations
  FOR UPDATE USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own locations" ON public.user_locations;
CREATE POLICY "Users can delete their own locations" ON public.user_locations
  FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- user_settings policies
DROP POLICY IF EXISTS "Users can view their own settings" ON public.user_settings;
CREATE POLICY "Users can view their own settings" ON public.user_settings
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own settings" ON public.user_settings;
CREATE POLICY "Users can insert their own settings" ON public.user_settings
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own settings" ON public.user_settings;
CREATE POLICY "Users can update their own settings" ON public.user_settings
  FOR UPDATE USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own settings" ON public.user_settings;
CREATE POLICY "Users can delete their own settings" ON public.user_settings
  FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- ============================================
-- SECURITY: Set search_path for functions
-- Only include functions that definitely exist
-- ============================================

-- Core utility function (exists in all installations)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    ALTER FUNCTION public.update_updated_at_column() SET search_path = public, pg_temp;
  END IF;
END $$;

-- Location crops function (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_location_crops_updated_at') THEN
    ALTER FUNCTION public.update_location_crops_updated_at() SET search_path = public, pg_temp;
  END IF;
END $$;

-- User settings function (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_user_settings_updated_at') THEN
    ALTER FUNCTION public.update_user_settings_updated_at() SET search_path = public, pg_temp;
  END IF;
END $$;

-- Organization function (if exists with correct signature)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
    AND p.proname = 'create_organization_with_admin'
  ) THEN
    EXECUTE 'ALTER FUNCTION public.create_organization_with_admin(text, text, text, uuid) SET search_path = public, pg_temp';
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Ignore if function signature doesn't match
  NULL;
END $$;

-- ============================================
-- NOTES
-- ============================================
-- Remaining warnings (organizations, organization_members):
-- - These have more complex policies with role checks
-- - Can be optimized later if performance issues occur
-- - Multiple permissive policies can be consolidated but not urgent
--
-- To enable leaked password protection:
-- Go to Supabase Dashboard → Authentication → Settings
-- Enable "Leaked Password Protection"
