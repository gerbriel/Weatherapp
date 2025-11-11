// AI Insights Service for Crop Watering Analysis
// src/services/aiInsightsService.ts

export interface ChartData {
  date: string;
  temperature: number;
  humidity: number;
  precipitation: number;
  evapotranspiration: number;
  soilMoisture?: number;
  irrigationAmount?: number;
  cropStage: string;
  weatherConditions: string;
}

export interface CropInsight {
  id: string;
  chartType: string;
  title: string;
  insight: string;
  recommendation: string;
  confidence: number; // 0-100%
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'watering' | 'efficiency' | 'timing' | 'weather' | 'crop_health';
  actionItems: string[];
  estimatedSavings?: string;
  riskFactors?: string[];
}

export interface CropContext {
  cropType: string;
  plantingDate: string;
  currentStage: string;
  fieldSize?: number;
  irrigationType?: string;
  priority?: 'high' | 'medium' | 'low'; // For resource allocation
  fieldId?: string; // To identify specific fields
}

export interface InsightContext {
  cropType: string; // Legacy support - will use first crop if multiple
  location: string;
  plantingDate: string; // Legacy support
  currentStage: string; // Legacy support
  fieldSize?: number; // Legacy support
  irrigationType?: string;
  soilType?: string;
  weatherHistory: ChartData[];
  irrigationHistory: ChartData[];
  // New multi-crop support
  crops?: CropContext[]; // Multiple crops with individual context
  farmName?: string;
}

export interface MultiCropInsight extends CropInsight {
  cropId?: string; // Which crop this insight applies to
  cropType: string; // Always specify which crop
  affectedCrops?: string[]; // Other crops that might be affected
  crossCropImpact?: {
    resourceConflicts?: string[];
    synergies?: string[];
    sharedBenefits?: string[];
  };
}

// Enhanced interfaces for improved AI logic
export interface DataQualityReport {
  overallScore: number; // 0-100
  issues: string[];
  anomalies: DataAnomaly[];
  completeness: number; // 0-100
  consistency: number; // 0-100
  reliability: number; // 0-100
}

export interface DataAnomaly {
  type: 'temperature' | 'humidity' | 'precipitation' | 'evapotranspiration';
  date: string;
  value: number;
  expectedRange: { min: number; max: number };
  severity: 'low' | 'medium' | 'high';
  impact: string;
}

export interface TrendAnalysis {
  temperatureTrend: {
    slope: number;
    direction: 'rising' | 'falling' | 'stable';
    confidence: number;
    prediction: number; // next 3-day average
  };
  precipitationPattern: {
    type: 'drought' | 'normal' | 'wet' | 'erratic';
    consistency: number;
    forecast: 'continuing' | 'changing' | 'uncertain';
  };
  evapotranspirationTrend: {
    average: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    waterDemandForecast: 'low' | 'medium' | 'high' | 'critical';
  };
}

export interface CropProfile {
  name: string;
  growthStages: {
    [stage: string]: {
      duration: number; // days
      waterNeed: 'low' | 'medium' | 'high' | 'critical';
      tempRange: { min: number; max: number; optimal: number };
      stressThresholds: {
        maxTemp: number;
        minTemp: number;
        maxWind: number;
        maxHumidity: number;
      };
      criticalFactors: string[];
    };
  };
  seasonalFactors: {
    [month: string]: {
      baseWaterNeed: number; // multiplier
      commonIssues: string[];
    };
  };
}

export interface SmartRecommendation {
  type: 'irrigation' | 'disease_prevention' | 'frost_protection' | 'heat_management' | 'nutrient_management';
  priority: 'urgent' | 'high' | 'normal' | 'low';
  action: string;
  timing: string[];
  reasoning: string;
  expectedOutcome: string;
  cost?: number;
  details?: string[];
}

export interface EconomicImpact {
  implementationCost: number;
  expectedSavings: number;
  yieldProtection: number;
  roi: number;
  paybackPeriod: number; // days
}

export interface EnhancedCropInsight extends CropInsight {
  dataQuality: number;
  trendAnalysis?: TrendAnalysis;
  economicImpact?: EconomicImpact;
  timeline?: {
    immediate: string[];
    shortTerm: string[]; // 1-7 days
    longTerm: string[]; // 1-4 weeks
  };
  successMetrics?: string[];
  smartRecommendations?: SmartRecommendation[];
}

// Enhanced crop system interfaces
export interface CropFamily {
  name: string;
  commonCharacteristics: {
    waterNeedRange: { min: number; max: number };
    tempToleranceRange: { min: number; max: number };
    commonStages: string[];
    typicalIssues: string[];
  };
  members: string[];
}

export interface UniversalCropProfile extends CropProfile {
  family: string;
  category: 'tree_fruit' | 'vine' | 'field_crop' | 'vegetable' | 'berry' | 'citrus' | 'stone_fruit' | 'nuts';
  aliases: string[];
  region_adaptations?: {
    [region: string]: {
      adjustments: Partial<CropProfile>;
      localConcerns: string[];
    };
  };
}

// Comprehensive Crop Database
class CropDatabase {
  private cropFamilies: Record<string, CropFamily> = {};
  private cropProfiles: Record<string, UniversalCropProfile> = {};
  private cropAliases: Record<string, string> = {}; // maps aliases to canonical names

  constructor() {
    this.initializeCropFamilies();
    this.initializeCropProfiles();
    this.buildAliasMap();
  }

  private initializeCropFamilies(): void {
    this.cropFamilies = {
      'stone_fruits': {
        name: 'Stone Fruits',
        commonCharacteristics: {
          waterNeedRange: { min: 1.2, max: 2.5 },
          tempToleranceRange: { min: 32, max: 95 },
          commonStages: ['dormant', 'budbreak', 'flowering', 'fruit_development', 'harvest', 'post_harvest'],
          typicalIssues: ['brown rot', 'bacterial spot', 'scale insects', 'frost damage']
        },
        members: ['peaches', 'plums', 'apricots', 'cherries', 'nectarines']
      },
      'tree_nuts': {
        name: 'Tree Nuts',
        commonCharacteristics: {
          waterNeedRange: { min: 1.0, max: 2.2 },
          tempToleranceRange: { min: 28, max: 100 },
          commonStages: ['dormant', 'budbreak', 'flowering', 'nut_development', 'hull_split', 'harvest'],
          typicalIssues: ['navel orangeworm', 'fungal diseases', 'drought stress', 'frost damage']
        },
        members: ['almonds', 'walnuts', 'pistachios', 'pecans', 'hazelnuts', 'macadamias']
      },
      'citrus': {
        name: 'Citrus',
        commonCharacteristics: {
          waterNeedRange: { min: 1.5, max: 3.0 },
          tempToleranceRange: { min: 35, max: 100 },
          commonStages: ['dormant', 'spring_flush', 'flowering', 'fruit_set', 'fruit_development', 'harvest'],
          typicalIssues: ['citrus canker', 'scale insects', 'frost damage', 'water stress']
        },
        members: ['oranges', 'lemons', 'limes', 'grapefruits', 'mandarins', 'tangerines']
      },
      'grapes': {
        name: 'Grapes',
        commonCharacteristics: {
          waterNeedRange: { min: 0.8, max: 2.0 },
          tempToleranceRange: { min: 25, max: 95 },
          commonStages: ['dormant', 'budbreak', 'flowering', 'fruit_set', 'veraison', 'harvest'],
          typicalIssues: ['powdery mildew', 'botrytis', 'phylloxera', 'frost damage']
        },
        members: ['wine_grapes', 'table_grapes', 'raisin_grapes']
      },
      'berries': {
        name: 'Berries',
        commonCharacteristics: {
          waterNeedRange: { min: 1.0, max: 2.5 },
          tempToleranceRange: { min: 20, max: 85 },
          commonStages: ['dormant', 'budbreak', 'flowering', 'fruit_development', 'harvest', 'post_harvest'],
          typicalIssues: ['gray mold', 'powdery mildew', 'spider mites', 'frost damage']
        },
        members: ['strawberries', 'blueberries', 'blackberries', 'raspberries', 'cranberries']
      },
      'field_crops': {
        name: 'Field Crops',
        commonCharacteristics: {
          waterNeedRange: { min: 0.8, max: 1.8 },
          tempToleranceRange: { min: 32, max: 100 },
          commonStages: ['planting', 'emergence', 'vegetative', 'flowering', 'grain_fill', 'harvest'],
          typicalIssues: ['drought stress', 'fungal diseases', 'insect pressure', 'weed competition']
        },
        members: ['corn', 'wheat', 'soybeans', 'cotton', 'rice', 'barley', 'oats', 'sorghum']
      },
      'vegetables': {
        name: 'Vegetables',
        commonCharacteristics: {
          waterNeedRange: { min: 0.5, max: 2.0 },
          tempToleranceRange: { min: 35, max: 90 },
          commonStages: ['seeding', 'emergence', 'vegetative', 'flowering', 'fruit_development', 'harvest'],
          typicalIssues: ['aphids', 'fungal diseases', 'bacterial wilt', 'temperature stress']
        },
        members: ['tomatoes', 'peppers', 'lettuce', 'onions', 'carrots', 'broccoli', 'spinach', 'cucumbers']
      }
    };
  }

  private initializeCropProfiles(): void {
    this.cropProfiles = {
      // Existing detailed profiles (almonds, grapes) - keep as is
      'almonds': {
        name: 'Almonds',
        family: 'tree_nuts',
        category: 'nuts',
        aliases: ['almond', 'almond_trees', 'sweet_almonds'],
        growthStages: {
          'dormant': {
            duration: 90,
            waterNeed: 'low',
            tempRange: { min: 32, max: 65, optimal: 45 },
            stressThresholds: { maxTemp: 70, minTemp: 28, maxWind: 25, maxHumidity: 90 },
            criticalFactors: ['frost protection', 'pruning timing', 'chill hour accumulation']
          },
          'budbreak': {
            duration: 14,
            waterNeed: 'medium',
            tempRange: { min: 40, max: 75, optimal: 60 },
            stressThresholds: { maxTemp: 80, minTemp: 35, maxWind: 20, maxHumidity: 85 },
            criticalFactors: ['frost protection', 'water consistency', 'bee activity']
          },
          'flowering': {
            duration: 21,
            waterNeed: 'critical',
            tempRange: { min: 55, max: 75, optimal: 65 },
            stressThresholds: { maxTemp: 78, minTemp: 50, maxWind: 15, maxHumidity: 80 },
            criticalFactors: ['pollination conditions', 'water stress prevention', 'bee health']
          },
          'nut_development': {
            duration: 120,
            waterNeed: 'high',
            tempRange: { min: 60, max: 90, optimal: 75 },
            stressThresholds: { maxTemp: 95, minTemp: 55, maxWind: 25, maxHumidity: 85 },
            criticalFactors: ['consistent moisture', 'heat stress prevention', 'pest monitoring']
          },
          'hull_split': {
            duration: 30,
            waterNeed: 'medium',
            tempRange: { min: 65, max: 95, optimal: 80 },
            stressThresholds: { maxTemp: 100, minTemp: 60, maxWind: 30, maxHumidity: 75 },
            criticalFactors: ['harvest timing', 'water reduction', 'hull monitoring']
          }
        },
        seasonalFactors: {
          'january': { baseWaterNeed: 0.3, commonIssues: ['frost risk', 'dormant pruning'] },
          'february': { baseWaterNeed: 0.4, commonIssues: ['frost protection', 'early budbreak'] },
          'march': { baseWaterNeed: 0.8, commonIssues: ['bloom timing', 'pollination weather'] },
          'april': { baseWaterNeed: 1.2, commonIssues: ['late frost', 'disease pressure'] },
          'may': { baseWaterNeed: 1.5, commonIssues: ['water stress', 'heat buildup'] },
          'june': { baseWaterNeed: 1.8, commonIssues: ['heat stress', 'rapid growth'] },
          'july': { baseWaterNeed: 2.0, commonIssues: ['peak water demand', 'heat stress'] },
          'august': { baseWaterNeed: 1.8, commonIssues: ['continued heat', 'hull split prep'] },
          'september': { baseWaterNeed: 1.2, commonIssues: ['harvest prep', 'water reduction'] },
          'october': { baseWaterNeed: 0.8, commonIssues: ['harvest timing', 'post-harvest care'] },
          'november': { baseWaterNeed: 0.5, commonIssues: ['leaf drop', 'dormancy prep'] },
          'december': { baseWaterNeed: 0.3, commonIssues: ['winter protection', 'dormancy'] }
        }
      },

      'grapes': {
        name: 'Grapes',
        family: 'grapes',
        category: 'vine',
        aliases: ['grape', 'wine_grapes', 'table_grapes', 'grapevines'],
        growthStages: {
          'dormant': {
            duration: 120,
            waterNeed: 'low',
            tempRange: { min: 25, max: 60, optimal: 40 },
            stressThresholds: { maxTemp: 65, minTemp: 20, maxWind: 30, maxHumidity: 85 },
            criticalFactors: ['pruning timing', 'cane maturation', 'disease prevention']
          },
          'budbreak': {
            duration: 10,
            waterNeed: 'medium',
            tempRange: { min: 45, max: 75, optimal: 60 },
            stressThresholds: { maxTemp: 80, minTemp: 40, maxWind: 25, maxHumidity: 80 },
            criticalFactors: ['frost protection', 'shoot emergence']
          },
          'flowering': {
            duration: 14,
            waterNeed: 'high',
            tempRange: { min: 60, max: 80, optimal: 70 },
            stressThresholds: { maxTemp: 85, minTemp: 55, maxWind: 15, maxHumidity: 75 },
            criticalFactors: ['cap fall timing', 'fruit set conditions']
          },
          'veraison': {
            duration: 30,
            waterNeed: 'low',
            tempRange: { min: 70, max: 95, optimal: 82 },
            stressThresholds: { maxTemp: 100, minTemp: 65, maxWind: 25, maxHumidity: 70 },
            criticalFactors: ['controlled water stress', 'sugar development']
          },
          'harvest': {
            duration: 21,
            waterNeed: 'low',
            tempRange: { min: 65, max: 85, optimal: 75 },
            stressThresholds: { maxTemp: 90, minTemp: 60, maxWind: 20, maxHumidity: 65 },
            criticalFactors: ['harvest timing', 'sugar-acid balance']
          }
        },
        seasonalFactors: {
          'january': { baseWaterNeed: 0.2, commonIssues: ['dormant pruning', 'disease cleanup'] },
          'february': { baseWaterNeed: 0.3, commonIssues: ['late pruning', 'soil preparation'] },
          'march': { baseWaterNeed: 0.6, commonIssues: ['budbreak timing', 'frost protection'] },
          'april': { baseWaterNeed: 1.0, commonIssues: ['shoot growth', 'powdery mildew prevention'] },
          'may': { baseWaterNeed: 1.3, commonIssues: ['flowering conditions', 'canopy management'] },
          'june': { baseWaterNeed: 1.5, commonIssues: ['fruit set', 'cluster thinning'] },
          'july': { baseWaterNeed: 1.2, commonIssues: ['veraison preparation', 'water stress timing'] },
          'august': { baseWaterNeed: 0.8, commonIssues: ['sugar development', 'disease management'] },
          'september': { baseWaterNeed: 0.5, commonIssues: ['harvest timing', 'quality assessment'] },
          'october': { baseWaterNeed: 0.4, commonIssues: ['harvest completion', 'leaf senescence'] },
          'november': { baseWaterNeed: 0.3, commonIssues: ['post-harvest care', 'winter preparation'] },
          'december': { baseWaterNeed: 0.2, commonIssues: ['dormancy', 'pruning preparation'] }
        }
      }
    };
  }

  private buildAliasMap(): void {
    this.cropAliases = {};
    
    // Build alias mappings for defined crops
    Object.entries(this.cropProfiles).forEach(([cropId, profile]) => {
      this.cropAliases[cropId] = cropId;
      this.cropAliases[profile.name.toLowerCase()] = cropId;
      
      profile.aliases.forEach(alias => {
        this.cropAliases[alias.toLowerCase()] = cropId;
      });
    });

    // Add family-level aliases for synthetic profile generation
    Object.entries(this.cropFamilies).forEach(([familyId, family]) => {
      family.members.forEach(member => {
        if (!this.cropAliases[member.toLowerCase()]) {
          this.cropAliases[member.toLowerCase()] = `synthetic_${member}`;
        }
      });
    });
  }

  // Public methods for crop resolution
  findCrop(cropName: string): UniversalCropProfile | null {
    const normalizedName = cropName.toLowerCase().trim();
    const cropId = this.cropAliases[normalizedName];
    
    if (cropId && this.cropProfiles[cropId]) {
      return this.cropProfiles[cropId];
    }
    
    // Try partial matching
    const partialMatch = Object.keys(this.cropAliases).find(alias => 
      alias.includes(normalizedName) || normalizedName.includes(alias)
    );
    
    if (partialMatch) {
      const matchedCropId = this.cropAliases[partialMatch];
      return this.cropProfiles[matchedCropId] || null;
    }
    
    return null;
  }

  generateSyntheticCropProfile(cropName: string): UniversalCropProfile | null {
    const normalizedName = cropName.toLowerCase().trim();
    
    // Try to determine crop family
    const family = this.determineCropFamily(normalizedName);
    if (!family) return null;
    
    const familyData = this.cropFamilies[family];
    
    // Generate synthetic profile based on family characteristics
    return this.createSyntheticProfile(cropName, family, familyData);
  }

  private determineCropFamily(cropName: string): string | null {
    const familyKeywords = {
      'tree_nuts': ['nut', 'nuts', 'almond', 'walnut', 'pistachio', 'pecan', 'hazelnut', 'macadamia'],
      'stone_fruits': ['peach', 'plum', 'apricot', 'cherry', 'nectarine', 'stone'],
      'citrus': ['orange', 'lemon', 'lime', 'grapefruit', 'mandarin', 'tangerine', 'citrus'],
      'grapes': ['grape', 'vine', 'wine', 'raisin'],
      'berries': ['berry', 'berries', 'strawberry', 'blueberry', 'blackberry', 'raspberry'],
      'field_crops': ['corn', 'wheat', 'soybean', 'cotton', 'rice', 'barley', 'oat', 'sorghum'],
      'vegetables': ['tomato', 'pepper', 'lettuce', 'onion', 'carrot', 'broccoli', 'spinach', 'cucumber']
    };

    for (const [family, keywords] of Object.entries(familyKeywords)) {
      if (keywords.some(keyword => cropName.includes(keyword))) {
        return family;
      }
    }

    return null;
  }

  private createSyntheticProfile(
    cropName: string, 
    familyId: string, 
    familyData: CropFamily
  ): UniversalCropProfile {
    const { commonCharacteristics } = familyData;
    
    // Generate growth stages based on family patterns
    const baseStages = commonCharacteristics.commonStages.reduce((stages, stageName) => {
      stages[stageName] = {
        duration: this.estimateStageDuration(stageName, familyId),
        waterNeed: this.estimateWaterNeed(stageName, familyId),
        tempRange: {
          min: commonCharacteristics.tempToleranceRange.min,
          max: commonCharacteristics.tempToleranceRange.max,
          optimal: Math.round((commonCharacteristics.tempToleranceRange.min + commonCharacteristics.tempToleranceRange.max) / 2)
        },
        stressThresholds: {
          maxTemp: commonCharacteristics.tempToleranceRange.max - 5,
          minTemp: commonCharacteristics.tempToleranceRange.min + 5,
          maxWind: 25,
          maxHumidity: 85
        },
        criticalFactors: [...commonCharacteristics.typicalIssues]
      };
      return stages;
    }, {} as Record<string, any>);

    // Generate seasonal factors
    const seasonalFactors = this.generateSeasonalFactors(familyId, commonCharacteristics);

    return {
      name: this.capitalizeWords(cropName),
      family: familyId,
      category: this.determineCropCategory(familyId),
      aliases: [cropName, cropName.replace(/s$/, ''), `${cropName}_trees`, `${cropName}_plants`],
      growthStages: baseStages,
      seasonalFactors
    };
  }

  private estimateStageDuration(stageName: string, familyId: string): number {
    const durationMap: Record<string, Record<string, number>> = {
      'tree_nuts': {
        'dormant': 100, 'budbreak': 15, 'flowering': 25, 'nut_development': 110, 'hull_split': 30, 'harvest': 30
      },
      'stone_fruits': {
        'dormant': 90, 'budbreak': 10, 'flowering': 14, 'fruit_development': 90, 'harvest': 30, 'post_harvest': 15
      },
      'citrus': {
        'dormant': 60, 'spring_flush': 30, 'flowering': 21, 'fruit_set': 30, 'fruit_development': 240, 'harvest': 90
      },
      'grapes': {
        'dormant': 120, 'budbreak': 10, 'flowering': 14, 'fruit_set': 21, 'veraison': 30, 'harvest': 21
      },
      'berries': {
        'dormant': 120, 'budbreak': 14, 'flowering': 21, 'fruit_development': 60, 'harvest': 45, 'post_harvest': 30
      },
      'field_crops': {
        'planting': 7, 'emergence': 14, 'vegetative': 60, 'flowering': 21, 'grain_fill': 45, 'harvest': 14
      },
      'vegetables': {
        'seeding': 7, 'emergence': 10, 'vegetative': 30, 'flowering': 14, 'fruit_development': 45, 'harvest': 21
      }
    };

    return durationMap[familyId]?.[stageName] || 30;
  }

  private estimateWaterNeed(stageName: string, familyId: string): 'low' | 'medium' | 'high' | 'critical' {
    const criticalStages = ['flowering', 'fruit_development', 'nut_development', 'fruit_set'];
    const highStages = ['budbreak', 'spring_flush', 'fruiting', 'vegetative'];
    const lowStages = ['dormant', 'harvest', 'veraison', 'post_harvest'];

    if (criticalStages.includes(stageName)) return 'critical';
    if (highStages.includes(stageName)) return 'high';
    if (lowStages.includes(stageName)) return 'low';
    return 'medium';
  }

  private generateSeasonalFactors(familyId: string, characteristics: any) {
    const months = ['january', 'february', 'march', 'april', 'may', 'june',
                   'july', 'august', 'september', 'october', 'november', 'december'];
    
    const seasonalFactors: Record<string, any> = {};
    
    months.forEach((month, index) => {
      const seasonMultiplier = this.getSeasonalMultiplier(index, familyId);
      seasonalFactors[month] = {
        baseWaterNeed: Number((characteristics.waterNeedRange.min + 
                       (characteristics.waterNeedRange.max - characteristics.waterNeedRange.min) * seasonMultiplier).toFixed(1)),
        commonIssues: this.getSeasonalIssues(month, familyId, characteristics.typicalIssues)
      };
    });

    return seasonalFactors;
  }

  private getSeasonalMultiplier(monthIndex: number, familyId: string): number {
    const curves = {
      'tree_nuts': [0.2, 0.3, 0.6, 1.0, 1.4, 1.8, 2.0, 1.8, 1.2, 0.8, 0.4, 0.2],
      'stone_fruits': [0.3, 0.4, 0.7, 1.2, 1.6, 2.0, 2.2, 1.8, 1.2, 0.8, 0.5, 0.3],
      'citrus': [0.8, 1.0, 1.3, 1.6, 1.9, 2.2, 2.5, 2.3, 2.0, 1.6, 1.2, 0.9],
      'grapes': [0.2, 0.3, 0.6, 1.0, 1.3, 1.5, 1.2, 0.8, 0.5, 0.4, 0.3, 0.2],
      'berries': [0.3, 0.4, 0.8, 1.2, 1.6, 1.8, 1.6, 1.4, 1.0, 0.6, 0.4, 0.3],
      'field_crops': [0.2, 0.3, 0.5, 0.8, 1.2, 1.5, 1.8, 1.6, 1.2, 0.8, 0.4, 0.2],
      'vegetables': [0.4, 0.5, 0.7, 1.0, 1.3, 1.5, 1.6, 1.4, 1.1, 0.8, 0.6, 0.4]
    };

    return curves[familyId as keyof typeof curves]?.[monthIndex] || 1.0;
  }

  private getSeasonalIssues(month: string, familyId: string, baseIssues: string[]): string[] {
    const seasonalIssueMap: Record<string, string[]> = {
      'winter': ['frost protection', 'dormant care', 'pruning timing'],
      'spring': ['budbreak management', 'frost risk', 'disease prevention'],
      'summer': ['heat stress', 'peak water demand', 'pest management'],
      'fall': ['harvest timing', 'post-harvest care', 'winter preparation']
    };

    const monthToSeason = {
      'december': 'winter', 'january': 'winter', 'february': 'winter',
      'march': 'spring', 'april': 'spring', 'may': 'spring',
      'june': 'summer', 'july': 'summer', 'august': 'summer',
      'september': 'fall', 'october': 'fall', 'november': 'fall'
    };

    const season = monthToSeason[month as keyof typeof monthToSeason];
    return [...(seasonalIssueMap[season] || []), ...baseIssues.slice(0, 2)];
  }

  private determineCropCategory(familyId: string): UniversalCropProfile['category'] {
    const categoryMap: Record<string, UniversalCropProfile['category']> = {
      'tree_nuts': 'nuts',
      'stone_fruits': 'stone_fruit',
      'citrus': 'citrus',
      'grapes': 'vine',
      'berries': 'berry',
      'field_crops': 'field_crop',
      'vegetables': 'vegetable'
    };

    return categoryMap[familyId] || 'field_crop';
  }

  private capitalizeWords(str: string): string {
    return str.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  }

  // Enhanced crop resolution with fallbacks
  getCropProfileWithFallback(cropName: string): UniversalCropProfile | null {
    // First try direct lookup
    let profile = this.findCrop(cropName);
    if (profile) return profile;

    // Try generating synthetic profile
    profile = this.generateSyntheticCropProfile(cropName);
    if (profile) return profile;

    // Last resort: return a generic crop profile
    return this.createGenericCropProfile(cropName);
  }

  private createGenericCropProfile(cropName: string): UniversalCropProfile {
    return {
      name: this.capitalizeWords(cropName),
      family: 'unknown',
      category: 'field_crop',
      aliases: [cropName],
      growthStages: {
        'establishment': {
          duration: 30,
          waterNeed: 'high',
          tempRange: { min: 45, max: 85, optimal: 65 },
          stressThresholds: { maxTemp: 90, minTemp: 40, maxWind: 25, maxHumidity: 85 },
          criticalFactors: ['root development', 'establishment care']
        },
        'vegetative': {
          duration: 60,
          waterNeed: 'medium',
          tempRange: { min: 50, max: 90, optimal: 70 },
          stressThresholds: { maxTemp: 95, minTemp: 45, maxWind: 30, maxHumidity: 85 },
          criticalFactors: ['growth support', 'pest monitoring']
        },
        'reproductive': {
          duration: 45,
          waterNeed: 'critical',
          tempRange: { min: 60, max: 85, optimal: 75 },
          stressThresholds: { maxTemp: 90, minTemp: 55, maxWind: 20, maxHumidity: 80 },
          criticalFactors: ['flowering support', 'fruit development']
        },
        'maturation': {
          duration: 30,
          waterNeed: 'medium',
          tempRange: { min: 65, max: 90, optimal: 78 },
          stressThresholds: { maxTemp: 95, minTemp: 60, maxWind: 25, maxHumidity: 75 },
          criticalFactors: ['harvest timing', 'quality maintenance']
        }
      },
      seasonalFactors: {
        'january': { baseWaterNeed: 0.5, commonIssues: ['winter care'] },
        'february': { baseWaterNeed: 0.6, commonIssues: ['early season prep'] },
        'march': { baseWaterNeed: 0.8, commonIssues: ['spring activation'] },
        'april': { baseWaterNeed: 1.0, commonIssues: ['growth initiation'] },
        'may': { baseWaterNeed: 1.3, commonIssues: ['active growth'] },
        'june': { baseWaterNeed: 1.5, commonIssues: ['peak growth'] },
        'july': { baseWaterNeed: 1.8, commonIssues: ['heat stress management'] },
        'august': { baseWaterNeed: 1.6, commonIssues: ['continued growth'] },
        'september': { baseWaterNeed: 1.2, commonIssues: ['maturation support'] },
        'october': { baseWaterNeed: 0.9, commonIssues: ['harvest preparation'] },
        'november': { baseWaterNeed: 0.6, commonIssues: ['post-harvest care'] },
        'december': { baseWaterNeed: 0.4, commonIssues: ['winter preparation'] }
      }
    };
  }

  // Utility methods for AI insights
  getAllSupportedCrops(): string[] {
    return Object.keys(this.cropProfiles);
  }

  getCropsByFamily(familyId: string): UniversalCropProfile[] {
    return Object.values(this.cropProfiles).filter(crop => crop.family === familyId);
  }

  searchCrops(query: string): UniversalCropProfile[] {
    const results: UniversalCropProfile[] = [];
    const normalizedQuery = query.toLowerCase();

    Object.values(this.cropProfiles).forEach(crop => {
      if (crop.name.toLowerCase().includes(normalizedQuery) ||
          crop.aliases.some(alias => alias.includes(normalizedQuery))) {
        results.push(crop);
      }
    });

    return results;
  }
}

// Abstract base class for AI providers
abstract class AIProvider {
  abstract generateInsights(context: InsightContext): Promise<CropInsight[]>;
  abstract isConfigured(): boolean;
  abstract getName(): string;
}

// OpenAI GPT Integration
class OpenAIProvider extends AIProvider {
  private apiKey: string;
  private model: string = 'gpt-4-turbo-preview';

  constructor(apiKey?: string) {
    super();
    this.apiKey = apiKey || import.meta.env?.VITE_OPENAI_API_KEY || '';
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  getName(): string {
    return 'OpenAI GPT-4';
  }

  async generateInsights(context: InsightContext): Promise<CropInsight[]> {
    if (!this.isConfigured()) {
      throw new Error('OpenAI API key not configured');
    }

    const prompt = this.buildPrompt(context);
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are a friendly, experienced farm advisor who talks like a supportive teammate. Use a warm, conversational tone with phrases like "Hey!", "Here\'s what I\'d do", "Just a heads up", etc. Be encouraging and approachable while providing expert agricultural advice. Sound like you\'re talking to a friend, not writing a technical manual.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 2000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      return this.parseOpenAIResponse(data.choices[0].message.content, context);
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw error;
    }
  }

  private buildPrompt(context: InsightContext): string {
    const recentData = context.weatherHistory.slice(-7); // Last 7 days
    const avgTemp = recentData.reduce((sum, d) => sum + d.temperature, 0) / recentData.length;
    const totalPrecip = recentData.reduce((sum, d) => sum + d.precipitation, 0);
    const avgHumidity = recentData.reduce((sum, d) => sum + d.humidity, 0) / recentData.length;
    const totalET = recentData.reduce((sum, d) => sum + d.evapotranspiration, 0);

    return `
Analyze this crop irrigation data and provide 3-5 specific, actionable insights:

CROP INFORMATION:
- Type: ${context.cropType}
- Location: ${context.location}
- Planting Date: ${context.plantingDate}
- Current Stage: ${context.currentStage}
- Field Size: ${context.fieldSize || 'Not specified'} acres
- Irrigation Type: ${context.irrigationType || 'Not specified'}
- Soil Type: ${context.soilType || 'Not specified'}

RECENT WEATHER DATA (Last 7 Days):
- Average Temperature: ${avgTemp.toFixed(1)}°F
- Total Precipitation: ${totalPrecip.toFixed(2)} inches
- Average Humidity: ${avgHumidity.toFixed(1)}%
- Total Evapotranspiration: ${totalET.toFixed(2)} inches

DETAILED DAILY DATA:
${recentData.map(d => 
  `${d.date}: ${d.temperature}°F, ${d.humidity}% humidity, ${d.precipitation}" rain, ${d.evapotranspiration}" ET, ${d.weatherConditions}`
).join('\n')}

For each insight, provide (in a friendly, conversational tone):
1. A catchy, friendly title (use emojis and engaging language!)
2. Insight written like friendly agricultural advice ("Hey there!", "Here's what's happening...", "This shows...")
3. Warm, practical recommendations ("Farmers should consider...", "This crop would benefit from...", "Best practice suggests...")
4. Confidence level (0-100%)
5. Severity (low/medium/high/critical)
6. Category (watering/efficiency/timing/weather/crop_health)  
7. 3-4 action items written as clear guidance ("Consider implementing...", "Monitor for...")
8. Estimated savings in agricultural terms ("This could reduce costs by...", "Potential savings...")
9. Risk factors explained practically ("Watch for signs of...", "Risk factors include...")

Write everything like friendly agricultural advice! Use:
- Engaging phrases: "Here's what's happening", "Good news", "Worth noting"
- Practical encouragement: "This approach works well", "Farmers often find success with"
- Clear explanations: "Think of it like...", "This means...", "In agricultural terms..."
- Professional guidance: "Best practice suggests...", "Consider this approach...", "Research shows..."

Focus on:
- Irrigation timing optimization (but explain it simply!)
- Water efficiency improvements (with encouraging savings estimates)
- Crop stress indicators (without scaring them)
- Weather-based adjustments (like helpful weather tips)
- Cost savings opportunities (celebrate the wins!)
- Yield protection strategies (supportive guidance)

Format as JSON array with this structure:
[{
  "title": "string",
  "insight": "string", 
  "recommendation": "string",
  "confidence": number,
  "severity": "low|medium|high|critical",
  "category": "watering|efficiency|timing|weather|crop_health",
  "actionItems": ["string1", "string2", "string3"],
  "estimatedSavings": "string or null",
  "riskFactors": ["string1", "string2"] or null
}]
`;
  }

  private parseOpenAIResponse(content: string, context: InsightContext): CropInsight[] {
    try {
      // Extract JSON from the response (in case there's additional text)
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      const jsonContent = jsonMatch ? jsonMatch[0] : content;
      
      const insights = JSON.parse(jsonContent);
      
      return insights.map((insight: any, index: number) => ({
        id: `openai-${Date.now()}-${index}`,
        chartType: 'weather-irrigation',
        title: insight.title || 'AI Insight',
        insight: insight.insight || '',
        recommendation: insight.recommendation || '',
        confidence: Math.min(100, Math.max(0, insight.confidence || 75)),
        severity: insight.severity || 'medium',
        category: insight.category || 'watering',
        actionItems: insight.actionItems || [],
        estimatedSavings: insight.estimatedSavings,
        riskFactors: insight.riskFactors
      }));
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      return this.getFallbackInsights(context);
    }
  }

  private getFallbackInsights(context: InsightContext): CropInsight[] {
    return [{
      id: `fallback-${Date.now()}`,
      chartType: 'weather-irrigation',
      title: 'AI Analysis Temporarily Unavailable',
      insight: 'Unable to generate detailed AI insights at this time.',
      recommendation: 'Continue monitoring weather conditions and adjust irrigation based on crop stage and soil moisture.',
      confidence: 50,
      severity: 'low',
      category: 'watering',
      actionItems: [
        'Check soil moisture manually',
        'Monitor weather forecasts',
        'Follow standard irrigation schedule'
      ]
    }];
  }
}

// Anthropic Claude Integration
class AnthropicProvider extends AIProvider {
  private apiKey: string;

  constructor(apiKey?: string) {
    super();
    this.apiKey = apiKey || import.meta.env?.VITE_ANTHROPIC_API_KEY || '';
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  getName(): string {
    return 'Anthropic Claude';
  }

  async generateInsights(context: InsightContext): Promise<CropInsight[]> {
    if (!this.isConfigured()) {
      throw new Error('Anthropic API key not configured');
    }

    const prompt = this.buildAnthropicPrompt(context);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 2000,
          messages: [{
            role: 'user',
            content: prompt
          }]
        }),
      });

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status}`);
      }

      const data = await response.json();
      return this.parseAnthropicResponse(data.content[0].text, context);
    } catch (error) {
      console.error('Anthropic API error:', error);
      throw error;
    }
  }

  private buildAnthropicPrompt(context: InsightContext): string {
    // Similar to OpenAI prompt but optimized for Claude
    return this.buildPromptBase(context);
  }

  private parseAnthropicResponse(content: string, context: InsightContext): CropInsight[] {
    // Similar parsing logic as OpenAI
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      const jsonContent = jsonMatch ? jsonMatch[0] : content;
      const insights = JSON.parse(jsonContent);
      
      return insights.map((insight: any, index: number) => ({
        id: `claude-${Date.now()}-${index}`,
        chartType: 'weather-irrigation',
        title: insight.title || 'AI Insight',
        insight: insight.insight || '',
        recommendation: insight.recommendation || '',
        confidence: Math.min(100, Math.max(0, insight.confidence || 80)),
        severity: insight.severity || 'medium',
        category: insight.category || 'watering',
        actionItems: insight.actionItems || [],
        estimatedSavings: insight.estimatedSavings,
        riskFactors: insight.riskFactors
      }));
    } catch (error) {
      console.error('Error parsing Claude response:', error);
      return this.getFallbackInsights(context);
    }
  }

  private buildPromptBase(context: InsightContext): string {
    // Base prompt logic shared between providers
    const recentData = context.weatherHistory.slice(-7);
    const avgTemp = recentData.reduce((sum, d) => sum + d.temperature, 0) / recentData.length;
    const totalPrecip = recentData.reduce((sum, d) => sum + d.precipitation, 0);

    return `As an agricultural AI expert, analyze this irrigation data for ${context.cropType} at ${context.location} and provide actionable insights in JSON format...`;
  }

  private getFallbackInsights(context: InsightContext): CropInsight[] {
    return [{
      id: `fallback-claude-${Date.now()}`,
      chartType: 'weather-irrigation',
      title: 'AI Analysis Temporarily Unavailable',
      insight: 'Claude analysis is currently unavailable.',
      recommendation: 'Continue with standard irrigation practices.',
      confidence: 50,
      severity: 'low',
      category: 'watering',
      actionItems: ['Monitor manually', 'Follow standard schedule']
    }];
  }
}

// Data Quality Analyzer Class
class DataQualityAnalyzer {
  static analyzeDataQuality(data: ChartData[]): DataQualityReport {
    const issues: string[] = [];
    const anomalies: DataAnomaly[] = [];
    
    if (data.length === 0) {
      return {
        overallScore: 0,
        issues: ['No data provided'],
        anomalies: [],
        completeness: 0,
        consistency: 0,
        reliability: 0
      };
    }

    // Calculate completeness score
    const completeness = this.calculateCompleteness(data);
    
    // Calculate consistency score
    const consistency = this.calculateConsistency(data);
    
    // Detect anomalies
    const detectedAnomalies = this.detectAnomalies(data);
    anomalies.push(...detectedAnomalies);
    
    // Calculate reliability based on anomalies
    const reliability = Math.max(0, 100 - (anomalies.length * 10));
    
    // Collect issues
    if (completeness < 80) issues.push('Incomplete data set detected');
    if (consistency < 70) issues.push('Data consistency issues found');
    if (anomalies.length > 3) issues.push('Multiple data anomalies detected');
    
    // Calculate overall score
    const overallScore = Math.round((completeness + consistency + reliability) / 3);
    
    return {
      overallScore,
      issues,
      anomalies,
      completeness,
      consistency,
      reliability
    };
  }

  private static calculateCompleteness(data: ChartData[]): number {
    let totalFields = 0;
    let validFields = 0;
    
    data.forEach(day => {
      totalFields += 4; // temp, humidity, precip, ET
      if (day.temperature !== undefined && day.temperature !== null) validFields++;
      if (day.humidity !== undefined && day.humidity !== null) validFields++;
      if (day.precipitation !== undefined && day.precipitation !== null) validFields++;
      if (day.evapotranspiration !== undefined && day.evapotranspiration !== null) validFields++;
    });
    
    return totalFields > 0 ? (validFields / totalFields) * 100 : 0;
  }

  private static calculateConsistency(data: ChartData[]): number {
    if (data.length < 2) return 100;
    
    let consistencyScore = 100;
    
    // Check for unrealistic day-to-day changes
    for (let i = 1; i < data.length; i++) {
      const tempChange = Math.abs(data[i].temperature - data[i-1].temperature);
      const humidityChange = Math.abs(data[i].humidity - data[i-1].humidity);
      
      // Penalize extreme changes
      if (tempChange > 30) consistencyScore -= 10; // 30°F+ change
      if (humidityChange > 40) consistencyScore -= 5; // 40%+ humidity change
    }
    
    return Math.max(0, consistencyScore);
  }

  private static detectAnomalies(data: ChartData[]): DataAnomaly[] {
    const anomalies: DataAnomaly[] = [];
    
    data.forEach((day, index) => {
      // Temperature anomalies
      if (day.temperature < -40 || day.temperature > 130) {
        anomalies.push({
          type: 'temperature',
          date: day.date,
          value: day.temperature,
          expectedRange: { min: -40, max: 130 },
          severity: 'high',
          impact: 'Invalid temperature reading affects all analysis'
        });
      }
      
      // Humidity anomalies
      if (day.humidity < 0 || day.humidity > 100) {
        anomalies.push({
          type: 'humidity',
          date: day.date,
          value: day.humidity,
          expectedRange: { min: 0, max: 100 },
          severity: 'medium',
          impact: 'Invalid humidity affects disease risk analysis'
        });
      }
      
      // Precipitation anomalies
      if (day.precipitation < 0 || day.precipitation > 20) {
        anomalies.push({
          type: 'precipitation',
          date: day.date,
          value: day.precipitation,
          expectedRange: { min: 0, max: 20 },
          severity: day.precipitation > 20 ? 'high' : 'medium',
          impact: 'Extreme precipitation value affects irrigation recommendations'
        });
      }
      
      // ET anomalies
      if (day.evapotranspiration < 0 || day.evapotranspiration > 2) {
        anomalies.push({
          type: 'evapotranspiration',
          date: day.date,
          value: day.evapotranspiration,
          expectedRange: { min: 0, max: 2 },
          severity: 'medium',
          impact: 'Unusual ET value affects water demand calculations'
        });
      }
    });
    
    return anomalies;
  }
}

// Statistical Analysis Class
class StatisticalAnalyzer {
  static calculateLinearRegression(values: number[]): { slope: number; intercept: number; rSquared: number } {
    const n = values.length;
    if (n < 2) return { slope: 0, intercept: 0, rSquared: 0 };
    
    const x = Array.from({length: n}, (_, i) => i);
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calculate R-squared
    const yMean = sumY / n;
    const totalSumSquares = values.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
    const residualSumSquares = values.reduce((sum, y, i) => {
      const predicted = slope * i + intercept;
      return sum + Math.pow(y - predicted, 2);
    }, 0);
    const rSquared = totalSumSquares > 0 ? 1 - (residualSumSquares / totalSumSquares) : 0;
    
    return { slope, intercept, rSquared };
  }

  static analyzeTrends(data: ChartData[]): TrendAnalysis {
    const temperatures = data.map(d => d.temperature);
    const precipitations = data.map(d => d.precipitation);
    const etValues = data.map(d => d.evapotranspiration);
    
    const tempTrend = this.calculateLinearRegression(temperatures);
    const precipTrend = this.calculateLinearRegression(precipitations);
    const etTrend = this.calculateLinearRegression(etValues);
    
    return {
      temperatureTrend: {
        slope: tempTrend.slope,
        direction: tempTrend.slope > 0.5 ? 'rising' : tempTrend.slope < -0.5 ? 'falling' : 'stable',
        confidence: tempTrend.rSquared * 100,
        prediction: temperatures[temperatures.length - 1] + (tempTrend.slope * 3)
      },
      precipitationPattern: {
        type: this.classifyPrecipitationPattern(precipitations),
        consistency: precipTrend.rSquared * 100,
        forecast: tempTrend.rSquared > 0.5 ? 'continuing' : 'uncertain'
      },
      evapotranspirationTrend: {
        average: etValues.reduce((sum, val) => sum + val, 0) / etValues.length,
        trend: etTrend.slope > 0.01 ? 'increasing' : etTrend.slope < -0.01 ? 'decreasing' : 'stable',
        waterDemandForecast: this.predictWaterDemand(etTrend, etValues)
      }
    };
  }

  private static classifyPrecipitationPattern(precipitations: number[]): 'drought' | 'normal' | 'wet' | 'erratic' {
    const total = precipitations.reduce((sum, val) => sum + val, 0);
    const average = total / precipitations.length;
    const variance = precipitations.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / precipitations.length;
    
    if (total < 0.5) return 'drought';
    if (total > 3) return 'wet';
    if (variance > 2) return 'erratic';
    return 'normal';
  }

  private static predictWaterDemand(etTrend: { slope: number }, etValues: number[]): 'low' | 'medium' | 'high' | 'critical' {
    const currentET = etValues[etValues.length - 1];
    const predictedET = currentET + (etTrend.slope * 3);
    
    if (predictedET > 0.5) return 'critical';
    if (predictedET > 0.35) return 'high';
    if (predictedET > 0.25) return 'medium';
    return 'low';
  }
}

// Local/Rule-Based Insights (No API required)
class LocalInsightsProvider extends AIProvider {
  private cropDatabase: CropDatabase;

  constructor() {
    super();
    this.cropDatabase = new CropDatabase();
  }

  isConfigured(): boolean {
    return true; // Always available
  }

  getName(): string {
    return 'Local Analysis';
  }



  private getCropProfile(cropType: string): UniversalCropProfile | null {
    return this.cropDatabase.getCropProfileWithFallback(cropType);
  }

  private generateFamilySpecificInsights(
    cropProfile: UniversalCropProfile, 
    context: InsightContext,
    dataQuality: DataQualityReport
  ): CropInsight[] {
    const insights: CropInsight[] = [];
    const recentData = context.weatherHistory.slice(-7);
    
    // Family-specific insights
    if (cropProfile.family === 'tree_nuts') {
      insights.push({
        id: `family-nuts-${Date.now()}`,
        chartType: 'crop-family',
        title: '🥜 Tree Nut Management - Specialized deep-root irrigation needed',
        insight: `Your ${cropProfile.name} belongs to the tree nut family, which has unique management requirements. Tree nuts typically need deep, infrequent irrigation (18-24 inch root zone) and are sensitive to both drought and waterlogged conditions. They also have specific harvest timing requirements for optimal nut quality and storage.`,
        recommendation: `Focus on deep root zone irrigation rather than frequent shallow watering. Monitor for nut-specific pests like navel orangeworm during hull split. Tree nuts benefit from controlled deficit irrigation during certain growth stages to concentrate flavors and improve shell hardness. Consider soil moisture sensors at 2-3 foot depth.`,
        confidence: this.calculateEnhancedConfidence({ cropProfile }, dataQuality, recentData.length),
        severity: 'medium',
        category: 'crop_health',
        actionItems: [
          'Implement deep irrigation scheduling (18-24 inch penetration)',
          'Monitor for nut-specific pest pressure during vulnerable stages',
          'Track hull split timing carefully for harvest decisions',
          'Consider controlled deficit irrigation strategies during maturation'
        ],
        riskFactors: ['Nut quality issues from improper irrigation depth', 'Pest pressure during hull split', 'Shallow irrigation leading to surface rooting']
      });
    }

    if (cropProfile.family === 'stone_fruits') {
      insights.push({
        id: `family-stone-${Date.now()}`,
        chartType: 'crop-family',
        title: '🍑 Stone Fruit Management - Fruit quality and disease prevention focus',
        insight: `Your ${cropProfile.name} is a stone fruit, which requires careful water management during pit hardening and is susceptible to brown rot and bacterial spot. Stone fruits have a narrow window for optimal harvest and are sensitive to temperature fluctuations during fruit development.`,
        recommendation: `Maintain consistent soil moisture during pit hardening (avoid drought stress). Reduce irrigation near harvest to concentrate sugars but don't stress the tree. Focus on canopy management for air circulation to prevent fungal diseases. Monitor for brown rot especially during wet periods.`,
        confidence: this.calculateEnhancedConfidence({ cropProfile }, dataQuality, recentData.length),
        severity: 'medium',
        category: 'crop_health',
        actionItems: [
          'Maintain consistent moisture during pit hardening stage',
          'Implement canopy management for disease prevention',
          'Monitor brown rot conditions (humidity + temperature)',
          'Time harvest for optimal sugar-acid balance'
        ],
        riskFactors: ['Brown rot during humid conditions', 'Pit splitting from irregular irrigation', 'Fruit quality loss from temperature stress']
      });
    }

    if (cropProfile.family === 'citrus') {
      insights.push({
        id: `family-citrus-${Date.now()}`,
        chartType: 'crop-family',
        title: '🍊 Citrus Management - Year-round production requires consistent care',
        insight: `Your ${cropProfile.name} is a citrus crop with year-round water needs and sensitivity to both frost and salt. Citrus trees have multiple growth flushes per year and can have fruit in various stages of development simultaneously. They're particularly sensitive to water stress during fruit sizing.`,
        recommendation: `Maintain consistent soil moisture year-round - citrus doesn't have a true dormant period. Protect from frost (32°F+ damage). Monitor for salt accumulation in irrigation water. Consider microsprinkler irrigation for uniform coverage. Watch for citrus-specific pests like scale and citrus canker.`,
        confidence: this.calculateEnhancedConfidence({ cropProfile }, dataQuality, recentData.length),
        severity: 'medium',
        category: 'crop_health',
        actionItems: [
          'Maintain year-round consistent irrigation schedule',
          'Monitor irrigation water for salt content',
          'Implement frost protection measures below 35°F',
          'Scout for citrus-specific pests and diseases regularly'
        ],
        riskFactors: ['Frost damage below 32°F', 'Salt accumulation from poor water quality', 'Multiple pest pressure points', 'Fruit drop from water stress']
      });
    }

    if (cropProfile.family === 'grapes') {
      insights.push({
        id: `family-grapes-${Date.now()}`,
        chartType: 'crop-family',
        title: '🍇 Grape Management - Controlled stress enhances quality',
        insight: `Your ${cropProfile.name} benefits from controlled water stress during certain growth stages. Grapes are unique in that mild water stress during veraison (color change) actually improves fruit quality by concentrating sugars and flavor compounds. However, severe stress can shut down photosynthesis.`,
        recommendation: `Use regulated deficit irrigation (RDI) during veraison to improve fruit quality - reduce irrigation by 25-40% but monitor leaf water potential. Maintain adequate moisture during flowering and early fruit development. Focus on canopy management for disease prevention and light exposure.`,
        confidence: this.calculateEnhancedConfidence({ cropProfile }, dataQuality, recentData.length),
        severity: 'medium',
        category: 'crop_health',
        actionItems: [
          'Implement regulated deficit irrigation during veraison',
          'Monitor leaf water potential during stress periods',
          'Maintain adequate irrigation during flowering and fruit set',
          'Manage canopy for optimal light exposure and air circulation'
        ],
        riskFactors: ['Over-stressing vines during critical growth stages', 'Powdery mildew in dense canopies', 'Poor fruit set from water stress during flowering']
      });
    }

    return insights;
  }

  private createDataQualityInsight(dataQuality: DataQualityReport, cropType: string): CropInsight {
    return {
      id: `data-quality-${Date.now()}`,
      chartType: 'combined',
      title: 'Farm-wide Data Quality Alert - Sensor readings need attention',
      insight: `Hey! I noticed some data quality issues that might affect analysis accuracy across your entire farm. Overall data quality score: ${dataQuality.overallScore}/100. Issues detected: ${dataQuality.issues.join(', ')}. ${dataQuality.anomalies.length > 0 ? `Found ${dataQuality.anomalies.length} data anomalies that could impact all crop recommendations.` : ''}`,
      recommendation: `Here's what I'd suggest for farm-wide data quality: verify all sensor calibrations and data collection systems. Clean, accurate data gives us much better insights for all your crops! Consider reviewing data from ${dataQuality.anomalies.map(a => a.date).join(', ')} for accuracy.`,
      confidence: 95,
      severity: dataQuality.overallScore < 50 ? 'high' : 'medium',
      category: 'crop_health',
      actionItems: [
        'Verify sensor calibration across all monitoring points',
        'Check data collection system for systematic errors',
        'Review anomalous readings for accuracy',
        'Consider backup data sources if available'
      ],
      riskFactors: ['Reduced recommendation accuracy for all crops', 'Potential missed critical conditions farm-wide']
    };
  }

  private generateCrossCropInsights(
    context: InsightContext, 
    dataQuality: DataQualityReport, 
    trendAnalysis: TrendAnalysis
  ): MultiCropInsight[] {
    const insights: MultiCropInsight[] = [];
    const crops = context.crops!;
    const recentData = context.weatherHistory.slice(-7);

    // Resource conflict analysis
    const resourceConflicts = this.analyzeResourceConflicts(crops, context);
    if (resourceConflicts.hasConflicts) {
      const affectedCropsText = resourceConflicts.affectedCrops.length > 0 ? 
        ` CROPS AFFECTED: ${resourceConflicts.affectedCrops.join(', ').toUpperCase()}` : '';
      
      insights.push({
        id: `resource-conflict-${Date.now()}`,
        cropType: 'farm-management',
        chartType: 'combined',
        title: 'MULTI-CROP Resource Management Alert - Multiple crops competing for attention',
        insight: `FARM-WIDE ANALYSIS${affectedCropsText}: I've detected potential resource conflicts between your crops. ${resourceConflicts.conflicts.join(' ')} This requires strategic management to optimize outcomes across your entire farm operation.`,
        recommendation: `Priority management strategy: ${resourceConflicts.recommendations.join(' ')} Consider staggering intensive management periods and sharing resources efficiently between crop types.`,
        confidence: this.calculateEnhancedConfidence({ resourceConflicts }, dataQuality, recentData.length),
        severity: resourceConflicts.severity,
        category: 'efficiency',
        actionItems: resourceConflicts.actionItems,
        affectedCrops: resourceConflicts.affectedCrops,
        crossCropImpact: {
          resourceConflicts: resourceConflicts.conflicts,
          synergies: resourceConflicts.synergies,
          sharedBenefits: resourceConflicts.sharedBenefits
        },
        riskFactors: ['Suboptimal resource allocation', 'Competing management priorities', 'Reduced efficiency across operations']
      });
    }

    // Family synergy analysis
    const familySynergies = this.analyzeFamilySynergies(crops);
    if (familySynergies.hasSynergies) {
      const synergyCropsText = familySynergies.affectedCrops.length > 0 ? 
        ` SYNERGY CROPS: ${familySynergies.affectedCrops.join(', ').toUpperCase()}` : '';
      
      insights.push({
        id: `family-synergy-${Date.now()}`,
        cropType: 'farm-optimization',
        chartType: 'combined',
        title: 'MULTI-CROP Synergy Opportunities - Shared management benefits detected',
        insight: `FARM OPTIMIZATION${synergyCropsText}: Great news! Your crop combination offers synergy opportunities: ${familySynergies.synergies.join(', ')}. These crops can benefit from coordinated management strategies that optimize resources and reduce overall management complexity.`,
        recommendation: `Synergy optimization: ${familySynergies.recommendations.join(' ')} This coordinated approach can improve efficiency and reduce costs across your farming operation.`,
        confidence: 85,
        severity: 'medium',
        category: 'efficiency',
        actionItems: familySynergies.actionItems,
        affectedCrops: familySynergies.affectedCrops,
        crossCropImpact: {
          synergies: familySynergies.synergies,
          sharedBenefits: familySynergies.sharedBenefits
        },
        riskFactors: ['Missed optimization opportunities without coordination']
      });
    }

    // Weather impact differential analysis
    const weatherImpacts = this.analyzeWeatherImpactDifferentials(crops, trendAnalysis);
    if (weatherImpacts.hasDifferentials) {
      const weatherCropsText = weatherImpacts.affectedCrops.length > 0 ? 
        ` WEATHER-AFFECTED CROPS: ${weatherImpacts.affectedCrops.join(', ').toUpperCase()}` : '';
      
      insights.push({
        id: `weather-differential-${Date.now()}`,
        cropType: 'weather-management',
        chartType: 'weather',
        title: '🌤️ MULTI-CROP Weather Impact - Crops responding differently to conditions',
        insight: `WEATHER ANALYSIS${weatherCropsText}: The current weather conditions are affecting your crops differently: ${weatherImpacts.differentials.join(', ')}. This creates both challenges and opportunities for targeted management approaches.`,
        recommendation: `Targeted weather management: ${weatherImpacts.recommendations.join(' ')} Focus resources on the most vulnerable crops while taking advantage of favorable conditions for others.`,
        confidence: this.calculateEnhancedConfidence({ weatherImpacts }, dataQuality, recentData.length),
        severity: weatherImpacts.maxSeverity,
        category: 'weather',
        actionItems: weatherImpacts.actionItems,
        affectedCrops: weatherImpacts.affectedCrops,
        crossCropImpact: {
          resourceConflicts: weatherImpacts.conflicts
        },
        riskFactors: weatherImpacts.riskFactors
      });
    }

    return insights;
  }

  private analyzeResourceConflicts(crops: CropContext[], context: InsightContext) {
    const conflicts: string[] = [];
    const recommendations: string[] = [];
    const actionItems: string[] = [];
    const synergies: string[] = [];
    const sharedBenefits: string[] = [];
    const affectedCrops: string[] = [];
    let severity: 'low' | 'medium' | 'high' = 'low';

    // Analyze irrigation timing conflicts
    const criticalWaterCrops = crops.filter(crop => {
      const profile = this.getCropProfile(crop.cropType);
      const stage = profile?.growthStages[crop.currentStage.toLowerCase()];
      return stage?.waterNeed === 'critical';
    });

    if (criticalWaterCrops.length > 1) {
      conflicts.push(`${criticalWaterCrops.length} crops (${criticalWaterCrops.map(c => c.cropType).join(', ')}) are in critical water need stages simultaneously.`);
      recommendations.push(`Prioritize irrigation for highest-value or most vulnerable crops first.`);
      actionItems.push('Create priority irrigation schedule for critical-need crops');
      affectedCrops.push(...criticalWaterCrops.map(c => c.cropType));
      severity = 'high';
    }

    // Analyze harvest timing overlaps
    const harvestCrops = crops.filter(crop => 
      ['harvest', 'maturation', 'hull_split'].includes(crop.currentStage.toLowerCase())
    );

    if (harvestCrops.length > 1) {
      conflicts.push(`${harvestCrops.length} crops approaching harvest simultaneously may strain labor resources.`);
      recommendations.push(`Stagger harvest timing where possible and prepare additional labor resources.`);
      actionItems.push('Plan harvest logistics and labor allocation');
      affectedCrops.push(...harvestCrops.map(c => c.cropType));
      severity = severity === 'high' ? 'high' : 'medium';
    }

    // Find positive synergies
    const families = [...new Set(crops.map(crop => {
      const profile = this.getCropProfile(crop.cropType);
      return profile?.family || 'unknown';
    }))];

    if (families.includes('tree_nuts') && families.includes('stone_fruits')) {
      synergies.push('Tree nuts and stone fruits can share pruning schedules and pest management protocols');
      sharedBenefits.push('Coordinated dormant season management', 'Shared pest monitoring systems');
    }

    if (families.includes('citrus') && families.includes('stone_fruits')) {
      synergies.push('Year-round citrus irrigation can complement seasonal stone fruit needs');
      sharedBenefits.push('Infrastructure sharing opportunities', 'Complementary labor scheduling');
    }

    return {
      hasConflicts: conflicts.length > 0 || synergies.length > 0,
      conflicts,
      recommendations,
      actionItems,
      synergies,
      sharedBenefits,
      affectedCrops: [...new Set(affectedCrops)],
      severity
    };
  }

  private analyzeFamilySynergies(crops: CropContext[]) {
    const synergies: string[] = [];
    const recommendations: string[] = [];
    const actionItems: string[] = [];
    const sharedBenefits: string[] = [];
    const affectedCrops: string[] = [];

    // Group crops by family
    const familyGroups: Record<string, CropContext[]> = {};
    crops.forEach(crop => {
      const profile = this.getCropProfile(crop.cropType);
      const family = profile?.family || 'unknown';
      if (!familyGroups[family]) familyGroups[family] = [];
      familyGroups[family].push(crop);
    });

    // Analyze within-family synergies
    Object.entries(familyGroups).forEach(([family, familyCrops]) => {
      if (familyCrops.length > 1 && family !== 'unknown') {
        synergies.push(`${familyCrops.length} ${family.replace('_', ' ')} crops can share specialized management protocols`);
        recommendations.push(`Coordinate ${family.replace('_', ' ')} management for economies of scale.`);
        actionItems.push(`Develop unified ${family.replace('_', ' ')} management schedule`);
        sharedBenefits.push(`Specialized ${family} equipment usage`, `Coordinated pest and disease management`);
        affectedCrops.push(...familyCrops.map(c => c.cropType));
      }
    });

    // Cross-family complementarity
    const familyNames = Object.keys(familyGroups);
    if (familyNames.includes('tree_nuts') && familyNames.includes('grapes')) {
      synergies.push('Tree nuts and grapes have complementary water stress strategies');
      recommendations.push('Coordinate deficit irrigation timing between tree nuts and grapes for optimal resource use.');
      sharedBenefits.push('Water use optimization', 'Complementary harvest timing');
    }

    return {
      hasSynergies: synergies.length > 0,
      synergies,
      recommendations,
      actionItems,
      sharedBenefits,
      affectedCrops: [...new Set(affectedCrops)]
    };
  }

  private analyzeWeatherImpactDifferentials(crops: CropContext[], trendAnalysis: TrendAnalysis) {
    const differentials: string[] = [];
    const recommendations: string[] = [];
    const actionItems: string[] = [];
    const conflicts: string[] = [];
    const riskFactors: string[] = [];
    const affectedCrops: string[] = [];
    let maxSeverity: 'low' | 'medium' | 'high' = 'low';

    // Analyze temperature sensitivity differences
    const tempSensitiveCrops: { crop: string; sensitivity: string; stage: string }[] = [];
    const tempTolerantCrops: { crop: string; tolerance: string; stage: string }[] = [];

    crops.forEach(crop => {
      const profile = this.getCropProfile(crop.cropType);
      const stage = profile?.growthStages[crop.currentStage.toLowerCase()];
      
      if (stage) {
        if (stage.stressThresholds.maxTemp < 80) {
          tempSensitiveCrops.push({ crop: crop.cropType, sensitivity: 'high', stage: crop.currentStage });
        } else if (stage.stressThresholds.maxTemp > 95) {
          tempTolerantCrops.push({ crop: crop.cropType, tolerance: 'high', stage: crop.currentStage });
        }
      }
    });

    if (tempSensitiveCrops.length > 0 && tempTolerantCrops.length > 0) {
      differentials.push(`${tempSensitiveCrops.map(c => c.crop).join(', ')} are heat-sensitive while ${tempTolerantCrops.map(c => c.crop).join(', ')} are heat-tolerant`);
      recommendations.push(`Focus cooling strategies on sensitive crops while maintaining normal care for tolerant ones.`);
      actionItems.push('Implement targeted heat protection for sensitive crops');
      conflicts.push('Competing resource needs for temperature management');
      affectedCrops.push(...tempSensitiveCrops.map(c => c.crop), ...tempTolerantCrops.map(c => c.crop));
      maxSeverity = 'medium';
    }

    // Analyze water need conflicts during trends
    if (trendAnalysis.temperatureTrend.direction === 'rising') {
      const highWaterCrops = crops.filter(crop => {
        const profile = this.getCropProfile(crop.cropType);
        const stage = profile?.growthStages[crop.currentStage.toLowerCase()];
        return stage?.waterNeed === 'critical' || stage?.waterNeed === 'high';
      });

      if (highWaterCrops.length > 1) {
        differentials.push(`Rising temperatures will increase water demand for ${highWaterCrops.map(c => c.cropType).join(', ')}`);
        recommendations.push(`Prepare for increased irrigation capacity and prioritize water allocation.`);
        actionItems.push('Increase irrigation system capacity preparation');
        riskFactors.push('Water resource strain during heat periods');
        affectedCrops.push(...highWaterCrops.map(c => c.cropType));
        maxSeverity = 'high';
      }
    }

    return {
      hasDifferentials: differentials.length > 0,
      differentials,
      recommendations,
      actionItems,
      conflicts,
      riskFactors,
      affectedCrops: [...new Set(affectedCrops)],
      maxSeverity
    };
  }

  private calculateEnhancedConfidence(analysis: any, dataQuality: DataQualityReport, sampleSize: number): number {
    let baseConfidence = 30;
    
    // Data quality factor (0-40 points)
    baseConfidence += Math.round((dataQuality.overallScore / 100) * 40);
    
    // Sample size factor (0-20 points)
    const sampleFactor = Math.min(sampleSize / 14, 1); // 14 days = max
    baseConfidence += Math.round(sampleFactor * 20);
    
    // Pattern strength (0-10 points)
    if (analysis.trendAnalysis?.temperatureTrend?.confidence > 70) baseConfidence += 10;
    else if (analysis.trendAnalysis?.temperatureTrend?.confidence > 50) baseConfidence += 5;
    
    return Math.min(100, Math.max(0, baseConfidence));
  }

  private generateSmartRecommendations(
    context: InsightContext, 
    dataQuality: DataQualityReport, 
    trendAnalysis: TrendAnalysis,
    currentStageProfile?: any
  ): SmartRecommendation[] {
    const recommendations: SmartRecommendation[] = [];
    const recentData = context.weatherHistory.slice(-7);
    const totalPrecip = recentData.reduce((sum, d) => sum + d.precipitation, 0);
    const avgET = recentData.reduce((sum, d) => sum + d.evapotranspiration, 0) / recentData.length;
    const avgTemp = recentData.reduce((sum, d) => sum + d.temperature, 0) / recentData.length;
    const avgHumidity = recentData.reduce((sum, d) => sum + d.humidity, 0) / recentData.length;
    
    // Water deficit calculation
    const waterDeficit = (avgET * recentData.length) - totalPrecip;
    
    // Smart irrigation recommendations
    if (waterDeficit > 0.5) {
      const irrigationAmount = this.calculateOptimalIrrigation(waterDeficit, currentStageProfile, context.fieldSize);
      const priority = currentStageProfile?.waterNeed === 'critical' ? 'urgent' : waterDeficit > 1.5 ? 'high' : 'normal';
      
      recommendations.push({
        type: 'irrigation',
        priority: priority,
        action: `Apply ${irrigationAmount.amount} inches of water over ${irrigationAmount.sessions} sessions`,
        timing: irrigationAmount.optimalTimes,
        reasoning: `Current water deficit of ${waterDeficit.toFixed(1)} inches during ${context.currentStage} stage`,
        expectedOutcome: `Restore optimal soil moisture and prevent ${currentStageProfile?.criticalFactors.join(', ') || 'plant stress'}`,
        cost: irrigationAmount.estimatedCost,
        details: [
          `Session 1: ${irrigationAmount.details.session1}`,
          `Session 2: ${irrigationAmount.details.session2}`,
          'Monitor soil moisture 24 hours after irrigation',
          'Adjust based on plant response and weather conditions'
        ]
      });
    }
    
    // Disease prevention recommendations
    const diseaseRisk = avgHumidity > 80 && avgTemp > 65 && avgTemp < 85;
    if (diseaseRisk) {
      recommendations.push({
        type: 'disease_prevention',
        priority: 'high',
        action: 'Implement preventive disease management protocol',
        timing: ['Immediate implementation', 'Morning application preferred', 'Avoid evening treatments'],
        reasoning: `High disease risk conditions: ${avgHumidity.toFixed(1)}% humidity with ${avgTemp.toFixed(1)}°F temperature`,
        expectedOutcome: 'Reduce disease incidence by 70-85% through proactive management',
        details: [
          'Switch to drip irrigation to reduce leaf wetness',
          'Increase air circulation around plants',
          'Apply organic fungicide preventively',
          'Scout for early disease symptoms daily'
        ]
      });
    }
    
    // Heat stress management
    if (trendAnalysis.temperatureTrend.direction === 'rising' && trendAnalysis.temperatureTrend.prediction > 90) {
      recommendations.push({
        type: 'heat_management',
        priority: trendAnalysis.temperatureTrend.prediction > 100 ? 'urgent' : 'high',
        action: 'Activate heat stress prevention protocols',
        timing: ['Pre-dawn irrigation (4-6 AM)', 'Midday monitoring', 'Evening assessment'],
        reasoning: `Forecasted temperature increase to ${trendAnalysis.temperatureTrend.prediction.toFixed(1)}°F`,
        expectedOutcome: 'Maintain crop productivity during extreme heat events',
        details: [
          'Increase irrigation frequency by 30-50%',
          'Apply reflective mulch if available',
          'Monitor leaf temperature and plant stress symptoms',
          'Consider temporary shade cloth for high-value crops'
        ]
      });
    }
    
    // Frost protection
    if (trendAnalysis.temperatureTrend.direction === 'falling' && trendAnalysis.temperatureTrend.prediction < 35) {
      recommendations.push({
        type: 'frost_protection',
        priority: 'urgent',
        action: 'Implement frost protection measures immediately',
        timing: ['Evening preparation', 'Night monitoring', 'Early morning assessment'],
        reasoning: `Predicted temperature drop to ${trendAnalysis.temperatureTrend.prediction.toFixed(1)}°F`,
        expectedOutcome: 'Prevent frost damage and protect crop yield',
        details: [
          'Cover sensitive plants with frost cloth',
          'Run irrigation system during coldest hours',
          'Monitor temperatures throughout the night',
          'Assess damage and adjust protection as needed'
        ]
      });
    }
    
    return recommendations;
  }

  private calculateOptimalIrrigation(
    waterDeficit: number, 
    stageProfile: any, 
    fieldSize?: number
  ) {
    const baseAmount = Math.min(waterDeficit * 1.2, 2.0); // Don't over-irrigate
    const sessions = baseAmount > 1.0 ? 2 : 1;
    const costPerAcreInch = 45; // Estimated cost per acre-inch
    
    return {
      amount: baseAmount.toFixed(1),
      sessions,
      optimalTimes: sessions === 2 
        ? ['Early morning (5-7 AM)', 'Early evening (6-8 PM)']
        : ['Early morning (5-7 AM)'],
      estimatedCost: fieldSize ? Math.round(baseAmount * fieldSize * costPerAcreInch) : undefined,
      details: {
        session1: sessions === 2 
          ? `${(baseAmount * 0.6).toFixed(1)} inches in morning session`
          : `${baseAmount} inches total`,
        session2: sessions === 2 
          ? `${(baseAmount * 0.4).toFixed(1)} inches in evening session`
          : 'Single session application'
      }
    };
  }

  private calculateEconomicImpact(
    recommendations: SmartRecommendation[],
    context: InsightContext,
    waterDeficit: number
  ): EconomicImpact {
    const implementationCost = recommendations.reduce((sum, rec) => sum + (rec.cost || 0), 0);
    
    // Estimate savings from proper water management
    const waterSavings = Math.max(0, waterDeficit * 0.3) * (context.fieldSize || 1) * 45; // 30% efficiency gain
    
    // Estimate yield protection value
    const yieldProtection = (context.fieldSize || 1) * 2000; // $2000/acre potential loss prevention
    
    const totalBenefits = waterSavings + yieldProtection;
    const roi = implementationCost > 0 ? (totalBenefits - implementationCost) / implementationCost : 0;
    const paybackPeriod = implementationCost > 0 ? implementationCost / (totalBenefits / 30) : 0; // days
    
    return {
      implementationCost,
      expectedSavings: waterSavings,
      yieldProtection,
      roi,
      paybackPeriod: Math.max(1, Math.round(paybackPeriod))
    };
  }

  // Public methods to showcase crop database capabilities
  getAllSupportedCrops(): string[] {
    return this.cropDatabase.getAllSupportedCrops();
  }

  searchCrops(query: string): UniversalCropProfile[] {
    return this.cropDatabase.searchCrops(query);
  }

  getCropsByFamily(familyId: string): UniversalCropProfile[] {
    return this.cropDatabase.getCropsByFamily(familyId);
  }

  async generateInsights(context: InsightContext): Promise<CropInsight[]> {
    // Check if this is a multi-crop analysis request
    if (context.crops && context.crops.length > 0) {
      return await this.generateMultiCropInsights(context);
    }

    // Single crop analysis (legacy support)
    return await this.generateSingleCropInsights(context);
  }

  private async generateMultiCropInsights(context: InsightContext): Promise<MultiCropInsight[]> {
    const allInsights: MultiCropInsight[] = [];
    const recentData = context.weatherHistory.slice(-7);

    // Perform global analysis first
    const dataQuality = DataQualityAnalyzer.analyzeDataQuality(recentData);
    const trendAnalysis = StatisticalAnalyzer.analyzeTrends(recentData);

    // Add multi-crop overview insight first
    const cropsList = context.crops!.map(c => c.cropType.toUpperCase()).join(', ');
    allInsights.push({
      id: `multi-crop-overview-${Date.now()}`,
      cropType: 'multi-crop-overview',
      chartType: 'combined',
      title: `🚜 ACTIVE CROPS ANALYSIS | ${context.crops!.length} crops being monitored`,
      insight: `MULTI-CROP DASHBOARD ACTIVE: Currently analyzing ${context.crops!.length} different crop types: ${cropsList}. Each crop below has individual AI insights plus farm-wide coordination recommendations. This comprehensive analysis covers crop-specific needs, resource conflicts, and synergy opportunities across your entire operation.`,
      recommendation: `Review individual crop insights below for specific management recommendations, then check farm-wide insights for coordination opportunities. Each crop gets personalized attention while optimizing your overall farming strategy.`,
      confidence: 95,
      severity: 'medium',
      category: 'crop_health',
      actionItems: [
        'Review individual crop insights for each selected crop type',
        'Check for resource conflicts between crops',
        'Look for synergy opportunities to optimize management',
        'Coordinate timing of intensive management activities'
      ],
      affectedCrops: context.crops!.map(c => c.cropType),
      riskFactors: ['Management complexity with multiple crop types', 'Resource allocation challenges']
    } as MultiCropInsight);

    // Add farm-wide data quality insight
    if (dataQuality.overallScore < 70) {
      allInsights.push({
        ...this.createDataQualityInsight(dataQuality, 'ALL CROPS'),
        cropType: 'farm-wide',
        affectedCrops: context.crops!.map(c => c.cropType)
      } as MultiCropInsight);
    }

    // Generate insights for each crop
    for (const cropContext of context.crops!) {
      const singleCropContext: InsightContext = {
        ...context,
        cropType: cropContext.cropType,
        plantingDate: cropContext.plantingDate,
        currentStage: cropContext.currentStage,
        fieldSize: cropContext.fieldSize,
        irrigationType: cropContext.irrigationType
      };

      const cropInsights = await this.generateSingleCropInsights(singleCropContext);
      
      // Convert to MultiCropInsight and add crop identification
      const multiCropInsights: MultiCropInsight[] = cropInsights.map(insight => ({
        ...insight,
        cropId: cropContext.fieldId || cropContext.cropType,
        cropType: cropContext.cropType,
        title: `${cropContext.cropType.toUpperCase()} | ${insight.title.replace(/^[^|]*\|/, '')}`,
        insight: `${cropContext.cropType.toUpperCase()} CROP ANALYSIS: ${insight.insight}`,
        id: `${cropContext.cropType}-${insight.id}`
      }));

      allInsights.push(...multiCropInsights);
    }

    // Add cross-crop analysis insights
    const crossCropInsights = this.generateCrossCropInsights(context, dataQuality, trendAnalysis);
    allInsights.push(...crossCropInsights);

    return allInsights;
  }

  private async generateSingleCropInsights(context: InsightContext): Promise<CropInsight[]> {
    const insights: CropInsight[] = [];
    const recentData = context.weatherHistory.slice(-7);
    const last24Hours = context.weatherHistory.slice(-1);
    const last48Hours = context.weatherHistory.slice(-2);
    
    // Perform data quality analysis
    const dataQuality = DataQualityAnalyzer.analyzeDataQuality(recentData);
    
    // Get crop profile for enhanced analysis
    const cropProfile = this.getCropProfile(context.cropType);
    const currentStageProfile = cropProfile?.growthStages[context.currentStage.toLowerCase()];
    
    // Perform trend analysis
    const trendAnalysis = StatisticalAnalyzer.analyzeTrends(recentData);
    
    // Add data quality insight if there are significant issues
    if (dataQuality.overallScore < 70) {
      insights.push({
        id: `data-quality-${Date.now()}`,
        chartType: 'combined',
        title: 'Data Quality Alert - Some readings need attention',
        insight: `Hey! I noticed some data quality issues that might affect our analysis accuracy. Overall data quality score: ${dataQuality.overallScore}/100. Issues detected: ${dataQuality.issues.join(', ')}. ${dataQuality.anomalies.length > 0 ? `Found ${dataQuality.anomalies.length} data anomalies that could impact recommendations.` : ''}`,
        recommendation: `Here's what I'd suggest: double-check sensor calibrations and data collection methods. Clean data gives us much better insights! Consider reviewing data from ${dataQuality.anomalies.map(a => a.date).join(', ')} for accuracy. Better data = better recommendations for your ${context.cropType}!`,
        confidence: 95,
        severity: dataQuality.overallScore < 50 ? 'high' : 'medium',
        category: 'crop_health',
        actionItems: [
          'Verify sensor calibration and placement',
          'Check data collection system for errors',
          'Review anomalous readings for accuracy',
          'Consider backup data sources if available'
        ],
        riskFactors: ['Reduced recommendation accuracy', 'Potential missed critical conditions']
      });
    }

    // Add crop family-specific insights
    if (cropProfile && cropProfile.family !== 'unknown') {
      const familyInsights = this.generateFamilySpecificInsights(cropProfile, context, dataQuality);
      insights.push(...familyInsights);
    }

    // Handle unknown crops with helpful guidance
    if (!cropProfile || cropProfile.family === 'unknown') {
      insights.push({
        id: `unknown-crop-${Date.now()}`,
        chartType: 'general',
        title: `Learning about "${context.cropType}" - Using adaptive analysis`,
        insight: `I'm still learning about ${context.cropType}, but I can provide general agricultural insights based on the weather patterns. The system uses intelligent fallback analysis when encountering new crop types, drawing from agricultural best practices and similar crop families.`,
        recommendation: `For crops I'm still learning about, I recommend following general best practices: monitor soil moisture at 6-12 inch depth, adjust irrigation based on weather patterns and plant appearance, watch for stress symptoms like wilting or leaf curl. Consider providing more details about growth stage and typical growing conditions for better analysis.`,
        confidence: 65,
        severity: 'low',
        category: 'crop_health',
        actionItems: [
          'Monitor soil moisture at appropriate depth for crop type',
          'Watch for visual plant stress indicators',
          'Follow general irrigation timing best practices',
          'Consider crop-specific information sources for optimal management'
        ],
        riskFactors: ['Limited crop-specific knowledge may miss specialized needs', 'Generic recommendations may not optimize for specific variety']
      });
    }

    // Add predictive trend insights
    if (trendAnalysis.temperatureTrend.confidence > 60) {
      const tempDirection = trendAnalysis.temperatureTrend.direction;
      const prediction = trendAnalysis.temperatureTrend.prediction;
      
      if (tempDirection !== 'stable') {
        const trendEmoji = tempDirection === 'rising' ? '📈' : '📉';
        const urgency = Math.abs(prediction - recentData[recentData.length - 1].temperature) > 10 ? 'significant' : 'moderate';
        
        insights.push({
          id: `temp-trend-${Date.now()}`,
          chartType: 'temperature',
          title: `${trendEmoji} Temperature trend forecast - ${tempDirection} pattern detected`,
          insight: `Based on recent data patterns, I'm seeing a ${urgency} ${tempDirection} temperature trend with ${trendAnalysis.temperatureTrend.confidence.toFixed(0)}% confidence. Current forecast suggests temperatures reaching around ${prediction.toFixed(1)}°F in the next 3 days. Your ${context.cropType} at ${context.currentStage} stage needs to be prepared for this change.`,
          recommendation: `Here's the game plan: ${tempDirection === 'rising' ? 'prepare for heat stress management - increase irrigation frequency, consider shade cloth, and monitor plant stress symptoms' : 'get ready for cooler conditions - adjust irrigation timing, watch for frost risk if temperatures drop significantly, and prepare protective measures'}. Planning ahead gives your crops the best chance to adapt!`,
          confidence: this.calculateEnhancedConfidence({ trendAnalysis }, dataQuality, recentData.length),
          severity: urgency === 'significant' ? 'high' : 'medium',
          category: 'weather',
          actionItems: [
            tempDirection === 'rising' ? 'Prepare heat stress management protocols' : 'Prepare cold protection measures',
            'Adjust irrigation schedule based on predicted conditions',
            'Monitor crop stress indicators closely',
            'Consider protective measures if extreme changes predicted'
          ],
          riskFactors: [
            tempDirection === 'rising' ? 'Heat stress potential' : 'Cold stress risk',
            'Rapid adaptation challenges for crops',
            currentStageProfile ? `${currentStageProfile.criticalFactors.join(', ')} concerns during ${context.currentStage}` : 'Growth stage specific vulnerabilities'
          ]
        });
      }
    }

    // Evapotranspiration trend insight
    if (trendAnalysis.evapotranspirationTrend.trend !== 'stable') {
      const etTrend = trendAnalysis.evapotranspirationTrend.trend;
      const waterDemand = trendAnalysis.evapotranspirationTrend.waterDemandForecast;
      const demandLabel = waterDemand === 'critical' ? '[CRITICAL]' : waterDemand === 'high' ? '[HIGH]' : '[MODERATE]';
      
      insights.push({
        id: `et-trend-${Date.now()}`,
        chartType: 'evapotranspiration',
        title: `${demandLabel} Water demand forecast - ${etTrend} ET trend detected`,
        insight: `The data shows an ${etTrend} evapotranspiration pattern, leading to ${waterDemand} water demand forecast. Average ET is currently ${trendAnalysis.evapotranspirationTrend.average.toFixed(2)} inches. This means your ${context.cropType} crops are ${etTrend === 'increasing' ? 'working harder and using more water' : 'reducing their water needs'}.`,
        recommendation: `Water management strategy: ${etTrend === 'increasing' ? 'increase irrigation frequency and duration, monitor soil moisture more closely, and consider early morning watering to maximize efficiency' : 'you can potentially reduce irrigation frequency while maintaining adequate soil moisture'}. ${waterDemand === 'critical' ? 'This is urgent - implement emergency irrigation protocols immediately!' : 'Adjust your irrigation schedule accordingly.'}`,
        confidence: this.calculateEnhancedConfidence({ trendAnalysis }, dataQuality, recentData.length),
        severity: waterDemand === 'critical' ? 'critical' : waterDemand === 'high' ? 'high' : 'medium',
        category: 'watering',
        actionItems: [
          etTrend === 'increasing' ? 'Increase irrigation frequency' : 'Optimize irrigation efficiency',
          'Monitor soil moisture levels more frequently',
          waterDemand === 'critical' ? 'Implement emergency watering protocols' : 'Adjust standard irrigation schedule',
          'Track plant stress indicators daily'
        ],
        riskFactors: [
          etTrend === 'increasing' ? 'Increased water costs' : 'Potential over-watering if not adjusted',
          'Crop stress from inadequate water management',
          currentStageProfile ? `${context.currentStage} stage vulnerability to water stress` : 'Growth stage specific water needs'
        ]
      });
    }

    // Crop-specific stress threshold analysis
    if (currentStageProfile && recentData.length > 0) {
      const avgTemp = recentData.reduce((sum, d) => sum + d.temperature, 0) / recentData.length;
      const maxTemp = Math.max(...recentData.map(d => d.temperature));
      const minTemp = Math.min(...recentData.map(d => d.temperature));
      const avgHumidity = recentData.reduce((sum, d) => sum + d.humidity, 0) / recentData.length;
      
      const stressFactors = [];
      let maxSeverity = 'low';
      
      // Temperature stress analysis
      if (maxTemp > currentStageProfile.stressThresholds.maxTemp) {
        stressFactors.push(`High temperature stress: ${maxTemp.toFixed(1)}°F exceeds ${currentStageProfile.stressThresholds.maxTemp}°F threshold`);
        maxSeverity = 'high';
      }
      if (minTemp < currentStageProfile.stressThresholds.minTemp) {
        stressFactors.push(`Cold stress risk: ${minTemp.toFixed(1)}°F below ${currentStageProfile.stressThresholds.minTemp}°F threshold`);
        maxSeverity = maxSeverity === 'low' ? 'high' : 'critical';
      }
      if (avgTemp < currentStageProfile.tempRange.min || avgTemp > currentStageProfile.tempRange.max) {
        stressFactors.push(`Temperature outside optimal range: ${avgTemp.toFixed(1)}°F (optimal: ${currentStageProfile.tempRange.min}-${currentStageProfile.tempRange.max}°F)`);
        maxSeverity = maxSeverity === 'low' ? 'medium' : maxSeverity;
      }
      
      // Humidity stress analysis
      if (avgHumidity > currentStageProfile.stressThresholds.maxHumidity) {
        stressFactors.push(`Humidity stress: ${avgHumidity.toFixed(1)}% exceeds ${currentStageProfile.stressThresholds.maxHumidity}% threshold`);
        maxSeverity = maxSeverity === 'low' ? 'medium' : maxSeverity;
      }
      
      if (stressFactors.length > 0) {
        insights.push({
          id: `crop-stress-${Date.now()}`,
          chartType: 'combined',
          title: `${context.cropType} stress alert - ${context.currentStage} stage vulnerability detected`,
          insight: `Your ${context.cropType} crops are experiencing stress conditions during the critical ${context.currentStage} stage! Current conditions are challenging for this growth phase. Detected stress factors: ${stressFactors.join('; ')}. This stage typically requires ${currentStageProfile.waterNeed} water needs and has these critical factors: ${currentStageProfile.criticalFactors.join(', ')}.`,
          recommendation: `Immediate crop care strategy: focus on the most critical factors for ${context.currentStage} stage - ${currentStageProfile.criticalFactors.join(', ')}. Optimal temperature range is ${currentStageProfile.tempRange.min}-${currentStageProfile.tempRange.max}°F with ${currentStageProfile.tempRange.optimal}°F being ideal. ${currentStageProfile.waterNeed === 'critical' ? 'Water management is absolutely crucial right now!' : 'Maintain appropriate water levels for this stage.'} Address these stress factors quickly to protect yield potential.`,
          confidence: this.calculateEnhancedConfidence({ stressFactors }, dataQuality, recentData.length),
          severity: maxSeverity as 'low' | 'medium' | 'high' | 'critical',
          category: 'crop_health',
          actionItems: [
            ...currentStageProfile.criticalFactors.map(factor => `Address ${factor} for ${context.currentStage} stage`),
            'Monitor crop stress symptoms hourly if severe',
            'Implement protective measures based on stress type',
            'Adjust management practices for current growth stage'
          ],
          riskFactors: [
            `${context.currentStage} stage vulnerability`,
            'Potential yield reduction from stress',
            'Increased susceptibility to diseases',
            'Long-term crop health impacts'
          ]
        });
      }
    }

    // Generate smart recommendations
    const smartRecommendations = this.generateSmartRecommendations(context, dataQuality, trendAnalysis, currentStageProfile);
    
    // Calculate economic impact for recommendations
    const totalPrecip = recentData.reduce((sum, d) => sum + d.precipitation, 0);
    const avgETForEconomics = recentData.reduce((sum, d) => sum + d.evapotranspiration, 0) / recentData.length;
    const waterDeficit = (avgETForEconomics * recentData.length) - totalPrecip;
    const economicImpact = this.calculateEconomicImpact(smartRecommendations, context, waterDeficit);

    // Add comprehensive management insight with smart recommendations
    if (smartRecommendations.length > 0) {
      const urgentRecs = smartRecommendations.filter(r => r.priority === 'urgent');
      const highPriorityRecs = smartRecommendations.filter(r => r.priority === 'high');
      
      insights.push({
        id: `smart-management-${Date.now()}`,
        chartType: 'combined',
        title: `Smart Management Plan - ${urgentRecs.length + highPriorityRecs.length} priority actions identified`,
        insight: `Based on comprehensive analysis of your ${context.cropType} at ${context.currentStage} stage, I've identified ${smartRecommendations.length} specific management opportunities. ${urgentRecs.length > 0 ? `${urgentRecs.length} urgent actions need immediate attention!` : ''} The analysis shows potential cost savings of $${economicImpact.expectedSavings.toFixed(0)} and yield protection worth $${economicImpact.yieldProtection.toFixed(0)} with an ROI of ${(economicImpact.roi * 100).toFixed(0)}%.`,
        recommendation: `Priority action plan: ${urgentRecs.length > 0 ? `First, handle urgent items: ${urgentRecs.map(r => r.action).join('; ')}.` : ''} ${highPriorityRecs.length > 0 ? `Then focus on high-priority actions: ${highPriorityRecs.map(r => r.action).join('; ')}.` : ''} Implementation cost is estimated at $${economicImpact.implementationCost.toFixed(0)} with payback in ${economicImpact.paybackPeriod} days. This investment protects your crop's yield potential!`,
        confidence: this.calculateEnhancedConfidence({ smartRecommendations, economicImpact }, dataQuality, recentData.length),
        severity: urgentRecs.length > 0 ? 'critical' : highPriorityRecs.length > 0 ? 'high' : 'medium',
        category: 'crop_health',
        actionItems: [
          ...urgentRecs.map(r => `URGENT: ${r.action}`),
          ...highPriorityRecs.map(r => `HIGH: ${r.action}`),
          'Monitor implementation effectiveness',
          'Adjust based on crop response'
        ],
        economicImpact,
        timeline: {
          immediate: urgentRecs.map(r => r.action),
          shortTerm: highPriorityRecs.map(r => r.action),
          longTerm: smartRecommendations.filter(r => r.priority === 'normal').map(r => r.action)
        },
        successMetrics: [
          'Improved crop health indicators',
          'Reduced water stress symptoms', 
          'Maintained optimal growing conditions',
          'Cost savings from efficient management'
        ],
        smartRecommendations,
        riskFactors: [
          'Delayed implementation increases risk',
          'Crop stage timing critical for success',
          'Weather changes may require plan adjustments'
        ]
      } as EnhancedCropInsight);
    }

    // Enhanced contextual analysis functions
    const analyzeTemperatureVolatility = () => {
      if (recentData.length < 2) return null;
      
      const temperatures = recentData.map(d => d.temperature);
      const dailySwings = [];
      
      for (let i = 1; i < temperatures.length; i++) {
        dailySwings.push(Math.abs(temperatures[i] - temperatures[i-1]));
      }
      
      const maxSwing = Math.max(...dailySwings);
      const avgSwing = dailySwings.reduce((sum, swing) => sum + swing, 0) / dailySwings.length;
      
      return { maxSwing, avgSwing, isVolatile: maxSwing > 20 || avgSwing > 15 };
    };

    const analyzeHumidityRisk = () => {
      const avgHumidity = recentData.reduce((sum, d) => sum + d.humidity, 0) / recentData.length;
      const maxHumidity = Math.max(...recentData.map(d => d.humidity));
      const highHumidityDays = recentData.filter(d => d.humidity > 85).length;
      const avgTemp = recentData.reduce((sum, d) => sum + d.temperature, 0) / recentData.length;
      
      // Disease risk increases with high humidity + moderate temperatures
      const riskLevel = (avgHumidity > 80 && avgTemp > 65 && avgTemp < 85) ? 'high' : 
                       (avgHumidity > 70 && highHumidityDays >= 2) ? 'medium' : 'low';
      
      return { avgHumidity, maxHumidity, highHumidityDays, avgTemp, riskLevel };
    };

    const analyzeWindConditions = () => {
      // Assume wind data is available in weatherConditions or we estimate from ET
      const avgET = recentData.reduce((sum, d) => sum + d.evapotranspiration, 0) / recentData.length;
      const maxET = Math.max(...recentData.map(d => d.evapotranspiration));
      
      // High ET often correlates with high wind
      const estimatedWindRisk = maxET > 0.4 ? 'high' : avgET > 0.35 ? 'medium' : 'low';
      const consecutiveHighETDays = recentData.filter(d => d.evapotranspiration > 0.35).length;
      
      return { avgET, maxET, estimatedWindRisk, consecutiveHighETDays };
    };

    const analyzeDroughtConditions = () => {
      const totalRain = recentData.reduce((sum, d) => sum + d.precipitation, 0);
      const dryDays = recentData.filter(d => d.precipitation < 0.1).length;
      const avgET = recentData.reduce((sum, d) => sum + d.evapotranspiration, 0) / recentData.length;
      
      // Water deficit calculation
      const waterDeficit = (avgET * recentData.length) - totalRain;
      const droughtSeverity = dryDays >= 5 && waterDeficit > 1.5 ? 'severe' : 
                             dryDays >= 3 && waterDeficit > 1.0 ? 'moderate' : 'low';
      
      return { totalRain, dryDays, waterDeficit, droughtSeverity };
    };

    const analyzeStormRisk = () => {
      const maxPrecip = Math.max(...recentData.map(d => d.precipitation));
      const avgET = recentData.reduce((sum, d) => sum + d.evapotranspiration, 0) / recentData.length;
      const heavyRainDays = recentData.filter(d => d.precipitation > 1.0).length;
      
      // High precipitation + high ET suggests storm conditions
      const stormRisk = maxPrecip > 2.0 && avgET > 0.3 ? 'high' : 
                       maxPrecip > 1.5 || heavyRainDays > 1 ? 'medium' : 'low';
      
      return { maxPrecip, heavyRainDays, stormRisk };
    };

    // Get crop vulnerability factors based on growth stage
    const getCropVulnerability = (stage: string) => {
      const stageFactors: Record<string, { wind: string; temp: string; moisture: string }> = {
        'seedling': { wind: 'critical', temp: 'critical', moisture: 'critical' },
        'vegetative': { wind: 'medium', temp: 'medium', moisture: 'medium' },
        'flowering': { wind: 'high', temp: 'high', moisture: 'critical' },
        'fruiting': { wind: 'medium', temp: 'medium', moisture: 'high' },
        'maturation': { wind: 'low', temp: 'low', moisture: 'medium' }
      };
      
      return stageFactors[stage.toLowerCase()] || { wind: 'medium', temp: 'medium', moisture: 'medium' };
    };

    // Calculate contextual severity score
    const calculateContextualSeverity = () => {
      let severityScore = 0;
      const factors = [];
      
      // Temperature volatility factor (0-3 points)
      if (tempVolatility && tempVolatility.isVolatile) {
        const tempFactor = tempVolatility.maxSwing > 30 ? 3 : tempVolatility.maxSwing > 20 ? 2 : 1;
        severityScore += tempFactor;
        factors.push(`Temperature swings (${tempFactor} pts)`);
      }
      
      // Humidity disease risk factor (0-3 points)
      if (humidityRisk.riskLevel === 'high') {
        severityScore += 3;
        factors.push('High disease risk (3 pts)');
      } else if (humidityRisk.riskLevel === 'medium') {
        severityScore += 2;
        factors.push('Medium disease risk (2 pts)');
      }
      
      // Wind stress factor (0-2 points)
      if (windConditions.estimatedWindRisk === 'high') {
        severityScore += 2;
        factors.push('High wind stress (2 pts)');
      } else if (windConditions.estimatedWindRisk === 'medium') {
        severityScore += 1;
        factors.push('Medium wind stress (1 pt)');
      }
      
      // Drought stress factor (0-3 points)
      if (droughtConditions.droughtSeverity === 'severe') {
        severityScore += 3;
        factors.push('Severe drought (3 pts)');
      } else if (droughtConditions.droughtSeverity === 'moderate') {
        severityScore += 2;
        factors.push('Moderate drought (2 pts)');
      }
      
      // Storm risk factor (0-2 points)
      if (stormRisk.stormRisk === 'high') {
        severityScore += 2;
        factors.push('High storm risk (2 pts)');
      } else if (stormRisk.stormRisk === 'medium') {
        severityScore += 1;
        factors.push('Medium storm risk (1 pt)');
      }
      
      // Crop vulnerability multiplier (affects final recommendation urgency)
      const vulnerabilityMultiplier = cropVulnerability.temp === 'critical' || 
                                     cropVulnerability.moisture === 'critical' || 
                                     cropVulnerability.wind === 'critical' ? 1.3 : 1.0;
      
      const finalScore = Math.round(severityScore * vulnerabilityMultiplier);
      
      return { 
        score: finalScore, 
        factors, 
        vulnerabilityMultiplier, 
        maxPossible: 13,
        riskLevel: finalScore >= 10 ? 'critical' : finalScore >= 7 ? 'high' : finalScore >= 4 ? 'medium' : 'low'
      };
    };

    // Perform contextual analyses
    const tempVolatility = analyzeTemperatureVolatility();
    const humidityRisk = analyzeHumidityRisk();
    const windConditions = analyzeWindConditions();
    const droughtConditions = analyzeDroughtConditions();
    const stormRisk = analyzeStormRisk();
    const cropVulnerability = getCropVulnerability(context.currentStage);
    const severityAnalysis = calculateContextualSeverity();

    // Generate insights based on contextual analyses
    
    // Temperature volatility insights
    if (tempVolatility && tempVolatility.isVolatile) {
      insights.push({
        id: `temp-volatility-${Date.now()}`,
        chartType: 'temperature',
        title: '🌡️ Temperature rollercoaster detected!',
        insight: `Whoa! The temperature has been swinging like crazy - we're seeing up to ${tempVolatility.maxSwing.toFixed(1)}°F daily swings with an average of ${tempVolatility.avgSwing.toFixed(1)}°F. ${context.cropType} plants are basically getting whiplash trying to adapt to these sudden changes.`,
        recommendation: `Here's the game plan: focus on soil moisture stability since plants use more water when stressed by temperature swings. Consider row covers or mulching to buffer temperature extremes at soil level. It's like giving your plants a cozy blanket during this weather chaos!`,
        confidence: this.calculateEnhancedConfidence({ trendAnalysis }, dataQuality, recentData.length),
        severity: tempVolatility.maxSwing > 25 ? 'high' : 'medium',
        category: 'crop_health',
        actionItems: [
          'Monitor soil moisture more frequently during temperature swings',
          'Consider installing row covers if available',
          'Check plants for stress symptoms (wilting, leaf curl)',
          'Adjust irrigation timing to early morning for temperature stability'
        ],
        riskFactors: ['Increased plant stress', 'Higher water consumption', 'Potential yield reduction']
      });
    }

    // Humidity spike disease risk insights
    if (humidityRisk.riskLevel !== 'low') {
      const diseaseLabel = humidityRisk.riskLevel === 'high' ? '[DISEASE RISK]' : '[WARNING]';
      const urgency = humidityRisk.riskLevel === 'high' ? 'Take action now!' : 'Keep an eye on this.';
      
      insights.push({
        id: `humidity-disease-${Date.now()}`,
        chartType: 'humidity',
        title: `${diseaseLabel} Disease alert - humidity creating perfect storm conditions`,
        insight: `${urgency} We're seeing ${humidityRisk.avgHumidity.toFixed(1)}% average humidity with temperatures around ${humidityRisk.avgTemp.toFixed(1)}°F. This combination is basically a VIP invitation for fungal diseases to set up shop on your ${context.cropType} crops.`,
        recommendation: `Time for defensive action: increase air circulation if possible, avoid overhead watering (especially in evenings), and keep an eye out for early disease symptoms like spots on leaves. Think of it like preventing a party you definitely don't want to host!`,
        confidence: this.calculateEnhancedConfidence({ trendAnalysis }, dataQuality, recentData.length),
        severity: humidityRisk.riskLevel === 'high' ? 'high' : 'medium',
        category: 'crop_health',
        actionItems: [
          'Switch to drip irrigation or ground-level watering',
          'Increase plant spacing for better air circulation',
          'Scout for early disease symptoms (leaf spots, mold)',
          'Avoid watering in evening hours',
          'Consider preventive organic fungicide if available'
        ],
        riskFactors: ['Fungal disease development', 'Leaf spot diseases', 'Root rot potential']
      });
    }

    // Wind condition insights
    if (windConditions.estimatedWindRisk !== 'low') {
      const windEmoji = windConditions.estimatedWindRisk === 'high' ? '💨' : '🍃';
      
      insights.push({
        id: `wind-conditions-${Date.now()}`,
        chartType: 'evapotranspiration',
        title: `${windEmoji} High wind stress detected through ET patterns`,
        insight: `The evapotranspiration data is telling us a story about wind stress - we're seeing ${windConditions.maxET.toFixed(2)} inches ET, which suggests your ${context.cropType} plants are working overtime against windy conditions. ${windConditions.consecutiveHighETDays} consecutive days of this pattern means they're getting tired!`,
        recommendation: `Wind management strategy: check for physical damage like bent stems or torn leaves, ensure adequate water supply since wind accelerates moisture loss, and consider windbreaks if this becomes a pattern. Your plants are basically running a marathon in a headwind right now!`,
        confidence: 75,
        severity: windConditions.estimatedWindRisk === 'high' ? 'high' : 'medium',
        category: 'crop_health',
        actionItems: [
          'Inspect plants for wind damage (bent stems, torn leaves)',
          'Increase irrigation frequency during windy periods',
          'Stake tall or vulnerable plants',
          'Consider temporary windbreaks for young plants'
        ],
        riskFactors: [`${cropVulnerability.wind} vulnerability to wind damage`, 'Accelerated water loss', 'Physical plant damage']
      });
    }

    // Drought condition insights
    if (droughtConditions.droughtSeverity !== 'low') {
      const droughtEmoji = droughtConditions.droughtSeverity === 'severe' ? '🏜️' : '☀️';
      const waterDeficitInches = droughtConditions.waterDeficit.toFixed(1);
      
      insights.push({
        id: `drought-conditions-${Date.now()}`,
        chartType: 'precipitation',
        title: `${droughtEmoji} Water deficit alert - crops running on empty!`,
        insight: `Houston, we have a problem! Your ${context.cropType} crops are facing a ${waterDeficitInches} inch water deficit after ${droughtConditions.dryDays} dry days. That's like asking someone to run a marathon while being dehydrated - not ideal for plant performance!`,
        recommendation: `Emergency irrigation protocol: prioritize deep, thorough watering over frequent shallow watering. Focus on root zones and consider drought-stress mitigation techniques like mulching. This is about plant survival and maintaining yield potential during tough times.`,
        confidence: this.calculateEnhancedConfidence({ trendAnalysis }, dataQuality, recentData.length),
        severity: droughtConditions.droughtSeverity === 'severe' ? 'critical' : 'high',
        category: 'watering',
        actionItems: [
          'Implement emergency irrigation schedule',
          'Apply mulch to reduce soil evaporation',
          'Focus watering on critical growth areas',
          'Monitor plants for drought stress symptoms',
          'Consider drought-tolerant management practices'
        ],
        riskFactors: [`${cropVulnerability.moisture} moisture stress vulnerability`, 'Reduced yield potential', 'Plant mortality risk']
      });
    }

    // Storm risk insights
    if (stormRisk.stormRisk !== 'low') {
      const stormEmoji = stormRisk.stormRisk === 'high' ? '⛈️' : '🌧️';
      
      insights.push({
        id: `storm-risk-${Date.now()}`,
        chartType: 'precipitation',
        title: `${stormEmoji} Severe weather patterns detected - batten down the hatches!`,
        insight: `The weather data is showing storm signatures with ${stormRisk.maxPrecip.toFixed(1)} inches of heavy rain in recent days. When you combine intense precipitation patterns like this, it often means your ${context.cropType} crops could face hail, strong winds, or flooding conditions.`,
        recommendation: `Storm preparation mode: ensure good field drainage, secure any loose equipment or plant supports, and prepare for potential crop damage assessment. After storms pass, scout fields quickly for damage and standing water issues. Think of it as emergency preparedness for your crops!`,
        confidence: 80,
        severity: stormRisk.stormRisk === 'high' ? 'high' : 'medium',
        category: 'weather',
        actionItems: [
          'Check and clear drainage systems',
          'Secure loose plant supports and equipment',
          'Prepare for post-storm damage assessment',
          'Monitor weather forecasts closely',
          'Plan for emergency field access if needed'
        ],
        riskFactors: ['Hail damage potential', 'Flooding risk', 'Physical crop damage', 'Field access issues']
      });
    }

    // Contextual severity assessment insight
    if (severityAnalysis.score >= 6) {
      const severityLabel = severityAnalysis.riskLevel === 'critical' ? '[CRITICAL]' : 
                           severityAnalysis.riskLevel === 'high' ? '[WARNING]' : '[ANALYSIS]';
      
      insights.push({
        id: `contextual-severity-${Date.now()}`,
        chartType: 'combined',
        title: `${severityLabel} Multi-factor weather risk assessment - ${severityAnalysis.riskLevel.toUpperCase()} conditions!`,
        insight: `Here's the big picture analysis: Your ${context.cropType} crops are facing a composite risk score of ${severityAnalysis.score}/${severityAnalysis.maxPossible}. Multiple weather factors are combining to create ${severityAnalysis.riskLevel} stress conditions right now. The contributing factors include: ${severityAnalysis.factors.join(', ')}.`,
        recommendation: `Comprehensive management approach needed: This isn't just one weather challenge - it's multiple stressors hitting at once. Priority should be on ${severityAnalysis.riskLevel === 'critical' ? 'immediate protective measures and emergency protocols' : 'proactive management and increased monitoring'}. Think of this like being the weather quarterback - you need to coordinate multiple plays at the same time!`,
        confidence: 95,
        severity: severityAnalysis.riskLevel === 'critical' ? 'critical' : 'high',
        category: 'crop_health',
        actionItems: [
          'Implement multi-factor crop protection strategy',
          'Increase monitoring frequency for all weather factors',
          'Prepare emergency response protocols if needed',
          `Focus on ${cropVulnerability.temp === 'critical' || cropVulnerability.moisture === 'critical' ? 'critical growth stage protection' : 'comprehensive crop management'}`,
          'Coordinate irrigation, protection, and monitoring efforts'
        ],
        riskFactors: [
          'Multiple simultaneous weather stressors',
          `Current growth stage (${context.currentStage}) vulnerability`,
          'Compound effects of weather factors',
          'Potential yield impact from combined stresses'
        ]
      });
    }

    // Temperature analysis (enhanced)
    const avgTemp = recentData.reduce((sum, d) => sum + d.temperature, 0) / recentData.length;
    const maxTemp = Math.max(...recentData.map(d => d.temperature));
    const minTemp = Math.min(...recentData.map(d => d.temperature));
    
    if (maxTemp > 85) {
      const severity = maxTemp > 95 ? 'critical' : 'high';
      const urgency = maxTemp > 95 ? "This is pretty urgent!" : "Just a heads up!";
      
      insights.push({
        id: `local-temp-${Date.now()}`,
        chartType: 'temperature',
        title: maxTemp > 95 ? '🔥 Whoa! These plants are dealing with serious heat!' : '☀️ Hot weather alert for crop management',
        insight: `Hey there! ${urgency} It hit ${maxTemp}°F today, and ${context.cropType} crops are likely experiencing heat stress right now. When temperatures get this high, plants work overtime just to stay cool and can struggle to take up water efficiently.`,
        recommendation: `Here's what farmers should consider: early morning watering (around 5-7 AM) or evening irrigation (6-8 PM) works best during heat waves. This timing reduces water loss to evaporation and helps plants recover more effectively. Think of it like timing a cold drink perfectly when someone's really thirsty!`,
        confidence: 90,
        severity: severity,
        category: 'crop_health',
        actionItems: [
          'Schedule irrigation for early morning (5-7 AM) when possible',
          'Increase soil moisture monitoring during heat periods', 
          'Consider shade cloth installation if available',
          'Evening watering (6-8 PM) helps plants recover overnight'
        ],
        estimatedSavings: undefined,
        riskFactors: ['Heat stress can reduce crop yields if not managed', 'Increased water demand during peak temperatures', 'Fruit quality may decline without proper heat management']
      });
    }

    // RAPID TEMPERATURE SWINGS ANALYSIS
    if (tempVolatility?.isVolatile) {
      const stressLevel = cropVulnerability.temp === 'critical' ? 'critical' : 
                         cropVulnerability.temp === 'high' ? 'high' : 'medium';
      
      insights.push({
        id: `local-temp-volatility-${Date.now()}`,
        chartType: 'temperature',
        title: '🌡️ Rapid temperature swings detected - thermal shock risk!',
        insight: `Whoa! Temperature has been swinging by up to ${tempVolatility.maxSwing.toFixed(1)}°F between days recently. This kind of volatility can cause thermal shock in ${context.cropType} crops, especially during the ${context.currentStage} stage. Plants struggle to adapt quickly to these dramatic changes, similar to how humans feel stressed by sudden temperature changes.`,
        recommendation: `During temperature volatility, maintain consistent soil moisture to help plants cope with thermal stress. Consider protective measures like row covers during extreme swings, and avoid fertilizing during unstable periods as stressed plants can't process nutrients efficiently. Think of it as providing stability when everything else is chaotic! 🛡️`,
        confidence: 85,
        severity: stressLevel,
        category: 'crop_health',
        actionItems: [
          'Maintain consistent soil moisture to buffer thermal stress',
          'Monitor plants closely for signs of shock (wilting, leaf curl)',
          'Delay fertilization until temperature stabilizes',
          'Consider protective covers if swings exceed 25°F',
          'Increase irrigation frequency with smaller amounts'
        ],
        riskFactors: [
          'Thermal shock can stunt growth and reduce yields',
          `${context.currentStage} stage makes plants particularly vulnerable`,
          'Rapid temperature changes stress root systems'
        ]
      });
    }

    // Precipitation analysis
    const totalRain = recentData.reduce((sum, d) => sum + d.precipitation, 0);
    if (totalRain > 2) {
      const rainAmount = totalRain.toFixed(1);
      
      insights.push({
        id: `local-rain-${Date.now()}`,
        chartType: 'precipitation',
        title: '🌧️ Great news! Natural irrigation just saved the day',
        insight: `Hey, check this out! The field received ${rainAmount} inches of natural precipitation this week - that's Mother Nature doing the heavy lifting! The crops are likely well-hydrated right now and may not need additional irrigation for a few days.`,
        recommendation: `Here's the smart play: farmers should take advantage of this free water by adjusting irrigation schedules. Skipping the next couple of watering sessions makes sense while letting crops enjoy this natural moisture. It's like getting a bonus - might as well use it! Monitoring soil moisture over the next few days helps ensure optimal levels.`,
        confidence: 85,
        severity: 'medium',
        category: 'efficiency',
        actionItems: [
          'Adjust irrigation schedule to skip next watering cycle',
          'Inspect field drainage systems for any standing water',
          'Monitor crops for potential fungal disease development',
          'Check soil moisture levels manually in 2-3 days'
        ],
        estimatedSavings: 'Farmers could save 15-25% on irrigation costs this week',
        riskFactors: ['Root rot risk if field drainage is inadequate', 'Fungal diseases thrive in prolonged wet conditions', 'Heavy rainfall can leach nutrients from soil']
      });
    }

    // ET analysis
    const avgET = recentData.reduce((sum, d) => sum + d.evapotranspiration, 0) / recentData.length;
    if (avgET > 0.3) {
      insights.push({
        id: `local-et-${Date.now()}`,
        chartType: 'evapotranspiration',
        title: '💨 High evapotranspiration detected - crops losing water quickly',
        insight: `Here's what's happening - crops are losing about ${avgET.toFixed(2)} inches of water per day right now, which is quite high! Think of it like plants are working overtime to stay cool because it's hot, windy, or very dry. They're managing heat stress, but that means they need more irrigation than typical conditions.`,
        recommendation: `Farmers should consider increasing irrigation duration by about 25% during these conditions. For example, extending a 20-minute watering cycle to 25 minutes, or adding a supplemental light irrigation session. This helps plants cope with high atmospheric demand - like providing extra hydration during intense physical activity! 😊`,
        confidence: 80,
        severity: 'medium',
        category: 'watering',
        actionItems: [
          'Increase irrigation duration by 25% to match higher water demand',
          'Consider adding light midday irrigation or misting if feasible',
          'Apply mulch to reduce soil water loss and help retain moisture',
          'Increase soil moisture monitoring frequency to twice daily'
        ],
        estimatedSavings: undefined,
        riskFactors: ['Water stress can reduce crop yields during high ET periods', 'Inadequate irrigation may result in smaller fruit development', 'Sustained water stress affects overall crop quality']
      });
    }

    // Crop stage-specific insights
    if (context.currentStage.toLowerCase().includes('flowering')) {
      insights.push({
        id: `local-flowering-${Date.now()}`,
        chartType: 'crop-stage',
        title: '🌸 Critical flowering period - optimal water management essential',
        insight: `Excellent timing observation! ${context.cropType} crops are in the flowering stage right now, which is crucial for fruit development. During flowering, plants are particularly sensitive to water stress and require consistent soil moisture. Water stress during this period can lead to flower drop and reduced fruit set.`,
        recommendation: `Farmers should prioritize maintaining consistent soil moisture during flowering - aim for 60-70% soil moisture content. This stage requires the most careful water management of the entire growing season. Consistent, moderate irrigation is better than infrequent heavy watering. Think of it as providing steady, reliable support during the most critical development phase!`,
        confidence: 95,
        severity: 'high',
        category: 'timing',
        actionItems: [
          'Implement daily soil moisture monitoring during flowering period',
          'Maintain consistent irrigation schedule without gaps',
          'Respond immediately to soil dryness indicators',
          'Set up monitoring reminders to ensure consistent attention'
        ],
        estimatedSavings: undefined,
        riskFactors: ['Flower drop risk increases with water stress', 'Poor fruit set directly impacts harvest yields', 'Flowering stage stress affects seasonal production potential']
      });
    }

    return insights.length > 0 ? insights : [{
      id: `local-default-${Date.now()}`,
      chartType: 'general',
      title: '✨ Conditions look favorable for continued growth',
      insight: `Great news! Weather conditions have been cooperative lately, and crops appear to be performing well. Sometimes stable conditions are exactly what farmers want - it indicates good management practices are working and environmental factors are supporting healthy plant development. 🌿`,
      recommendation: `Farmers should continue current management practices that are proving successful. Maintaining the existing irrigation routine makes sense while staying alert to weather changes that might require adjustments. Consistent monitoring and gradual refinements help optimize crop performance! 👍`,
      confidence: 70,
      severity: 'low',
      category: 'watering',
      actionItems: [
        'Continue successful current management practices',
        'Monitor weather forecasts for potential changes requiring adjustment',
        'Maintain established irrigation schedule that\'s proving effective',
        'Document successful practices for future reference 🎉'
      ]
    }];
  }
}

// Main AI Insights Service
export class AIInsightsService {
  private providers: Map<string, AIProvider> = new Map();
  private currentProvider: string = 'local';

  constructor() {
    // Initialize providers
    this.providers.set('openai', new OpenAIProvider());
    this.providers.set('anthropic', new AnthropicProvider());
    this.providers.set('local', new LocalInsightsProvider());
  }

  getAvailableProviders(): { id: string; name: string; configured: boolean }[] {
    return Array.from(this.providers.entries()).map(([id, provider]) => ({
      id,
      name: provider.getName(),
      configured: provider.isConfigured()
    }));
  }

  setProvider(providerId: string): boolean {
    if (this.providers.has(providerId)) {
      this.currentProvider = providerId;
      return true;
    }
    return false;
  }

  async generateInsights(context: InsightContext): Promise<CropInsight[]> {
    const provider = this.providers.get(this.currentProvider);
    
    if (!provider) {
      throw new Error(`Provider ${this.currentProvider} not found`);
    }

    if (!provider.isConfigured() && this.currentProvider !== 'local') {
      console.warn(`Provider ${this.currentProvider} not configured, falling back to local analysis`);
      const localProvider = this.providers.get('local')!;
      return await localProvider.generateInsights(context);
    }

    return await provider.generateInsights(context);
  }

  getCurrentProvider(): string {
    return this.currentProvider;
  }
}

// Singleton instance
export const aiInsightsService = new AIInsightsService();