-- Drop existing RLS policies for pending_crop_coefficients if they exist
DROP POLICY IF EXISTS "Allow anonymous access to pending_crop_coefficients" ON pending_crop_coefficients;
DROP POLICY IF EXISTS "Allow all operations on pending_crop_coefficients" ON pending_crop_coefficients;

-- Create comprehensive RLS policy that allows all operations for anonymous users
CREATE POLICY "Allow all operations on pending_crop_coefficients" ON pending_crop_coefficients
FOR ALL 
TO anon
USING (true)
WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE pending_crop_coefficients ENABLE ROW LEVEL SECURITY;