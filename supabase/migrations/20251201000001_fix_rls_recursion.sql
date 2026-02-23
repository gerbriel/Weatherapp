-- =====================================================
-- FIX INFINITE RECURSION IN RLS POLICIES
-- =====================================================
-- The is_superuser() function was causing infinite recursion
-- This fixes it by using a non-recursive approach

-- Drop the problematic function
DROP FUNCTION IF EXISTS is_superuser() CASCADE;

-- Drop all conflicting policies
DROP POLICY IF EXISTS "Users can view profiles based on role" ON user_profiles;
DROP POLICY IF EXISTS "Users can update profiles based on role" ON user_profiles;
DROP POLICY IF EXISTS "Users can view organizations based on role" ON organizations;
DROP POLICY IF EXISTS "Users can view organization members based on role" ON organization_members;

-- =====================================================
-- CRITICAL FIX: Allow users to view their own profile
-- =====================================================
-- This is the most important policy - users MUST be able to see their own profile
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
CREATE POLICY "Users can view their own profile" ON user_profiles
FOR SELECT TO authenticated
USING (id = auth.uid());

-- =====================================================
-- Allow users to view profiles in their organization
-- =====================================================
DROP POLICY IF EXISTS "Users can view org profiles" ON user_profiles;
CREATE POLICY "Users can view org profiles" ON user_profiles
FOR SELECT TO authenticated
USING (
  -- Users with role 'superuser' can see all profiles
  EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.id = auth.uid() 
    AND up.role = 'superuser'
  )
  OR
  -- Users can see profiles in their organization
  primary_organization_id IN (
    SELECT primary_organization_id 
    FROM user_profiles 
    WHERE id = auth.uid()
  )
);

-- =====================================================
-- UPDATE POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile" ON user_profiles
FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Superusers can update any profile" ON user_profiles;
CREATE POLICY "Superusers can update any profile" ON user_profiles
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND role = 'superuser'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND role = 'superuser'
  )
);

-- =====================================================
-- ORGANIZATION POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Users can view their organizations" ON organizations;
CREATE POLICY "Users can view their organizations" ON organizations
FOR SELECT TO authenticated
USING (
  -- Superusers can see all
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND role = 'superuser'
  )
  OR
  -- Users see their org
  id IN (
    SELECT primary_organization_id 
    FROM user_profiles 
    WHERE id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can view org members" ON organization_members;
CREATE POLICY "Users can view org members" ON organization_members
FOR SELECT TO authenticated
USING (
  -- Superusers can see all
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND role = 'superuser'
  )
  OR
  -- Members see their org's members
  organization_id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid()
  )
);
