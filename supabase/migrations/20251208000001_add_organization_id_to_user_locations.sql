-- Add organization_id column to user_locations table if it doesn't exist
-- This migration safely adds the column and sets up proper constraints

-- First, ensure organizations table has the correct columns
DO $$ 
BEGIN
  -- Check if organizations table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations') THEN
    -- Add owner_id column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'organizations' AND column_name = 'owner_id'
    ) THEN
      -- Add user_id column as owner_id if user_id exists
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'organizations' AND column_name = 'user_id'
      ) THEN
        ALTER TABLE organizations RENAME COLUMN user_id TO owner_id;
        RAISE NOTICE 'Renamed user_id to owner_id in organizations table';
      ELSE
        -- Add owner_id column referencing auth.users
        ALTER TABLE organizations ADD COLUMN owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added owner_id column to organizations table';
      END IF;
    END IF;
  ELSE
    -- Create organizations table if it doesn't exist
    CREATE TABLE organizations (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      name text NOT NULL,
      slug text UNIQUE NOT NULL,
      description text,
      owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      settings jsonb DEFAULT '{}'::jsonb,
      created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
      updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
    );
    RAISE NOTICE 'Created organizations table';
  END IF;
END $$;

-- Add organization_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'user_locations' 
    AND column_name = 'organization_id'
  ) THEN
    -- Add the column as nullable first
    ALTER TABLE user_locations 
    ADD COLUMN organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
    
    -- Create a default organization for existing users if needed
    -- Only if user_profiles table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
      INSERT INTO organizations (id, name, slug, owner_id, description)
      SELECT 
        gen_random_uuid(),
        'Default Organization',
        'default-' || up.id::text,
        up.id,
        'Auto-created default organization'
      FROM user_profiles up
      WHERE NOT EXISTS (
        SELECT 1 FROM organizations WHERE owner_id = up.id
      )
      ON CONFLICT (slug) DO NOTHING;
    END IF;
    
    -- Update existing user_locations to have an organization_id
    -- Link them to their user's default organization
    UPDATE user_locations ul
    SET organization_id = (
      SELECT o.id 
      FROM organizations o 
      WHERE o.owner_id = ul.user_id 
      LIMIT 1
    )
    WHERE organization_id IS NULL;
    
    -- For any locations still without organization (shouldn't happen), create a generic org
    IF EXISTS (SELECT 1 FROM user_locations WHERE organization_id IS NULL) THEN
      -- Insert a fallback organization
      INSERT INTO organizations (id, name, slug, owner_id, description)
      SELECT 
        gen_random_uuid(),
        'Default Organization',
        'default-fallback',
        (SELECT id FROM auth.users LIMIT 1),
        'Fallback organization for orphaned locations'
      ON CONFLICT (slug) DO NOTHING;
      
      -- Assign orphaned locations to fallback org
      UPDATE user_locations
      SET organization_id = (SELECT id FROM organizations WHERE slug = 'default-fallback')
      WHERE organization_id IS NULL;
    END IF;
    
    -- Don't make it NOT NULL - keep it nullable for flexibility
    -- Make sure it's nullable (in case it was previously set to NOT NULL)
    ALTER TABLE user_locations 
    ALTER COLUMN organization_id DROP NOT NULL;
    
    RAISE NOTICE 'organization_id column added to user_locations table';
  ELSE
    -- Column already exists - make sure it's nullable
    ALTER TABLE user_locations 
    ALTER COLUMN organization_id DROP NOT NULL;
    
    RAISE NOTICE 'organization_id column already exists in user_locations table';
  END IF;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_user_locations_organization_id 
ON user_locations(organization_id);

-- Create index for user_id + organization_id lookups
CREATE INDEX IF NOT EXISTS idx_user_locations_user_org 
ON user_locations(user_id, organization_id);

-- Update the updated_at timestamp function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger for user_locations updated_at
DROP TRIGGER IF EXISTS update_user_locations_updated_at ON user_locations;
CREATE TRIGGER update_user_locations_updated_at
    BEFORE UPDATE ON user_locations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add trigger for organizations updated_at
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on organizations if not already enabled
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for organizations
DROP POLICY IF EXISTS "Users can view their own organizations" ON organizations;
CREATE POLICY "Users can view their own organizations" ON organizations
  FOR SELECT
  USING (
    owner_id = auth.uid()
    OR id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create organizations" ON organizations;
CREATE POLICY "Users can create organizations" ON organizations
  FOR INSERT
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Organization owners can update their organizations" ON organizations;
CREATE POLICY "Organization owners can update their organizations" ON organizations
  FOR UPDATE
  USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Organization owners can delete their organizations" ON organizations;
CREATE POLICY "Organization owners can delete their organizations" ON organizations
  FOR DELETE
  USING (owner_id = auth.uid());

-- Update user_locations RLS policies to be more permissive
-- Allow users to view their own locations regardless of organization_id
DROP POLICY IF EXISTS "Users can view their own locations" ON user_locations;
CREATE POLICY "Users can view their own locations" ON user_locations
  FOR SELECT
  USING (
    user_id = auth.uid()
  );

-- Allow users to insert their own locations
DROP POLICY IF EXISTS "Users can insert their own locations" ON user_locations;
CREATE POLICY "Users can insert their own locations" ON user_locations
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Allow users to update their own locations
DROP POLICY IF EXISTS "Users can update their own locations" ON user_locations;
CREATE POLICY "Users can update their own locations" ON user_locations
  FOR UPDATE
  USING (user_id = auth.uid());

-- Allow users to delete their own locations
DROP POLICY IF EXISTS "Users can delete their own locations" ON user_locations;
CREATE POLICY "Users can delete their own locations" ON user_locations
  FOR DELETE
  USING (user_id = auth.uid());

COMMENT ON COLUMN user_locations.organization_id IS 'Organization that owns this location';
COMMENT ON TABLE organizations IS 'Organizations for grouping users and locations';
