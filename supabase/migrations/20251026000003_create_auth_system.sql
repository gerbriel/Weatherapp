-- Authentication and Profile System Database Schema
-- This creates a scalable multi-tenant system with organizations and user profiles

-- ============================================================================
-- ORGANIZATIONS TABLE
-- ============================================================================
-- Organizations are the top-level entity for multi-tenancy
CREATE TABLE IF NOT EXISTS organizations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text UNIQUE NOT NULL, -- URL-friendly identifier
  description text,
  logo_url text,
  website text,
  contact_email text,
  phone text,
  address text,
  city text,
  state text,
  country text DEFAULT 'US',
  postal_code text,
  timezone text DEFAULT 'UTC',
  subscription_plan text DEFAULT 'free' CHECK (subscription_plan IN ('free', 'basic', 'premium', 'enterprise')),
  max_users integer DEFAULT 5,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- USER PROFILES TABLE
-- ============================================================================
-- Extended profile information linked to Supabase Auth users
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  first_name text,
  last_name text,
  display_name text,
  avatar_url text,
  phone text,
  job_title text,
  department text,
  role text DEFAULT 'user' CHECK (role IN ('super_admin', 'org_admin', 'manager', 'user', 'viewer')),
  permissions jsonb DEFAULT '[]'::jsonb, -- Flexible permissions system
  preferences jsonb DEFAULT '{}'::jsonb, -- User preferences (theme, notifications, etc.)
  is_active boolean DEFAULT true,
  last_login_at timestamp with time zone,
  email_verified boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- USER LOCATIONS TABLE
-- ============================================================================
-- User's saved/default locations for weather data
CREATE TABLE IF NOT EXISTS user_locations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL, -- User-friendly name like "Home Farm", "North Field"
  description text,
  latitude decimal(10, 8) NOT NULL,
  longitude decimal(11, 8) NOT NULL,
  elevation decimal(8, 2), -- meters above sea level
  address text,
  city text,
  state text,
  country text DEFAULT 'US',
  postal_code text,
  timezone text,
  is_default boolean DEFAULT false, -- User's primary location
  is_active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb, -- Additional location data (farm size, crop types, etc.)
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- ORGANIZATION INVITATIONS TABLE
-- ============================================================================
-- For inviting users to organizations
CREATE TABLE IF NOT EXISTS organization_invitations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  role text DEFAULT 'user' CHECK (role IN ('org_admin', 'manager', 'user', 'viewer')),
  invited_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  token text UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  expires_at timestamp with time zone DEFAULT (now() + interval '7 days') NOT NULL,
  accepted_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Organizations
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_active ON organizations(is_active);

-- User Profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_organization ON user_profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_active ON user_profiles(is_active);

-- User Locations
CREATE INDEX IF NOT EXISTS idx_user_locations_user ON user_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_locations_organization ON user_locations(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_locations_default ON user_locations(user_id, is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_user_locations_coords ON user_locations(latitude, longitude);

-- Organization Invitations
CREATE INDEX IF NOT EXISTS idx_organization_invitations_org ON organization_invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_invitations_email ON organization_invitations(email);
CREATE INDEX IF NOT EXISTS idx_organization_invitations_token ON organization_invitations(token);

-- ============================================================================
-- CONSTRAINTS AND VALIDATIONS
-- ============================================================================

-- Ensure only one default location per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_default_location 
ON user_locations(user_id) 
WHERE is_default = true;

-- Validate coordinates
ALTER TABLE user_locations ADD CONSTRAINT check_latitude 
CHECK (latitude >= -90 AND latitude <= 90);

ALTER TABLE user_locations ADD CONSTRAINT check_longitude 
CHECK (longitude >= -180 AND longitude <= 180);

-- Validate email format
ALTER TABLE user_profiles ADD CONSTRAINT check_email_format 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE organization_invitations ADD CONSTRAINT check_invitation_email_format 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to all tables
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at 
    BEFORE UPDATE ON organizations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_locations_updated_at ON user_locations;
CREATE TRIGGER update_user_locations_updated_at 
    BEFORE UPDATE ON user_locations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create user profile when user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_org_id uuid;
BEGIN
    -- Get or create a default organization for new users
    -- In production, you might want a different strategy
    SELECT id INTO default_org_id 
    FROM organizations 
    WHERE slug = 'default' 
    LIMIT 1;
    
    IF default_org_id IS NULL THEN
        INSERT INTO organizations (name, slug, description)
        VALUES ('Default Organization', 'default', 'Default organization for new users')
        RETURNING id INTO default_org_id;
    END IF;
    
    -- Create user profile
    INSERT INTO user_profiles (
        id, 
        organization_id, 
        email, 
        display_name,
        email_verified
    )
    VALUES (
        NEW.id, 
        default_org_id, 
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
        NEW.email_confirmed_at IS NOT NULL
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update last login
CREATE OR REPLACE FUNCTION update_last_login()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at THEN
        UPDATE user_profiles 
        SET last_login_at = NEW.last_sign_in_at
        WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update last login time
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
    AFTER UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION update_last_login();

SELECT 'Authentication system database schema created successfully' as status;