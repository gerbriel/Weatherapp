import React, { useState, useEffect } from 'react';
import { MapPin, Thermometer, Droplets, Wind, Sprout, Gauge, Menu, X, TrendingUp, Calculator, Plus, Trash2, Mail, Edit, Star } from 'lucide-react';
import { useTrial } from '../contexts/TrialContext';
import { COMPREHENSIVE_CROP_DATABASE, type AvailableCrop } from '../data/crops';
import { LocationAddModal } from './LocationAddModal';
import { CropManagementModal } from './CropManagementModal';
import { WeatherCharts } from './WeatherCharts';
import { EmailNotifications } from './EmailNotifications';
import { AddCropInstanceModal } from './AddCropInstanceModal';
import { SoilSelectionModal } from './SoilSelectionModal';
import { CalculatorVisualizations } from './CalculatorVisualizations';
import { type SoilType } from '../data/soils';

interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  et0: number;
}

interface CropInstance {
  id: string;
  cropId: string;
  plantingDate: string;
  currentStage: number; // Index of current stage in crop.stages array
  customStageDays?: number; // Override days in current stage
  fieldName?: string;
  notes?: string;
}

interface CropCoefficient {
  crop: string;
  stage: string;
  kc: number;
  daysSinceStage: number;
  etc: number;
  irrigationRecommendation: string;
  category: string;
  plantingDate: string;
}

interface IrrigationSystem {
  id: string;
  name: string;
  efficiency: number;
  description: string;
}

interface CalculatorInputs {
  crop: string;
  kcValue?: number;
  growthStage?: string;
  etSource: 'weather-station' | 'cimis' | 'manual';
  manualET?: number;
  zoneFlowGPM: number;
  area: number;
  areaUnit: 'acres' | 'sqft';
  systemType: string;
}

interface RuntimeResult {
  dailyWaterNeed: number; // gallons per day
  runtimeHours: number;
  runtimeMinutes: number;
  weeklyHours: number;
  efficiency: number;
  formula: string;
  etc: number; // ETc value in mm/day
}

export const TrialDashboard: React.FC = () => {
  const { trialLocations, disableTrialMode, removeLocation } = useTrial();
  const [selectedLocation, setSelectedLocation] = useState(trialLocations[0]);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [cropCoefficients, setCropCoefficients] = useState<CropCoefficient[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'overview' | 'coefficients' | 'calculator' | 'reports' | 'emails'>('overview');
  const [availableCrops, setAvailableCrops] = useState<AvailableCrop[]>([]);
  const [selectedCrops, setSelectedCrops] = useState<string[]>([]);
  const [cropInstances, setCropInstances] = useState<CropInstance[]>([]);
  const [showAddCropInstanceModal, setShowAddCropInstanceModal] = useState(false);
  const [selectedCropForInstance, setSelectedCropForInstance] = useState<AvailableCrop | null>(null);
  const [selectedSoil, setSelectedSoil] = useState<SoilType | null>(null);
  const [showSoilSelector, setShowSoilSelector] = useState(false);
  const [showCropSelector, setShowCropSelector] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [calculatorInputs, setCalculatorInputs] = useState<CalculatorInputs>({
    crop: '',
    etSource: 'weather-station',
    zoneFlowGPM: 0,
    area: 0,
    areaUnit: 'acres',
    systemType: ''
  });
  const [calculatorResult, setCalculatorResult] = useState<RuntimeResult | null>(null);

  // Mock weather data for trial
  useEffect(() => {
    const mockWeatherData: WeatherData = {
      temperature: 22 + Math.random() * 10,
      humidity: 60 + Math.random() * 20,
      windSpeed: 5 + Math.random() * 10,
      precipitation: Math.random() * 2,
      et0: 4 + Math.random() * 3
    };

    const mockCropCoefficients: CropCoefficient[] = [];

    setTimeout(() => {
      setWeatherData(mockWeatherData);
      setAvailableCrops(COMPREHENSIVE_CROP_DATABASE);
      setCropCoefficients(mockCropCoefficients);
      setLoading(false);
    }, 1000);
  }, [selectedLocation]);

  // Generate crop coefficients when selected crops change
  useEffect(() => {
    if (availableCrops.length === 0) return;

    const et0 = weatherData?.et0 || 5; // Default ET0 if not available yet
    
    const mockCropCoefficients: CropCoefficient[] = selectedCrops.map(cropId => {
      const crop = availableCrops.find(c => c.id === cropId);
      if (!crop) return null;
      
      const today = new Date();
      // Dynamic planting offset based on crop category
      const getCropPlantingOffset = (crop: AvailableCrop): number => {
        const categoryOffsets: Record<string, number> = {
          'Tree Nuts': 120,    // 4 months
          'Tree Fruits': 90,   // 3 months
          'Berries': 60,       // 2 months
          'Leafy Greens': 30,  // 1 month
          'Vegetables': 45,    // 1.5 months
          'Field Crops': 75,   // 2.5 months
          'Herbs': 40          // 1.3 months
        };
        return categoryOffsets[crop.category] || 60;
      };
      
      const daysSincePlanting = getCropPlantingOffset(crop);
      
      // Find current stage based on days since planting
      let currentStage = crop.stages[0];
      let daysSinceStageStart = daysSincePlanting;
      let accumulatedDays = 0;
      
      for (const stage of crop.stages) {
        if (daysSincePlanting >= accumulatedDays && daysSincePlanting < accumulatedDays + stage.duration) {
          currentStage = stage;
          daysSinceStageStart = daysSincePlanting - accumulatedDays;
          break;
        }
        accumulatedDays += stage.duration;
      }
      
      // If past all stages, use the last stage
      if (daysSincePlanting >= accumulatedDays) {
        currentStage = crop.stages[crop.stages.length - 1];
        daysSinceStageStart = daysSincePlanting - (accumulatedDays - currentStage.duration);
      }
      
      const plantingDate = new Date(today.getTime() - daysSincePlanting * 24 * 60 * 60 * 1000);
      
      return {
        crop: crop.name,
        stage: currentStage.name,
        kc: currentStage.kc,
        daysSinceStage: Math.max(0, daysSinceStageStart),
        etc: et0 * currentStage.kc,
        irrigationRecommendation: currentStage.description,
        category: crop.category,
        plantingDate: plantingDate.toLocaleDateString()
      };
    }).filter(Boolean) as CropCoefficient[];

    setCropCoefficients(mockCropCoefficients);
  }, [selectedCrops, availableCrops, weatherData]);

  const handleCropToggle = (cropId: string) => {
    setSelectedCrops(prev => {
      if (prev.includes(cropId)) {
        return prev.filter(id => id !== cropId);
      } else {
        return [...prev, cropId];
      }
    });
  };

  const addAllCrops = () => {
    setSelectedCrops(availableCrops.map(crop => crop.id));
  };

  const removeAllCrops = () => {
    setSelectedCrops([]);
  };

  const handleAddCropInstance = (crop: AvailableCrop) => {
    setSelectedCropForInstance(crop);
    setShowAddCropInstanceModal(true);
  };

  const handleAddInstance = (instanceData: Omit<CropInstance, 'id'>) => {
    const newInstance: CropInstance = {
      ...instanceData,
      id: Date.now().toString()
    };
    setCropInstances(prev => [...prev, newInstance]);
    setShowAddCropInstanceModal(false);
    setSelectedCropForInstance(null);
  };

  const generateCropInsight = (crop: AvailableCrop) => {
    // Dynamic planting offset based on crop category
    const getCropPlantingOffset = (crop: AvailableCrop): number => {
      const categoryOffsets: Record<string, number> = {
        'Tree Nuts': 120,    // 4 months
        'Tree Fruits': 90,   // 3 months
        'Berries': 60,       // 2 months
        'Leafy Greens': 30,  // 1 month
        'Vegetables': 45,    // 1.5 months
        'Field Crops': 75,   // 2.5 months
        'Herbs': 40          // 1.3 months
      };
      return categoryOffsets[crop.category] || 60;
    };
    
    const daysSincePlanting = getCropPlantingOffset(crop);
    
    // Find current stage
    let currentStage = crop.stages[0];
    let accumulatedDays = 0;
    
    for (const stage of crop.stages) {
      if (daysSincePlanting >= accumulatedDays && daysSincePlanting < accumulatedDays + stage.duration) {
        currentStage = stage;
        break;
      }
      accumulatedDays += stage.duration;
    }
    
    // Generate insights based on Kc value and stage characteristics
    const getWaterNeedsFromKc = (kc: number): string => {
      if (kc < 0.5) return 'Low';
      if (kc < 0.8) return 'Medium';
      if (kc < 1.1) return 'High';
      return 'Very High';
    };

    const getEfficiencyFromCategory = (category: string): number => {
      const baseEfficiency: Record<string, number> = {
        'Tree Nuts': 88,
        'Tree Fruits': 85,
        'Berries': 82,
        'Leafy Greens': 78,
        'Vegetables': 80,
        'Field Crops': 75,
        'Herbs': 83
      };
      return baseEfficiency[category] || 80;
    };

    const getRecommendationFromStage = (stage: any, category: string): string => {
      const stageRecommendations: Record<string, string> = {
        'Initial': `Early ${category.toLowerCase()} growth - monitor establishment and adjust irrigation frequency`,
        'Development': `Active growth phase - increase irrigation to support ${category.toLowerCase()} development`,
        'Mid-season': `Peak growth period - maintain consistent soil moisture for optimal ${category.toLowerCase()} production`,
        'Late season': `Maturation phase - adjust irrigation for harvest timing and quality`
      };
      return stageRecommendations[stage.name] || stage.description;
    };

    return {
      crop: crop.name,
      currentStage: currentStage.name,
      waterNeeds: getWaterNeedsFromKc(currentStage.kc),
      efficiency: getEfficiencyFromCategory(crop.category),
      recommendation: getRecommendationFromStage(currentStage, crop.category)
    };
  };

  const getStageColor = (stage: string) => {
    switch (stage.toLowerCase()) {
      case 'initial': return 'text-blue-400';
      case 'development': return 'text-yellow-400';
      case 'mid-season': return 'text-green-400';
      case 'late season': return 'text-orange-400';
      default: return 'text-gray-400';
    }
  };

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 90) return 'text-green-400';
    if (efficiency >= 80) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getCurrentKc = (crop: AvailableCrop): number => {
    const plantingOffset = {
      'almonds': 120,
      'grapes': 90,
      'strawberries': 60,
      'lettuce': 30
    };
    
    const daysSincePlanting = plantingOffset[crop.id as keyof typeof plantingOffset] || 60;
    
    let currentStage = crop.stages[0];
    let accumulatedDays = 0;
    
    for (const stage of crop.stages) {
      if (daysSincePlanting >= accumulatedDays && daysSincePlanting < accumulatedDays + stage.duration) {
        currentStage = stage;
        break;
      }
      accumulatedDays += stage.duration;
    }
    
    return currentStage.kc;
  };

  const getWaterNeedsColor = (waterNeeds: string): string => {
    switch (waterNeeds) {
      case 'High': return 'bg-red-900 text-red-300';
      case 'Medium': return 'bg-yellow-900 text-yellow-300';
      case 'Low': return 'bg-green-900 text-green-300';
      default: return 'bg-gray-900 text-gray-300';
    }
  };

  const getStageNumber = (crop: AvailableCrop, stageName: string): number => {
    return crop.stages.findIndex(stage => stage.name === stageName) + 1;
  };

  const getKcRange = (crop: AvailableCrop): string => {
    const kcValues = crop.stages.map(stage => stage.kc);
    const min = Math.min(...kcValues);
    const max = Math.max(...kcValues);
    return `${min.toFixed(2)} - ${max.toFixed(2)}`;
  };

  const irrigationSystems: IrrigationSystem[] = [
    { id: 'drip', name: 'Drip Irrigation', efficiency: 0.90, description: 'High efficiency, precise water application' },
    { id: 'micro', name: 'Micro Sprinklers', efficiency: 0.85, description: 'Medium efficiency, good coverage' },
    { id: 'pivot', name: 'Center Pivot', efficiency: 0.80, description: 'Large area coverage, moderate efficiency' },
    { id: 'sprinkler', name: 'Overhead Sprinklers', efficiency: 0.75, description: 'Traditional system, lower efficiency' },
    { id: 'flood', name: 'Flood/Furrow', efficiency: 0.60, description: 'Low efficiency, simple system' }
  ];

  const calculateRuntime = (inputs: CalculatorInputs): RuntimeResult => {
    // Get ET0 value (convert to mm for internal calculations)
    let et0 = weatherData?.et0 || 5;
    if (inputs.etSource === 'manual' && inputs.manualET) {
      et0 = inputs.manualET / 0.0393701; // Convert inches to mm for calculations
    }

    // Get Kc value
    let kc = 1.0; // default
    if (inputs.kcValue) {
      kc = inputs.kcValue;
    } else if (inputs.growthStage && inputs.crop) {
      const crop = availableCrops.find(c => c.name.toLowerCase() === inputs.crop.toLowerCase());
      if (crop) {
        const stage = crop.stages.find(s => s.name.toLowerCase() === inputs.growthStage?.toLowerCase());
        if (stage) {
          kc = stage.kc;
        }
      }
    }

    // Calculate ETc (crop water requirement in mm/day)
    const etc = et0 * kc;

    // Convert area to square feet
    const areaInSqFt = inputs.areaUnit === 'acres' ? inputs.area * 43560 : inputs.area;

    // Convert ETc from mm/day to inches/day, then to gallons/day
    const etcInches = etc * 0.0393701; // mm to inches
    const dailyWaterNeedGallons = areaInSqFt * etcInches * 0.623; // sq ft * inches * 0.623 = gallons

    // Get system efficiency
    const system = irrigationSystems.find(s => s.id === inputs.systemType);
    const efficiency = system?.efficiency || 0.75;

    // Adjust for system efficiency
    const adjustedWaterNeed = dailyWaterNeedGallons / efficiency;

    // Calculate runtime
    const runtimeHours = adjustedWaterNeed / (inputs.zoneFlowGPM * 60); // GPM * 60 = gallons per hour
    const runtimeMinutes = (runtimeHours % 1) * 60;
    const weeklyHours = runtimeHours * 7;

    const formula = `Runtime = (Area × ETc × 0.623) ÷ (System Efficiency × Flow Rate × 60)
= (${areaInSqFt.toLocaleString()} sq ft × ${etcInches.toFixed(3)} in/day × 0.623) ÷ (${efficiency} × ${inputs.zoneFlowGPM} GPM × 60)
= ${adjustedWaterNeed.toFixed(0)} gallons/day ÷ ${(inputs.zoneFlowGPM * 60).toFixed(0)} gallons/hour
= ${runtimeHours.toFixed(2)} hours/day`;

    return {
      dailyWaterNeed: adjustedWaterNeed,
      runtimeHours: Math.floor(runtimeHours),
      runtimeMinutes: Math.round(runtimeMinutes),
      weeklyHours,
      efficiency: efficiency * 100,
      formula,
      etc
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading trial data for {selectedLocation.name}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="flex h-screen w-full">
        {/* Sidebar */}
        <div className={`
          fixed inset-y-0 left-0 z-50 w-80 bg-gray-800 border-r border-gray-700
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:inset-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-700">
            <div className="flex items-center space-x-2">
              <Gauge className="h-6 w-6 text-blue-400" />
              <h1 className="text-lg font-semibold text-white">
                ET Weather
              </h1>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-300 hover:bg-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="p-6 overflow-y-auto h-full">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Locations</h3>
                <button
                  onClick={() => setShowLocationModal(true)}
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                  title="Add New Location"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {trialLocations.map((location) => (
                <div key={location.id} className="relative group">
                  <button
                    onClick={() => setSelectedLocation(location)}
                    className={`w-full text-left p-4 rounded-lg transition-all border ${
                      selectedLocation.id === location.id
                        ? 'bg-blue-600 text-white border-blue-500'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border-gray-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg ${
                          selectedLocation.id === location.id ? 'bg-blue-700' : 'bg-gray-700'
                        }`}>
                          <MapPin className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{location.name}</div>
                          <div className="text-xs opacity-75 mt-1">{location.region}</div>
                          {/* Coordinates Display */}
                          <div className="text-xs opacity-60 mt-1 font-mono">
                            {location.latitude?.toFixed(4)}°, {location.longitude?.toFixed(4)}°
                          </div>
                          {/* Weather Status */}
                          <div className="flex items-center space-x-2 mt-2">
                            <div className="flex items-center space-x-1">
                              <Thermometer className="h-3 w-3" />
                              <span className="text-xs">{weatherData?.temperature ? ((weatherData.temperature * 9/5 + 32).toFixed(0)) : '--'}°F</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Droplets className="h-3 w-3" />
                              <span className="text-xs">{weatherData?.humidity?.toFixed(0) || '--'}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Toggle favorite status
                          }}
                          className="p-1.5 text-yellow-400 hover:text-yellow-300 rounded-lg hover:bg-gray-600/50 transition-colors"
                          title="Add to Favorites"
                        >
                          <Star className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Edit location
                          }}
                          className="p-1.5 text-blue-400 hover:text-blue-300 rounded-lg hover:bg-gray-600/50 transition-colors"
                          title="Edit Location"
                        >
                          <Edit className="h-3 w-3" />
                        </button>
                        {trialLocations.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (selectedLocation.id === location.id && trialLocations.length > 1) {
                                const newIndex = trialLocations.findIndex(loc => loc.id === location.id);
                                const nextLocation = trialLocations[newIndex === 0 ? 1 : 0];
                                setSelectedLocation(nextLocation);
                              }
                              removeLocation(location.id);
                            }}
                            className="p-1.5 text-red-400 hover:text-red-300 rounded-lg hover:bg-gray-600/50 transition-colors"
                            title="Remove Location"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-300 hover:bg-gray-700"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div>
                  <h2 className="text-xl font-semibold text-white">{selectedLocation.name}</h2>
                  <p className="text-gray-400 text-sm">{selectedLocation.region}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {/* View Toggle */}
                <div className="flex items-center space-x-1 bg-gray-700 rounded-lg p-1">
                  <button
                    onClick={() => setCurrentView('overview')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      currentView === 'overview'
                        ? 'bg-gray-800 text-white shadow-sm'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Sprout className="h-4 w-4 mr-1 inline" />
                    Overview
                  </button>
                  <button
                    onClick={() => setCurrentView('coefficients')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      currentView === 'coefficients'
                        ? 'bg-gray-800 text-white shadow-sm'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Calculator className="h-4 w-4 mr-1 inline" />
                    Coefficients
                  </button>
                  <button
                    onClick={() => setCurrentView('calculator')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      currentView === 'calculator'
                        ? 'bg-gray-800 text-white shadow-sm'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Gauge className="h-4 w-4 mr-1 inline" />
                    Calculator
                  </button>
                  <button
                    onClick={() => setCurrentView('reports')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      currentView === 'reports'
                        ? 'bg-gray-800 text-white shadow-sm'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <TrendingUp className="h-4 w-4 mr-1 inline" />
                    Reports
                  </button>
                  <button
                    onClick={() => setCurrentView('emails')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      currentView === 'emails'
                        ? 'bg-gray-800 text-white shadow-sm'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Mail className="h-4 w-4 mr-1 inline" />
                    Emails
                  </button>
                </div>
                
                <button
                  onClick={disableTrialMode}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Exit Trial
                </button>
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 overflow-y-auto p-6 w-full">
            {currentView === 'overview' ? (
              <>
                {/* Weather Overview */}
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-white mb-4">Current Weather - {selectedLocation.name}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    <div className="bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-700">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-gray-700 rounded-lg text-red-400">
                            <Thermometer className="h-5 w-5" />
                          </div>
                          <h3 className="text-base font-semibold text-white">Temperature</h3>
                        </div>
                        <TrendingUp className="h-4 w-4 text-red-400" />
                      </div>
                      <div className="flex items-baseline space-x-2 mb-2">
                        <span className="text-2xl font-bold text-white">
                          {((weatherData?.temperature || 0) * 9/5 + 32).toFixed(1)}
                        </span>
                        <span className="text-sm text-gray-400 font-mono">°F</span>
                      </div>
                      <p className="text-sm text-gray-400">Above average for this time of year</p>
                    </div>
                    
                    <div className="bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-700">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-gray-700 rounded-lg text-blue-400">
                            <Droplets className="h-5 w-5" />
                          </div>
                          <h3 className="text-base font-semibold text-white">Humidity</h3>
                        </div>
                      </div>
                      <div className="flex items-baseline space-x-2 mb-2">
                        <span className="text-2xl font-bold text-white">
                          {weatherData?.humidity.toFixed(0)}
                        </span>
                        <span className="text-sm text-gray-400 font-mono">%</span>
                      </div>
                      <p className="text-sm text-gray-400">Optimal range for most crops</p>
                    </div>

                    <div className="bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-700">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-gray-700 rounded-lg text-gray-400">
                            <Wind className="h-5 w-5" />
                          </div>
                          <h3 className="text-base font-semibold text-white">Wind Speed</h3>
                        </div>
                      </div>
                      <div className="flex items-baseline space-x-2 mb-2">
                        <span className="text-2xl font-bold text-white">
                          {((weatherData?.windSpeed || 0) * 0.621371).toFixed(1)}
                        </span>
                        <span className="text-sm text-gray-400 font-mono">mph</span>
                      </div>
                      <p className="text-sm text-gray-400">Light breeze conditions</p>
                    </div>

                    <div className="bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-700">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-gray-700 rounded-lg text-indigo-400">
                            <Droplets className="h-5 w-5" />
                          </div>
                          <h3 className="text-base font-semibold text-white">Precipitation</h3>
                        </div>
                      </div>
                      <div className="flex items-baseline space-x-2 mb-2">
                        <span className="text-2xl font-bold text-white">
                          {((weatherData?.precipitation || 0) * 0.0393701).toFixed(2)}
                        </span>
                        <span className="text-sm text-gray-400 font-mono">in</span>
                      </div>
                      <p className="text-sm text-gray-400">Recent rainfall recorded</p>
                    </div>

                    <div className="bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-700">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-gray-700 rounded-lg text-green-400">
                            <Sprout className="h-5 w-5" />
                          </div>
                          <h3 className="text-base font-semibold text-white">Reference ET₀</h3>
                        </div>
                      </div>
                      <div className="flex items-baseline space-x-2 mb-2">
                        <span className="text-2xl font-bold text-white">
                          {((weatherData?.et0 || 0) * 0.0393701).toFixed(2)}
                        </span>
                        <span className="text-sm text-gray-400 font-mono">in/day</span>
                      </div>
                      <p className="text-sm text-gray-400">Base for Kc calculations</p>
                    </div>
                  </div>
                </div>

                {/* Crop Insights */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-semibold text-white">Crop Insights</h2>
                      <p className="text-sm text-gray-400">
                        {selectedCrops.length} of {availableCrops.length} crops selected
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setShowCropSelector(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                      >
                        <Sprout className="h-4 w-4" />
                        <span>Manage Crops</span>
                      </button>
                      {selectedCrops.length > 0 && (
                        <button
                          onClick={removeAllCrops}
                          className="bg-red-600 hover:red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                        >
                          Clear All
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Crop Instances */}
                  {cropInstances.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold text-white mb-4">Your Crop Plantings</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {cropInstances.map((instance) => {
                          const crop = availableCrops.find(c => c.id === instance.cropId);
                          if (!crop) return null;

                          const daysSincePlanting = Math.floor(
                            (new Date().getTime() - new Date(instance.plantingDate).getTime()) / (1000 * 60 * 60 * 24)
                          );

                          // Calculate current stage based on days since planting
                          let cumulativeDays = 0;
                          let currentStageIndex = instance.currentStage;
                          
                          for (let i = 0; i < instance.currentStage; i++) {
                            cumulativeDays += crop.stages[i].duration;
                          }
                          
                          const currentStage = crop.stages[currentStageIndex];
                          const daysIntoStage = daysSincePlanting - cumulativeDays;
                          const stageDuration = instance.customStageDays ?? currentStage.duration;
                          const stageProgress = Math.min(100, (daysIntoStage / stageDuration) * 100);

                          return (
                            <div key={instance.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <h4 className="font-semibold text-white">{crop.name}</h4>
                                  {instance.fieldName && (
                                    <p className="text-sm text-gray-400">{instance.fieldName}</p>
                                  )}
                                  <p className="text-xs text-gray-500 mt-1">
                                    Planted: {new Date(instance.plantingDate).toLocaleDateString()}
                                  </p>
                                </div>
                                <button
                                  onClick={() => {
                                    setCropInstances(prev => prev.filter(ci => ci.id !== instance.id));
                                  }}
                                  className="text-red-400 hover:text-red-300 transition-colors"
                                  title="Remove crop instance"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>

                              {/* Stage Progress */}
                              <div className="mb-3">
                                <div className="flex items-center justify-between text-sm mb-1">
                                  <span className="text-blue-400 font-medium">{currentStage.name}</span>
                                  <span className="text-gray-400">{daysIntoStage}/{stageDuration} days</span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full transition-all ${
                                      stageProgress >= 100 ? 'bg-orange-500' : 'bg-blue-500'
                                    }`}
                                    style={{ width: `${Math.min(100, stageProgress)}%` }}
                                  />
                                </div>
                                {stageProgress >= 100 && (
                                  <p className="text-orange-400 text-xs mt-1">⚠️ Stage complete - consider advancing</p>
                                )}
                              </div>

                              {/* Current Kc and ET */}
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="bg-gray-900 p-2 rounded">
                                  <div className="text-gray-400 text-xs">Kc Value</div>
                                  <div className="text-white font-semibold">{currentStage.kc}</div>
                                </div>
                                <div className="bg-gray-900 p-2 rounded">
                                  <div className="text-gray-400 text-xs">ET (in/day)</div>
                                  <div className="text-white font-semibold">
                                    {(currentStage.kc * (weatherData?.et0 || 5)).toFixed(1)}
                                  </div>
                                </div>
                              </div>

                              {/* Days Since Planting */}
                              <div className="mt-3 text-center">
                                <span className="text-xs bg-gray-700 px-2 py-1 rounded-full text-gray-300">
                                  {daysSincePlanting} days since planting
                                </span>
                              </div>

                              {instance.notes && (
                                <div className="mt-3 p-2 bg-gray-900 rounded border border-gray-600">
                                  <p className="text-xs text-gray-400">{instance.notes}</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Selected Crops Insights */}
                  {selectedCrops.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {selectedCrops.map((cropId) => {
                        const crop = availableCrops.find(c => c.id === cropId);
                        if (!crop) return null;
                        
                        // Generate insights for selected crop
                        const insight = generateCropInsight(crop);
                        
                        return (
                          <div key={cropId} className="bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-700">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h3 className="text-lg font-semibold text-white">{crop.name}</h3>
                                <p className="text-sm text-gray-400">{crop.category}</p>
                              </div>
                              <span className={`text-sm font-medium ${getEfficiencyColor(insight.efficiency)}`}>
                                {insight.efficiency}% efficient
                              </span>
                            </div>
                            
                            {/* Coefficient Information */}
                            <div className="bg-gray-900 rounded-lg p-4 mb-4 border border-gray-600">
                              <h4 className="text-sm font-semibold text-blue-400 mb-3">Crop Coefficient (Kc) Details</h4>
                              <div className="grid grid-cols-2 gap-4 mb-3">
                                <div>
                                  <p className="text-xs text-gray-400">Current Kc Value</p>
                                  <p className="text-lg font-bold text-blue-400">{getCurrentKc(crop).toFixed(2)}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-400">ETc (in/day)</p>
                                  <p className="text-lg font-bold text-green-400">{((getCurrentKc(crop) * (weatherData?.et0 || 5)) * 0.0393701).toFixed(3)}</p>
                                </div>
                              </div>
                              <div className="text-xs text-gray-300">
                                <p><span className="text-gray-400">Formula:</span> ETc = ET₀ × Kc = {((weatherData?.et0 || 5) * 0.0393701).toFixed(3)} × {getCurrentKc(crop).toFixed(2)}</p>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <div>
                                <p className="text-sm text-gray-400">Water Needs</p>
                                <div className="flex items-center space-x-2">
                                  <p className="font-medium text-white">{insight.waterNeeds}</p>
                                  <span className={`text-xs px-2 py-1 rounded ${getWaterNeedsColor(insight.waterNeeds)}`}>
                                    {insight.waterNeeds === 'High' ? '🔴' : insight.waterNeeds === 'Medium' ? '🟡' : '🟢'}
                                  </span>
                                </div>
                              </div>
                              <div>
                                <p className="text-sm text-gray-400">Current Stage</p>
                                <div className="flex items-center space-x-2">
                                  <p className="font-medium text-blue-400">{insight.currentStage}</p>
                                  <span className={`text-xs px-2 py-1 rounded ${getStageColor(insight.currentStage)}`}>
                                    Stage {getStageNumber(crop, insight.currentStage)}/4
                                  </span>
                                </div>
                              </div>
                              <div>
                                <p className="text-sm text-gray-400">Coefficient Range</p>
                                <p className="text-sm text-gray-300">
                                  {getKcRange(crop)} <span className="text-xs text-gray-500">(across all stages)</span>
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-400">Recommendation</p>
                                <p className="text-gray-300">{insight.recommendation}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center">
                      <Sprout className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-white mb-2">No Crops Selected</h3>
                      <p className="text-gray-400 mb-4">
                        Select crops from the "Select Crops" section above to view their specific insights and recommendations.
                      </p>
                      <button
                        onClick={() => setShowCropSelector(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                      >
                        Select Crops
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : currentView === 'coefficients' ? (
              <>
                {/* Crop Management Section */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-white">Crop Management - {selectedLocation.name}</h2>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setShowCropSelector(!showCropSelector)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                      >
                        <Sprout className="h-4 w-4" />
                        <span>Manage Crops</span>
                      </button>
                      {selectedCrops.length > 0 && (
                        <button
                          onClick={removeAllCrops}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                        >
                          Clear All
                        </button>
                      )}
                      <div className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded border border-gray-600">
                        <button 
                          onClick={disableTrialMode}
                          className="hover:text-blue-400 transition-colors"
                        >
                          Create account for custom crops
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Crop Selector */}
                  {showCropSelector && (
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white">Select Crops for this Location</h3>
                        <button
                          onClick={addAllCrops}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          Add All
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {availableCrops.map((crop) => (
                          <div
                            key={crop.id}
                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                              selectedCrops.includes(crop.id)
                                ? 'border-green-500 bg-green-900/20'
                                : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                            }`}
                            onClick={() => handleCropToggle(crop.id)}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-white">{crop.name}</h4>
                              <div className={`w-4 h-4 rounded border-2 ${
                                selectedCrops.includes(crop.id)
                                  ? 'bg-green-500 border-green-500'
                                  : 'border-gray-400'
                              }`}>
                                {selectedCrops.includes(crop.id) && (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <span className="text-white text-xs">✓</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-gray-400 mb-2">{crop.category}</p>
                            <p className="text-xs text-gray-500">{crop.stages.length} growth stages</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Selected Crops Summary */}
                  {selectedCrops.length > 0 && (
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-6">
                      <h3 className="text-white font-medium mb-2">Active Crops at {selectedLocation.name}:</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedCrops.map(cropId => {
                          const crop = availableCrops.find(c => c.id === cropId);
                          return crop ? (
                            <span key={cropId} className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
                              {crop.name}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Crop Coefficients */}
                {cropCoefficients.length > 0 ? (
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold text-white">Crop Coefficients (Kc) - Active Crops</h2>
                      <div className="text-sm text-gray-400">
                        ET₀ × Kc = ETc (Crop Water Requirement)
                      </div>
                    </div>
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-6">
                      <p className="text-gray-300 text-sm">
                        <strong className="text-white">Crop coefficients (Kc)</strong> adjust reference evapotranspiration (ET₀) to calculate actual crop water requirements (ETc). 
                        Values vary by crop growth stage: <span className="text-blue-400">Initial (0.3-0.4)</span>, 
                        <span className="text-yellow-400"> Development (0.4-0.8)</span>, 
                        <span className="text-green-400"> Mid-season (0.8-1.2)</span>, 
                        <span className="text-orange-400"> Late season (0.6-0.8)</span>.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {cropCoefficients.map((coeff, index) => (
                        <div key={index} className="bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-700">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="text-lg font-semibold text-white">{coeff.crop}</h3>
                              <p className="text-sm text-gray-400">{coeff.category}</p>
                            </div>
                            <span className={`text-sm font-medium px-2 py-1 rounded ${getStageColor(coeff.stage)} bg-gray-700`}>
                              {coeff.stage}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-sm text-gray-400">Kc Value</p>
                              <p className="text-xl font-bold text-blue-400">{coeff.kc.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-400">ETc (in/day)</p>
                              <p className="text-xl font-bold text-green-400">{(coeff.etc * 0.0393701).toFixed(3)}</p>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div>
                              <p className="text-sm text-gray-400">Planted</p>
                              <p className="text-white text-sm">{coeff.plantingDate}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-400">Days in Stage</p>
                              <p className="text-white">{coeff.daysSinceStage} days</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-400">Stage Description</p>
                              <p className="text-gray-300 text-sm">{coeff.irrigationRecommendation}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mb-8">
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center">
                      <Sprout className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-white mb-2">No Crops Selected</h3>
                      <p className="text-gray-400 mb-4">
                        Select crops from the "Manage Crops" section above to view their coefficient data and irrigation requirements.
                      </p>
                      <button
                        onClick={() => setShowCropSelector(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                      >
                        Add Crops
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : currentView === 'reports' ? (
              <>
                {/* Weather Reports */}
                <WeatherCharts locationName={selectedLocation.name} />
              </>
            ) : currentView === 'emails' ? (
              <>
                {/* Email Notifications */}
                <EmailNotifications />
              </>
            ) : (
              <>
                {/* Irrigation Runtime Calculator */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-white">Irrigation Runtime Calculator</h2>
                    <div className="flex items-center space-x-3">
                      <p className="text-sm text-gray-400">Calculate exact irrigation runtimes for your specific setup</p>
                      <div className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded border border-gray-600">
                        <button 
                          onClick={disableTrialMode}
                          className="hover:text-blue-400 transition-colors"
                        >
                          Create account for saved calculations
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
                    {/* Input Form */}
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 xl:col-span-2">
                      <h3 className="text-lg font-semibold text-white mb-4">Input Parameters</h3>
                      
                      <div className="space-y-4">
                        {/* Crop Selection */}
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Crop Type</label>
                          <select 
                            value={calculatorInputs.crop}
                            onChange={(e) => setCalculatorInputs({...calculatorInputs, crop: e.target.value})}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select Crop</option>
                            {availableCrops.map(crop => (
                              <option key={crop.id} value={crop.name}>{crop.name}</option>
                            ))}
                          </select>
                        </div>

                        {/* Kc or Growth Stage */}
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Growth Stage or Kc Value</label>
                          <div className="space-y-2">
                            {calculatorInputs.crop && (
                              <select 
                                value={calculatorInputs.growthStage || ''}
                                onChange={(e) => setCalculatorInputs({...calculatorInputs, growthStage: e.target.value, kcValue: undefined})}
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">Select Growth Stage</option>
                                {availableCrops.find(c => c.name === calculatorInputs.crop)?.stages.map(stage => (
                                  <option key={stage.name} value={stage.name}>{stage.name} (Kc: {stage.kc})</option>
                                ))}
                              </select>
                            )}
                            <div className="text-center text-gray-400 text-sm">or</div>
                            <input
                              type="number"
                              step="0.01"
                              placeholder="Enter Kc value manually"
                              value={calculatorInputs.kcValue || ''}
                              onChange={(e) => setCalculatorInputs({...calculatorInputs, kcValue: parseFloat(e.target.value), growthStage: undefined})}
                              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>

                        {/* ET Source */}
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">ET₀ Source</label>
                          <select 
                            value={calculatorInputs.etSource}
                            onChange={(e) => setCalculatorInputs({...calculatorInputs, etSource: e.target.value as 'weather-station' | 'cimis' | 'manual'})}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="weather-station">Current Weather Station ({((weatherData?.et0 || 0) * 0.0393701).toFixed(3)} in/day)</option>
                            <option value="cimis">CIMIS Data</option>
                            <option value="manual">Manual Entry</option>
                          </select>
                          {calculatorInputs.etSource === 'manual' && (
                            <input
                              type="number"
                              step="0.1"
                              placeholder="Enter ET₀ in in/day"
                              value={calculatorInputs.manualET || ''}
                              onChange={(e) => setCalculatorInputs({...calculatorInputs, manualET: parseFloat(e.target.value)})}
                              className="mt-2 w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
                            />
                          )}
                        </div>

                        {/* Zone Flow */}
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Zone Flow Rate (GPM)</label>
                          <input
                            type="number"
                            step="0.1"
                            placeholder="e.g., 15.5"
                            value={calculatorInputs.zoneFlowGPM || ''}
                            onChange={(e) => setCalculatorInputs({...calculatorInputs, zoneFlowGPM: parseFloat(e.target.value)})}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        {/* Area */}
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Area</label>
                          <div className="flex space-x-2">
                            <input
                              type="number"
                              step="0.1"
                              placeholder="e.g., 2.5"
                              value={calculatorInputs.area || ''}
                              onChange={(e) => setCalculatorInputs({...calculatorInputs, area: parseFloat(e.target.value)})}
                              className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
                            />
                            <select 
                              value={calculatorInputs.areaUnit}
                              onChange={(e) => setCalculatorInputs({...calculatorInputs, areaUnit: e.target.value as 'acres' | 'sqft'})}
                              className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="acres">Acres</option>
                              <option value="sqft">Sq Ft</option>
                            </select>
                          </div>
                        </div>

                        {/* System Type */}
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Irrigation System</label>
                          <select 
                            value={calculatorInputs.systemType}
                            onChange={(e) => setCalculatorInputs({...calculatorInputs, systemType: e.target.value})}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select System Type</option>
                            {irrigationSystems.map(system => (
                              <option key={system.id} value={system.id}>
                                {system.name} ({(system.efficiency * 100).toFixed(0)}% efficiency)
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Soil Type */}
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Soil Type</label>
                          <div className="flex space-x-2">
                            <div className="flex-1">
                              {selectedSoil ? (
                                <div className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <div 
                                      className="w-4 h-4 rounded-full border border-gray-500"
                                      style={{ backgroundColor: selectedSoil.color }}
                                    />
                                    <span>{selectedSoil.name}</span>
                                  </div>
                                  <span className="text-xs text-gray-400">
                                    {selectedSoil.characteristics.infiltrationRate} mm/h
                                  </span>
                                </div>
                              ) : (
                                <div className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-400">
                                  No soil type selected
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => setShowSoilSelector(true)}
                              className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
                            >
                              {selectedSoil ? 'Change' : 'Select'} Soil
                            </button>
                          </div>
                          {selectedSoil && (
                            <div className="mt-2 text-xs text-gray-400">
                              {selectedSoil.characteristics.description}
                            </div>
                          )}
                        </div>

                        {/* Calculate Button */}
                        <button
                          onClick={() => {
                            const result = calculateRuntime(calculatorInputs);
                            setCalculatorResult(result);
                          }}
                          disabled={!calculatorInputs.crop || !calculatorInputs.zoneFlowGPM || !calculatorInputs.area || !calculatorInputs.systemType}
                          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                          Calculate Runtime
                        </button>
                      </div>
                    </div>

                    {/* Results */}
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 xl:col-span-3">
                      <h3 className="text-lg font-semibold text-white mb-4">Calculation Results</h3>
                      
                      {calculatorResult ? (
                        <div className="space-y-6">
                          {/* Runtime Results */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-900 rounded-lg p-4">
                              <p className="text-sm text-gray-400">Daily Runtime</p>
                              <p className="text-2xl font-bold text-blue-400">
                                {calculatorResult.runtimeHours}h {calculatorResult.runtimeMinutes}m
                              </p>
                            </div>
                            <div className="bg-gray-900 rounded-lg p-4">
                              <p className="text-sm text-gray-400">Weekly Hours</p>
                              <p className="text-2xl font-bold text-green-400">
                                {calculatorResult.weeklyHours.toFixed(1)}h
                              </p>
                            </div>
                          </div>

                          <div className="bg-gray-900 rounded-lg p-4">
                            <p className="text-sm text-gray-400">Daily Water Need</p>
                            <p className="text-xl font-bold text-white">
                              {calculatorResult.dailyWaterNeed.toLocaleString()} gallons/day
                            </p>
                            <p className="text-sm text-gray-500">
                              At {calculatorResult.efficiency}% system efficiency
                            </p>
                          </div>

                          {/* Formula Breakdown */}
                          <div className="bg-gray-900 rounded-lg p-4">
                            <h4 className="text-sm font-semibold text-gray-300 mb-2">Calculation Formula</h4>
                            <pre className="text-xs text-gray-400 whitespace-pre-wrap font-mono">
                              {calculatorResult.formula}
                            </pre>
                          </div>

                          {/* Template for App */}
                          <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
                            <h4 className="text-sm font-semibold text-blue-400 mb-2">Template for Your App</h4>
                            <p className="text-xs text-gray-300 mb-2">Copy this configuration for your irrigation management system:</p>
                            <pre className="text-xs text-gray-400 bg-gray-900 p-3 rounded whitespace-pre-wrap">
{`{
  "block_id": "block_001",
  "crop": "${calculatorInputs.crop}",
  "area": ${calculatorInputs.area},
  "area_unit": "${calculatorInputs.areaUnit}",
  "system_type": "${calculatorInputs.systemType}",
  "flow_rate_gpm": ${calculatorInputs.zoneFlowGPM},
  "efficiency": ${calculatorResult.efficiency / 100},
  "runtime_formula": "Area × ETc × 0.623 ÷ (Efficiency × Flow × 60)",
  "daily_runtime_hours": ${calculatorResult.runtimeHours + (calculatorResult.runtimeMinutes / 60)},
  "update_frequency": "daily"
}`}
                            </pre>
                          </div>
                          
                          {/* Visual Analytics */}
                          {selectedSoil && (
                            <div className="mt-8">
                              <CalculatorVisualizations
                                soilType={selectedSoil}
                                etcValue={calculatorResult!.etc}
                                irrigationRuntime={calculatorResult!.runtimeHours + (calculatorResult!.runtimeMinutes / 60)}
                                systemEfficiency={calculatorResult!.efficiency}
                                cropName={calculatorInputs.crop}
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Calculator className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                          <p className="text-gray-400">Fill in the parameters and click Calculate to see your runtime results</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </main>
        </div>
      </div>
      
      {/* Location Add Modal */}
      <LocationAddModal 
        isOpen={showLocationModal} 
        onClose={() => setShowLocationModal(false)} 
      />
      
      {/* Crop Management Modal */}
      <CropManagementModal
        isOpen={showCropSelector}
        onClose={() => setShowCropSelector(false)}
        availableCrops={availableCrops}
        selectedCrops={selectedCrops}
        onCropToggle={handleCropToggle}
        onAddCropInstance={handleAddCropInstance}
        onAddAllCrops={addAllCrops}
        onRemoveAllCrops={removeAllCrops}
      />
      
      {selectedCropForInstance && (
        <AddCropInstanceModal
          isOpen={showAddCropInstanceModal}
          onClose={() => {
            setShowAddCropInstanceModal(false);
            setSelectedCropForInstance(null);
          }}
          crop={selectedCropForInstance}
          onAddInstance={handleAddInstance}
        />
      )}
      
      {/* Soil Selection Modal */}
      <SoilSelectionModal
        isOpen={showSoilSelector}
        onClose={() => setShowSoilSelector(false)}
        onSoilSelect={(soil: SoilType) => {
          setSelectedSoil(soil);
          setShowSoilSelector(false);
        }}
        selectedSoilId={selectedSoil?.id}
      />
    </div>
  );
};