-- Organization System with Multi-Tenant Support
-- First user to create an org becomes org_admin automatically
-- Superusers can manage everything

-- 1. Create organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  industry TEXT,
  website TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  settings JSONB DEFAULT '{}'::jsonb
);

-- 2. Create organization_members junction table
CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('org_admin', 'member', 'viewer')),
  is_active BOOLEAN DEFAULT true,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  invited_by UUID REFERENCES auth.users(id),
  UNIQUE(organization_id, user_id)
);

-- 3. Add organization_id to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS primary_organization_id UUID REFERENCES public.organizations(id);

-- 4. Add organization_id to user_locations (table is user_locations, not locations)
ALTER TABLE public.user_locations 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- 5. Add organization_id to location_crops (table is user_crops, not location_crops)
ALTER TABLE public.location_crops 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_locations_org_id ON public.user_locations(organization_id);
CREATE INDEX IF NOT EXISTS idx_location_crops_org_id ON public.location_crops(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_org_id ON public.user_profiles(primary_organization_id);

-- 7. Function to create organization and make creator the admin
CREATE OR REPLACE FUNCTION public.create_organization_with_admin(
  org_name TEXT,
  org_slug TEXT,
  org_description TEXT DEFAULT NULL,
  creator_user_id UUID DEFAULT auth.uid()
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_org_id UUID;
BEGIN
  -- Create the organization
  INSERT INTO public.organizations (name, slug, description)
  VALUES (org_name, org_slug, org_description)
  RETURNING id INTO new_org_id;
  
  -- Make the creator an org_admin
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (new_org_id, creator_user_id, 'org_admin');
  
  -- Update user's primary organization
  UPDATE public.user_profiles
  SET primary_organization_id = new_org_id
  WHERE id = creator_user_id;
  
  RETURN new_org_id;
END;
$$;

-- 8. RLS Policies for organizations table
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Superusers can see all organizations
DROP POLICY IF EXISTS "Superusers can view all organizations" ON public.organizations;
CREATE POLICY "Superusers can view all organizations"
  ON public.organizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'superuser'
    )
  );

-- Users can see organizations they belong to
DROP POLICY IF EXISTS "Users can view their organizations" ON public.organizations;
CREATE POLICY "Users can view their organizations"
  ON public.organizations FOR SELECT
  USING (
    id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Org admins can update their organization
DROP POLICY IF EXISTS "Org admins can update their organization" ON public.organizations;
CREATE POLICY "Org admins can update their organization"
  ON public.organizations FOR UPDATE
  USING (
    id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid() AND role = 'org_admin'
    )
  );

-- Superusers can do everything
DROP POLICY IF EXISTS "Superusers can manage all organizations" ON public.organizations;
CREATE POLICY "Superusers can manage all organizations"
  ON public.organizations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'superuser'
    )
  );

-- Anyone authenticated can create an organization
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON public.organizations;
CREATE POLICY "Authenticated users can create organizations"
  ON public.organizations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 9. RLS Policies for organization_members
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Users can view members of their organizations
DROP POLICY IF EXISTS "Users can view org members" ON public.organization_members;
CREATE POLICY "Users can view org members"
  ON public.organization_members FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'superuser'
    )
  );

-- Org admins can add members to their org
DROP POLICY IF EXISTS "Org admins can add members" ON public.organization_members;
CREATE POLICY "Org admins can add members"
  ON public.organization_members FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid() AND role = 'org_admin'
    )
    OR
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'superuser'
    )
  );

-- Org admins can update members in their org
DROP POLICY IF EXISTS "Org admins can update members" ON public.organization_members;
CREATE POLICY "Org admins can update members"
  ON public.organization_members FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid() AND role = 'org_admin'
    )
    OR
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'superuser'
    )
  );

-- Org admins can remove members (except themselves)
DROP POLICY IF EXISTS "Org admins can remove members" ON public.organization_members;
CREATE POLICY "Org admins can remove members"
  ON public.organization_members FOR DELETE
  USING (
    user_id != auth.uid()
    AND
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid() AND role = 'org_admin'
    )
    OR
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'superuser'
    )
  );

-- 10. Update existing RLS policies for user_locations (org-scoped)
DROP POLICY IF EXISTS "Users can view locations they have access to" ON public.user_locations;
DROP POLICY IF EXISTS "Users can view org locations" ON public.user_locations;
CREATE POLICY "Users can view org locations"
  ON public.user_locations FOR SELECT
  USING (
    -- Superuser can see all
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'superuser'
    )
    OR
    -- User can see locations in their orgs
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
    OR
    -- Legacy: locations without org_id (personal locations)
    organization_id IS NULL
  );

-- 11. Update existing RLS policies for location_crops (org-scoped)
DROP POLICY IF EXISTS "Users can view crops for their locations" ON public.location_crops;
DROP POLICY IF EXISTS "Users can view org crops" ON public.location_crops;
CREATE POLICY "Users can view org crops"
  ON public.location_crops FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'superuser'
    )
    OR
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
    OR
    organization_id IS NULL
  );

-- 12. Function to get user's role in an organization
CREATE OR REPLACE FUNCTION public.get_user_org_role(
  org_id UUID,
  user_id UUID DEFAULT auth.uid()
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role TEXT;
  is_super BOOLEAN;
BEGIN
  -- Check if superuser first
  SELECT role = 'superuser' INTO is_super
  FROM public.user_profiles
  WHERE id = user_id;
  
  IF is_super THEN
    RETURN 'superuser';
  END IF;
  
  -- Get org role
  SELECT role INTO user_role
  FROM public.organization_members
  WHERE organization_id = org_id AND user_id = user_id AND is_active = true;
  
  RETURN COALESCE(user_role, 'none');
END;
$$;

-- 13. Create a default "Personal" organization for existing users
DO $$
DECLARE
  user_record RECORD;
  personal_org_id UUID;
BEGIN
  FOR user_record IN 
    SELECT id, email FROM public.user_profiles 
    WHERE primary_organization_id IS NULL
  LOOP
    -- Create personal organization
    INSERT INTO public.organizations (name, slug, description)
    VALUES (
      user_record.email || '''s Personal Account',
      'personal-' || user_record.id,
      'Personal organization for ' || user_record.email
    )
    RETURNING id INTO personal_org_id;
    
    -- Add user as org_admin
    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (personal_org_id, user_record.id, 'org_admin');
    
    -- Update user profile
    UPDATE public.user_profiles
    SET primary_organization_id = personal_org_id
    WHERE id = user_record.id;
    
    -- Update user's existing locations
    UPDATE public.user_locations
    SET organization_id = personal_org_id
    WHERE user_id = user_record.id;
    
    -- Update user's existing crops
    UPDATE public.location_crops
    SET organization_id = personal_org_id
    WHERE location_id IN (
      SELECT id FROM public.user_locations
      WHERE user_id = user_record.id
    );
  END LOOP;
END;
$$;

-- 14. Trigger to auto-set organization_id when creating locations
CREATE OR REPLACE FUNCTION public.auto_set_location_org()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.organization_id IS NULL THEN
    SELECT primary_organization_id INTO NEW.organization_id
    FROM public.user_profiles
    WHERE id = auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_location_org_trigger
  BEFORE INSERT ON public.user_locations
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_location_org();

-- 15. Trigger to auto-set organization_id when creating crops
CREATE OR REPLACE FUNCTION public.auto_set_crop_org()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.organization_id IS NULL THEN
    SELECT organization_id INTO NEW.organization_id
    FROM public.user_locations
    WHERE id = NEW.location_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_crop_org_trigger
  BEFORE INSERT ON public.location_crops
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_crop_org();

-- 16. Grant permissions
GRANT ALL ON public.organizations TO authenticated;
GRANT ALL ON public.organization_members TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_organization_with_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_org_role TO authenticated;

COMMENT ON TABLE public.organizations IS 'Organizations/Companies in the system. First user to create becomes org_admin.';
COMMENT ON TABLE public.organization_members IS 'Junction table tracking which users belong to which organizations and their roles.';
COMMENT ON FUNCTION public.create_organization_with_admin IS 'Creates a new organization and makes the creator an org_admin automatically.';
