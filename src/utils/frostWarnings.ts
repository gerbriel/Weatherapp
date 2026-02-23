// Frost Warning Utility Functions
// Add to src/utils/frostWarnings.ts
import React from 'react';

export interface FrostWarning {
  id: string;
  locationId: string;
  locationName: string;
  severity: 'frost-watch' | 'frost-advisory' | 'frost-warning' | 'hard-freeze';
  temperature: number; // Predicted low temperature
  probability: number; // 0-100%
  timeframe: string; // e.g., "Tonight", "Tomorrow night"
  cropRisk: 'low' | 'moderate' | 'high' | 'critical';
  recommendations: string[];
  isActive: boolean;
  createdAt: Date;
  expiresAt: Date;
}

export interface CropFrostSensitivity {
  cropId: string;
  cropName: string;
  criticalTemp: number; // Temperature at which damage occurs (°F)
  damageTemp: number; // Temperature at which severe damage occurs (°F)
  protectionMethods: string[];
  vulnerabilityByStage: {
    [stage: string]: {
      criticalTemp: number;
      riskLevel: 'low' | 'moderate' | 'high' | 'critical';
    };
  };
}

// Crop frost sensitivity database
export const CROP_FROST_SENSITIVITY: CropFrostSensitivity[] = [
  {
    cropId: 'tomatoes',
    cropName: 'Tomatoes',
    criticalTemp: 32, // Light frost damage
    damageTemp: 28, // Severe damage
    protectionMethods: ['Row covers', 'Water irrigation', 'Greenhouses'],
    vulnerabilityByStage: {
      'seedling': { criticalTemp: 35, riskLevel: 'critical' },
      'flowering': { criticalTemp: 32, riskLevel: 'high' },
      'fruiting': { criticalTemp: 30, riskLevel: 'moderate' },
      'mature': { criticalTemp: 28, riskLevel: 'low' }
    }
  },
  {
    cropId: 'lettuce',
    cropName: 'Lettuce',
    criticalTemp: 28,
    damageTemp: 25,
    protectionMethods: ['Row covers', 'Mulching'],
    vulnerabilityByStage: {
      'seedling': { criticalTemp: 30, riskLevel: 'high' },
      'growing': { criticalTemp: 28, riskLevel: 'moderate' },
      'mature': { criticalTemp: 25, riskLevel: 'low' }
    }
  },
  {
    cropId: 'citrus',
    cropName: 'Citrus',
    criticalTemp: 28,
    damageTemp: 22,
    protectionMethods: ['Heaters', 'Wind machines', 'Irrigation'],
    vulnerabilityByStage: {
      'young_tree': { criticalTemp: 32, riskLevel: 'critical' },
      'flowering': { criticalTemp: 28, riskLevel: 'high' },
      'fruiting': { criticalTemp: 26, riskLevel: 'moderate' },
      'dormant': { criticalTemp: 20, riskLevel: 'low' }
    }
  }
];

// Frost warning severity levels
export const FROST_THRESHOLDS = {
  'frost-watch': { minTemp: 36, maxTemp: 33, color: '#3B82F6', icon: '❄️' },
  'frost-advisory': { minTemp: 32, maxTemp: 28, color: '#F59E0B', icon: '🧊' },
  'frost-warning': { minTemp: 28, maxTemp: 25, color: '#EF4444', icon: '⚠️' },
  'hard-freeze': { minTemp: 25, maxTemp: -Infinity, color: '#7C2D12', icon: '🥶' }
};

// Generate frost warnings for locations
export const generateFrostWarnings = (
  locations: any[], 
  cropInstances: any[]
): FrostWarning[] => {
  const warnings: FrostWarning[] = [];

  locations.forEach(location => {
    if (!location.weatherData?.daily) return;

    const dailyData = location.weatherData.daily;
    const temperatures = dailyData.temperature_2m_min || [];
    const dates = dailyData.time || [];

    // Check next 3 days for frost conditions
    for (let i = 0; i < Math.min(3, temperatures.length); i++) {
      const lowTemp = temperatures[i];
      const date = dates[i];

      if (lowTemp <= 36) { // Frost watch threshold
        const severity = getFrostSeverity(lowTemp);
        const cropRisk = assessCropRisk(location.id, cropInstances, lowTemp);
        
        warnings.push({
          id: `frost-${location.id}-${date}`,
          locationId: location.id,
          locationName: location.name,
          severity,
          temperature: lowTemp,
          probability: calculateFrostProbability(lowTemp),
          timeframe: getTimeframeLabel(i),
          cropRisk,
          recommendations: generateRecommendations(severity, cropRisk, lowTemp),
          isActive: true,
          createdAt: new Date(),
          expiresAt: new Date(new Date().getTime() + 24 * 60 * 60 * 1000) // 24 hours
        });
      }
    }
  });

  return warnings.sort((a, b) => {
    // Sort by severity, then by temperature
    const severityOrder = ['hard-freeze', 'frost-warning', 'frost-advisory', 'frost-watch'];
    const aSeverityIndex = severityOrder.indexOf(a.severity);
    const bSeverityIndex = severityOrder.indexOf(b.severity);
    
    if (aSeverityIndex !== bSeverityIndex) {
      return aSeverityIndex - bSeverityIndex;
    }
    
    return a.temperature - b.temperature; // Lower temps first
  });
};

// Helper functions
const getFrostSeverity = (temperature: number): FrostWarning['severity'] => {
  if (temperature <= 25) return 'hard-freeze';
  if (temperature <= 28) return 'frost-warning';
  if (temperature <= 32) return 'frost-advisory';
  return 'frost-watch';
};

const calculateFrostProbability = (temperature: number): number => {
  // Simple probability calculation based on temperature
  if (temperature <= 25) return 95;
  if (temperature <= 28) return 85;
  if (temperature <= 30) return 70;
  if (temperature <= 32) return 50;
  if (temperature <= 35) return 25;
  return 10;
};

const getTimeframeLabel = (dayIndex: number): string => {
  const labels = ['Tonight', 'Tomorrow night', 'Day after tomorrow'];
  return labels[dayIndex] || `In ${dayIndex + 1} days`;
};

const assessCropRisk = (
  locationId: string, 
  cropInstances: any[], 
  temperature: number
): FrostWarning['cropRisk'] => {
  const locationCrops = cropInstances.filter(crop => crop.locationId === locationId);
  
  if (locationCrops.length === 0) return 'low';
  
  let highestRisk: FrostWarning['cropRisk'] = 'low';
  
  locationCrops.forEach(cropInstance => {
    const sensitivity = CROP_FROST_SENSITIVITY.find(s => s.cropId === cropInstance.cropId);
    if (!sensitivity) return;
    
    if (temperature <= sensitivity.damageTemp) {
      highestRisk = 'critical';
    } else if (temperature <= sensitivity.criticalTemp && highestRisk !== 'critical') {
      highestRisk = 'high';
    } else if (temperature <= sensitivity.criticalTemp + 4 && ['low', 'moderate'].includes(highestRisk)) {
      highestRisk = 'moderate';
    }
  });
  
  return highestRisk;
};

const generateRecommendations = (
  severity: FrostWarning['severity'],
  cropRisk: FrostWarning['cropRisk'],
  temperature: number
): string[] => {
  const recommendations = [];
  
  // Base recommendations by severity
  switch (severity) {
    case 'frost-watch':
      recommendations.push('Monitor weather conditions closely');
      recommendations.push('Prepare frost protection equipment');
      break;
    case 'frost-advisory':
      recommendations.push('Cover sensitive plants before sunset');
      recommendations.push('Move potted plants indoors');
      break;
    case 'frost-warning':
      recommendations.push('Activate irrigation systems if available');
      recommendations.push('Use row covers or blankets on crops');
      recommendations.push('Consider running heaters or wind machines');
      break;
    case 'hard-freeze':
      recommendations.push('Take immediate action - all protection methods');
      recommendations.push('Harvest any remaining sensitive crops');
      recommendations.push('Protect irrigation systems from freezing');
      break;
  }
  
  // Additional recommendations based on crop risk
  if (cropRisk === 'critical' || cropRisk === 'high') {
    recommendations.push('Focus protection on most valuable crops first');
    if (temperature <= 28) {
      recommendations.push('Consider emergency harvesting if economically viable');
    }
  }
  
  return recommendations;
};

// Export frost warning hook for components
export const useFrostWarnings = (locations: any[], cropInstances: any[]) => {
  const [frostWarnings, setFrostWarnings] = React.useState<FrostWarning[]>([]);
  
  React.useEffect(() => {
    const warnings = generateFrostWarnings(locations, cropInstances);
    setFrostWarnings(warnings);
  }, [locations, cropInstances]);
  
  return {
    frostWarnings,
    activeFrostWarnings: frostWarnings.filter(w => w.isActive),
    criticalFrostWarnings: frostWarnings.filter(w => 
      w.isActive && ['frost-warning', 'hard-freeze'].includes(w.severity)
    )
  };
};