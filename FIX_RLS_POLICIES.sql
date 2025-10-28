-- CRITICAL: This SQL MUST be run in your Supabase SQL Editor Dashboard
-- to fix the Row Level Security (RLS) policies that are preventing 
-- coefficient status updates from persisting.

-- Step 1: Check current policies (for reference)
SELECT schemaname, tablename, policyname, cmd, roles, with_check
FROM pg_policies 
WHERE tablename = 'pending_crop_coefficients';

-- Step 2: Drop any existing restrictive policies
DROP POLICY IF EXISTS "Allow anonymous access to pending_crop_coefficients" ON pending_crop_coefficients;
DROP POLICY IF EXISTS "Enable read access for all users" ON pending_crop_coefficients;
DROP POLICY IF EXISTS "Enable insert for all users" ON pending_crop_coefficients;
DROP POLICY IF EXISTS "Enable update for all users" ON pending_crop_coefficients;
DROP POLICY IF EXISTS "Enable delete for all users" ON pending_crop_coefficients;

-- Step 3: Create a comprehensive policy that allows ALL operations
CREATE POLICY "allow_all_operations_pending_crop_coefficients" 
ON pending_crop_coefficients 
FOR ALL 
TO anon, authenticated, service_role
USING (true) 
WITH CHECK (true);

-- Step 4: Ensure RLS is enabled
ALTER TABLE pending_crop_coefficients ENABLE ROW LEVEL SECURITY;

-- Step 5: Verify the new policy is active
SELECT schemaname, tablename, policyname, cmd, roles, qual, with_check
FROM pg_policies 
WHERE tablename = 'pending_crop_coefficients';

-- Step 6: Test the update operation (should work now)
-- This will test that the policy allows updates
DO $$
DECLARE
    test_id UUID;
BEGIN
    -- Get a sample pending record
    SELECT id INTO test_id 
    FROM pending_crop_coefficients 
    WHERE status = 'pending' 
    LIMIT 1;
    
    IF test_id IS NOT NULL THEN
        -- Test the update
        UPDATE pending_crop_coefficients 
        SET status = 'approved' 
        WHERE id = test_id;
        
        -- Check if it worked
        IF FOUND THEN
            RAISE NOTICE 'SUCCESS: Update test passed for record %', test_id;
            -- Revert the test change
            UPDATE pending_crop_coefficients 
            SET status = 'pending' 
            WHERE id = test_id;
        ELSE
            RAISE NOTICE 'FAILED: Update test failed for record %', test_id;
        END IF;
    ELSE
        RAISE NOTICE 'No pending records found for testing';
    END IF;
END $$;