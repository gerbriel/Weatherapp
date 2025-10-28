-- Check the current crop_coefficients table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'crop_coefficients'
ORDER BY ordinal_position;

-- Check if pending_crop_coefficients table exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'pending_crop_coefficients'
ORDER BY ordinal_position;