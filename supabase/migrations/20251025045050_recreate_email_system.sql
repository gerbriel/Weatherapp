-- Drop and recreate email system tables with correct schema
-- This ensures we have the right structure for the email functionality

-- Drop existing tables (if they exist) to recreate with correct schema
DROP TABLE IF EXISTS email_send_logs CASCADE;
DROP TABLE IF EXISTS email_subscriptions CASCADE;
DROP TABLE IF EXISTS weather_locations CASCADE;

-- Email Subscriptions Table
CREATE TABLE email_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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
    next_send_at TIMESTAMP WITH TIME ZONE
);

-- Email Send Logs Table
CREATE TABLE email_send_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subscription_id UUID REFERENCES email_subscriptions(id) ON DELETE CASCADE,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'pending', -- pending, sent, failed
    error_message TEXT,
    locations_count INTEGER,
    weather_data JSONB
);

-- Weather Locations Table (for persistence)
CREATE TABLE weather_locations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID, -- For future user authentication
    name VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    is_favorite BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_email_subscriptions_enabled ON email_subscriptions(enabled);
CREATE INDEX idx_email_subscriptions_next_send ON email_subscriptions(next_send_at);
CREATE INDEX idx_email_send_logs_subscription ON email_send_logs(subscription_id);
CREATE INDEX idx_email_send_logs_sent_at ON email_send_logs(sent_at);

-- Enable Row Level Security
ALTER TABLE email_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_send_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_locations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for anonymous access
CREATE POLICY "Allow anonymous access to email subscriptions" ON email_subscriptions FOR ALL 
USING (true);

CREATE POLICY "Allow anonymous access to email send logs" ON email_send_logs FOR ALL 
USING (true);

CREATE POLICY "Allow anonymous access to weather locations" ON weather_locations FOR ALL 
USING (true);
