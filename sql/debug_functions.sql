-- Check if the functions exist and their signatures
SELECT 
    p.proname as function_name,
    p.proargnames as argument_names,
    pg_get_function_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type
FROM pg_proc p
WHERE p.proname IN ('approve_pending_coefficient', 'reject_pending_coefficient');

-- Check crop_coefficients table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'crop_coefficients'
ORDER BY ordinal_position;

-- Check pending_crop_coefficients table structure  
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'pending_crop_coefficients'
ORDER BY ordinal_position;