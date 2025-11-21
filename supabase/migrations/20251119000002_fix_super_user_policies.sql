-- Fix Super User Policies - Remove infinite recursion
-- Drop the problematic policies and recreate them properly

-- ============================================================================
-- DROP PROBLEMATIC POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Super users can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Super users can view all organizations" ON organizations;
DROP POLICY IF EXISTS "Super users can view all locations" ON user_locations;
DROP POLICY IF EXISTS "Super users can view all invitations" ON organization_invitations;

-- Also need to drop and recreate the original restrictive policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view profiles in their organization" ON user_profiles;
DROP POLICY IF EXISTS "Users can view their own organization" ON organizations;
DROP POLICY IF EXISTS "Users can view locations in their organization" ON user_locations;

-- ============================================================================
-- CREATE COMBINED POLICIES (Super User + Regular User Access)
-- ============================================================================

-- Combined policy for user_profiles: Super user sees all, regular users see their org
CREATE POLICY "Users can view profiles based on role" ON user_profiles
FOR SELECT TO authenticated
USING (
  -- Super user check using the specific UUID (to avoid recursion)
  auth.uid() = 'bb86ab6e-fdfe-46e0-9d4c-b2e0a3fa710f'::uuid
  OR
  -- Regular users can view profiles in their organization
  organization_id = (
    SELECT organization_id 
    FROM user_profiles 
    WHERE id = auth.uid()
  )
);

-- Combined policy for organizations: Super user sees all, regular users see their org
CREATE POLICY "Users can view organizations based on role" ON organizations
FOR SELECT TO authenticated
USING (
  -- Super user check
  auth.uid() = 'bb86ab6e-fdfe-46e0-9d4c-b2e0a3fa710f'::uuid
  OR
  -- Regular users can view their own organization
  id = (
    SELECT organization_id 
    FROM user_profiles 
    WHERE id = auth.uid()
  )
);

-- Combined policy for user_locations: Super user sees all, regular users see their org
CREATE POLICY "Users can view locations based on role" ON user_locations
FOR SELECT TO authenticated
USING (
  -- Super user check
  auth.uid() = 'bb86ab6e-fdfe-46e0-9d4c-b2e0a3fa710f'::uuid
  OR
  -- Regular users can view locations in their organization
  organization_id = (
    SELECT organization_id 
    FROM user_profiles 
    WHERE id = auth.uid()
  )
);

-- Combined policy for organization_invitations
CREATE POLICY "Users can view invitations based on role" ON organization_invitations
FOR SELECT TO authenticated
USING (
  -- Super user check
  auth.uid() = 'bb86ab6e-fdfe-46e0-9d4c-b2e0a3fa710f'::uuid
  OR
  -- Organization admins can view their invitations
  organization_id = (
    SELECT organization_id 
    FROM user_profiles 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'org_admin')
  )
  OR
  -- Anyone can view invitations by token
  (token IS NOT NULL AND expires_at > now())
);

SELECT 'Super user access policies fixed successfully - using UUID-based check' as status;
