-- Add missing columns to user_profiles table for compatibility
-- This allows the app to work with the simple company-based auth

-- Add company and phone columns
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS company TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Update existing user with company name
UPDATE public.user_profiles 
SET company = 'ET Weather', 
    role = 'superuser',
    updated_at = NOW()
WHERE email = current_setting('app.admin_email', true);

-- Verify the changes
SELECT id, email, full_name, company, phone, role, created_at 
FROM public.user_profiles 
WHERE email = current_setting('app.admin_email', true);
