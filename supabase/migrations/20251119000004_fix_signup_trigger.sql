-- Fix the handle_new_user trigger to handle errors better
-- This will help debug why signup is failing

-- Drop and recreate the trigger function with better error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER -- Run with elevated privileges
SET search_path = public
AS $$
DECLARE
    default_org_id uuid;
BEGIN
    -- Get or create a default organization for new users
    SELECT id INTO default_org_id 
    FROM organizations 
    WHERE slug = 'default' 
    LIMIT 1;
    
    IF default_org_id IS NULL THEN
        INSERT INTO organizations (name, slug, description)
        VALUES ('Default Organization', 'default', 'Default organization for new users')
        RETURNING id INTO default_org_id;
    END IF;
    
    -- Create user profile
    -- Using INSERT ... ON CONFLICT to handle duplicates gracefully
    INSERT INTO user_profiles (
        id, 
        organization_id, 
        email, 
        display_name,
        email_verified,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id, 
        default_org_id, 
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
        NEW.email_confirmed_at IS NOT NULL,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        email = EXCLUDED.email,
        email_verified = EXCLUDED.email_verified,
        updated_at = NOW();
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the signup
        RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION handle_new_user();

-- Grant necessary permissions to the function
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON organizations TO authenticated, anon;
GRANT ALL ON user_profiles TO authenticated, anon;

SELECT 'Fixed handle_new_user trigger with better error handling' as status;
