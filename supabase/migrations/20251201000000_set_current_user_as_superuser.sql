-- Set the current authenticated user as a superuser
-- Run this migration to make yourself a superuser

-- Update your user profile to be a superuser
-- Replace with your actual email if needed
UPDATE user_profiles 
SET role = 'superuser'
WHERE email = (
  SELECT email 
  FROM auth.users 
  WHERE id = auth.uid()
  LIMIT 1
);

-- Verify the update
DO $$
DECLARE
  current_role text;
  current_email text;
BEGIN
  SELECT role, email INTO current_role, current_email
  FROM user_profiles
  WHERE id = auth.uid();
  
  RAISE NOTICE 'User % is now set to role: %', current_email, current_role;
END $$;
