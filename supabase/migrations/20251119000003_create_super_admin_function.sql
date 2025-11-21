-- Create Super Admin Function to Bypass RLS
-- This function runs with SECURITY DEFINER to bypass Row Level Security

-- ============================================================================
-- CREATE FUNCTION TO GET ALL USER PROFILES (BYPASSES RLS)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_all_user_profiles_admin()
RETURNS TABLE (
  id uuid,
  organization_id uuid,
  email text,
  first_name text,
  last_name text,
  display_name text,
  avatar_url text,
  phone text,
  job_title text,
  department text,
  role text,
  permissions jsonb,
  preferences jsonb,
  is_active boolean,
  last_login_at timestamp with time zone,
  email_verified boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER -- This makes it run with the permissions of the function creator (bypasses RLS)
AS $$
BEGIN
  -- Only allow the super user to call this function
  IF auth.uid() != 'bb86ab6e-fdfe-46e0-9d4c-b2e0a3fa710f'::uuid THEN
    RAISE EXCEPTION 'Access denied: Only super admin can access this function';
  END IF;

  -- Return all user profiles
  RETURN QUERY
  SELECT 
    up.id,
    up.organization_id,
    up.email,
    up.first_name,
    up.last_name,
    up.display_name,
    up.avatar_url,
    up.phone,
    up.job_title,
    up.department,
    up.role,
    up.permissions,
    up.preferences,
    up.is_active,
    up.last_login_at,
    up.email_verified,
    up.created_at,
    up.updated_at
  FROM user_profiles up
  ORDER BY up.created_at DESC;
END;
$$;

-- ============================================================================
-- CREATE FUNCTION TO GET ALL ORGANIZATIONS (BYPASSES RLS)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_all_organizations_admin()
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  description text,
  logo_url text,
  website text,
  contact_email text,
  phone text,
  address text,
  city text,
  state text,
  country text,
  postal_code text,
  timezone text,
  subscription_plan text,
  max_users integer,
  is_active boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only allow the super user to call this function
  IF auth.uid() != 'bb86ab6e-fdfe-46e0-9d4c-b2e0a3fa710f'::uuid THEN
    RAISE EXCEPTION 'Access denied: Only super admin can access this function';
  END IF;

  -- Return all organizations
  RETURN QUERY
  SELECT 
    o.id,
    o.name,
    o.slug,
    o.description,
    o.logo_url,
    o.website,
    o.contact_email,
    o.phone,
    o.address,
    o.city,
    o.state,
    o.country,
    o.postal_code,
    o.timezone,
    o.subscription_plan,
    o.max_users,
    o.is_active,
    o.created_at,
    o.updated_at
  FROM organizations o
  ORDER BY o.created_at DESC;
END;
$$;

-- ============================================================================
-- CREATE FUNCTION TO GET ALL USER LOCATIONS (BYPASSES RLS)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_all_user_locations_admin()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  organization_id uuid,
  name text,
  description text,
  latitude decimal,
  longitude decimal,
  elevation decimal,
  address text,
  city text,
  state text,
  country text,
  postal_code text,
  timezone text,
  is_default boolean,
  is_active boolean,
  metadata jsonb,
  is_favorite boolean,
  sort_order integer,
  weatherstation text,
  weatherstation_id text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only allow the super user to call this function
  IF auth.uid() != 'bb86ab6e-fdfe-46e0-9d4c-b2e0a3fa710f'::uuid THEN
    RAISE EXCEPTION 'Access denied: Only super admin can access this function';
  END IF;

  -- Return all user locations
  RETURN QUERY
  SELECT 
    ul.id,
    ul.user_id,
    ul.organization_id,
    ul.name,
    ul.description,
    ul.latitude,
    ul.longitude,
    ul.elevation,
    ul.address,
    ul.city,
    ul.state,
    ul.country,
    ul.postal_code,
    ul.timezone,
    ul.is_default,
    ul.is_active,
    ul.metadata,
    ul.is_favorite,
    ul.sort_order,
    ul.weatherstation,
    ul.weatherstation_id,
    ul.created_at,
    ul.updated_at
  FROM user_locations ul
  ORDER BY ul.created_at DESC;
END;
$$;

SELECT 'Super admin functions created successfully - use RPC to bypass RLS' as status;
