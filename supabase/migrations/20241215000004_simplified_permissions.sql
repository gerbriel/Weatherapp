-- Simplified admin permissions without auth schema functions
-- This allows users to add/edit crop data with role-based permissions

-- Create user roles table
CREATE TABLE user_roles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role_name text NOT NULL CHECK (role_name IN ('admin', 'editor', 'viewer')),
  granted_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  granted_by uuid REFERENCES auth.users(id),
  UNIQUE(user_id, role_name)
);

-- Enable RLS on user_roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- RLS policy for user_roles (users can see their own roles, admins can see all)
CREATE POLICY "Users can view their own roles" ON user_roles FOR SELECT 
USING (auth.uid() = user_id OR EXISTS (
  SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role_name = 'admin'
));

CREATE POLICY "Admins can manage all roles" ON user_roles FOR ALL 
USING (EXISTS (
  SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role_name = 'admin'
));

-- For now, let's allow all authenticated users to add/edit crop data
-- In production, you can restrict this to specific roles

-- Update policies for crop_categories
DROP POLICY IF EXISTS "Crop categories are viewable by all users" ON crop_categories;
CREATE POLICY "Authenticated users can view crop categories" ON crop_categories FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can add crop categories" ON crop_categories FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update crop categories" ON crop_categories FOR UPDATE 
USING (auth.role() = 'authenticated');

-- Update policies for crop_varieties  
DROP POLICY IF EXISTS "Crop varieties are viewable by all users" ON crop_varieties;
CREATE POLICY "Authenticated users can view crop varieties" ON crop_varieties FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can add crop varieties" ON crop_varieties FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update crop varieties" ON crop_varieties FOR UPDATE 
USING (auth.role() = 'authenticated');

-- Update policies for crop_coefficients
DROP POLICY IF EXISTS "Crop coefficients are viewable by all users" ON crop_coefficients;
CREATE POLICY "Authenticated users can view crop coefficients" ON crop_coefficients FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can add crop coefficients" ON crop_coefficients FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update crop coefficients" ON crop_coefficients FOR UPDATE 
USING (auth.role() = 'authenticated');

-- Update policies for growth_stages (keep read-only for now)
DROP POLICY IF EXISTS "Growth stages are viewable by all users" ON growth_stages;
CREATE POLICY "Authenticated users can view growth stages" ON growth_stages FOR SELECT 
USING (auth.role() = 'authenticated');

-- Update policies for regional_adaptations
DROP POLICY IF EXISTS "Regional adaptations are viewable by all users" ON regional_adaptations;
CREATE POLICY "Authenticated users can view regional adaptations" ON regional_adaptations FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can add regional adaptations" ON regional_adaptations FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update regional adaptations" ON regional_adaptations FOR UPDATE 
USING (auth.role() = 'authenticated');

-- Create indexes for performance
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_name ON user_roles(role_name);