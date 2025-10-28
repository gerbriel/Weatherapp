export interface SoilCharacteristics {
  waterHoldingCapacity: number; // mm of water per 100mm soil depth
  fieldCapacity: number; // % volumetric water content
  wiltingPoint: number; // % volumetric water content
  availableWaterCapacity: number; // mm/m (field capacity - wilting point)
  infiltrationRate: number; // mm/hour
  drainageRate: 'poor' | 'moderate' | 'good' | 'excessive';
  bulkDensity: number; // g/cm³
  organicMatter: number; // %
  description: string;
  irrigationFactor: number; // multiplier for irrigation efficiency
}

export interface SoilType {
  id: string;
  name: string;
  category: 'clay' | 'loam' | 'sand' | 'silt' | 'organic';
  characteristics: SoilCharacteristics;
  color: string; // hex color for visualization
  texture: string;
  commonCrops: string[];
}

export const SOIL_DATABASE: SoilType[] = [
  {
    id: 'clay_heavy',
    name: 'Heavy Clay',
    category: 'clay',
    characteristics: {
      waterHoldingCapacity: 200,
      fieldCapacity: 45,
      wiltingPoint: 25,
      availableWaterCapacity: 200,
      infiltrationRate: 2,
      drainageRate: 'poor',
      bulkDensity: 1.3,
      organicMatter: 3,
      description: 'Fine-textured soil with high water retention but slow drainage',
      irrigationFactor: 0.85
    },
    color: '#8B4513',
    texture: 'Fine, sticky when wet, hard when dry',
    commonCrops: ['Rice', 'Cotton', 'Soybeans']
  },
  {
    id: 'clay_medium',
    name: 'Clay Loam',
    category: 'clay',
    characteristics: {
      waterHoldingCapacity: 180,
      fieldCapacity: 40,
      wiltingPoint: 20,
      availableWaterCapacity: 180,
      infiltrationRate: 5,
      drainageRate: 'moderate',
      bulkDensity: 1.35,
      organicMatter: 4,
      description: 'Balanced soil with good water retention and moderate drainage',
      irrigationFactor: 0.90
    },
    color: '#A0522D',
    texture: 'Smooth, moldable, moderate plasticity',
    commonCrops: ['Wheat', 'Corn', 'Alfalfa']
  },
  {
    id: 'loam_silty',
    name: 'Silt Loam',
    category: 'silt',
    characteristics: {
      waterHoldingCapacity: 160,
      fieldCapacity: 35,
      wiltingPoint: 15,
      availableWaterCapacity: 160,
      infiltrationRate: 8,
      drainageRate: 'good',
      bulkDensity: 1.40,
      organicMatter: 3.5,
      description: 'Smooth-textured soil with excellent water and nutrient retention',
      irrigationFactor: 0.95
    },
    color: '#CD853F',
    texture: 'Smooth, floury feel when dry, slippery when wet',
    commonCrops: ['Vegetables', 'Small grains', 'Perennial crops']
  },
  {
    id: 'loam_standard',
    name: 'Loam',
    category: 'loam',
    characteristics: {
      waterHoldingCapacity: 140,
      fieldCapacity: 30,
      wiltingPoint: 12,
      availableWaterCapacity: 140,
      infiltrationRate: 12,
      drainageRate: 'good',
      bulkDensity: 1.45,
      organicMatter: 4,
      description: 'Ideal agricultural soil with balanced sand, silt, and clay',
      irrigationFactor: 1.00
    },
    color: '#DEB887',
    texture: 'Balanced feel, neither sticky nor gritty',
    commonCrops: ['Most crops', 'Fruits', 'Vegetables', 'Grains']
  },
  {
    id: 'loam_sandy',
    name: 'Sandy Loam',
    category: 'sand',
    characteristics: {
      waterHoldingCapacity: 120,
      fieldCapacity: 25,
      wiltingPoint: 10,
      availableWaterCapacity: 120,
      infiltrationRate: 20,
      drainageRate: 'good',
      bulkDensity: 1.50,
      organicMatter: 2.5,
      description: 'Well-draining soil with moderate water retention',
      irrigationFactor: 1.05
    },
    color: '#F4A460',
    texture: 'Gritty feel, crumbles easily',
    commonCrops: ['Potatoes', 'Carrots', 'Peanuts', 'Berries']
  },
  {
    id: 'sand_loamy',
    name: 'Loamy Sand',
    category: 'sand',
    characteristics: {
      waterHoldingCapacity: 80,
      fieldCapacity: 18,
      wiltingPoint: 6,
      availableWaterCapacity: 80,
      infiltrationRate: 30,
      drainageRate: 'excessive',
      bulkDensity: 1.55,
      organicMatter: 2,
      description: 'Fast-draining soil requiring frequent irrigation',
      irrigationFactor: 1.15
    },
    color: '#F5DEB3',
    texture: 'Very gritty, loose structure',
    commonCrops: ['Root vegetables', 'Melons', 'Quick-growing crops']
  },
  {
    id: 'sand_fine',
    name: 'Fine Sand',
    category: 'sand',
    characteristics: {
      waterHoldingCapacity: 60,
      fieldCapacity: 15,
      wiltingPoint: 4,
      availableWaterCapacity: 60,
      infiltrationRate: 40,
      drainageRate: 'excessive',
      bulkDensity: 1.60,
      organicMatter: 1.5,
      description: 'Very fast-draining, low water retention',
      irrigationFactor: 1.25
    },
    color: '#FFEAA7',
    texture: 'Fine gritty feel, very loose',
    commonCrops: ['Asparagus', 'Herbs', 'Drought-tolerant crops']
  },
  {
    id: 'organic_peat',
    name: 'Peat Soil',
    category: 'organic',
    characteristics: {
      waterHoldingCapacity: 300,
      fieldCapacity: 60,
      wiltingPoint: 30,
      availableWaterCapacity: 300,
      infiltrationRate: 15,
      drainageRate: 'moderate',
      bulkDensity: 0.8,
      organicMatter: 25,
      description: 'High organic matter soil with excellent water retention',
      irrigationFactor: 0.80
    },
    color: '#2D3436',
    texture: 'Spongy, dark, high organic content',
    commonCrops: ['Celery', 'Onions', 'Specialty vegetables']
  },
  {
    id: 'adobe_clay',
    name: 'Adobe Clay',
    category: 'clay',
    characteristics: {
      waterHoldingCapacity: 220,
      fieldCapacity: 50,
      wiltingPoint: 30,
      availableWaterCapacity: 200,
      infiltrationRate: 1,
      drainageRate: 'poor',
      bulkDensity: 1.25,
      organicMatter: 2,
      description: 'Very heavy clay with extreme water retention and poor drainage',
      irrigationFactor: 0.75
    },
    color: '#6C5CE7',
    texture: 'Extremely fine, plastic when wet, very hard when dry',
    commonCrops: ['Rice', 'Water-tolerant crops']
  }
];

export const getSoilsByCategory = (): Record<string, SoilType[]> => {
  const categories: Record<string, SoilType[]> = {};
  
  SOIL_DATABASE.forEach(soil => {
    if (!categories[soil.category]) {
      categories[soil.category] = [];
    }
    categories[soil.category].push(soil);
  });
  
  return categories;
};

export const getSoilById = (id: string): SoilType | undefined => {
  return SOIL_DATABASE.find(soil => soil.id === id);
};

export const calculateIrrigationAdjustment = (soilType: SoilType, baseETc: number): {
  adjustedETc: number;
  irrigationFrequency: string;
  applicationRate: number;
  runoffRisk: 'low' | 'medium' | 'high';
} => {
  const adjustedETc = baseETc * soilType.characteristics.irrigationFactor;
  
  let irrigationFrequency: string;
  let runoffRisk: 'low' | 'medium' | 'high';
  
  if (soilType.characteristics.infiltrationRate > 25) {
    irrigationFrequency = 'Daily or every 2 days';
    runoffRisk = 'low';
  } else if (soilType.characteristics.infiltrationRate > 10) {
    irrigationFrequency = 'Every 2-3 days';
    runoffRisk = 'low';
  } else if (soilType.characteristics.infiltrationRate > 5) {
    irrigationFrequency = 'Every 3-5 days';
    runoffRisk = 'medium';
  } else {
    irrigationFrequency = 'Weekly or longer intervals';
    runoffRisk = 'high';
  }
  
  const applicationRate = Math.min(
    soilType.characteristics.infiltrationRate * 0.8, // 80% of infiltration rate
    25 // max 25mm/hour
  );
  
  return {
    adjustedETc,
    irrigationFrequency,
    applicationRate,
    runoffRisk
  };
};