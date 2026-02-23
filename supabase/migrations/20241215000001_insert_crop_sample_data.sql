-- Insert sample data for crop coefficient system
-- This includes common crops, varieties, growth stages, and coefficients

-- Insert crop categories
INSERT INTO crop_categories (category_name, description) VALUES
('Vegetables', 'Garden vegetables and leafy greens'),
('Fruits', 'Tree fruits and berries'),
('Grains', 'Cereal grains and field crops'),
('Legumes', 'Beans, peas, and nitrogen-fixing crops'),
('Nuts', 'Tree nuts and nut crops'),
('Herbs', 'Culinary and medicinal herbs'),
('Grapes', 'Wine and table grapes'),
('Citrus', 'Citrus fruits'),
('Stone Fruits', 'Peaches, plums, cherries, apricots'),
('Berries', 'Strawberries, blueberries, blackberries');

-- Insert growth stages
INSERT INTO growth_stages (stage_name, stage_order, description) VALUES
('Initial', 1, 'Germination to 10% ground cover'),
('Development', 2, 'From 10% to 70-80% ground cover'),
('Mid-Season', 3, 'From 70-80% ground cover to maturity'),
('Late Season', 4, 'From maturity to harvest or senescence');

-- Get category IDs for inserting varieties
DO $$
DECLARE
    vegetables_id uuid;
    fruits_id uuid;
    grains_id uuid;
    legumes_id uuid;
    nuts_id uuid;
    herbs_id uuid;
    grapes_id uuid;
    citrus_id uuid;
    stone_fruits_id uuid;
    berries_id uuid;
    
    initial_stage_id uuid;
    development_stage_id uuid;
    mid_season_stage_id uuid;
    late_season_stage_id uuid;
BEGIN
    -- Get category IDs
    SELECT id INTO vegetables_id FROM crop_categories WHERE category_name = 'Vegetables';
    SELECT id INTO fruits_id FROM crop_categories WHERE category_name = 'Fruits';
    SELECT id INTO grains_id FROM crop_categories WHERE category_name = 'Grains';
    SELECT id INTO legumes_id FROM crop_categories WHERE category_name = 'Legumes';
    SELECT id INTO nuts_id FROM crop_categories WHERE category_name = 'Nuts';
    SELECT id INTO herbs_id FROM crop_categories WHERE category_name = 'Herbs';
    SELECT id INTO grapes_id FROM crop_categories WHERE category_name = 'Grapes';
    SELECT id INTO citrus_id FROM crop_categories WHERE category_name = 'Citrus';
    SELECT id INTO stone_fruits_id FROM crop_categories WHERE category_name = 'Stone Fruits';
    SELECT id INTO berries_id FROM crop_categories WHERE category_name = 'Berries';
    
    -- Get stage IDs
    SELECT id INTO initial_stage_id FROM growth_stages WHERE stage_name = 'Initial';
    SELECT id INTO development_stage_id FROM growth_stages WHERE stage_name = 'Development';
    SELECT id INTO mid_season_stage_id FROM growth_stages WHERE stage_name = 'Mid-Season';
    SELECT id INTO late_season_stage_id FROM growth_stages WHERE stage_name = 'Late Season';

    -- Insert vegetables
    INSERT INTO crop_varieties (category_id, common_name, scientific_name, variety_name, maturity_days, planting_season) VALUES
    (vegetables_id, 'Tomato', 'Solanum lycopersicum', 'Determinate', 75, 'spring'),
    (vegetables_id, 'Tomato', 'Solanum lycopersicum', 'Indeterminate', 85, 'spring'),
    (vegetables_id, 'Tomato', 'Solanum lycopersicum', 'Cherry', 65, 'spring'),
    (vegetables_id, 'Lettuce', 'Lactuca sativa', 'Romaine', 70, 'spring'),
    (vegetables_id, 'Lettuce', 'Lactuca sativa', 'Iceberg', 75, 'spring'),
    (vegetables_id, 'Lettuce', 'Lactuca sativa', 'Butterhead', 65, 'spring'),
    (vegetables_id, 'Spinach', 'Spinacia oleracea', NULL, 45, 'spring'),
    (vegetables_id, 'Broccoli', 'Brassica oleracea', NULL, 70, 'spring'),
    (vegetables_id, 'Carrots', 'Daucus carota', NULL, 75, 'spring'),
    (vegetables_id, 'Peppers', 'Capsicum annuum', 'Bell', 70, 'spring'),
    (vegetables_id, 'Peppers', 'Capsicum annuum', 'Hot', 75, 'spring'),
    (vegetables_id, 'Cucumber', 'Cucumis sativus', NULL, 55, 'spring'),
    (vegetables_id, 'Onions', 'Allium cepa', NULL, 100, 'spring'),
    (vegetables_id, 'Potatoes', 'Solanum tuberosum', 'Russet', 90, 'spring'),
    (vegetables_id, 'Potatoes', 'Solanum tuberosum', 'Red', 75, 'spring');

    -- Insert grapes with different varieties
    INSERT INTO crop_varieties (category_id, common_name, scientific_name, variety_name, maturity_days, planting_season) VALUES
    (grapes_id, 'Grape', 'Vitis vinifera', 'Cabernet Sauvignon', 165, 'spring'),
    (grapes_id, 'Grape', 'Vitis vinifera', 'Chardonnay', 150, 'spring'),
    (grapes_id, 'Grape', 'Vitis vinifera', 'Pinot Noir', 155, 'spring'),
    (grapes_id, 'Grape', 'Vitis vinifera', 'Merlot', 160, 'spring'),
    (grapes_id, 'Grape', 'Vitis vinifera', 'Sauvignon Blanc', 145, 'spring'),
    (grapes_id, 'Grape', 'Vitis labrusca', 'Concord', 140, 'spring'),
    (grapes_id, 'Grape', 'Vitis vinifera', 'Thompson Seedless', 135, 'spring');

    -- Insert citrus varieties
    INSERT INTO crop_varieties (category_id, common_name, scientific_name, variety_name, maturity_days, planting_season) VALUES
    (citrus_id, 'Orange', 'Citrus sinensis', 'Navel', 270, 'year-round'),
    (citrus_id, 'Orange', 'Citrus sinensis', 'Valencia', 300, 'year-round'),
    (citrus_id, 'Lemon', 'Citrus limon', 'Eureka', 240, 'year-round'),
    (citrus_id, 'Lemon', 'Citrus limon', 'Meyer', 210, 'year-round'),
    (citrus_id, 'Lime', 'Citrus aurantifolia', 'Key Lime', 180, 'year-round'),
    (citrus_id, 'Grapefruit', 'Citrus paradisi', 'Ruby Red', 330, 'year-round'),
    (citrus_id, 'Avocado', 'Persea americana', 'Hass', 365, 'year-round'),
    (citrus_id, 'Avocado', 'Persea americana', 'Fuerte', 300, 'year-round');

    -- Insert stone fruits
    INSERT INTO crop_varieties (category_id, common_name, scientific_name, variety_name, maturity_days, planting_season) VALUES
    (stone_fruits_id, 'Peach', 'Prunus persica', 'Freestone', 120, 'spring'),
    (stone_fruits_id, 'Peach', 'Prunus persica', 'Clingstone', 110, 'spring'),
    (stone_fruits_id, 'Cherry', 'Prunus avium', 'Bing', 75, 'spring'),
    (stone_fruits_id, 'Cherry', 'Prunus cerasus', 'Montmorency', 70, 'spring'),
    (stone_fruits_id, 'Plum', 'Prunus domestica', 'Santa Rosa', 100, 'spring'),
    (stone_fruits_id, 'Apricot', 'Prunus armeniaca', NULL, 90, 'spring');

    -- Insert nuts
    INSERT INTO crop_varieties (category_id, common_name, scientific_name, variety_name, maturity_days, planting_season) VALUES
    (nuts_id, 'Almond', 'Prunus dulcis', 'Nonpareil', 240, 'spring'),
    (nuts_id, 'Almond', 'Prunus dulcis', 'Carmel', 250, 'spring'),
    (nuts_id, 'Walnut', 'Juglans regia', 'English', 200, 'spring'),
    (nuts_id, 'Pistachio', 'Pistacia vera', 'Kerman', 180, 'spring');

    -- Insert legumes
    INSERT INTO crop_varieties (category_id, common_name, scientific_name, variety_name, maturity_days, planting_season) VALUES
    (legumes_id, 'Beans', 'Phaseolus vulgaris', 'Bush', 50, 'spring'),
    (legumes_id, 'Beans', 'Phaseolus vulgaris', 'Pole', 65, 'spring'),
    (legumes_id, 'Peas', 'Pisum sativum', 'Sugar Snap', 60, 'spring'),
    (legumes_id, 'Soybeans', 'Glycine max', NULL, 100, 'spring'),
    (legumes_id, 'Alfalfa', 'Medicago sativa', NULL, 365, 'spring');

    -- Insert grains
    INSERT INTO crop_varieties (category_id, common_name, scientific_name, variety_name, maturity_days, planting_season) VALUES
    (grains_id, 'Corn', 'Zea mays', 'Sweet', 85, 'spring'),
    (grains_id, 'Corn', 'Zea mays', 'Field', 120, 'spring'),
    (grains_id, 'Wheat', 'Triticum aestivum', 'Winter', 240, 'fall'),
    (grains_id, 'Wheat', 'Triticum aestivum', 'Spring', 120, 'spring'),
    (grains_id, 'Rice', 'Oryza sativa', NULL, 150, 'spring');

    -- Insert berries
    INSERT INTO crop_varieties (category_id, common_name, scientific_name, variety_name, maturity_days, planting_season) VALUES
    (berries_id, 'Strawberry', 'Fragaria ananassa', 'June-bearing', 60, 'spring'),
    (berries_id, 'Strawberry', 'Fragaria ananassa', 'Ever-bearing', 90, 'spring'),
    (berries_id, 'Blueberry', 'Vaccinium corymbosum', 'Highbush', 180, 'spring'),
    (berries_id, 'Blackberry', 'Rubus species', NULL, 120, 'spring');

    -- Insert herbs
    INSERT INTO crop_varieties (category_id, common_name, scientific_name, variety_name, maturity_days, planting_season) VALUES
    (herbs_id, 'Basil', 'Ocimum basilicum', 'Sweet', 70, 'spring'),
    (herbs_id, 'Oregano', 'Origanum vulgare', NULL, 80, 'spring'),
    (herbs_id, 'Thyme', 'Thymus vulgaris', NULL, 75, 'spring'),
    (herbs_id, 'Rosemary', 'Rosmarinus officinalis', NULL, 90, 'spring');

END $$;