-- Supabase SQL Schema for Weather App Email System
-- Run this in your Supabase SQL editor

-- Enable Row Level Security
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Email Subscriptions Table
CREATE TABLE IF NOT EXISTS email_subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    enabled BOOLEAN DEFAULT true,
    is_recurring BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Scheduling with minute precision
    schedule_day_of_week INTEGER, -- 1=Monday, 7=Sunday (null for non-recurring)
    schedule_hour INTEGER CHECK (schedule_hour >= 0 AND schedule_hour <= 23),
    schedule_minute INTEGER CHECK (schedule_minute >= 0 AND schedule_minute <= 59),
    schedule_timezone VARCHAR(50) DEFAULT 'UTC',
    
    -- One-time scheduling (for non-recurring)
    scheduled_at TIMESTAMP WITH TIME ZONE,
    
    -- Location preferences
    selected_location_ids TEXT[] DEFAULT '{}',
    
    -- Email tracking
    last_sent_at TIMESTAMP WITH TIME ZONE,
    next_send_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT valid_recurring_schedule CHECK (
        (is_recurring = true AND schedule_day_of_week IS NOT NULL AND schedule_hour IS NOT NULL AND schedule_minute IS NOT NULL) OR
        (is_recurring = false AND scheduled_at IS NOT NULL)
    )
);

-- Email Send Logs Table
CREATE TABLE IF NOT EXISTS email_send_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    subscription_id UUID REFERENCES email_subscriptions(id) ON DELETE CASCADE,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'pending', -- pending, sent, failed
    error_message TEXT,
    locations_count INTEGER,
    weather_data JSONB
);

-- Locations Table (for persistence)
CREATE TABLE IF NOT EXISTS weather_locations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID, -- For future user authentication
    name VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    is_favorite BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_subscriptions_enabled ON email_subscriptions(enabled);
CREATE INDEX IF NOT EXISTS idx_email_subscriptions_next_send ON email_subscriptions(next_send_at);
CREATE INDEX IF NOT EXISTS idx_email_send_logs_subscription ON email_send_logs(subscription_id);
CREATE INDEX IF NOT EXISTS idx_email_send_logs_sent_at ON email_send_logs(sent_at);

-- RLS Policies (for security)
ALTER TABLE email_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_send_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_locations ENABLE ROW LEVEL SECURITY;

-- Allow public read/write for now (you can restrict this later with auth)
CREATE POLICY "Allow public access" ON email_subscriptions FOR ALL USING (true);
CREATE POLICY "Allow public access" ON email_send_logs FOR ALL USING (true);
CREATE POLICY "Allow public access" ON weather_locations FOR ALL USING (true);

-- Function to calculate next send time for recurring subscriptions
CREATE OR REPLACE FUNCTION calculate_next_send_time(
    day_of_week INTEGER,
    hour INTEGER,
    minute INTEGER,
    timezone TEXT DEFAULT 'UTC'
) RETURNS TIMESTAMP WITH TIME ZONE AS $$
DECLARE
    now_in_tz TIMESTAMP WITH TIME ZONE;
    next_occurrence TIMESTAMP WITH TIME ZONE;
    target_day INTEGER;
    days_until_target INTEGER;
BEGIN
    -- Get current time in specified timezone
    now_in_tz := NOW() AT TIME ZONE timezone;
    
    -- Calculate days until target day of week
    target_day := day_of_week;
    days_until_target := (target_day - EXTRACT(dow FROM now_in_tz)::INTEGER + 7) % 7;
    
    -- If it's today but past the time, schedule for next week
    IF days_until_target = 0 AND 
       (EXTRACT(hour FROM now_in_tz)::INTEGER > hour OR 
        (EXTRACT(hour FROM now_in_tz)::INTEGER = hour AND EXTRACT(minute FROM now_in_tz)::INTEGER >= minute)) THEN
        days_until_target := 7;
    END IF;
    
    -- Calculate next occurrence
    next_occurrence := DATE_TRUNC('day', now_in_tz) + 
                      INTERVAL '1 day' * days_until_target + 
                      INTERVAL '1 hour' * hour + 
                      INTERVAL '1 minute' * minute;
    
    RETURN next_occurrence AT TIME ZONE timezone;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically calculate next_send_at when subscription is created/updated
CREATE OR REPLACE FUNCTION update_next_send_time()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_recurring = true AND NEW.enabled = true THEN
        NEW.next_send_at := calculate_next_send_time(
            NEW.schedule_day_of_week,
            NEW.schedule_hour,
            NEW.schedule_minute,
            NEW.schedule_timezone
        );
    ELSIF NEW.is_recurring = false THEN
        NEW.next_send_at := NEW.scheduled_at;
    ELSE
        NEW.next_send_at := NULL;
    END IF;
    
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_next_send_time
    BEFORE INSERT OR UPDATE ON email_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_next_send_time();

-- Sample data (optional)
-- INSERT INTO weather_locations (name, latitude, longitude, is_favorite) 
-- VALUES ('Los Angeles, CA', 34.0522, -118.2437, true);

COMMENT ON TABLE email_subscriptions IS 'Email subscription preferences with recurring and one-time scheduling';
COMMENT ON TABLE email_send_logs IS 'Log of all email send attempts and results';
COMMENT ON TABLE weather_locations IS 'Weather locations for weather data fetching';