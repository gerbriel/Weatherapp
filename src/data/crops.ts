interface CropStage {
  name: string;
  kc: number;
  duration: number;
  description: string;
}

export interface AvailableCrop {
  id: string;
  name: string;
  category: string;
  scientificName?: string;
  stages: CropStage[];
}

export const COMPREHENSIVE_CROP_DATABASE: AvailableCrop[] = [
  // Tree Nuts
  {
    id: 'almonds',
    name: 'Almonds',
    scientificName: 'Prunus dulcis',
    category: 'Tree Nuts',
    stages: [
      { name: 'Initial', kc: 0.40, duration: 30, description: 'Bud break and early leaf development' },
      { name: 'Development', kc: 0.85, duration: 45, description: 'Rapid canopy growth and nut development' },
      { name: 'Mid-season', kc: 1.10, duration: 60, description: 'Full canopy and peak water demand' },
      { name: 'Late season', kc: 0.75, duration: 45, description: 'Nut maturation and harvest preparation' }
    ]
  },
  {
    id: 'walnuts',
    name: 'Walnuts',
    scientificName: 'Juglans regia',
    category: 'Tree Nuts',
    stages: [
      { name: 'Initial', kc: 0.50, duration: 35, description: 'Bud break and catkin development' },
      { name: 'Development', kc: 0.90, duration: 50, description: 'Leaf expansion and nut development' },
      { name: 'Mid-season', kc: 1.15, duration: 65, description: 'Full canopy and hull filling' },
      { name: 'Late season', kc: 0.80, duration: 40, description: 'Hull split and harvest' }
    ]
  },
  {
    id: 'pistachios',
    name: 'Pistachios',
    scientificName: 'Pistacia vera',
    category: 'Tree Nuts',
    stages: [
      { name: 'Initial', kc: 0.35, duration: 25, description: 'Bud break and early growth' },
      { name: 'Development', kc: 0.75, duration: 40, description: 'Shoot development and flowering' },
      { name: 'Mid-season', kc: 1.05, duration: 70, description: 'Nut development and filling' },
      { name: 'Late season', kc: 0.70, duration: 35, description: 'Nut maturation and harvest' }
    ]
  },

  // Tree Fruits
  {
    id: 'grapes',
    name: 'Grapes',
    category: 'Tree Fruits',
    stages: [
      { name: 'Initial', kc: 0.30, duration: 20, description: 'Bud break and shoot emergence' },
      { name: 'Development', kc: 0.70, duration: 40, description: 'Rapid shoot and leaf growth' },
      { name: 'Mid-season', kc: 1.15, duration: 50, description: 'Flowering, fruit set, and veraison' },
      { name: 'Late season', kc: 0.80, duration: 30, description: 'Fruit ripening and harvest' }
    ]
  },
  {
    id: 'oranges',
    name: 'Oranges',
    category: 'Tree Fruits',
    stages: [
      { name: 'Initial', kc: 0.55, duration: 45, description: 'Spring flush and flowering' },
      { name: 'Development', kc: 0.85, duration: 60, description: 'Fruit set and early development' },
      { name: 'Mid-season', kc: 1.00, duration: 90, description: 'Fruit enlargement and maturation' },
      { name: 'Late season', kc: 0.75, duration: 60, description: 'Harvest and dormancy preparation' }
    ]
  },
  {
    id: 'apples',
    name: 'Apples',
    category: 'Tree Fruits',
    stages: [
      { name: 'Initial', kc: 0.45, duration: 30, description: 'Bud break and bloom' },
      { name: 'Development', kc: 0.80, duration: 50, description: 'Fruit set and early growth' },
      { name: 'Mid-season', kc: 1.10, duration: 70, description: 'Fruit development and sizing' },
      { name: 'Late season', kc: 0.85, duration: 45, description: 'Fruit maturation and harvest' }
    ]
  },
  {
    id: 'peaches',
    name: 'Peaches',
    category: 'Tree Fruits',
    stages: [
      { name: 'Initial', kc: 0.40, duration: 25, description: 'Bud break and flowering' },
      { name: 'Development', kc: 0.75, duration: 35, description: 'Leaf development and fruit set' },
      { name: 'Mid-season', kc: 1.05, duration: 50, description: 'Rapid fruit growth' },
      { name: 'Late season', kc: 0.80, duration: 30, description: 'Fruit ripening and harvest' }
    ]
  },
  {
    id: 'avocados',
    name: 'Avocados',
    category: 'Tree Fruits',
    stages: [
      { name: 'Initial', kc: 0.50, duration: 60, description: 'New flush and flowering' },
      { name: 'Development', kc: 0.75, duration: 90, description: 'Fruit set and early development' },
      { name: 'Mid-season', kc: 0.95, duration: 120, description: 'Fruit growth and maturation' },
      { name: 'Late season', kc: 0.70, duration: 90, description: 'Harvest and winter dormancy' }
    ]
  },

  // Berries
  {
    id: 'strawberries',
    name: 'Strawberries',
    category: 'Berries',
    stages: [
      { name: 'Initial', kc: 0.40, duration: 25, description: 'Plant establishment and early growth' },
      { name: 'Development', kc: 0.70, duration: 35, description: 'Vegetative growth and flowering' },
      { name: 'Mid-season', kc: 1.00, duration: 40, description: 'Fruit development and harvest' },
      { name: 'Late season', kc: 0.85, duration: 20, description: 'Continued harvest and runner development' }
    ]
  },
  {
    id: 'blueberries',
    name: 'Blueberries',
    category: 'Berries',
    stages: [
      { name: 'Initial', kc: 0.35, duration: 30, description: 'Bud break and leaf emergence' },
      { name: 'Development', kc: 0.65, duration: 40, description: 'Flowering and fruit set' },
      { name: 'Mid-season', kc: 0.95, duration: 45, description: 'Fruit development and ripening' },
      { name: 'Late season', kc: 0.75, duration: 35, description: 'Harvest and fall preparation' }
    ]
  },
  {
    id: 'blackberries',
    name: 'Blackberries',
    category: 'Berries',
    stages: [
      { name: 'Initial', kc: 0.30, duration: 20, description: 'Cane emergence and early growth' },
      { name: 'Development', kc: 0.60, duration: 35, description: 'Lateral growth and flowering' },
      { name: 'Mid-season', kc: 0.90, duration: 40, description: 'Fruit development and harvest' },
      { name: 'Late season', kc: 0.70, duration: 25, description: 'Continued harvest and cane maturation' }
    ]
  },

  // Leafy Greens
  {
    id: 'lettuce',
    name: 'Lettuce',
    category: 'Leafy Greens',
    stages: [
      { name: 'Initial', kc: 0.45, duration: 15, description: 'Seedling establishment' },
      { name: 'Development', kc: 0.75, duration: 25, description: 'Leaf development and head formation' },
      { name: 'Mid-season', kc: 1.00, duration: 30, description: 'Head filling and maturation' },
      { name: 'Late season', kc: 0.70, duration: 10, description: 'Harvest maturity' }
    ]
  },
  {
    id: 'spinach',
    name: 'Spinach',
    category: 'Leafy Greens',
    stages: [
      { name: 'Initial', kc: 0.40, duration: 12, description: 'Germination and cotyledon stage' },
      { name: 'Development', kc: 0.70, duration: 20, description: 'True leaf development' },
      { name: 'Mid-season', kc: 1.00, duration: 25, description: 'Rapid leaf growth' },
      { name: 'Late season', kc: 0.75, duration: 15, description: 'Harvest maturity' }
    ]
  },
  {
    id: 'kale',
    name: 'Kale',
    category: 'Leafy Greens',
    stages: [
      { name: 'Initial', kc: 0.40, duration: 18, description: 'Seedling establishment' },
      { name: 'Development', kc: 0.70, duration: 28, description: 'Leaf development' },
      { name: 'Mid-season', kc: 1.05, duration: 35, description: 'Full leaf production' },
      { name: 'Late season', kc: 0.80, duration: 20, description: 'Continuous harvest' }
    ]
  },
  {
    id: 'arugula',
    name: 'Arugula',
    category: 'Leafy Greens',
    stages: [
      { name: 'Initial', kc: 0.45, duration: 10, description: 'Germination and early growth' },
      { name: 'Development', kc: 0.75, duration: 15, description: 'Leaf development' },
      { name: 'Mid-season', kc: 1.00, duration: 20, description: 'Peak growth and harvest' },
      { name: 'Late season', kc: 0.70, duration: 10, description: 'Final harvest' }
    ]
  },

  // Vegetables
  {
    id: 'tomatoes',
    name: 'Tomatoes',
    category: 'Vegetables',
    stages: [
      { name: 'Initial', kc: 0.45, duration: 20, description: 'Transplanting and establishment' },
      { name: 'Development', kc: 0.75, duration: 30, description: 'Vegetative growth and flowering' },
      { name: 'Mid-season', kc: 1.15, duration: 40, description: 'Fruit set and development' },
      { name: 'Late season', kc: 0.80, duration: 30, description: 'Fruit ripening and harvest' }
    ]
  },
  {
    id: 'peppers',
    name: 'Peppers',
    category: 'Vegetables',
    stages: [
      { name: 'Initial', kc: 0.40, duration: 25, description: 'Transplanting and early growth' },
      { name: 'Development', kc: 0.70, duration: 35, description: 'Vegetative growth and flowering' },
      { name: 'Mid-season', kc: 1.05, duration: 45, description: 'Fruit development' },
      { name: 'Late season', kc: 0.85, duration: 25, description: 'Fruit maturation and harvest' }
    ]
  },
  {
    id: 'cucumbers',
    name: 'Cucumbers',
    category: 'Vegetables',
    stages: [
      { name: 'Initial', kc: 0.50, duration: 15, description: 'Germination and early growth' },
      { name: 'Development', kc: 0.80, duration: 25, description: 'Vine development and flowering' },
      { name: 'Mid-season', kc: 1.10, duration: 35, description: 'Fruit production' },
      { name: 'Late season', kc: 0.75, duration: 15, description: 'Final harvest' }
    ]
  },
  {
    id: 'carrots',
    name: 'Carrots',
    category: 'Vegetables',
    stages: [
      { name: 'Initial', kc: 0.35, duration: 20, description: 'Germination and early leaf growth' },
      { name: 'Development', kc: 0.70, duration: 30, description: 'Leaf development and root initiation' },
      { name: 'Mid-season', kc: 1.05, duration: 50, description: 'Root enlargement' },
      { name: 'Late season', kc: 0.80, duration: 30, description: 'Root maturation and harvest' }
    ]
  },
  {
    id: 'broccoli',
    name: 'Broccoli',
    category: 'Vegetables',
    stages: [
      { name: 'Initial', kc: 0.40, duration: 20, description: 'Transplanting and establishment' },
      { name: 'Development', kc: 0.70, duration: 25, description: 'Vegetative growth' },
      { name: 'Mid-season', kc: 1.05, duration: 30, description: 'Head formation' },
      { name: 'Late season', kc: 0.75, duration: 15, description: 'Head maturation and harvest' }
    ]
  },

  // Field Crops
  {
    id: 'corn',
    name: 'Corn',
    category: 'Field Crops',
    stages: [
      { name: 'Initial', kc: 0.30, duration: 25, description: 'Emergence to V6 stage' },
      { name: 'Development', kc: 0.70, duration: 35, description: 'V6 to tasseling' },
      { name: 'Mid-season', kc: 1.20, duration: 40, description: 'Tasseling to blister stage' },
      { name: 'Late season', kc: 0.60, duration: 30, description: 'Dent stage to maturity' }
    ]
  },
  {
    id: 'soybeans',
    name: 'Soybeans',
    category: 'Field Crops',
    stages: [
      { name: 'Initial', kc: 0.40, duration: 15, description: 'Emergence to V1 stage' },
      { name: 'Development', kc: 0.70, duration: 35, description: 'V1 to R1 (flowering)' },
      { name: 'Mid-season', kc: 1.15, duration: 45, description: 'R1 to R6 (full seed)' },
      { name: 'Late season', kc: 0.50, duration: 25, description: 'R6 to maturity' }
    ]
  },
  {
    id: 'wheat',
    name: 'Wheat',
    category: 'Field Crops',
    stages: [
      { name: 'Initial', kc: 0.35, duration: 30, description: 'Emergence to tillering' },
      { name: 'Development', kc: 0.70, duration: 40, description: 'Tillering to jointing' },
      { name: 'Mid-season', kc: 1.15, duration: 50, description: 'Jointing to grain filling' },
      { name: 'Late season', kc: 0.40, duration: 30, description: 'Grain filling to harvest' }
    ]
  },
  {
    id: 'cotton',
    name: 'Cotton',
    category: 'Field Crops',
    stages: [
      { name: 'Initial', kc: 0.35, duration: 30, description: 'Emergence to squaring' },
      { name: 'Development', kc: 0.70, duration: 50, description: 'Squaring to flowering' },
      { name: 'Mid-season', kc: 1.15, duration: 60, description: 'Flowering to boll opening' },
      { name: 'Late season', kc: 0.50, duration: 45, description: 'Boll opening to harvest' }
    ]
  },
  {
    id: 'alfalfa',
    name: 'Alfalfa',
    category: 'Field Crops',
    stages: [
      { name: 'Initial', kc: 0.40, duration: 10, description: 'Post-cutting regrowth' },
      { name: 'Development', kc: 0.70, duration: 20, description: 'Vegetative growth' },
      { name: 'Mid-season', kc: 1.20, duration: 25, description: 'Pre-bloom to 10% bloom' },
      { name: 'Late season', kc: 1.10, duration: 10, description: 'Harvest ready' }
    ]
  },

  // Herbs
  {
    id: 'basil',
    name: 'Basil',
    category: 'Herbs',
    stages: [
      { name: 'Initial', kc: 0.40, duration: 15, description: 'Seedling establishment' },
      { name: 'Development', kc: 0.70, duration: 25, description: 'Vegetative growth' },
      { name: 'Mid-season', kc: 1.05, duration: 45, description: 'Full production' },
      { name: 'Late season', kc: 0.80, duration: 30, description: 'Continuous harvest' }
    ]
  },
  {
    id: 'cilantro',
    name: 'Cilantro',
    category: 'Herbs',
    stages: [
      { name: 'Initial', kc: 0.45, duration: 12, description: 'Germination and early growth' },
      { name: 'Development', kc: 0.75, duration: 18, description: 'Leaf development' },
      { name: 'Mid-season', kc: 1.00, duration: 25, description: 'Peak harvest period' },
      { name: 'Late season', kc: 0.70, duration: 15, description: 'Before bolting' }
    ]
  },
  {
    id: 'oregano',
    name: 'Oregano',
    scientificName: 'Origanum vulgare',
    category: 'Herbs',
    stages: [
      { name: 'Initial', kc: 0.35, duration: 20, description: 'Plant establishment' },
      { name: 'Development', kc: 0.65, duration: 30, description: 'Vegetative growth' },
      { name: 'Mid-season', kc: 0.95, duration: 60, description: 'Full production' },
      { name: 'Late season', kc: 0.75, duration: 40, description: 'Continuous harvest' }
    ]
  },

  // Additional Field Crops
  {
    id: 'wheat',
    name: 'Wheat',
    scientificName: 'Triticum aestivum',
    category: 'Field Crops',
    stages: [
      { name: 'Initial', kc: 0.40, duration: 40, description: 'Germination to tillering' },
      { name: 'Development', kc: 0.70, duration: 60, description: 'Tillering to stem elongation' },
      { name: 'Mid-season', kc: 1.15, duration: 40, description: 'Flowering to grain filling' },
      { name: 'Late season', kc: 0.65, duration: 30, description: 'Grain filling to maturity' }
    ]
  },
  {
    id: 'barley',
    name: 'Barley',
    scientificName: 'Hordeum vulgare',
    category: 'Field Crops',
    stages: [
      { name: 'Initial', kc: 0.30, duration: 35, description: 'Germination to tillering' },
      { name: 'Development', kc: 0.65, duration: 55, description: 'Tillering to stem elongation' },
      { name: 'Mid-season', kc: 1.10, duration: 35, description: 'Flowering to grain filling' },
      { name: 'Late season', kc: 0.60, duration: 25, description: 'Grain filling to maturity' }
    ]
  },
  {
    id: 'rice',
    name: 'Rice',
    scientificName: 'Oryza sativa',
    category: 'Field Crops',
    stages: [
      { name: 'Initial', kc: 1.05, duration: 30, description: 'Transplanting to tillering' },
      { name: 'Development', kc: 1.15, duration: 35, description: 'Tillering to panicle initiation' },
      { name: 'Mid-season', kc: 1.30, duration: 50, description: 'Flowering to grain filling' },
      { name: 'Late season', kc: 0.90, duration: 30, description: 'Grain filling to maturity' }
    ]
  },
  {
    id: 'sorghum',
    name: 'Sorghum',
    scientificName: 'Sorghum bicolor',
    category: 'Field Crops',
    stages: [
      { name: 'Initial', kc: 0.30, duration: 25, description: 'Emergence to tillering' },
      { name: 'Development', kc: 0.55, duration: 40, description: 'Tillering to boot stage' },
      { name: 'Mid-season', kc: 1.00, duration: 45, description: 'Flowering to grain filling' },
      { name: 'Late season', kc: 0.65, duration: 35, description: 'Grain filling to maturity' }
    ]
  },

  // Additional Tree Fruits
  {
    id: 'cherries',
    name: 'Cherries',
    scientificName: 'Prunus avium',
    category: 'Tree Fruits',
    stages: [
      { name: 'Initial', kc: 0.45, duration: 30, description: 'Bud break to full bloom' },
      { name: 'Development', kc: 0.80, duration: 40, description: 'Fruit set and development' },
      { name: 'Mid-season', kc: 1.05, duration: 50, description: 'Fruit development to pit hardening' },
      { name: 'Late season', kc: 0.75, duration: 30, description: 'Fruit maturation to harvest' }
    ]
  },
  {
    id: 'apricots',
    name: 'Apricots',
    scientificName: 'Prunus armeniaca',
    category: 'Tree Fruits',
    stages: [
      { name: 'Initial', kc: 0.50, duration: 35, description: 'Bud break to bloom' },
      { name: 'Development', kc: 0.85, duration: 45, description: 'Fruit set and early development' },
      { name: 'Mid-season', kc: 1.10, duration: 55, description: 'Rapid fruit growth' },
      { name: 'Late season', kc: 0.80, duration: 35, description: 'Fruit maturation' }
    ]
  },
  {
    id: 'pears',
    name: 'Pears',
    scientificName: 'Pyrus communis',
    category: 'Tree Fruits',
    stages: [
      { name: 'Initial', kc: 0.45, duration: 40, description: 'Bud break to full bloom' },
      { name: 'Development', kc: 0.75, duration: 50, description: 'Fruit set and cell division' },
      { name: 'Mid-season', kc: 1.00, duration: 65, description: 'Fruit development and sizing' },
      { name: 'Late season', kc: 0.70, duration: 40, description: 'Fruit maturation' }
    ]
  },
  {
    id: 'plums',
    name: 'Plums',
    scientificName: 'Prunus domestica',
    category: 'Tree Fruits',
    stages: [
      { name: 'Initial', kc: 0.50, duration: 35, description: 'Bud break to petal fall' },
      { name: 'Development', kc: 0.80, duration: 45, description: 'Fruit set to pit hardening' },
      { name: 'Mid-season', kc: 1.05, duration: 60, description: 'Fruit development and growth' },
      { name: 'Late season', kc: 0.75, duration: 30, description: 'Fruit ripening' }
    ]
  },

  // Additional Vegetables
  {
    id: 'onions',
    name: 'Onions',
    scientificName: 'Allium cepa',
    category: 'Vegetables',
    stages: [
      { name: 'Initial', kc: 0.70, duration: 25, description: 'Establishment and early growth' },
      { name: 'Development', kc: 1.05, duration: 30, description: 'Rapid leaf growth' },
      { name: 'Mid-season', kc: 1.20, duration: 40, description: 'Bulb development' },
      { name: 'Late season', kc: 0.80, duration: 25, description: 'Bulb maturation' }
    ]
  },
  {
    id: 'potatoes',
    name: 'Potatoes',
    scientificName: 'Solanum tuberosum',
    category: 'Vegetables',
    stages: [
      { name: 'Initial', kc: 0.50, duration: 25, description: 'Emergence to canopy development' },
      { name: 'Development', kc: 0.75, duration: 35, description: 'Vegetative growth and tuber initiation' },
      { name: 'Mid-season', kc: 1.15, duration: 50, description: 'Tuber development and bulking' },
      { name: 'Late season', kc: 0.75, duration: 25, description: 'Tuber maturation' }
    ]
  },
  {
    id: 'sweet_potatoes',
    name: 'Sweet Potatoes',
    scientificName: 'Ipomoea batatas',
    category: 'Vegetables',
    stages: [
      { name: 'Initial', kc: 0.50, duration: 20, description: 'Plant establishment' },
      { name: 'Development', kc: 0.75, duration: 30, description: 'Vine development' },
      { name: 'Mid-season', kc: 1.15, duration: 60, description: 'Full canopy and root development' },
      { name: 'Late season', kc: 0.65, duration: 40, description: 'Root maturation' }
    ]
  },
  {
    id: 'beets',
    name: 'Beets',
    scientificName: 'Beta vulgaris',
    category: 'Vegetables',
    stages: [
      { name: 'Initial', kc: 0.50, duration: 20, description: 'Germination and establishment' },
      { name: 'Development', kc: 0.75, duration: 25, description: 'Leaf development' },
      { name: 'Mid-season', kc: 1.05, duration: 35, description: 'Root development' },
      { name: 'Late season', kc: 0.95, duration: 20, description: 'Root maturation' }
    ]
  },
  {
    id: 'radishes',
    name: 'Radishes',
    scientificName: 'Raphanus sativus',
    category: 'Vegetables',
    stages: [
      { name: 'Initial', kc: 0.70, duration: 10, description: 'Germination and early growth' },
      { name: 'Development', kc: 0.90, duration: 10, description: 'Leaf development' },
      { name: 'Mid-season', kc: 1.00, duration: 15, description: 'Root development' },
      { name: 'Late season', kc: 0.90, duration: 10, description: 'Root maturation' }
    ]
  },
  {
    id: 'turnips',
    name: 'Turnips',
    scientificName: 'Brassica rapa',
    category: 'Vegetables',
    stages: [
      { name: 'Initial', kc: 0.50, duration: 20, description: 'Germination and establishment' },
      { name: 'Development', kc: 0.70, duration: 25, description: 'Leaf development' },
      { name: 'Mid-season', kc: 1.10, duration: 35, description: 'Root development' },
      { name: 'Late season', kc: 0.95, duration: 20, description: 'Root maturation' }
    ]
  },
  {
    id: 'cauliflower',
    name: 'Cauliflower',
    scientificName: 'Brassica oleracea',
    category: 'Vegetables',
    stages: [
      { name: 'Initial', kc: 0.70, duration: 25, description: 'Transplant establishment' },
      { name: 'Development', kc: 1.05, duration: 35, description: 'Vegetative growth' },
      { name: 'Mid-season', kc: 1.20, duration: 40, description: 'Head development' },
      { name: 'Late season', kc: 1.10, duration: 15, description: 'Head maturation' }
    ]
  },
  {
    id: 'cabbage',
    name: 'Cabbage',
    scientificName: 'Brassica oleracea var. capitata',
    category: 'Vegetables',
    stages: [
      { name: 'Initial', kc: 0.70, duration: 25, description: 'Transplant establishment' },
      { name: 'Development', kc: 1.05, duration: 35, description: 'Vegetative growth' },
      { name: 'Mid-season', kc: 1.20, duration: 50, description: 'Head formation' },
      { name: 'Late season', kc: 1.00, duration: 20, description: 'Head maturation' }
    ]
  },

  // Additional Legumes
  {
    id: 'soybeans',
    name: 'Soybeans',
    scientificName: 'Glycine max',
    category: 'Legumes',
    stages: [
      { name: 'Initial', kc: 0.50, duration: 25, description: 'Emergence to first trifoliate' },
      { name: 'Development', kc: 0.75, duration: 35, description: 'Vegetative growth' },
      { name: 'Mid-season', kc: 1.15, duration: 60, description: 'Flowering to pod fill' },
      { name: 'Late season', kc: 0.70, duration: 25, description: 'Pod fill to maturity' }
    ]
  },
  {
    id: 'chickpeas',
    name: 'Chickpeas',
    scientificName: 'Cicer arietinum',
    category: 'Legumes',
    stages: [
      { name: 'Initial', kc: 0.40, duration: 30, description: 'Emergence to flowering' },
      { name: 'Development', kc: 0.70, duration: 40, description: 'Flowering to pod formation' },
      { name: 'Mid-season', kc: 1.15, duration: 50, description: 'Pod filling' },
      { name: 'Late season', kc: 0.60, duration: 25, description: 'Maturation' }
    ]
  },
  {
    id: 'lentils',
    name: 'Lentils',
    scientificName: 'Lens culinaris',
    category: 'Legumes',
    stages: [
      { name: 'Initial', kc: 0.40, duration: 25, description: 'Emergence to branching' },
      { name: 'Development', kc: 0.70, duration: 35, description: 'Branching to flowering' },
      { name: 'Mid-season', kc: 1.10, duration: 50, description: 'Flowering to pod filling' },
      { name: 'Late season', kc: 0.60, duration: 20, description: 'Pod filling to maturity' }
    ]
  },
  {
    id: 'black_beans',
    name: 'Black Beans',
    scientificName: 'Phaseolus vulgaris',
    category: 'Legumes',
    stages: [
      { name: 'Initial', kc: 0.50, duration: 20, description: 'Emergence to first trifoliate' },
      { name: 'Development', kc: 0.75, duration: 30, description: 'Vegetative growth' },
      { name: 'Mid-season', kc: 1.20, duration: 40, description: 'Flowering to pod filling' },
      { name: 'Late season', kc: 0.90, duration: 20, description: 'Pod filling to harvest' }
    ]
  },

  // Additional Herbs and Spices
  {
    id: 'rosemary',
    name: 'Rosemary',
    scientificName: 'Rosmarinus officinalis',
    category: 'Herbs',
    stages: [
      { name: 'Initial', kc: 0.30, duration: 30, description: 'Plant establishment' },
      { name: 'Development', kc: 0.60, duration: 40, description: 'Vegetative growth' },
      { name: 'Mid-season', kc: 0.85, duration: 80, description: 'Full production' },
      { name: 'Late season', kc: 0.70, duration: 50, description: 'Continuous harvest' }
    ]
  },
  {
    id: 'thyme',
    name: 'Thyme',
    scientificName: 'Thymus vulgaris',
    category: 'Herbs',
    stages: [
      { name: 'Initial', kc: 0.35, duration: 25, description: 'Plant establishment' },
      { name: 'Development', kc: 0.65, duration: 35, description: 'Vegetative growth' },
      { name: 'Mid-season', kc: 0.90, duration: 70, description: 'Full production' },
      { name: 'Late season', kc: 0.75, duration: 45, description: 'Continuous harvest' }
    ]
  },
  {
    id: 'sage',
    name: 'Sage',
    scientificName: 'Salvia officinalis',
    category: 'Herbs',
    stages: [
      { name: 'Initial', kc: 0.40, duration: 30, description: 'Plant establishment' },
      { name: 'Development', kc: 0.70, duration: 40, description: 'Vegetative growth' },
      { name: 'Mid-season', kc: 0.95, duration: 75, description: 'Full production' },
      { name: 'Late season', kc: 0.80, duration: 50, description: 'Continuous harvest' }
    ]
  },
  {
    id: 'mint',
    name: 'Mint',
    scientificName: 'Mentha spicata',
    category: 'Herbs',
    stages: [
      { name: 'Initial', kc: 0.60, duration: 20, description: 'Plant establishment' },
      { name: 'Development', kc: 0.90, duration: 30, description: 'Rapid vegetative growth' },
      { name: 'Mid-season', kc: 1.15, duration: 60, description: 'Full production' },
      { name: 'Late season', kc: 1.00, duration: 40, description: 'Continuous harvest' }
    ]
  },
  {
    id: 'parsley',
    name: 'Parsley',
    scientificName: 'Petroselinum crispum',
    category: 'Herbs',
    stages: [
      { name: 'Initial', kc: 0.50, duration: 20, description: 'Germination and establishment' },
      { name: 'Development', kc: 0.80, duration: 30, description: 'Vegetative growth' },
      { name: 'Mid-season', kc: 1.05, duration: 60, description: 'Full production' },
      { name: 'Late season', kc: 0.95, duration: 45, description: 'Continuous harvest' }
    ]
  },
  {
    id: 'chives',
    name: 'Chives',
    scientificName: 'Allium schoenoprasum',
    category: 'Herbs',
    stages: [
      { name: 'Initial', kc: 0.50, duration: 25, description: 'Plant establishment' },
      { name: 'Development', kc: 0.75, duration: 30, description: 'Vegetative growth' },
      { name: 'Mid-season', kc: 1.00, duration: 70, description: 'Full production' },
      { name: 'Late season', kc: 0.90, duration: 50, description: 'Continuous harvest' }
    ]
  },

  // Specialty Crops
  {
    id: 'sunflowers',
    name: 'Sunflowers',
    scientificName: 'Helianthus annuus',
    category: 'Specialty Crops',
    stages: [
      { name: 'Initial', kc: 0.35, duration: 25, description: 'Emergence to bud stage' },
      { name: 'Development', kc: 0.75, duration: 35, description: 'Bud development to flowering' },
      { name: 'Mid-season', kc: 1.15, duration: 45, description: 'Flowering to seed filling' },
      { name: 'Late season', kc: 0.35, duration: 25, description: 'Seed maturation' }
    ]
  },
  {
    id: 'canola',
    name: 'Canola',
    scientificName: 'Brassica napus',
    category: 'Specialty Crops',
    stages: [
      { name: 'Initial', kc: 0.35, duration: 30, description: 'Emergence to rosette' },
      { name: 'Development', kc: 0.75, duration: 50, description: 'Rosette to flowering' },
      { name: 'Mid-season', kc: 1.15, duration: 40, description: 'Flowering to pod development' },
      { name: 'Late season', kc: 0.35, duration: 30, description: 'Pod filling to maturity' }
    ]
  },
  {
    id: 'sesame',
    name: 'Sesame',
    scientificName: 'Sesamum indicum',
    category: 'Specialty Crops',
    stages: [
      { name: 'Initial', kc: 0.35, duration: 20, description: 'Emergence to branching' },
      { name: 'Development', kc: 0.75, duration: 30, description: 'Vegetative growth' },
      { name: 'Mid-season', kc: 1.10, duration: 40, description: 'Flowering to capsule formation' },
      { name: 'Late season', kc: 0.60, duration: 25, description: 'Capsule filling to maturity' }
    ]
  }
];

export const getCropsByCategory = (): Record<string, AvailableCrop[]> => {
  const categories: Record<string, AvailableCrop[]> = {};
  
  COMPREHENSIVE_CROP_DATABASE.forEach(crop => {
    if (!categories[crop.category]) {
      categories[crop.category] = [];
    }
    categories[crop.category].push(crop);
  });
  
  return categories;
};

export const getCropById = (id: string): AvailableCrop | undefined => {
  return COMPREHENSIVE_CROP_DATABASE.find(crop => crop.id === id);
};

export const searchCrops = (query: string): AvailableCrop[] => {
  const lowercaseQuery = query.toLowerCase();
  return COMPREHENSIVE_CROP_DATABASE.filter(crop => 
    crop.name.toLowerCase().includes(lowercaseQuery) ||
    crop.category.toLowerCase().includes(lowercaseQuery)
  );
};