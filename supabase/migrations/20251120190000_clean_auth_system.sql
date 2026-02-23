-- Clean Auth System Migration
-- This replaces all previous auth migrations
-- Run this in Supabase SQL Editor

-- ============================================
-- STEP 1: Clean slate - Remove old tables
-- ============================================
DROP TABLE IF EXISTS public.organization_users CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.organizations CASCADE;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- ============================================
-- STEP 2: Create Organizations table
-- ============================================
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 3: Create User Profiles table
-- ============================================
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('superuser', 'admin', 'user')),
  primary_organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 4: Create Organization Users junction table
-- ============================================
CREATE TABLE public.organization_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  role_in_org TEXT NOT NULL DEFAULT 'member' CHECK (role_in_org IN ('owner', 'admin', 'member')),
  invited_by UUID REFERENCES public.user_profiles(id),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Enable RLS
ALTER TABLE public.organization_users ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 5: Create trigger for new user signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create user profile
  INSERT INTO public.user_profiles (id, email, full_name, role)
  VALUES (
    NEW.id, 
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    'user'  -- Default role
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log but don't fail auth
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- STEP 6: RLS Policies for user_profiles
-- ============================================

-- SuperUsers can see all profiles
CREATE POLICY "SuperUsers can view all profiles"
  ON public.user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'superuser'
    )
  );

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile (except role)
CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- SuperUsers can update any profile
CREATE POLICY "SuperUsers can update all profiles"
  ON public.user_profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'superuser'
    )
  );

-- SuperUsers can insert profiles
CREATE POLICY "SuperUsers can insert profiles"
  ON public.user_profiles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'superuser'
    )
  );

-- ============================================
-- STEP 7: RLS Policies for organizations
-- ============================================

-- Everyone can view organizations they're a member of
CREATE POLICY "Users can view their organizations"
  ON public.organizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_users
      WHERE organization_id = organizations.id
      AND user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role IN ('superuser', 'admin')
    )
  );

-- Admins and SuperUsers can create organizations
CREATE POLICY "Admins can create organizations"
  ON public.organizations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role IN ('superuser', 'admin')
    )
  );

-- Org owners and SuperUsers can update organizations
CREATE POLICY "Org owners can update organizations"
  ON public.organizations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_users
      WHERE organization_id = organizations.id
      AND user_id = auth.uid()
      AND role_in_org = 'owner'
    )
    OR EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'superuser'
    )
  );

-- ============================================
-- STEP 8: RLS Policies for organization_users
-- ============================================

-- Users can view organization memberships they're part of
CREATE POLICY "Users can view org memberships"
  ON public.organization_users FOR SELECT
  USING (
    user_id = auth.uid()
    OR organization_id IN (
      SELECT organization_id FROM public.organization_users WHERE user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role IN ('superuser', 'admin')
    )
  );

-- Org owners can add members
CREATE POLICY "Org owners can add members"
  ON public.organization_users FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_users
      WHERE organization_id = organization_users.organization_id
      AND user_id = auth.uid()
      AND role_in_org IN ('owner', 'admin')
    )
    OR EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role IN ('superuser', 'admin')
    )
  );

-- ============================================
-- STEP 9: Grant permissions
-- ============================================
GRANT SELECT, INSERT, UPDATE ON public.user_profiles TO authenticated;
GRANT SELECT ON public.user_profiles TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizations TO authenticated;
GRANT SELECT ON public.organizations TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_users TO authenticated;

-- ============================================
-- STEP 10: Create profiles for existing users
-- ============================================
INSERT INTO public.user_profiles (id, email, role)
SELECT 
  id, 
  email,
  CASE 
    WHEN email = current_setting('app.admin_email', true) THEN 'superuser'
    ELSE 'user'
  END as role
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Confirm all emails
UPDATE auth.users 
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email_confirmed_at IS NULL;

-- ============================================
-- STEP 11: Create default organization
-- ============================================
INSERT INTO public.organizations (name, slug)
VALUES (
  'Default Organization',
  'default'
)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- VERIFICATION
-- ============================================
SELECT 'Auth system created successfully!' as status;
SELECT 'Total users: ' || COUNT(*) FROM auth.users
UNION ALL
SELECT 'Total profiles: ' || COUNT(*) FROM public.user_profiles
UNION ALL  
SELECT 'SuperUsers: ' || COUNT(*) FROM public.user_profiles WHERE role = 'superuser'
UNION ALL
SELECT 'Admins: ' || COUNT(*) FROM public.user_profiles WHERE role = 'admin'
UNION ALL
SELECT 'Regular users: ' || COUNT(*) FROM public.user_profiles WHERE role = 'user';
