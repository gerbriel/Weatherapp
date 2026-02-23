-- Insert crop coefficient values for sample varieties
-- Values are based on FAO-56 guidelines and agricultural research

DO $$
DECLARE
    variety_id uuid;
    initial_stage_id uuid;
    development_stage_id uuid;
    mid_season_stage_id uuid;
    late_season_stage_id uuid;
BEGIN
    -- Get stage IDs
    SELECT id INTO initial_stage_id FROM growth_stages WHERE stage_name = 'Initial';
    SELECT id INTO development_stage_id FROM growth_stages WHERE stage_name = 'Development';
    SELECT id INTO mid_season_stage_id FROM growth_stages WHERE stage_name = 'Mid-Season';
    SELECT id INTO late_season_stage_id FROM growth_stages WHERE stage_name = 'Late Season';

    -- TOMATOES (Determinate)
    SELECT id INTO variety_id FROM crop_varieties WHERE common_name = 'Tomato' AND variety_name = 'Determinate';
    INSERT INTO crop_coefficients (variety_id, growth_stage_id, kc_value, stage_duration_days, source) VALUES
    (variety_id, initial_stage_id, 0.60, 15, 'FAO-56'),
    (variety_id, development_stage_id, 1.15, 25, 'FAO-56'),
    (variety_id, mid_season_stage_id, 1.15, 25, 'FAO-56'),
    (variety_id, late_season_stage_id, 0.80, 10, 'FAO-56');

    -- TOMATOES (Indeterminate)
    SELECT id INTO variety_id FROM crop_varieties WHERE common_name = 'Tomato' AND variety_name = 'Indeterminate';
    INSERT INTO crop_coefficients (variety_id, growth_stage_id, kc_value, stage_duration_days, source) VALUES
    (variety_id, initial_stage_id, 0.60, 15, 'FAO-56'),
    (variety_id, development_stage_id, 1.15, 30, 'FAO-56'),
    (variety_id, mid_season_stage_id, 1.15, 30, 'FAO-56'),
    (variety_id, late_season_stage_id, 0.80, 10, 'FAO-56');

    -- LETTUCE (Romaine)
    SELECT id INTO variety_id FROM crop_varieties WHERE common_name = 'Lettuce' AND variety_name = 'Romaine';
    INSERT INTO crop_coefficients (variety_id, growth_stage_id, kc_value, stage_duration_days, source) VALUES
    (variety_id, initial_stage_id, 0.70, 10, 'FAO-56'),
    (variety_id, development_stage_id, 1.00, 20, 'FAO-56'),
    (variety_id, mid_season_stage_id, 1.00, 30, 'FAO-56'),
    (variety_id, late_season_stage_id, 0.95, 10, 'FAO-56');

    -- SPINACH
    SELECT id INTO variety_id FROM crop_varieties WHERE common_name = 'Spinach';
    INSERT INTO crop_coefficients (variety_id, growth_stage_id, kc_value, stage_duration_days, source) VALUES
    (variety_id, initial_stage_id, 0.70, 10, 'FAO-56'),
    (variety_id, development_stage_id, 1.00, 15, 'FAO-56'),
    (variety_id, mid_season_stage_id, 1.00, 15, 'FAO-56'),
    (variety_id, late_season_stage_id, 0.95, 5, 'FAO-56');

    -- BROCCOLI
    SELECT id INTO variety_id FROM crop_varieties WHERE common_name = 'Broccoli';
    INSERT INTO crop_coefficients (variety_id, growth_stage_id, kc_value, stage_duration_days, source) VALUES
    (variety_id, initial_stage_id, 0.70, 15, 'FAO-56'),
    (variety_id, development_stage_id, 1.05, 25, 'FAO-56'),
    (variety_id, mid_season_stage_id, 1.05, 25, 'FAO-56'),
    (variety_id, late_season_stage_id, 0.95, 5, 'FAO-56');

    -- PEPPERS (Bell)
    SELECT id INTO variety_id FROM crop_varieties WHERE common_name = 'Peppers' AND variety_name = 'Bell';
    INSERT INTO crop_coefficients (variety_id, growth_stage_id, kc_value, stage_duration_days, source) VALUES
    (variety_id, initial_stage_id, 0.60, 15, 'FAO-56'),
    (variety_id, development_stage_id, 1.05, 25, 'FAO-56'),
    (variety_id, mid_season_stage_id, 1.05, 25, 'FAO-56'),
    (variety_id, late_season_stage_id, 0.90, 5, 'FAO-56');

    -- GRAPES (Cabernet Sauvignon)
    SELECT id INTO variety_id FROM crop_varieties WHERE common_name = 'Grape' AND variety_name = 'Cabernet Sauvignon';
    INSERT INTO crop_coefficients (variety_id, growth_stage_id, kc_value, stage_duration_days, source) VALUES
    (variety_id, initial_stage_id, 0.30, 30, 'FAO-56'),
    (variety_id, development_stage_id, 0.70, 50, 'FAO-56'),
    (variety_id, mid_season_stage_id, 0.85, 70, 'FAO-56'),
    (variety_id, late_season_stage_id, 0.45, 15, 'FAO-56');

    -- GRAPES (Chardonnay)
    SELECT id INTO variety_id FROM crop_varieties WHERE common_name = 'Grape' AND variety_name = 'Chardonnay';
    INSERT INTO crop_coefficients (variety_id, growth_stage_id, kc_value, stage_duration_days, source) VALUES
    (variety_id, initial_stage_id, 0.30, 25, 'FAO-56'),
    (variety_id, development_stage_id, 0.70, 45, 'FAO-56'),
    (variety_id, mid_season_stage_id, 0.85, 65, 'FAO-56'),
    (variety_id, late_season_stage_id, 0.45, 15, 'FAO-56');

    -- CITRUS (Orange - Navel)
    SELECT id INTO variety_id FROM crop_varieties WHERE common_name = 'Orange' AND variety_name = 'Navel';
    INSERT INTO crop_coefficients (variety_id, growth_stage_id, kc_value, stage_duration_days, source) VALUES
    (variety_id, initial_stage_id, 0.70, 60, 'FAO-56'),
    (variety_id, development_stage_id, 0.65, 90, 'FAO-56'),
    (variety_id, mid_season_stage_id, 0.65, 120, 'FAO-56'),
    (variety_id, late_season_stage_id, 0.65, 0, 'FAO-56');

    -- AVOCADO (Hass)
    SELECT id INTO variety_id FROM crop_varieties WHERE common_name = 'Avocado' AND variety_name = 'Hass';
    INSERT INTO crop_coefficients (variety_id, growth_stage_id, kc_value, stage_duration_days, source) VALUES
    (variety_id, initial_stage_id, 0.60, 90, 'FAO-56'),
    (variety_id, development_stage_id, 0.85, 120, 'FAO-56'),
    (variety_id, mid_season_stage_id, 0.85, 120, 'FAO-56'),
    (variety_id, late_season_stage_id, 0.75, 35, 'FAO-56');

    -- ALMONDS (Nonpareil)
    SELECT id INTO variety_id FROM crop_varieties WHERE common_name = 'Almond' AND variety_name = 'Nonpareil';
    INSERT INTO crop_coefficients (variety_id, growth_stage_id, kc_value, stage_duration_days, source) VALUES
    (variety_id, initial_stage_id, 0.40, 30, 'FAO-56'),
    (variety_id, development_stage_id, 0.90, 90, 'FAO-56'),
    (variety_id, mid_season_stage_id, 0.90, 90, 'FAO-56'),
    (variety_id, late_season_stage_id, 0.65, 30, 'FAO-56');

    -- CORN (Sweet)
    SELECT id INTO variety_id FROM crop_varieties WHERE common_name = 'Corn' AND variety_name = 'Sweet';
    INSERT INTO crop_coefficients (variety_id, growth_stage_id, kc_value, stage_duration_days, source) VALUES
    (variety_id, initial_stage_id, 0.30, 15, 'FAO-56'),
    (variety_id, development_stage_id, 1.20, 25, 'FAO-56'),
    (variety_id, mid_season_stage_id, 1.20, 35, 'FAO-56'),
    (variety_id, late_season_stage_id, 0.60, 10, 'FAO-56');

    -- STRAWBERRIES (June-bearing)
    SELECT id INTO variety_id FROM crop_varieties WHERE common_name = 'Strawberry' AND variety_name = 'June-bearing';
    INSERT INTO crop_coefficients (variety_id, growth_stage_id, kc_value, stage_duration_days, source) VALUES
    (variety_id, initial_stage_id, 0.40, 10, 'FAO-56'),
    (variety_id, development_stage_id, 0.70, 20, 'FAO-56'),
    (variety_id, mid_season_stage_id, 0.85, 25, 'FAO-56'),
    (variety_id, late_season_stage_id, 0.75, 5, 'FAO-56');

    -- BEANS (Bush)
    SELECT id INTO variety_id FROM crop_varieties WHERE common_name = 'Beans' AND variety_name = 'Bush';
    INSERT INTO crop_coefficients (variety_id, growth_stage_id, kc_value, stage_duration_days, source) VALUES
    (variety_id, initial_stage_id, 0.40, 10, 'FAO-56'),
    (variety_id, development_stage_id, 0.70, 15, 'FAO-56'),
    (variety_id, mid_season_stage_id, 1.15, 20, 'FAO-56'),
    (variety_id, late_season_stage_id, 0.80, 5, 'FAO-56');

    -- ONIONS
    SELECT id INTO variety_id FROM crop_varieties WHERE common_name = 'Onions';
    INSERT INTO crop_coefficients (variety_id, growth_stage_id, kc_value, stage_duration_days, source) VALUES
    (variety_id, initial_stage_id, 0.70, 15, 'FAO-56'),
    (variety_id, development_stage_id, 1.05, 25, 'FAO-56'),
    (variety_id, mid_season_stage_id, 1.05, 45, 'FAO-56'),
    (variety_id, late_season_stage_id, 0.75, 15, 'FAO-56');

    -- POTATOES (Russet)
    SELECT id INTO variety_id FROM crop_varieties WHERE common_name = 'Potatoes' AND variety_name = 'Russet';
    INSERT INTO crop_coefficients (variety_id, growth_stage_id, kc_value, stage_duration_days, source) VALUES
    (variety_id, initial_stage_id, 0.50, 15, 'FAO-56'),
    (variety_id, development_stage_id, 1.15, 30, 'FAO-56'),
    (variety_id, mid_season_stage_id, 1.15, 35, 'FAO-56'),
    (variety_id, late_season_stage_id, 0.75, 10, 'FAO-56');

    -- ALFALFA
    SELECT id INTO variety_id FROM crop_varieties WHERE common_name = 'Alfalfa';
    INSERT INTO crop_coefficients (variety_id, growth_stage_id, kc_value, stage_duration_days, source) VALUES
    (variety_id, initial_stage_id, 0.40, 10, 'FAO-56'),
    (variety_id, development_stage_id, 1.20, 30, 'FAO-56'),
    (variety_id, mid_season_stage_id, 1.20, 300, 'FAO-56'),
    (variety_id, late_season_stage_id, 1.15, 25, 'FAO-56');

END $$;