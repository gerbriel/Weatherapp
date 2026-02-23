-- Create comprehensive crop coefficient management system
-- This schema supports variety-level precision, regional adaptations, and growth stage variations

-- Crop categories (main crop types)
CREATE TABLE crop_categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  category_name text NOT NULL UNIQUE,
  description text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Crop varieties (specific varieties/strains within categories)
CREATE TABLE crop_varieties (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id uuid REFERENCES crop_categories(id) ON DELETE CASCADE,
  common_name text NOT NULL,
  scientific_name text,
  variety_name text,
  strain_name text,
  description text,
  maturity_days integer,
  planting_season text, -- spring, summer, fall, winter, year-round
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Growth stages for coefficient variations
CREATE TABLE growth_stages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  stage_name text NOT NULL UNIQUE,
  stage_order integer NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Crop coefficients (Kc values) for different growth stages
CREATE TABLE crop_coefficients (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  variety_id uuid REFERENCES crop_varieties(id) ON DELETE CASCADE,
  growth_stage_id uuid REFERENCES growth_stages(id) ON DELETE CASCADE,
  kc_value decimal(4,3) NOT NULL, -- Crop coefficient value
  stage_duration_days integer, -- How long this stage lasts
  notes text,
  source text, -- Research source/citation
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(variety_id, growth_stage_id)
);

-- Regional adaptations for location-specific adjustments
CREATE TABLE regional_adaptations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  variety_id uuid REFERENCES crop_varieties(id) ON DELETE CASCADE,
  region_name text NOT NULL,
  country_code text,
  state_province text,
  climate_zone text,
  kc_adjustment_factor decimal(4,3) DEFAULT 1.0, -- Multiplier for base Kc
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- User's selected crops for their locations
CREATE TABLE user_crops (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  location_id uuid REFERENCES weather_locations(id) ON DELETE CASCADE,
  variety_id uuid REFERENCES crop_varieties(id) ON DELETE CASCADE,
  planting_date date,
  harvest_date date,
  current_stage_id uuid REFERENCES growth_stages(id),
  stage_start_date date,
  area_size decimal(10,2), -- in acres or hectares
  area_unit text DEFAULT 'acres',
  active boolean DEFAULT true,
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, location_id, variety_id, planting_date)
);

-- Create indexes for better performance
CREATE INDEX idx_crop_varieties_category ON crop_varieties(category_id);
CREATE INDEX idx_crop_varieties_common_name ON crop_varieties(common_name);
CREATE INDEX idx_crop_varieties_scientific_name ON crop_varieties(scientific_name);
CREATE INDEX idx_crop_coefficients_variety ON crop_coefficients(variety_id);
CREATE INDEX idx_crop_coefficients_stage ON crop_coefficients(growth_stage_id);
CREATE INDEX idx_regional_adaptations_variety ON regional_adaptations(variety_id);
CREATE INDEX idx_user_crops_user_location ON user_crops(user_id, location_id);
CREATE INDEX idx_user_crops_variety ON user_crops(variety_id);

-- Enable Row Level Security
ALTER TABLE crop_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE crop_varieties ENABLE ROW LEVEL SECURITY;
ALTER TABLE growth_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE crop_coefficients ENABLE ROW LEVEL SECURITY;
ALTER TABLE regional_adaptations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_crops ENABLE ROW LEVEL SECURITY;

-- RLS Policies for crop data (public read access for crop information)
CREATE POLICY "Crop categories are viewable by all users" ON crop_categories FOR SELECT USING (true);
CREATE POLICY "Crop varieties are viewable by all users" ON crop_varieties FOR SELECT USING (true);
CREATE POLICY "Growth stages are viewable by all users" ON growth_stages FOR SELECT USING (true);
CREATE POLICY "Crop coefficients are viewable by all users" ON crop_coefficients FOR SELECT USING (true);
CREATE POLICY "Regional adaptations are viewable by all users" ON regional_adaptations FOR SELECT USING (true);

-- RLS Policies for user crops (users can only access their own crops)
CREATE POLICY "Users can view their own crops" ON user_crops FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own crops" ON user_crops FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own crops" ON user_crops FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own crops" ON user_crops FOR DELETE USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_crop_categories_updated_at BEFORE UPDATE ON crop_categories FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_crop_varieties_updated_at BEFORE UPDATE ON crop_varieties FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_crop_coefficients_updated_at BEFORE UPDATE ON crop_coefficients FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_regional_adaptations_updated_at BEFORE UPDATE ON regional_adaptations FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_user_crops_updated_at BEFORE UPDATE ON user_crops FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();