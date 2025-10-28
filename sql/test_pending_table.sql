-- Test query to check if pending_crop_coefficients table exists and create test data
-- First, let's verify the table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'pending_crop_coefficients'
ORDER BY ordinal_position;

-- If the table exists, let's also check if we have any data
SELECT COUNT(*) as pending_count FROM pending_crop_coefficients;