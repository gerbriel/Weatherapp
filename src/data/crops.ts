interface CropStage {
  name: string;
  kc: number;
  duration: number;
  description: string;
}

interface WateringCycle {
  name: string;
  kc: number;
  duration: number;
  description: string;
  season: 'spring' | 'summer' | 'fall' | 'winter';
  repeatsAnnually: boolean;
}

interface KcPeriod {
  startDate: string; // Format: "MM-dd" (e.g., "01-01" for Jan 1)
  endDate: string;   // Format: "MM-dd" (e.g., "01-31" for Jan 31)
  kc: number;
  description?: string;
}

interface MonthlyKc {
  month: number; // 1-12 (January = 1, December = 12)
  monthName: string;
  kc: number;
  description: string;
}

export interface AvailableCrop {
  id: string;
  name: string;
  category: string;
  scientificName?: string;
  stages: CropStage[];
  wateringCycles?: WateringCycle[]; // For perennial crops with annual watering cycles
  kcSchedule?: KcPeriod[]; // Detailed date-based Kc values
  monthlyKc?: MonthlyKc[]; // Monthly Kc values (simplified approach)
  isPerennial?: boolean; // True for trees, vines, etc.
  plantingType?: 'annual' | 'perennial'; // Optional for backward compatibility
}

export const COMPREHENSIVE_CROP_DATABASE: AvailableCrop[] = [
  // Tree Nuts - Enhanced with watering cycles for perennial management
  {
    id: 'almonds',
    name: 'Almonds',
    scientificName: 'Prunus dulcis',
    category: 'Tree Nuts',
    plantingType: 'perennial',
    isPerennial: true,
    stages: [
      { name: 'Initial', kc: 0.40, duration: 30, description: 'Bud break and early leaf development' },
      { name: 'Development', kc: 0.75, duration: 45, description: 'Rapid canopy growth and nut development' },
      { name: 'Mid-season', kc: 1.11, duration: 60, description: 'Full canopy and peak water demand' },
      { name: 'Late season', kc: 0.85, duration: 45, description: 'Nut maturation and harvest preparation' }
    ],
    monthlyKc: [
      { month: 1, monthName: "January", kc: 0.40, description: "Dormant season - minimal water needs" },
      { month: 2, monthName: "February", kc: 0.41, description: "Late dormancy - preparing for bud break" },
      { month: 3, monthName: "March", kc: 0.61, description: "Bud break and early leaf development" },
      { month: 4, monthName: "April", kc: 0.80, description: "Flowering and initial nut development" },
      { month: 5, monthName: "May", kc: 0.94, description: "Rapid vegetative growth" },
      { month: 6, monthName: "June", kc: 1.05, description: "Peak nut development" },
      { month: 7, monthName: "July", kc: 1.11, description: "Maximum water demand period" },
      { month: 8, monthName: "August", kc: 1.11, description: "Continued peak water demand" },
      { month: 9, monthName: "September", kc: 1.06, description: "Nut maturation and harvest preparation" },
      { month: 10, monthName: "October", kc: 0.92, description: "Harvest period" },
      { month: 11, monthName: "November", kc: 0.69, description: "Post-harvest transition to dormancy" },
      { month: 12, monthName: "December", kc: 0.43, description: "Winter dormancy begins" }
    ]
  },
  {
    id: 'walnuts',
    name: 'Walnuts',
    scientificName: 'Juglans regia',
    category: 'Tree Nuts',
    plantingType: 'perennial',
    isPerennial: true,
    stages: [
      { name: 'Initial', kc: 0.00, duration: 90, description: 'Winter dormancy - no irrigation needs' },
      { name: 'Development', kc: 0.61, duration: 30, description: 'Bud break and catkin development' },
      { name: 'Mid-season', kc: 1.14, duration: 60, description: 'Peak growth and hull filling' },
      { name: 'Late season', kc: 0.70, duration: 60, description: 'Hull split and harvest' }
    ],
    kcSchedule: [
      { startDate: "01-01", endDate: "01-31", kc: 0.00, description: "January dormancy" },
      { startDate: "02-01", endDate: "02-28", kc: 0.00, description: "February dormancy" },
      { startDate: "03-01", endDate: "03-15", kc: 0.00, description: "Early March dormancy" },
      { startDate: "03-16", endDate: "03-31", kc: 0.12, description: "Late March bud break" },
      { startDate: "04-01", endDate: "04-15", kc: 0.53, description: "Early April development" },
      { startDate: "04-16", endDate: "04-30", kc: 0.68, description: "Late April catkin development" },
      { startDate: "05-01", endDate: "05-15", kc: 0.79, description: "Early May rapid growth" },
      { startDate: "05-16", endDate: "05-31", kc: 0.86, description: "Late May hull development" },
      { startDate: "06-01", endDate: "06-15", kc: 0.93, description: "Early June hull filling" },
      { startDate: "06-16", endDate: "06-30", kc: 1.00, description: "Late June peak growth" },
      { startDate: "07-01", endDate: "07-15", kc: 1.14, description: "Early July peak demand" },
      { startDate: "07-16", endDate: "07-31", kc: 1.14, description: "Late July peak demand" },
      { startDate: "08-01", endDate: "08-15", kc: 1.14, description: "Early August peak demand" },
      { startDate: "08-16", endDate: "08-31", kc: 1.14, description: "Late August peak demand" },
      { startDate: "09-01", endDate: "09-15", kc: 1.08, description: "Early September hull split" },
      { startDate: "09-16", endDate: "09-30", kc: 0.97, description: "Late September harvest prep" },
      { startDate: "10-01", endDate: "10-15", kc: 0.88, description: "Early October harvest" },
      { startDate: "10-16", endDate: "10-31", kc: 0.51, description: "Late October post-harvest" },
      { startDate: "11-01", endDate: "11-15", kc: 0.28, description: "Early November dormancy transition" },
      { startDate: "11-16", endDate: "11-30", kc: 0.00, description: "Late November dormancy" },
      { startDate: "12-01", endDate: "12-31", kc: 0.00, description: "December dormancy" }
    ],
    monthlyKc: [
      { month: 1, monthName: "Jan", kc: 0.00, description: "Winter dormancy - no water needs" },
      { month: 2, monthName: "Feb", kc: 0.00, description: "Continued winter dormancy" },
      { month: 3, monthName: "Mar", kc: 0.06, description: "Late bud break begins" },
      { month: 4, monthName: "Apr", kc: 0.61, description: "Spring development and catkins" },
      { month: 5, monthName: "May", kc: 0.83, description: "Rapid vegetative growth" },
      { month: 6, monthName: "Jun", kc: 0.97, description: "Hull development and filling" },
      { month: 7, monthName: "Jul", kc: 1.14, description: "Peak water demand period" },
      { month: 8, monthName: "Aug", kc: 1.14, description: "Continued high water needs" },
      { month: 9, monthName: "Sep", kc: 1.03, description: "Hull split and maturation" },
      { month: 10, monthName: "Oct", kc: 0.70, description: "Harvest and senescence" },
      { month: 11, monthName: "Nov", kc: 0.14, description: "Transition to dormancy" },
      { month: 12, monthName: "Dec", kc: 0.00, description: "Winter dormancy begins" }
    ]
  },
  {
    id: 'pistachios',
    name: 'Pistachios',
    scientificName: 'Pistacia vera',
    category: 'Tree Nuts',
    plantingType: 'perennial',
    isPerennial: true,
    stages: [
      { name: 'Initial', kc: 0.00, duration: 90, description: 'Winter dormancy - no water needs' },
      { name: 'Development', kc: 0.75, duration: 60, description: 'Shoot development and flowering' },
      { name: 'Mid-season', kc: 1.19, duration: 60, description: 'Peak nut development and filling' },
      { name: 'Late season', kc: 0.70, duration: 60, description: 'Nut maturation and harvest' }
    ],
    kcSchedule: [
      { startDate: "01-01", endDate: "01-31", kc: 0.00, description: "January dormancy" },
      { startDate: "02-01", endDate: "02-28", kc: 0.00, description: "February dormancy" },
      { startDate: "03-01", endDate: "03-15", kc: 0.00, description: "Early March dormancy" },
      { startDate: "03-16", endDate: "03-31", kc: 0.00, description: "Late March dormancy" },
      { startDate: "04-01", endDate: "04-15", kc: 0.07, description: "Early April bud break" },
      { startDate: "04-16", endDate: "04-30", kc: 0.43, description: "Late April development" },
      { startDate: "05-01", endDate: "05-15", kc: 0.68, description: "Early May growth" },
      { startDate: "05-16", endDate: "05-31", kc: 0.93, description: "Late May rapid growth" },
      { startDate: "06-01", endDate: "06-15", kc: 1.09, description: "Early June nut development" },
      { startDate: "06-16", endDate: "06-30", kc: 1.17, description: "Late June peak growth" },
      { startDate: "07-01", endDate: "07-15", kc: 1.19, description: "Early July peak demand" },
      { startDate: "07-16", endDate: "07-31", kc: 1.19, description: "Late July peak demand" },
      { startDate: "08-01", endDate: "08-15", kc: 1.19, description: "Early August peak demand" },
      { startDate: "08-16", endDate: "08-31", kc: 1.12, description: "Late August decline" },
      { startDate: "09-01", endDate: "09-15", kc: 0.99, description: "Early September maturation" },
      { startDate: "09-16", endDate: "09-30", kc: 0.87, description: "Late September harvest prep" },
      { startDate: "10-01", endDate: "10-15", kc: 0.67, description: "Early October harvest" },
      { startDate: "10-16", endDate: "10-31", kc: 0.50, description: "Late October post-harvest" },
      { startDate: "11-01", endDate: "11-15", kc: 0.35, description: "Early November dormancy transition" },
      { startDate: "11-16", endDate: "11-30", kc: 0.00, description: "Late November dormancy" },
      { startDate: "12-01", endDate: "12-31", kc: 0.00, description: "December dormancy" }
    ],
    monthlyKc: [
      { month: 1, monthName: 'Jan', kc: 0.00, description: 'Winter dormancy - no irrigation needed' },
      { month: 2, monthName: 'Feb', kc: 0.00, description: 'Continued winter dormancy' },
      { month: 3, monthName: 'Mar', kc: 0.00, description: 'Late winter dormancy period' },
      { month: 4, monthName: 'Apr', kc: 0.25, description: 'Bud break and initial growth' },
      { month: 5, monthName: 'May', kc: 0.81, description: 'Rapid vegetative growth' },
      { month: 6, monthName: 'Jun', kc: 1.13, description: 'Peak nut development period' },
      { month: 7, monthName: 'Jul', kc: 1.19, description: 'Maximum water demand period' },
      { month: 8, monthName: 'Aug', kc: 1.16, description: 'Continued high water needs' },
      { month: 9, monthName: 'Sep', kc: 0.93, description: 'Nut maturation period' },
      { month: 10, monthName: 'Oct', kc: 0.59, description: 'Harvest and post-harvest' },
      { month: 11, monthName: 'Nov', kc: 0.18, description: 'Transition to dormancy' },
      { month: 12, monthName: 'Dec', kc: 0.00, description: 'Winter dormancy begins' }
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
    id: 'citrus',
    name: 'Citrus',
    scientificName: 'Citrus spp.',
    category: 'Tree Fruits',
    plantingType: 'perennial',
    isPerennial: true,
    stages: [
      { name: 'Winter', kc: 0.70, duration: 90, description: 'Winter period with lower water needs' },
      { name: 'Spring Flush', kc: 0.71, duration: 90, description: 'Spring flush and flowering' },
      { name: 'Fruit Development', kc: 0.67, duration: 90, description: 'Summer fruit development' },
      { name: 'Harvest', kc: 0.70, duration: 95, description: 'Fall maturation and harvest' }
    ],
    kcSchedule: [
      { startDate: "01-01", endDate: "01-31", kc: 0.75, description: "January winter period" },
      { startDate: "02-01", endDate: "02-28", kc: 0.74, description: "February winter period" },
      { startDate: "03-01", endDate: "03-15", kc: 0.73, description: "Early March spring transition" },
      { startDate: "03-16", endDate: "03-31", kc: 0.71, description: "Late March spring flush" },
      { startDate: "04-01", endDate: "04-15", kc: 0.70, description: "Early April flowering" },
      { startDate: "04-16", endDate: "04-30", kc: 0.70, description: "Late April fruit set" },
      { startDate: "05-01", endDate: "05-15", kc: 0.70, description: "Early May development" },
      { startDate: "05-16", endDate: "05-31", kc: 0.70, description: "Late May development" },
      { startDate: "06-01", endDate: "06-15", kc: 0.67, description: "Early June fruit growth" },
      { startDate: "06-16", endDate: "06-30", kc: 0.65, description: "Late June summer period" },
      { startDate: "07-01", endDate: "07-15", kc: 0.65, description: "Early July summer period" },
      { startDate: "07-16", endDate: "07-31", kc: 0.65, description: "Late July summer period" },
      { startDate: "08-01", endDate: "08-15", kc: 0.65, description: "Early August summer period" },
      { startDate: "08-16", endDate: "08-31", kc: 0.65, description: "Late August summer period" },
      { startDate: "09-01", endDate: "09-09", kc: 0.68, description: "Early September maturation" },
      { startDate: "09-10", endDate: "09-16", kc: 0.73, description: "Mid September color break" },
      { startDate: "09-17", endDate: "09-23", kc: 0.78, description: "Late September peak maturation" },
      { startDate: "09-24", endDate: "09-30", kc: 0.66, description: "End September harvest start" },
      { startDate: "10-01", endDate: "12-23", kc: 0.70, description: "October-December harvest period" },
      { startDate: "12-24", endDate: "12-31", kc: 0.73, description: "Late December winter transition" }
    ],
    monthlyKc: [
      { month: 1, monthName: 'Jan', kc: 0.75, description: 'Winter period with steady water needs' },
      { month: 2, monthName: 'Feb', kc: 0.74, description: 'Late winter maintenance period' },
      { month: 3, monthName: 'Mar', kc: 0.72, description: 'Spring transition and bud break' },
      { month: 4, monthName: 'Apr', kc: 0.70, description: 'Spring flowering and fruit set' },
      { month: 5, monthName: 'May', kc: 0.70, description: 'Early fruit development' },
      { month: 6, monthName: 'Jun', kc: 0.66, description: 'Summer growth period' },
      { month: 7, monthName: 'Jul', kc: 0.65, description: 'Peak summer heat stress period' },
      { month: 8, monthName: 'Aug', kc: 0.65, description: 'Late summer fruit sizing' },
      { month: 9, monthName: 'Sep', kc: 0.71, description: 'Early fall maturation period' },
      { month: 10, monthName: 'Oct', kc: 0.70, description: 'Harvest and post-harvest recovery' },
      { month: 11, monthName: 'Nov', kc: 0.70, description: 'Late harvest period' },
      { month: 12, monthName: 'Dec', kc: 0.72, description: 'Winter preparation period' }
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
    ],
    monthlyKc: [
      { month: 1, monthName: "January", kc: 0.65, description: "Cool season growing - moderate water needs" },
      { month: 2, monthName: "February", kc: 0.70, description: "Prime cool season - increasing growth" },
      { month: 3, monthName: "March", kc: 0.85, description: "Spring growth - higher water demand" },
      { month: 4, monthName: "April", kc: 0.90, description: "Active growth period" },
      { month: 5, monthName: "May", kc: 0.95, description: "Peak spring growing season" },
      { month: 6, monthName: "June", kc: 0.75, description: "Hot weather - bolting risk, less ideal" },
      { month: 7, monthName: "July", kc: 0.60, description: "Summer heat stress - not ideal season" },
      { month: 8, monthName: "August", kc: 0.60, description: "Late summer heat - challenging conditions" },
      { month: 9, monthName: "September", kc: 0.80, description: "Fall planting begins" },
      { month: 10, monthName: "October", kc: 0.90, description: "Excellent fall growing conditions" },
      { month: 11, monthName: "November", kc: 0.85, description: "Cool season optimal growth" },
      { month: 12, monthName: "December", kc: 0.70, description: "Winter growing - slower but steady" }
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