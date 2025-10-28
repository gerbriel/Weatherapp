-- Manual SQL to fix RLS policies for pending_crop_coefficients
-- Run this in your Supabase SQL Editor

-- First, check existing policies
SELECT schemaname, tablename, policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'pending_crop_coefficients';

-- Drop any restrictive policies
DROP POLICY IF EXISTS "Allow anonymous access to pending_crop_coefficients" ON pending_crop_coefficients;
DROP POLICY IF EXISTS "Enable read access for all users" ON pending_crop_coefficients;
DROP POLICY IF EXISTS "Enable insert for all users" ON pending_crop_coefficients;

-- Create a single comprehensive policy for all operations
CREATE POLICY "allow_all_operations_pending_crop_coefficients" 
ON pending_crop_coefficients 
FOR ALL 
TO anon, authenticated
USING (true) 
WITH CHECK (true);

-- Ensure the table has RLS enabled
ALTER TABLE pending_crop_coefficients ENABLE ROW LEVEL SECURITY;

-- Verify the policy was created
SELECT schemaname, tablename, policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'pending_crop_coefficients';