-- Temporary policy to allow anonymous access to crop data for testing
-- This should be restricted in production

-- Allow anonymous users to read crop categories
CREATE POLICY "Anonymous users can view crop categories" ON crop_categories FOR SELECT 
USING (true);

-- Allow anonymous users to read crop varieties
CREATE POLICY "Anonymous users can view crop varieties" ON crop_varieties FOR SELECT 
USING (true);

-- Allow anonymous users to read crop coefficients
CREATE POLICY "Anonymous users can view crop coefficients" ON crop_coefficients FOR SELECT 
USING (true);

-- Allow anonymous users to read growth stages  
CREATE POLICY "Anonymous users can view growth stages" ON growth_stages FOR SELECT 
USING (true);
