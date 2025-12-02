-- Fix Super User Policies to check role instead of hardcoded UUID
-- This allows ANY user with role='superuser' to see all data

-- ============================================================================
-- DROP EXISTING POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view profiles based on role" ON user_profiles;
DROP POLICY IF EXISTS "Users can view organizations based on role" ON organizations;

-- ============================================================================
-- CREATE ROLE-BASED POLICIES (NO RECURSION)
-- ============================================================================

-- User Profiles: Superusers see all, regular users see their org
-- FIX: Use a security definer function to avoid infinite recursion
CREATE OR REPLACE FUNCTION is_superuser()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT role FROM user_profiles WHERE id = auth.uid() LIMIT 1) = 'superuser';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Users can view profiles based on role" ON user_profiles
FOR SELECT TO authenticated
USING (
  is_superuser()
  OR
  primary_organization_id IN (
    SELECT primary_organization_id 
    FROM user_profiles 
    WHERE id = auth.uid()
  )
  OR
  id = auth.uid()
);

-- Organizations: Superusers see all, regular users see their org
CREATE POLICY "Users can view organizations based on role" ON organizations
FOR SELECT TO authenticated
USING (
  is_superuser()
  OR
  id IN (
    SELECT primary_organization_id 
    FROM user_profiles 
    WHERE id = auth.uid()
  )
);

-- Organization Members: Superusers see all, members see their org
CREATE POLICY "Users can view organization members based on role" ON organization_members
FOR SELECT TO authenticated
USING (
  is_superuser()
  OR
  organization_id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid()
  )
);

-- ============================================================================
-- SUPERUSER UPDATE POLICIES
-- ============================================================================

-- Allow superusers to update any user profile
DROP POLICY IF EXISTS "Users can update profiles based on role" ON user_profiles;
CREATE POLICY "Users can update profiles based on role" ON user_profiles
FOR UPDATE TO authenticated
USING (
  is_superuser()
  OR
  id = auth.uid()
)
WITH CHECK (
  is_superuser()
  OR
  id = auth.uid()
);

-- Allow superusers to update any organization
DROP POLICY IF EXISTS "Users can update organizations based on role" ON organizations;
CREATE POLICY "Users can update organizations based on role" ON organizations
FOR UPDATE TO authenticated
USING (
  is_superuser()
  OR
  id IN (
    SELECT primary_organization_id 
    FROM user_profiles 
    WHERE id = auth.uid() 
    AND role IN ('org_admin', 'admin')
  )
)
WITH CHECK (
  is_superuser()
  OR
  id IN (
    SELECT primary_organization_id 
    FROM user_profiles 
    WHERE id = auth.uid() 
    AND role IN ('org_admin', 'admin')
  )
);

-- Allow superusers to insert organizations
DROP POLICY IF EXISTS "Superusers can insert organizations" ON organizations;
CREATE POLICY "Superusers can insert organizations" ON organizations
FOR INSERT TO authenticated
WITH CHECK (is_superuser());

-- Allow superusers to delete organizations
DROP POLICY IF EXISTS "Superusers can delete organizations" ON organizations;
CREATE POLICY "Superusers can delete organizations" ON organizations
FOR DELETE TO authenticated
USING (is_superuser());

-- Allow superusers to manage organization members
DROP POLICY IF EXISTS "Superusers can insert organization members" ON organization_members;
CREATE POLICY "Superusers can insert organization members" ON organization_members
FOR INSERT TO authenticated
WITH CHECK (is_superuser());

DROP POLICY IF EXISTS "Superusers can update organization members" ON organization_members;
CREATE POLICY "Superusers can update organization members" ON organization_members
FOR UPDATE TO authenticated
USING (is_superuser())
WITH CHECK (is_superuser());

DROP POLICY IF EXISTS "Superusers can delete organization members" ON organization_members;
CREATE POLICY "Superusers can delete organization members" ON organization_members
FOR DELETE TO authenticated
USING (is_superuser());

SELECT 'Superuser RLS policies updated - infinite recursion fixed' as status;
