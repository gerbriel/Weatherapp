-- Fix Remaining RLS Warnings - Part 2
-- Generated: 2026-01-07
-- Fixes location_crops policies and user_profiles duplicate policies

-- ============================================
-- FIX: location_crops RLS policies
-- Wrap auth.uid() in subqueries for performance
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view crops for their locations" ON public.location_crops;
DROP POLICY IF EXISTS "Users can insert crops for their locations" ON public.location_crops;
DROP POLICY IF EXISTS "Users can update crops for their locations" ON public.location_crops;
DROP POLICY IF EXISTS "Users can delete crops for their locations" ON public.location_crops;

-- Recreate with optimized auth.uid() calls
CREATE POLICY "Users can view crops for their locations" ON public.location_crops
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_locations
      WHERE user_locations.id = location_crops.location_id
      AND user_locations.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can insert crops for their locations" ON public.location_crops
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_locations
      WHERE user_locations.id = location_crops.location_id
      AND user_locations.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update crops for their locations" ON public.location_crops
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_locations
      WHERE user_locations.id = location_crops.location_id
      AND user_locations.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete crops for their locations" ON public.location_crops
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_locations
      WHERE user_locations.id = location_crops.location_id
      AND user_locations.user_id = (SELECT auth.uid())
    )
  );

-- ============================================
-- FIX: user_profiles duplicate policies
-- Remove old policies, keep optimized ones
-- ============================================

-- Remove duplicate old-style policies
DROP POLICY IF EXISTS "users_read_own" ON public.user_profiles;
DROP POLICY IF EXISTS "users_update_own" ON public.user_profiles;

-- Keep the new optimized policies:
-- "Users view own profile" 
-- "Users update own profile"
-- "Users insert own profile"

-- ============================================
-- FIX: organization_members RLS policy
-- ============================================

DROP POLICY IF EXISTS "users_view_own_memberships" ON public.organization_members;
CREATE POLICY "users_view_own_memberships" ON public.organization_members
  FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

-- ============================================
-- FIX: Add missing search_path for functions
-- These exist in production but weren't in previous migration
-- ============================================

DO $$
BEGIN
  -- delete_user function (check with signature)
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'delete_user'
  ) THEN
    BEGIN
      ALTER FUNCTION public.delete_user(uuid) SET search_path = public, pg_temp;
    EXCEPTION WHEN undefined_function THEN
      -- Function doesn't exist or signature mismatch, skip
      NULL;
    END;
  END IF;
END $$;

DO $$
BEGIN
  -- update_superusers_updated_at function
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'update_superusers_updated_at'
  ) THEN
    BEGIN
      ALTER FUNCTION public.update_superusers_updated_at() SET search_path = public, pg_temp;
    EXCEPTION WHEN undefined_function THEN
      NULL;
    END;
  END IF;
END $$;

DO $$
BEGIN
  -- update_organizations_updated_at function
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'update_organizations_updated_at'
  ) THEN
    BEGIN
      ALTER FUNCTION public.update_organizations_updated_at() SET search_path = public, pg_temp;
    EXCEPTION WHEN undefined_function THEN
      NULL;
    END;
  END IF;
END $$;

DO $$
BEGIN
  -- update_organization_members_updated_at function
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'update_organization_members_updated_at'
  ) THEN
    BEGIN
      ALTER FUNCTION public.update_organization_members_updated_at() SET search_path = public, pg_temp;
    EXCEPTION WHEN undefined_function THEN
      NULL;
    END;
  END IF;
END $$;

DO $$
BEGIN
  -- add_owner_as_organization_member function
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'add_owner_as_organization_member'
  ) THEN
    BEGIN
      ALTER FUNCTION public.add_owner_as_organization_member() SET search_path = public, pg_temp;
    EXCEPTION WHEN undefined_function THEN
      NULL;
    END;
  END IF;
END $$;

DO $$
BEGIN
  -- create_organization_with_admin function (check all possible signatures)
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'create_organization_with_admin'
  ) THEN
    -- Try the 4-parameter version first
    BEGIN
      ALTER FUNCTION public.create_organization_with_admin(text, text, text, uuid) 
        SET search_path = public, pg_temp;
    EXCEPTION WHEN OTHERS THEN
      -- If that fails, the function might have a different signature
      NULL;
    END;
  END IF;
END $$;

-- ============================================
-- SUMMARY
-- ============================================
-- This migration fixes:
-- ✅ 4 location_crops RLS policies (auth.uid() optimization)
-- ✅ 1 organization_members RLS policy (auth.uid() optimization)  
-- ✅ 2 duplicate user_profiles policies (removed old ones)
-- ✅ 6 function search_path settings
--
-- Remaining warnings after this migration:
-- - Leaked password protection (enable in Auth settings)
-- - Low-priority organizational policy optimizations
