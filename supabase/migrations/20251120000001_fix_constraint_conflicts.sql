-- Fix constraint conflicts by checking if they exist before adding
-- This resolves the "constraint already exists" error

-- Drop and re-add constraints with proper IF NOT EXISTS logic
DO $$ 
BEGIN
    -- Check and add latitude constraint
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_latitude' 
        AND conrelid = 'user_locations'::regclass
    ) THEN
        ALTER TABLE user_locations ADD CONSTRAINT check_latitude 
        CHECK (latitude >= -90 AND latitude <= 90);
    END IF;

    -- Check and add longitude constraint
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_longitude' 
        AND conrelid = 'user_locations'::regclass
    ) THEN
        ALTER TABLE user_locations ADD CONSTRAINT check_longitude 
        CHECK (longitude >= -180 AND longitude <= 180);
    END IF;

    -- Check and add email format constraint for user_profiles
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_email_format' 
        AND conrelid = 'user_profiles'::regclass
    ) THEN
        ALTER TABLE user_profiles ADD CONSTRAINT check_email_format 
        CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
    END IF;

    -- Check and add email format constraint for organization_invitations
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_invitation_email_format' 
        AND conrelid = 'organization_invitations'::regclass
    ) THEN
        ALTER TABLE organization_invitations ADD CONSTRAINT check_invitation_email_format 
        CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
    END IF;
END $$;

SELECT 'Fixed constraint conflicts - all constraints now exist' as status;
