-- Check what columns exist in the pending_crop_coefficients table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'pending_crop_coefficients'
ORDER BY ordinal_position;