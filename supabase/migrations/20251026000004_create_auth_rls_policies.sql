-- Row Level Security (RLS) Policies for Authentication System
-- This ensures users can only access data from their organization

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_invitations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ORGANIZATIONS POLICIES
-- ============================================================================

-- Users can only see their own organization
CREATE POLICY "Users can view their own organization" ON organizations
FOR SELECT TO authenticated
USING (
  id IN (
    SELECT organization_id 
    FROM user_profiles 
    WHERE id = auth.uid()
  )
);

-- Organization admins can update their organization
CREATE POLICY "Organization admins can update their organization" ON organizations
FOR UPDATE TO authenticated
USING (
  id IN (
    SELECT organization_id 
    FROM user_profiles 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'org_admin')
  )
)
WITH CHECK (
  id IN (
    SELECT organization_id 
    FROM user_profiles 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'org_admin')
  )
);

-- Super admins can create organizations
CREATE POLICY "Super admins can create organizations" ON organizations
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() IN (
    SELECT id 
    FROM user_profiles 
    WHERE role = 'super_admin'
  )
);

-- ============================================================================
-- USER PROFILES POLICIES
-- ============================================================================

-- Users can view profiles in their organization
CREATE POLICY "Users can view profiles in their organization" ON user_profiles
FOR SELECT TO authenticated
USING (
  organization_id IN (
    SELECT organization_id 
    FROM user_profiles 
    WHERE id = auth.uid()
  )
);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" ON user_profiles
FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Organization admins can update profiles in their organization
CREATE POLICY "Organization admins can update organization profiles" ON user_profiles
FOR UPDATE TO authenticated
USING (
  organization_id IN (
    SELECT organization_id 
    FROM user_profiles 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'org_admin')
  )
)
WITH CHECK (
  organization_id IN (
    SELECT organization_id 
    FROM user_profiles 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'org_admin')
  )
);

-- Allow creating user profiles (handled by trigger)
CREATE POLICY "Allow creating user profiles" ON user_profiles
FOR INSERT TO authenticated, anon
WITH CHECK (true);

-- ============================================================================
-- USER LOCATIONS POLICIES
-- ============================================================================

-- Users can view locations in their organization
CREATE POLICY "Users can view locations in their organization" ON user_locations
FOR SELECT TO authenticated
USING (
  organization_id IN (
    SELECT organization_id 
    FROM user_profiles 
    WHERE id = auth.uid()
  )
);

-- Users can manage their own locations
CREATE POLICY "Users can manage their own locations" ON user_locations
FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid() 
  AND organization_id IN (
    SELECT organization_id 
    FROM user_profiles 
    WHERE id = auth.uid()
  )
);

-- Organization admins can manage all locations in their organization
CREATE POLICY "Organization admins can manage organization locations" ON user_locations
FOR ALL TO authenticated
USING (
  organization_id IN (
    SELECT organization_id 
    FROM user_profiles 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'org_admin', 'manager')
  )
)
WITH CHECK (
  organization_id IN (
    SELECT organization_id 
    FROM user_profiles 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'org_admin', 'manager')
  )
);

-- ============================================================================
-- ORGANIZATION INVITATIONS POLICIES
-- ============================================================================

-- Organization admins can view invitations for their organization
CREATE POLICY "Organization admins can view their invitations" ON organization_invitations
FOR SELECT TO authenticated
USING (
  organization_id IN (
    SELECT organization_id 
    FROM user_profiles 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'org_admin')
  )
);

-- Organization admins can create invitations for their organization
CREATE POLICY "Organization admins can create invitations" ON organization_invitations
FOR INSERT TO authenticated
WITH CHECK (
  organization_id IN (
    SELECT organization_id 
    FROM user_profiles 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'org_admin')
  )
);

-- Organization admins can update/delete invitations for their organization
CREATE POLICY "Organization admins can manage their invitations" ON organization_invitations
FOR ALL TO authenticated
USING (
  organization_id IN (
    SELECT organization_id 
    FROM user_profiles 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'org_admin')
  )
)
WITH CHECK (
  organization_id IN (
    SELECT organization_id 
    FROM user_profiles 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'org_admin')
  )
);

-- Allow anonymous users to view invitations by token (for accepting invites)
CREATE POLICY "Allow viewing invitations by token" ON organization_invitations
FOR SELECT TO anon, authenticated
USING (token IS NOT NULL AND expires_at > now());

-- ============================================================================
-- HELPER FUNCTIONS FOR PERMISSIONS
-- ============================================================================

-- Function to check if user has specific permission
CREATE OR REPLACE FUNCTION user_has_permission(permission_name text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM user_profiles 
    WHERE id = auth.uid() 
    AND (
      role IN ('super_admin', 'org_admin') 
      OR permissions ? permission_name
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's organization ID
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS uuid AS $$
BEGIN
  RETURN (
    SELECT organization_id 
    FROM user_profiles 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can access organization
CREATE OR REPLACE FUNCTION user_can_access_organization(org_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM user_profiles 
    WHERE id = auth.uid() 
    AND organization_id = org_id
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT 'RLS policies for authentication system created successfully' as status;