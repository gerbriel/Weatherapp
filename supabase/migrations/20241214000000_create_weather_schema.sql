-- Create the basic weather app schema before crop coefficients
-- This includes all the core tables needed for the weather application

-- Weather locations table for storing user locations
CREATE TABLE weather_locations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  latitude real NOT NULL,
  longitude real NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE weather_locations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for weather_locations
CREATE POLICY "Users can view their own locations" ON weather_locations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own locations" ON weather_locations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own locations" ON weather_locations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own locations" ON weather_locations FOR DELETE USING (auth.uid() = user_id);

-- Email subscriptions table for automated weather reports
CREATE TABLE email_subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  locations uuid[] DEFAULT '{}',
  frequency text NOT NULL CHECK (frequency IN ('daily', 'weekly')),
  time_of_day text DEFAULT '07:00',
  timezone text DEFAULT 'America/Los_Angeles',
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE email_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_subscriptions
CREATE POLICY "Users can view their own subscriptions" ON email_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own subscriptions" ON email_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own subscriptions" ON email_subscriptions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own subscriptions" ON email_subscriptions FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_weather_locations_user_id ON weather_locations(user_id);
CREATE INDEX idx_email_subscriptions_user_id ON email_subscriptions(user_id);
CREATE INDEX idx_email_subscriptions_active ON email_subscriptions(active);

-- Function to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_weather_locations_updated_at BEFORE UPDATE ON weather_locations FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_email_subscriptions_updated_at BEFORE UPDATE ON email_subscriptions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();