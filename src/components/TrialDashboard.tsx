import React, { useState, useEffect } from 'react';
import { MapPin, Thermometer, Droplets, Wind, Sprout, Gauge, Menu, X, TrendingUp, Calculator, Plus, Trash2, Mail, Edit, Star, LogOut } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { useTrial } from '../contexts/TrialContext';
import { useAuth } from '../contexts/AuthContext';
import { useLocations } from '../contexts/LocationsContext';
import { weatherService } from '../services/weatherService';
import { COMPREHENSIVE_CROP_DATABASE, type AvailableCrop } from '../data/crops';
import { LocationAddModal } from './LocationAddModal';
import { CropManagementModal } from './CropManagementModal';
import { EmailNotifications } from './EmailNotifications';
import { useFrostWarnings, FROST_THRESHOLDS } from '../utils/frostWarnings';

import { OrganizationSwitcher } from './OrganizationSwitcher';
import { FieldBlocksManager } from './FieldBlocksManager';
import type { FieldBlock } from './FieldBlocksManager';
import { OrganizationalDashboard } from './OrganizationalDashboard';
import { ReportView } from './ReportView';
import FrostWarningDashboard from './FrostWarningDashboard';
import FrostAlertSubscription from './FrostAlertSubscription';
import { FrostEmailService } from '../services/frostEmailService';
import { EnhancedLocationsList } from './EnhancedLocationsList';

interface WeatherData {
  temperature: number;
  temperatureMax: number;
  temperatureMin: number;
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
  currentWateringCycle?: number; // Index of current watering cycle for perennials
  customStageDays?: number; // Override days in current stage
  fieldName?: string;
  notes?: string;
  locationId?: string; // Location where this crop instance is planted
  customKcValues?: {[key: number]: number}; // Custom Kc values by month (1-12)
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
  selectedMonth?: number; // 1-12 for January-December
  etSource: 'weather-station' | 'cimis' | 'manual';
  manualET?: number;
  zoneFlowGPM: number;
  area: number;
  areaUnit: 'acres' | 'sqft';
  systemType: string;
}

interface CropProfile {
  id: string;
  name: string;
  cropId: string;
  cropName: string;
  soilType: string;
  irrigationMethod: 'drip' | 'sprinkler' | 'flood' | 'micro-spray' | 'surface';
  systemEfficiency: number;
  zoneFlowGPM: number;
  areaSize: number;
  areaUnit: 'acres' | 'sqft';
  emitterSpacing?: number; // for drip systems
  precipitationRate?: number; // for sprinkler systems
  notes?: string;
  isFavorite: boolean;
  createdAt: string;
  lastUsed: string;
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
  const { 
    user, 
    signOut, 
    organization,
    locations: authLocations, 
    deleteLocation: authDeleteLocation
  } = useAuth();
  const { disableTrialMode } = useTrial();
  const { 
    locations: locationsContextLocations, 
    removeLocation: removeUserLocation
  } = useLocations();
  
  // Use same location source as EnhancedLocationsList for consistency
  const rawAvailableLocations = user ? authLocations : locationsContextLocations;
  
  // Deduplicate locations by ID (safeguard against any duplication issues)
  const availableLocations = React.useMemo(() => {
    const seen = new Set<string>();
    return rawAvailableLocations.filter(loc => {
      if (seen.has(loc.id)) {
        return false;
      }
      seen.add(loc.id);
      return true;
    });
  }, [rawAvailableLocations]);
  
  const removeLocation = user ? authDeleteLocation : removeUserLocation;

  
  // State for enhanced trial locations with weather data - only for display enhancement
  const [trialLocationsWithWeather, setTrialLocationsWithWeather] = useState<any[]>([]);
  
  const [selectedLocation, setSelectedLocation] = useState(availableLocations[0] || null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'overview' | 'calculator' | 'reports' | 'notifications' | 'org-dashboard' | 'field-blocks'>('overview');
  const [availableCrops, setAvailableCrops] = useState<AvailableCrop[]>([]);
  const [selectedCrops, setSelectedCrops] = useState<string[]>([]);
  const [cropInstances, setCropInstances] = useState<CropInstance[]>([]);
  const [showCropSelector, setShowCropSelector] = useState(false);
  const [showEditCropModal, setShowEditCropModal] = useState(false);
  const [editingCropInstance, setEditingCropInstance] = useState<CropInstance | null>(null);
  const [editingKcValues, setEditingKcValues] = useState<{[key: number]: number}>({});

  const [showLocationModal, setShowLocationModal] = useState(false);
  const [cropProfiles, setCropProfiles] = useState<CropProfile[]>([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState<CropProfile | null>(null);
  const [calculatorInputs, setCalculatorInputs] = useState<CalculatorInputs>({
    crop: '',
    etSource: 'weather-station',
    zoneFlowGPM: 0,
    area: 0,
    areaUnit: 'acres',
    systemType: ''
  });
  const [calculatorResult, setCalculatorResult] = useState<RuntimeResult | null>(null);

  const [displayedLocations, setDisplayedLocations] = useState<any[]>(availableLocations);

  // Reports view persistent state
  const [reportSelectedLocationIds, setReportSelectedLocationIds] = useState<Set<string>>(new Set());
  const [reportInsights, setReportInsights] = useState<Map<string, { 
    precipitationChart: string;
    temperatureChart: string; 
    cropCoefficientsChart: string;
    etcEtoComparisonChart: string;
    dataTable: string;
    general: string;
  }>>(new Map());

  // Visual feedback states for crop application
  const [appliedLocations, setAppliedLocations] = useState<Set<string>>(new Set());
  const [isApplyingToAll, setIsApplyingToAll] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Frost warnings hook
  const { activeFrostWarnings, criticalFrostWarnings } = useFrostWarnings(
    availableLocations, 
    cropInstances
  );

  // Track if weather has been fetched to prevent duplicate API calls
  const [weatherFetched, setWeatherFetched] = useState(false);

  // Fetch real weather data for trial locations (for enhanced display only)
  useEffect(() => {
    if (!user && locationsContextLocations.length > 0 && !weatherFetched) {
      const fetchWeatherForTrialLocations = async () => {
        setWeatherFetched(true); // Set immediately to prevent duplicate calls
        
        const locationsWithWeather = await Promise.all(
          locationsContextLocations.map(async (location: any) => {
            try {
              const weatherData = await weatherService.getWeatherData({
                id: location.id,
                name: location.name,
                latitude: location.latitude,
                longitude: location.longitude,
                isFavorite: false
              });
              
              return {
                ...location,
                weatherData,
                loading: false,
                error: undefined
              };
            } catch (error) {
              console.error(`❌ Failed to fetch weather for ${location.name}:`, error);
              return {
                ...location,
                loading: false,
                error: error instanceof Error ? error.message : 'Failed to fetch weather data'
              };
            }
          })
        );
        
        setTrialLocationsWithWeather(locationsWithWeather);
      };
      
      fetchWeatherForTrialLocations();
    }
  }, [user, locationsContextLocations, weatherFetched]);

  // Mock weather data for trial overview card
  useEffect(() => {
    const mockWeatherData: WeatherData = {
      temperature: 22 + Math.random() * 10,
      temperatureMax: 28 + Math.random() * 8, // Daily high
      temperatureMin: 12 + Math.random() * 8, // Daily low  
      humidity: 60 + Math.random() * 20,
      windSpeed: 5 + Math.random() * 10,
      precipitation: Math.random() * 2,
      et0: 4 + Math.random() * 3
    };

    setTimeout(() => {
      setWeatherData(mockWeatherData);
      
      // Always show the full comprehensive crop database for crop selection
      setAvailableCrops(COMPREHENSIVE_CROP_DATABASE);
      
      // Don't auto-select any crops - let users choose manually
      setSelectedCrops(prev => {
        // Keep existing selections but ensure they're valid crops
        return prev.filter(cropId => COMPREHENSIVE_CROP_DATABASE.some(crop => crop.id === cropId));
      });
      
      setLoading(false);
    }, 1000);
  }, [selectedLocation, organization]);

  // Reset calculator when location changes to avoid showing crops from other locations
  useEffect(() => {
    setCalculatorInputs({
      crop: '',
      kcValue: undefined,
      selectedMonth: undefined,
      etSource: 'weather-station',
      manualET: undefined,
      zoneFlowGPM: 0,
      area: 0,
      areaUnit: 'acres',
      systemType: ''
    });
    setCalculatorResult(null);
  }, [selectedLocation]);



  const handleCropToggle = (cropId: string, isManualToggle: boolean = true) => {
    setSelectedCrops(prev => {
      if (prev.includes(cropId)) {
        // Remove crop from selection and remove its instances (only if manually toggled)
        if (isManualToggle) {
          const instancesToRemove = cropInstances.filter(instance => 
            instance.cropId === cropId && instance.locationId === selectedLocation?.id
          );
          
          if (instancesToRemove.length > 0) {
            setCropInstances(prevInstances => 
              prevInstances.filter(instance => 
                !(instance.cropId === cropId && instance.locationId === selectedLocation?.id)
              )
            );
          }
        }
        
        return prev.filter(id => id !== cropId);
      } else {
        // Add crop to selection and create a quick crop instance (only if manually toggled and none exists)
        if (isManualToggle && selectedLocation) {
          const existingInstance = cropInstances.find(instance => 
            instance.cropId === cropId && instance.locationId === selectedLocation.id
          );
          
          if (!existingInstance) {
            const crop = availableCrops.find(c => c.id === cropId);
            if (crop) {
              const newInstance: CropInstance = {
                id: `quick-${Date.now()}`,
                cropId: crop.id,
                plantingDate: new Date().toISOString().split('T')[0], // Today's date
                currentStage: 0, // Start at first stage
                currentWateringCycle: 0, // Start at first watering cycle for perennials
                locationId: selectedLocation.id,
                notes: 'Quick added crop - edit for more details'
              };
              
              setCropInstances(prev => [...prev, newInstance]);
            }
          }
        }
        
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

  const handleApplyToLocation = (locationId: string, cropIds: string[]) => {
    // Apply selected crops to a specific location by creating crop instances
    const location = availableLocations.find(loc => loc.id === locationId);
    if (!location || cropIds.length === 0) {
      return;
    }

    // Batch create new instances
    const newInstances: CropInstance[] = [];
    let appliedCount = 0;

    cropIds.forEach(cropId => {
      const crop = availableCrops.find(c => c.id === cropId);
      if (!crop) {
        return;
      }

      // Check if this crop instance already exists for this location
      const existingInstance = cropInstances.find(instance => 
        instance.cropId === cropId && instance.locationId === locationId
      );

      if (!existingInstance) {
        // Generate unique ID with more entropy to avoid duplicates
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substr(2, 9);
        const uniqueId = `instance-${timestamp}-${randomSuffix}-${cropId.substr(0, 4)}-${locationId.substr(0, 8)}`;
        
        const newInstance = {
          id: uniqueId,
          cropId: cropId,
          plantingDate: new Date().toISOString().split('T')[0],
          currentStage: 0,
          locationId: locationId,
          notes: `Applied to ${location.name} - edit for more details`
        };
        
        newInstances.push(newInstance);
        appliedCount++;
      }
    });

    // Batch update crop instances
    if (newInstances.length > 0) {
      setCropInstances(prev => [...prev, ...newInstances]);
    }

    // Also add to selected crops if not already there
    setSelectedCrops(prev => {
      const newCrops = cropIds.filter(cropId => !prev.includes(cropId));
      if (newCrops.length > 0) {
        return [...prev, ...newCrops];
      }
      return prev;
    });

    // Visual feedback - mark this location as applied
    if (appliedCount > 0) {
      setAppliedLocations(prev => new Set([...prev, locationId]));
      setSuccessMessage(`✅ Applied ${appliedCount} crop${appliedCount > 1 ? 's' : ''} to ${location.name}!`);
      
      // Remove the feedback after 3 seconds
      setTimeout(() => {
        setAppliedLocations(prev => {
          const newSet = new Set(prev);
          newSet.delete(locationId);
          return newSet;
        });
      }, 3000);

      // Clear success message after 4 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 4000);
    }
  };

  const handleApplyToAllLocations = (cropIds: string[]) => {
    if (cropIds.length === 0 || availableLocations.length === 0) return;
    
    // Show loading state
    setIsApplyingToAll(true);
    
    // Apply selected crops to all available locations with a small delay for UX
    setTimeout(() => {
      let totalApplied = 0;
      
      availableLocations.forEach((location, index) => {
        // Stagger the applications slightly for better visual feedback
        setTimeout(() => {
          const beforeCount = cropInstances.length;
          handleApplyToLocation(location.id, cropIds);
          // This is approximate since handleApplyToLocation is async
        }, index * 150);
      });
      
      // Hide loading state after all applications
      setTimeout(() => {
        setIsApplyingToAll(false);
        setSuccessMessage(`🎉 Applied crops to all ${availableLocations.length} locations!`);
        
        // Clear bulk success message after 5 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 5000);
      }, availableLocations.length * 150 + 500);
    }, 300);
  };

  // Load crop profiles from localStorage
  useEffect(() => {
    const savedProfiles = localStorage.getItem('cropProfiles');
    if (savedProfiles) {
      try {
        setCropProfiles(JSON.parse(savedProfiles));
      } catch (error) {
        console.error('Error loading crop profiles:', error);
      }
    }
  }, []);

  // Save crop profiles to localStorage
  const saveProfilesToStorage = (profiles: CropProfile[]) => {
    localStorage.setItem('cropProfiles', JSON.stringify(profiles));
  };

  // Create a new crop profile
  const saveCropProfile = (profileData: Omit<CropProfile, 'id' | 'createdAt' | 'lastUsed'>) => {
    const newProfile: CropProfile = {
      ...profileData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString()
    };
    
    const updatedProfiles = [...cropProfiles, newProfile];
    setCropProfiles(updatedProfiles);
    saveProfilesToStorage(updatedProfiles);
    return newProfile;
  };

  // Update existing crop profile
  const updateCropProfile = (profileId: string, updates: Partial<CropProfile>) => {
    const updatedProfiles = cropProfiles.map(profile => 
      profile.id === profileId 
        ? { ...profile, ...updates, lastUsed: new Date().toISOString() }
        : profile
    );
    setCropProfiles(updatedProfiles);
    saveProfilesToStorage(updatedProfiles);
  };

  // Delete a crop profile
  const deleteCropProfile = (profileId: string) => {
    const updatedProfiles = cropProfiles.filter(profile => profile.id !== profileId);
    setCropProfiles(updatedProfiles);
    saveProfilesToStorage(updatedProfiles);
  };

  // Load profile into calculator
  const loadProfileToCalculator = (profile: CropProfile) => {
    setCalculatorInputs({
      crop: profile.cropName,
      etSource: 'weather-station',
      zoneFlowGPM: profile.zoneFlowGPM,
      area: profile.areaSize,
      areaUnit: profile.areaUnit,
      systemType: profile.irrigationMethod
    });
    
    // Update last used timestamp
    updateCropProfile(profile.id, { lastUsed: new Date().toISOString() });
    
    // Switch to calculator view
    setCurrentView('calculator');
  };

  // Save current calculator settings as profile
  const saveCurrentAsProfile = (profileName: string, notes?: string) => {
    if (!calculatorInputs.crop) return null;
    
    const cropId = availableCrops.find(c => c.name === calculatorInputs.crop)?.id;
    if (!cropId) return null;

    return saveCropProfile({
      name: profileName,
      cropId,
      cropName: calculatorInputs.crop,
      soilType: 'Loam', // Default soil type
      irrigationMethod: (calculatorInputs.systemType as any) || 'drip',
      systemEfficiency: 85, // Default efficiency
      zoneFlowGPM: calculatorInputs.zoneFlowGPM,
      areaSize: calculatorInputs.area,
      areaUnit: calculatorInputs.areaUnit,
      notes: notes,
      isFavorite: false
    });
  };





  // Sync field block updates back to crop instances and calculator
  const handleFieldBlockUpdate = (updatedBlock: FieldBlock) => {
    // Update related crop instances based on field block changes
    setCropInstances(prev => prev.map(instance => {
      if (instance.fieldName === updatedBlock.name || 
          (instance.locationId === selectedLocation?.id && 
           instance.cropId === updatedBlock.crop_id)) {
        const crop = availableCrops.find(c => c.id === updatedBlock.crop_id);
        const stageIndex = crop?.stages.findIndex(stage => stage.name === updatedBlock.growth_stage) || 0;
        
        return {
          ...instance,
          fieldName: updatedBlock.name,
          plantingDate: updatedBlock.date_planted,
          currentStage: Math.max(0, stageIndex),
          notes: updatedBlock.notes || instance.notes
        };
      }
      return instance;
    }));

    // If calculator is using this crop, update it too
    if (calculatorInputs.crop) {
      const isCalculatorCropMatch = availableCrops.find(c => 
        c.name === calculatorInputs.crop && c.id === updatedBlock.crop_id
      );
      
      if (isCalculatorCropMatch) {
        const crop = availableCrops.find(c => c.id === updatedBlock.crop_id);
        const stage = crop?.stages.find(s => s.name === updatedBlock.growth_stage);
        
        // Get the primary irrigation method for the current stage
        const primaryIrrigationMethod = updatedBlock.irrigation_methods?.[0]?.method || 'drip';
        
        setCalculatorInputs(prev => ({
          ...prev,
          growthStage: updatedBlock.growth_stage,
          kcValue: stage?.kc,
          systemType: primaryIrrigationMethod
        }));
      }
    }
  };

  // Filter crop instances for the currently selected location and deduplicate
  const getLocationCropInstances = () => {
    if (!selectedLocation) return [];
    
    const locationInstances = cropInstances.filter(instance => instance.locationId === selectedLocation.id);
    
    // Deduplicate by cropId - keep only the most recent instance for each crop
    const deduplicatedInstances = locationInstances.reduce((acc, instance) => {
      const existingIndex = acc.findIndex(existing => existing.cropId === instance.cropId);
      if (existingIndex >= 0) {
        // Replace with more recent instance based on ID comparison
        // Handle different ID formats (quick-, instance-, etc.)
        const currentTime = instance.id.includes('-') ? 
          parseInt(instance.id.split('-')[1]) || 0 : 
          parseInt(instance.id) || 0;
        const existingTime = acc[existingIndex].id.includes('-') ? 
          parseInt(acc[existingIndex].id.split('-')[1]) || 0 : 
          parseInt(acc[existingIndex].id) || 0;
          
        if (currentTime > existingTime) {
          acc[existingIndex] = instance;
        }
      } else {
        acc.push(instance);
      }
      return acc;
    }, [] as CropInstance[]);
    
    return deduplicatedInstances;
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
    } else if (inputs.selectedMonth && inputs.crop) {
      const crop = availableCrops.find(c => c.name.toLowerCase() === inputs.crop.toLowerCase());
      if (crop && crop.monthlyKc) {
        const monthlyKc = crop.monthlyKc.find(m => m.month === inputs.selectedMonth);
        if (monthlyKc) {
          kc = monthlyKc.kc;
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-700 dark:text-gray-300">Loading {user ? 'your' : 'trial'} data...</p>
        </div>
      </div>
    );
  }

  if (!selectedLocation || availableLocations.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Locations Available</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {user ? 'Add your first location to get started' : 'Please try refreshing the page'}
          </p>
          {user && (
            <button
              onClick={() => setShowLocationModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Location
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="flex h-screen w-full">
        {/* Sidebar - Only visible for dashboard/overview view */}
        {currentView === 'overview' && (
          <div className={`
            fixed inset-y-0 left-0 z-50 w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
            transform transition-transform duration-300 ease-in-out
            lg:translate-x-0 lg:static lg:inset-0
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}>
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <Gauge className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                ET Weather
              </h1>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-md text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="p-6 overflow-y-auto h-full">
            <EnhancedLocationsList
              onLocationSelect={setSelectedLocation}
              selectedLocationId={selectedLocation?.id}
            />
          </div>
        </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors">
            {/* Desktop Header */}
            <div className="hidden lg:block px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Show ET Weather branding only when NOT in overview mode (since overview has sidebar with branding) */}
                  {currentView !== 'overview' && (
                    <div className="flex items-center space-x-2">
                      <Gauge className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                        ET Weather
                      </h1>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-3">
                  {/* View Toggle */}
                  <div className="flex items-center space-x-1 bg-gray-200 dark:bg-gray-700 rounded-lg p-1 transition-colors">
                    <button
                      onClick={() => setCurrentView('overview')}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                        currentView === 'overview'
                          ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      <Sprout className="h-4 w-4 mr-1 inline" />
                      Dashboard
                    </button>
                    <button
                      onClick={() => setCurrentView('reports')}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                        currentView === 'reports'
                          ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      <TrendingUp className="h-4 w-4 mr-1 inline" />
                      Reports
                    </button>
                    <button
                      onClick={() => setCurrentView('calculator')}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                        currentView === 'calculator'
                          ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      <Gauge className="h-4 w-4 mr-1 inline" />
                      Calculator
                    </button>
                    <button
                      onClick={() => setCurrentView('notifications')}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                        currentView === 'notifications'
                          ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      <Mail className="h-4 w-4 mr-1 inline" />
                      Notifications
                    </button>
                    
                    <button
                      onClick={() => setCurrentView('org-dashboard')}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center space-x-1 ${
                        currentView === 'org-dashboard'
                          ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      <TrendingUp className="h-4 w-4" />
                      <span>Org Insights</span>
                    </button>
                    <button
                      onClick={() => setCurrentView('field-blocks')}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center space-x-1 ${
                        currentView === 'field-blocks'
                          ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      <MapPin className="h-4 w-4" />
                      <span>Field Blocks</span>
                    </button>
                  </div>
                  
                  {user ? (
                    <div className="flex items-center space-x-3">
                      <ThemeToggle />
                      <OrganizationSwitcher />
                      <span className="text-gray-600 dark:text-gray-300 text-sm">
                        {user.email}
                      </span>
                      <button
                        onClick={() => signOut()}
                        className="flex items-center space-x-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3">
                      <ThemeToggle />
                      <OrganizationSwitcher />
                      <button
                        onClick={disableTrialMode}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                      >
                        Exit Trial
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile Header */}
            <div className="lg:hidden">
              {/* Top row with location and menu */}
              <div className="px-4 py-3 flex items-center justify-between">
                {/* Show ET Weather branding only when NOT in overview mode (since overview has sidebar with branding) */}
                {currentView !== 'overview' && (
                  <div className="flex items-center space-x-2">
                    <Gauge className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                      ET Weather
                    </h1>
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <OrganizationSwitcher />
                  <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="p-2 rounded-md text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Mobile navigation menu */}
              {mobileMenuOpen && (
                <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
                  <div className="px-2 py-3 space-y-1">
                    <button
                      onClick={() => {
                        setCurrentView('overview');
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        currentView === 'overview'
                          ? 'bg-blue-50 dark:bg-gray-800 text-blue-700 dark:text-white'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Sprout className="h-4 w-4 mr-3" />
                      Dashboard
                    </button>
                    <button
                      onClick={() => {
                        setCurrentView('reports');
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        currentView === 'reports'
                          ? 'bg-blue-50 dark:bg-gray-800 text-blue-700 dark:text-white'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <TrendingUp className="h-4 w-4 mr-3" />
                      Reports
                    </button>
                    <button
                      onClick={() => {
                        setCurrentView('calculator');
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        currentView === 'calculator'
                          ? 'bg-blue-50 dark:bg-gray-800 text-blue-700 dark:text-white'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Gauge className="h-4 w-4 mr-3" />
                      Calculator
                    </button>
                    <button
                      onClick={() => {
                        setCurrentView('notifications');
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        currentView === 'notifications'
                          ? 'bg-blue-50 dark:bg-gray-800 text-blue-700 dark:text-white'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Mail className="h-4 w-4 mr-3" />
                      Notifications
                    </button>
                    <button
                      onClick={() => {
                        setCurrentView('org-dashboard');
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        currentView === 'org-dashboard'
                          ? 'bg-blue-50 dark:bg-gray-800 text-blue-700 dark:text-white'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <TrendingUp className="h-4 w-4 mr-3" />
                      Org Insights
                    </button>
                    <button
                      onClick={() => {
                        setCurrentView('field-blocks');
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        currentView === 'field-blocks'
                          ? 'bg-blue-50 dark:bg-gray-800 text-blue-700 dark:text-white'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <MapPin className="h-4 w-4 mr-3" />
                      Field Blocks
                    </button>
                  </div>
                  
                  {/* Mobile user actions */}
                  <div className="border-t border-gray-200 dark:border-gray-700 px-2 py-3">
                    {user ? (
                      <div className="space-y-2">
                        <div className="px-3 py-2">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Signed in as</p>
                          <p className="text-sm text-gray-900 dark:text-gray-300 truncate">{user.email}</p>
                        </div>
                        <button
                          onClick={() => {
                            signOut();
                            setMobileMenuOpen(false);
                          }}
                          className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-gray-700 rounded-md transition-colors"
                        >
                          <LogOut className="h-4 w-4 mr-3" />
                          Sign Out
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          disableTrialMode();
                          setMobileMenuOpen(false);
                        }}
                        className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                      >
                        Exit Trial
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 overflow-y-auto p-6 w-full">
            {currentView === 'overview' ? (
              <>
                    {/* Current Location Weather Overview */}
                    <div className="mb-6 bg-gradient-to-r from-blue-900/30 to-green-900/30 border border-blue-700/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                          <MapPin className="h-5 w-5 text-blue-400" />
                          <span>System Overview - {selectedLocation.name}</span>
                        </h3>
                        <div className="flex items-center space-x-4 text-sm">
                          <span className="text-green-400 flex items-center space-x-1">
                            <Sprout className="h-4 w-4" />
                            <span>{selectedCrops.length} crops</span>
                          </span>
                          <span className="text-yellow-400 flex items-center space-x-1">
                            <Plus className="h-4 w-4" />
                            <span>{getLocationCropInstances().length} plantings</span>
                          </span>
                          {calculatorInputs.crop && (
                            <span className="text-blue-400 flex items-center space-x-1">
                              <Calculator className="h-4 w-4" />
                              <span>Calculator: {calculatorInputs.crop}</span>
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-400">{((weatherData?.temperatureMax || weatherData?.temperature || 0) * 9/5 + 32).toFixed(0)}°F</div>
                          <div className="text-gray-400">High Temp</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-400">{((weatherData?.temperatureMin || weatherData?.temperature || 0) * 9/5 + 32).toFixed(0)}°F</div>
                          <div className="text-gray-400">Low Temp</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-400">{((weatherData?.et0 || 0) * 0.0393701).toFixed(3)}</div>
                          <div className="text-gray-400">ET₀ (in/day)</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-yellow-400">{weatherData?.humidity?.toFixed(0) || 0}%</div>
                          <div className="text-gray-400">Humidity</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-400">{((weatherData?.windSpeed || 0) * 0.621371).toFixed(1)}</div>
                          <div className="text-gray-400">Wind (mph)</div>
                        </div>
                      </div>
                    </div>

                    {/* Frost Alert Widget */}
                    {activeFrostWarnings.length > 0 && (
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="text-2xl">
                              {criticalFrostWarnings.length > 0 ? '🚨' : '❄️'}
                            </div>
                            <div>
                              <div className="font-bold text-gray-900 dark:text-white text-sm">
                                {criticalFrostWarnings.length > 0 ? 'CRITICAL FROST ALERT' : 'Frost Warning'}
                              </div>
                              <div className="text-gray-600 dark:text-gray-400 text-xs">
                                {activeFrostWarnings.length} location(s) affected
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-gray-900 dark:text-white font-bold text-lg">
                              {Math.min(...activeFrostWarnings.map(w => w.temperature))}°F
                            </div>
                            <div className="text-gray-600 dark:text-gray-400 text-xs">Predicted Low</div>
                          </div>
                        </div>
                        {criticalFrostWarnings.length > 0 && (
                          <div className="mt-2 text-xs text-gray-600 dark:text-gray-300 border-t border-gray-200 dark:border-gray-600 pt-2">
                            ⚠️ Take immediate protective action for sensitive crops
                          </div>
                        )}
                      </div>
                    )}

                {/* Weather Overview */}
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Current Weather - {selectedLocation.name}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-red-600 dark:text-red-400">
                            <Thermometer className="h-5 w-5" />
                          </div>
                          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Temperature</h3>
                        </div>
                        <TrendingUp className="h-4 w-4 text-red-600 dark:text-red-400" />
                      </div>
                      <div className="flex items-baseline space-x-2 mb-2">
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">
                          {((weatherData?.temperature || 0) * 9/5 + 32).toFixed(1)}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">°F</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Above average for this time of year</p>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-blue-600 dark:text-blue-400">
                            <Droplets className="h-5 w-5" />
                          </div>
                          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Humidity</h3>
                        </div>
                      </div>
                      <div className="flex items-baseline space-x-2 mb-2">
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">
                          {weatherData?.humidity.toFixed(0)}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">%</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Optimal range for most crops</p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-400">
                            <Wind className="h-5 w-5" />
                          </div>
                          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Wind Speed</h3>
                        </div>
                      </div>
                      <div className="flex items-baseline space-x-2 mb-2">
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">
                          {((weatherData?.windSpeed || 0) * 0.621371).toFixed(1)}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">mph</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Light breeze conditions</p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-indigo-600 dark:text-indigo-400">
                            <Droplets className="h-5 w-5" />
                          </div>
                          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Precipitation</h3>
                        </div>
                      </div>
                      <div className="flex items-baseline space-x-2 mb-2">
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">
                          {((weatherData?.precipitation || 0) * 0.0393701).toFixed(2)}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">in</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Recent rainfall recorded</p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-green-600 dark:text-green-400">
                            <Sprout className="h-5 w-5" />
                          </div>
                          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Reference ET₀</h3>
                        </div>
                      </div>
                      <div className="flex items-baseline space-x-2 mb-2">
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">
                          {((weatherData?.et0 || 0) * 0.0393701).toFixed(2)}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">in/day</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Base for Kc calculations</p>
                    </div>
                  </div>
                </div>

                {/* Crop Management Section */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Crop Management</h2>
                      {/* Global crop summary */}
                      {cropInstances.length > 0 && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {cropInstances.length} total plantings across {availableLocations.filter(loc => 
                            cropInstances.some(inst => inst.locationId === loc.id)
                          ).length} location{availableLocations.filter(loc => 
                            cropInstances.some(inst => inst.locationId === loc.id)
                          ).length !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => setShowCropSelector(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                    >
                      <Sprout className="h-4 w-4" />
                      <span>Manage Crops</span>
                    </button>
                  </div>
                  
                  {getLocationCropInstances().length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
                      <Sprout className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Crop Plantings Yet</h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Add crops to your location to start tracking their water requirements and growth stages.
                      </p>
                      <button
                        onClick={() => setShowCropSelector(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                      >
                        Add Your First Crop
                      </button>
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-900 dark:text-white font-medium">{getLocationCropInstances().length} Active Crop{getLocationCropInstances().length !== 1 ? 's' : ''} at {selectedLocation?.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {cropInstances.length > getLocationCropInstances().length ? 
                              `Showing crops for this location only. ${cropInstances.length - getLocationCropInstances().length} more crops at other locations.` :
                              'Click "Manage Crops" to add more or modify existing crops'
                            }
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full"></div>
                          <span className="text-sm text-green-500 dark:text-green-400">Active</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Your Crop Plantings - Enhanced with Detailed Coefficients (Unified Section) */}
                {getLocationCropInstances().length > 0 && (
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold text-white">Your Crop Plantings</h2>
                      <div className="text-sm text-gray-400">
                        ET₀ × Kc = ETc (Crop Water Requirement)
                      </div>
                    </div>
                    <div className="bg-blue-50 dark:bg-gray-800 border border-blue-200 dark:border-gray-700 rounded-lg p-4 mb-6">
                      <p className="text-gray-700 dark:text-gray-300 text-sm">
                        <strong className="text-gray-900 dark:text-white">Crop coefficients (Kc)</strong> adjust reference evapotranspiration (ET₀) to calculate actual crop water requirements (ETc). 
                        Values vary by month based on seasonal crop water needs and are automatically selected based on the current month.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {getLocationCropInstances().map((instance) => {
                        const crop = availableCrops.find(c => c.id === instance.cropId);
                        if (!crop) return null;

                        const daysSincePlanting = Math.floor(
                          (new Date().getTime() - new Date(instance.plantingDate).getTime()) / (1000 * 60 * 60 * 24)
                        );

                        // Get current month and corresponding Kc value
                        const currentDate = new Date();
                        const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-indexed
                        
                        // Find monthly Kc data for current month
                        const currentMonthData = crop.monthlyKc?.find(m => m.month === currentMonth);
                        // Use custom Kc value if available, otherwise use default monthly Kc
                        const displayKc = instance.customKcValues?.[currentMonth] || currentMonthData?.kc || crop.stages[0]?.kc || 0.4;
                        const displayMonth = currentMonthData?.monthName || new Date().toLocaleString('default', { month: 'long' });
                        const isCustomKc = instance.customKcValues?.[currentMonth] !== undefined;
                        
                        const etc = displayKc * (weatherData?.et0 || 5); // mm/day
                        const etcInches = etc * 0.0393701; // Convert to inches/day

                        return (
                          <div key={instance.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{crop.name}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{crop.category}</p>
                                {instance.fieldName && (
                                  <p className="text-xs text-gray-500 dark:text-gray-500">{instance.fieldName}</p>
                                )}
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium px-2 py-1 rounded text-blue-400 bg-blue-900/30">
                                  {displayMonth}
                                </span>
                                <button
                                  onClick={() => {
                                    setEditingCropInstance(instance);
                                    
                                    // Initialize Kc values for editing
                                    const crop = availableCrops.find(c => c.id === instance.cropId);
                                    if (crop?.monthlyKc) {
                                      const initialKcValues: {[key: number]: number} = {};
                                      crop.monthlyKc.forEach(month => {
                                        // Use custom Kc if it exists in the instance, otherwise use default
                                        initialKcValues[month.month] = instance.customKcValues?.[month.month] || month.kc;
                                      });
                                      setEditingKcValues(initialKcValues);
                                    }
                                    
                                    setShowEditCropModal(true);
                                  }}
                                  className="text-blue-400 hover:text-blue-300 transition-colors"
                                  title="Edit crop instance"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setCropInstances(prev => prev.filter(ci => ci.id !== instance.id));
                                    // Also remove from selected crops
                                    setSelectedCrops(prev => prev.filter(id => id !== instance.cropId));
                                  }}
                                  className="text-red-400 hover:text-red-300 transition-colors"
                                  title="Remove crop instance"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>

                            {/* Crop Coefficient (Kc) Details */}
                            <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-lg p-4 mb-4">
                              <h4 className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-3">Crop Coefficient (Kc) Details</h4>
                              <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                  <p className="text-sm text-gray-400 flex items-center">
                                    Current Kc Value
                                    {isCustomKc && (
                                      <span className="ml-2 text-xs text-orange-400 bg-orange-900/30 px-2 py-0.5 rounded" title="Using custom Kc value">
                                        Custom
                                      </span>
                                    )}
                                  </p>
                                  <p className="text-xl font-bold text-blue-400">{displayKc.toFixed(2)}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-400">ETc (in/day)</p>
                                  <p className="text-xl font-bold text-green-400">{etcInches.toFixed(3)}</p>
                                </div>
                              </div>
                              <div className="text-xs text-gray-400 mb-2">
                                Formula: ETc = ET₀ × Kc = {(weatherData?.et0 || 5).toFixed(1)} × {displayKc.toFixed(2)}
                              </div>
                            </div>

                            <div className="space-y-3">
                              <div>
                                <p className="text-sm text-gray-400">Water Needs</p>
                                <p className="text-white font-bold text-lg">
                                  {etcInches > 0.25 ? 'Very High' : etcInches > 0.15 ? 'High' : etcInches > 0.10 ? 'Medium' : 'Low'}
                                  <span className={`ml-2 w-2 h-2 rounded-full inline-block ${
                                    etcInches > 0.25 ? 'bg-red-500' : etcInches > 0.15 ? 'bg-orange-500' : etcInches > 0.10 ? 'bg-yellow-500' : 'bg-green-500'
                                  }`}></span>
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-400">Current Month</p>
                                <p className="text-white font-medium">{displayMonth}</p>
                                <p className="text-xs text-gray-500">Monthly Kc: {displayKc}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-400">Coefficient Range</p>
                                <p className="text-white text-sm">
                                  {crop.monthlyKc ? 
                                    `${Math.min(...crop.monthlyKc.map(m => m.kc)).toFixed(2)} - ${Math.max(...crop.monthlyKc.map(m => m.kc)).toFixed(2)} (annual range)` :
                                    `${Math.min(...crop.stages.map(s => s.kc)).toFixed(2)} - ${Math.max(...crop.stages.map(s => s.kc)).toFixed(2)} (across all stages)`
                                  }
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-400">Recommendation</p>
                                <p className="text-gray-300 text-sm">
                                  {currentMonthData?.description || `${displayMonth} - maintain consistent soil moisture for optimal ${crop.name.toLowerCase()} production`}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Planted</p>
                                <p className="text-gray-900 dark:text-white text-sm">{new Date(instance.plantingDate).toLocaleDateString()}</p>
                                <p className="text-xs text-gray-500">({daysSincePlanting} days since planting)</p>
                              </div>
                            </div>

                            {instance.notes && (
                              <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-600">
                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Notes</p>
                                <p className="text-sm text-gray-800 dark:text-gray-300">{instance.notes}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            ) : currentView === 'calculator' ? (
              <>
                {/* Irrigation Runtime Calculator */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Irrigation Runtime Calculator</h2>
                    <div className="flex items-center space-x-3">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Calculate exact irrigation runtimes for your specific setup</p>
                      {!user && (
                        <div className="text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded border border-gray-200 dark:border-gray-600">
                          <button 
                            onClick={disableTrialMode}
                            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          >
                            Create account for saved calculations
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Saved Profiles Section */}
                  {cropProfiles.length > 0 && (
                    <div className="mb-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                          <Star className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />
                          <span>Saved Crop Profiles</span>
                        </h3>
                        <button
                          onClick={() => setShowProfileModal(true)}
                          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                        >
                          Save Current Setup
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {cropProfiles.slice(0, 6).map(profile => (
                          <div
                            key={profile.id}
                            className={`p-3 rounded-lg border transition-all ${
                              calculatorInputs.crop === profile.cropName
                                ? 'border-green-500 bg-green-100 dark:bg-green-900/20'
                                : 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-gray-900 dark:text-white text-sm">{profile.name}</h4>
                              <div className="flex items-center space-x-1">
                                {profile.isFavorite && <Star className="h-3 w-3 text-yellow-500 dark:text-yellow-400 fill-current" />}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingProfile(profile);
                                    setShowProfileModal(true);
                                  }}
                                  className="p-1 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                  title="Edit profile"
                                >
                                  <Edit className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm('Are you sure you want to delete this profile?')) {
                                      deleteCropProfile(profile.id);
                                    }
                                  }}
                                  className="p-1 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                  title="Delete profile"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                            <div 
                              className="text-xs text-gray-600 dark:text-gray-400 space-y-1 cursor-pointer"
                              onClick={() => loadProfileToCalculator(profile)}
                            >
                              <div className="flex items-center space-x-1">
                                <Sprout className="h-3 w-3" />
                                <span>{profile.cropName}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Droplets className="h-3 w-3" />
                                <span>{profile.irrigationMethod} • {profile.zoneFlowGPM} GPM</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <MapPin className="h-3 w-3" />
                                <span>{profile.areaSize} {profile.areaUnit} • {profile.soilType}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                        {cropProfiles.length > 6 && (
                          <div className="p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                            <span className="text-gray-600 dark:text-gray-400 text-sm">+{cropProfiles.length - 6} more profiles</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
                    {/* Input Form */}
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 xl:col-span-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Input Parameters</h3>
                      
                      <div className="space-y-4">
                        {/* Crop Selection */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Crop Type</label>
                          
                          {/* Quick Select from Dashboard Crops */}
                          {selectedCrops.length > 0 && (
                            <div className="mb-3">
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Quick select from your dashboard crops:</p>
                              <div className="flex flex-wrap gap-2">
                                {selectedCrops.slice(0, 4).map(cropId => {
                                  const crop = availableCrops.find(c => c.id === cropId);
                                  return crop ? (
                                    <button
                                      key={cropId}
                                      onClick={() => setCalculatorInputs({...calculatorInputs, crop: crop.name})}
                                      className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                                        calculatorInputs.crop === crop.name
                                          ? 'bg-blue-600 text-white'
                                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                      }`}
                                    >
                                      {crop.name}
                                    </button>
                                  ) : null;
                                })}
                                {selectedCrops.length > 4 && (
                                  <span className="text-xs text-gray-500 self-center">+{selectedCrops.length - 4} more</span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Quick Selection from Your Planted Crops */}
                          {getLocationCropInstances().length > 0 && (
                            <div className="mb-3">
                              <p className="text-xs text-green-600 dark:text-green-400 mb-2">🌱 Your Planted Crops at {selectedLocation?.name}:</p>
                              <div className="space-y-2 mb-3">
                                {getLocationCropInstances().slice(0, 3).map(instance => {
                                  const crop = availableCrops.find(c => c.id === instance.cropId);
                                  if (!crop) return null;
                                  
                                  const currentStage = crop.stages[instance.currentStage];
                                  const currentWateringCycle = crop.isPerennial && crop.wateringCycles ? 
                                    crop.wateringCycles[instance.currentWateringCycle || 0] : null;
                                  
                                  return (
                                    <button
                                      key={instance.id}
                                      onClick={() => {
                                        // Auto-populate calculator with crop instance data
                                        setCalculatorInputs({
                                          ...calculatorInputs,
                                          crop: crop.name,
                                          kcValue: currentWateringCycle?.kc || currentStage?.kc || crop.stages[0]?.kc,
                                          selectedMonth: new Date().getMonth() + 1, // Set to current month
                                          area: 0, // Default area since field blocks are managed separately
                                          areaUnit: 'acres'
                                        });
                                      }}
                                      className="w-full flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors text-left"
                                    >
                                      <div className="flex-1">
                                        <p className="text-green-700 dark:text-green-300 font-medium text-sm">{crop.name}</p>
                                        <p className="text-green-600 dark:text-green-200 text-xs">
                                          {instance.fieldName && `📍 ${instance.fieldName}`}
                                        </p>
                                        <p className="text-green-200 text-xs">
                                          Stage: {currentWateringCycle ? 
                                            `${currentWateringCycle.name} (${currentWateringCycle.season})` :
                                            currentStage?.name
                                          }
                                        </p>
                                        <p className="text-gray-400 text-xs">
                                          Planted: {new Date(instance.plantingDate).toLocaleDateString()}
                                        </p>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-green-400 text-sm font-mono">
                                          Kc: {currentWateringCycle?.kc || currentStage?.kc || crop.stages[0]?.kc}
                                        </p>

                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          
                          <select 
                            value={calculatorInputs.crop}
                            onChange={(e) => setCalculatorInputs({...calculatorInputs, crop: e.target.value})}
                            className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select Crop</option>
                            {availableCrops.map(crop => (
                              <option key={crop.id} value={crop.name}>{crop.name}</option>
                            ))}
                          </select>
                        </div>

                        {/* Kc or Monthly Selection */}
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Monthly Kc Value or Custom</label>
                          
                          <div className="space-y-2">
                            {calculatorInputs.crop && (
                              <select 
                                value={calculatorInputs.selectedMonth || ''}
                                onChange={(e) => setCalculatorInputs({...calculatorInputs, selectedMonth: parseInt(e.target.value), kcValue: undefined})}
                                className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">Select Month</option>
                                {availableCrops.find(c => c.name === calculatorInputs.crop)?.monthlyKc?.map(monthKc => (
                                  <option key={monthKc.month} value={monthKc.month}>
                                    {monthKc.monthName} (Kc: {monthKc.kc})
                                  </option>
                                ))}
                              </select>
                            )}
                            <div className="text-center text-gray-600 dark:text-gray-400 text-sm">or</div>
                            <input
                              type="number"
                              step="0.01"
                              placeholder="Enter Kc value manually"
                              value={calculatorInputs.kcValue || ''}
                              onChange={(e) => setCalculatorInputs({...calculatorInputs, kcValue: parseFloat(e.target.value), selectedMonth: undefined})}
                              className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>

                        {/* ET Source */}
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">ET₀ Source</label>
                          <div className="mb-2 p-2 bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
                            <div className="text-xs text-gray-600 dark:text-gray-400">Current Location: {selectedLocation.name}</div>
                            <div className="text-xs text-blue-600 dark:text-blue-400">Live ET₀: {((weatherData?.et0 || 0) * 0.0393701).toFixed(3)} in/day</div>
                          </div>
                          <select 
                            value={calculatorInputs.etSource}
                            onChange={(e) => setCalculatorInputs({...calculatorInputs, etSource: e.target.value as 'weather-station' | 'cimis' | 'manual'})}
                            className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="weather-station">Use Current Location Data ({((weatherData?.et0 || 0) * 0.0393701).toFixed(3)} in/day)</option>
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
                              className="mt-2 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500"
                            />
                          )}
                        </div>

                        {/* Irrigation System Type */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Irrigation System</label>
                          <select 
                            value={calculatorInputs.systemType}
                            onChange={(e) => setCalculatorInputs({...calculatorInputs, systemType: e.target.value})}
                            className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select System Type</option>
                            <option value="drip">Drip Irrigation (90-95% efficient)</option>
                            <option value="micro-spray">Micro-Spray (80-90% efficient)</option>
                            <option value="sprinkler">Sprinkler (70-85% efficient)</option>
                            <option value="surface">Surface/Flood (60-75% efficient)</option>
                          </select>
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



                        {/* Calculate Button */}
                        <button
                          onClick={() => {
                            const result = calculateRuntime(calculatorInputs);
                            setCalculatorResult(result);
                          }}
                          disabled={!calculatorInputs.crop || !calculatorInputs.zoneFlowGPM || !calculatorInputs.area || !calculatorInputs.systemType}
                          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                          Calculate Runtime
                        </button>
                      </div>
                    </div>

                    {/* Results */}
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 xl:col-span-3">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Calculation Results</h3>
                      
                      {calculatorResult ? (
                        <div className="space-y-6">
                          {/* Runtime Results */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                              <p className="text-sm text-gray-600 dark:text-gray-400">Daily Runtime</p>
                              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                {calculatorResult.runtimeHours}h {calculatorResult.runtimeMinutes}m
                              </p>
                            </div>
                            <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                              <p className="text-sm text-gray-600 dark:text-gray-400">Weekly Hours</p>
                              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                {calculatorResult.weeklyHours.toFixed(1)}h
                              </p>
                            </div>
                          </div>

                          <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Daily Water Need</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">
                              {calculatorResult.dailyWaterNeed.toLocaleString()} gallons/day
                            </p>
                            <p className="text-sm text-gray-500">
                              At {calculatorResult.efficiency}% system efficiency
                            </p>
                          </div>

                          {/* Formula Breakdown */}
                          <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                            <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-300 mb-2">Calculation Formula</h4>
                            <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap font-mono">
                              {calculatorResult.formula}
                            </pre>
                          </div>

                          {/* Template for App */}
                          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                            <h4 className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2">Template for Your App</h4>
                            <p className="text-xs text-gray-700 dark:text-gray-300 mb-2">Copy this configuration for your irrigation management system:</p>
                            <pre className="text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900 p-3 rounded whitespace-pre-wrap">
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
            ) : currentView === 'reports' ? (
              <>
                {/* Weather Reports with Crop Data */}
                <div className="mb-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {displayedLocations.length === 0 ? (
                        'Weather Reports Dashboard - Select Location to View Data'
                      ) : displayedLocations.length > 1 ? (
                        `Comprehensive Reports - ${displayedLocations.length} Locations (${displayedLocations.map(loc => loc.name).join(', ')})`
                      ) : (
                        `Weather Report - ${displayedLocations[0]?.name || 'No Location'}`
                      )}
                    </h2>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex items-center space-x-1">
                        <Sprout className="h-3 w-3" />
                        <span>{selectedCrops.length} crops tracked</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Plus className="h-3 w-3" />
                        <span>{getLocationCropInstances().length} plantings</span>
                      </span>
                    </div>
                  </div>
                </div>
                <ReportView 
                  selectedCrops={selectedCrops}
                  cropInstances={getLocationCropInstances()}
                  calculatorResult={calculatorResult}
                  calculatorInputs={calculatorInputs}
                  selectedLocation={null}
                  availableLocations={availableLocations}
                  onDisplayLocationsChange={setDisplayedLocations}
                  reportSelectedLocationIds={reportSelectedLocationIds}
                  onReportSelectedLocationIdsChange={setReportSelectedLocationIds}
                  reportInsights={reportInsights}
                  onReportInsightsChange={setReportInsights}
                />
              </>
            ) : currentView === 'notifications' ? (
              <>
                {/* Notifications - Combined Email and Frost Alerts */}
                <div className="space-y-8">
                  {/* Email Notifications Section */}
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                      <Mail className="h-6 w-6 mr-3" />
                      Email Notifications
                    </h2>
                    <EmailNotifications />
                  </div>
                  
                  {/* Frost Alert Subscription Section */}
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                      <Thermometer className="h-6 w-6 mr-3" />
                      Frost Alert Subscriptions
                    </h2>
                    <div className="space-y-6">
                      <FrostWarningDashboard 
                        locations={availableLocations}
                        cropInstances={getLocationCropInstances()}
                        onSendAlert={async (warning) => {
                          try {
                            const email = prompt('Enter email address for frost alert:');
                            if (email) {
                              await FrostEmailService.sendFrostWarning(
                                email, 
                                [warning], 
                                [warning.locationName]
                              );
                              alert('Frost alert sent successfully!');
                            }
                          } catch (error) {
                            console.error('Error sending frost alert:', error);
                            alert('Failed to send frost alert');
                          }
                        }}
                      />
                      <FrostAlertSubscription />
                    </div>
                  </div>
                </div>
              </>
            ) : currentView === 'org-dashboard' ? (
              <>
                {/* Organizational Dashboard */}
                <OrganizationalDashboard 
                  selectedCrops={selectedCrops}
                  cropInstances={getLocationCropInstances()}
                  calculatorResult={calculatorResult}
                  // fieldBlocks={fieldBlocks} // Temporarily disabled due to interface conflict
                />
              </>
            ) : currentView === 'field-blocks' ? (
              <>
                {/* Field Blocks Management */}
                <FieldBlocksManager 
                  selectedCrops={selectedCrops}
                  calculatorResult={calculatorResult}
                  calculatorInputs={calculatorInputs}
                  selectedLocation={selectedLocation}
                  availableLocations={availableLocations}
                  onFieldBlockUpdate={handleFieldBlockUpdate}
                />
              </>
            ) : null}
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
        onAddAllCrops={addAllCrops}
        onRemoveAllCrops={removeAllCrops}
        locations={availableLocations}
        onApplyToLocation={handleApplyToLocation}
        onApplyToAllLocations={handleApplyToAllLocations}
        appliedLocations={appliedLocations}
        isApplyingToAll={isApplyingToAll}
      />

      {/* Floating Success Notification */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-5 duration-300">
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 max-w-sm">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 animate-bounce" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-sm font-medium">{successMessage}</span>
            <button 
              onClick={() => setSuccessMessage('')}
              className="flex-shrink-0 ml-2 text-white/80 hover:text-white"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}
      

      {/* Profile Management Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4">
              {editingProfile ? 'Edit Profile' : 'Create New Profile'}
            </h3>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              if (editingProfile) {
                updateCropProfile(editingProfile.id, {
                  name: formData.get('profileName') as string,
                  notes: formData.get('notes') as string,
                  isFavorite: formData.get('isFavorite') === 'on'
                });
              } else {
                saveCurrentAsProfile(
                  formData.get('profileName') as string, 
                  formData.get('notes') as string
                );
              }
              setShowProfileModal(false);
              setEditingProfile(null);
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Profile Name *
                  </label>
                  <input
                    name="profileName"
                    type="text"
                    defaultValue={editingProfile?.name || ''}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter profile name"
                    required
                  />
                </div>

                {!editingProfile && (
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Current Configuration:</h4>
                    <div className="text-sm text-gray-400 space-y-1">
                      <div>Crop: {calculatorInputs.crop || 'None selected'}</div>

                      <div>System: {calculatorInputs.systemType || 'None selected'}</div>
                      <div>Flow Rate: {calculatorInputs.zoneFlowGPM} GPM</div>
                      <div>Area: {calculatorInputs.area} {calculatorInputs.areaUnit}</div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Notes (optional)
                  </label>
                  <textarea
                    name="notes"
                    rows={3}
                    defaultValue={editingProfile?.notes || ''}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                    placeholder="Add any notes about this profile"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    name="isFavorite"
                    type="checkbox"
                    defaultChecked={editingProfile?.isFavorite || false}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <label className="text-sm text-gray-300">Mark as favorite</label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileModal(false);
                    setEditingProfile(null);
                  }}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingProfile ? 'Update Profile' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Crop Edit Modal */}
      {showEditCropModal && editingCropInstance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <Sprout className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Edit {availableCrops.find(c => c.id === editingCropInstance.cropId)?.name} Instance
                    </h2>
                    <p className="text-sm text-gray-400">
                      <span className="italic">{availableCrops.find(c => c.id === editingCropInstance.cropId)?.scientificName}</span> • {availableCrops.find(c => c.id === editingCropInstance.cropId)?.category}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowEditCropModal(false);
                    setEditingCropInstance(null);
                    setEditingKcValues({});
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                const notes = formData.get('notes') as string;
                
                // Update the crop instance with notes and custom Kc values
                setCropInstances(prev => prev.map(instance => 
                  instance.id === editingCropInstance.id 
                    ? { 
                        ...instance, 
                        notes: notes || instance.notes,
                        customKcValues: Object.keys(editingKcValues).length > 0 ? editingKcValues : instance.customKcValues
                      }
                    : instance
                ));
                
                setShowEditCropModal(false);
                setEditingCropInstance(null);
                setEditingKcValues({});
              }}
              className="p-6 space-y-6"
            >
              <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-blue-300">
                  <MapPin className="h-4 w-4" />
                  <span className="font-medium">Location: {selectedLocation?.name || 'Unknown Location'}</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-300">Monthly Kc Coefficients</h3>
                  <div className="text-xs text-gray-400">
                    Click values to edit • Range: 0.0 - 2.0
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {availableCrops.find(c => c.id === editingCropInstance.cropId)?.monthlyKc?.map((month) => {
                    const isCurrentMonth = new Date().getMonth() + 1 === month.month;
                    const currentKc = editingKcValues[month.month] !== undefined ? editingKcValues[month.month] : month.kc;
                    
                    return (
                      <div 
                        key={month.month}
                        className={`p-3 rounded-lg border ${
                          isCurrentMonth 
                            ? 'bg-blue-900/50 border-blue-600' 
                            : 'bg-gray-800 border-gray-700'
                        }`}
                        title={month.description}
                      >
                        <div className="font-medium text-center mb-2 text-xs text-gray-300">{month.monthName}</div>
                        <div className="text-center">
                          <label className="block text-xs text-gray-400 mb-1">Kc</label>
                          <input
                            type="number"
                            min="0"
                            max="2"
                            step="0.01"
                            value={currentKc}
                            onChange={(e) => {
                              const newValue = parseFloat(e.target.value) || 0;
                              setEditingKcValues(prev => ({
                                ...prev,
                                [month.month]: newValue
                              }));
                            }}
                            className={`w-full px-2 py-1 text-xs font-mono font-bold text-center rounded border ${
                              isCurrentMonth 
                                ? 'bg-blue-800 border-blue-500 text-blue-200' 
                                : 'bg-gray-700 border-gray-600 text-white'
                            } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <div className="text-gray-400">
                    <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mr-1"></span>Current month
                    <span className="inline-block w-2 h-2 bg-gray-600 rounded-full mr-1 ml-3"></span>Other months
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      // Reset to original values
                      const crop = availableCrops.find(c => c.id === editingCropInstance.cropId);
                      if (crop?.monthlyKc) {
                        const resetValues: {[key: number]: number} = {};
                        crop.monthlyKc.forEach(month => {
                          resetValues[month.month] = month.kc;
                        });
                        setEditingKcValues(resetValues);
                      }
                    }}
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Reset to defaults
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-300 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  defaultValue={editingCropInstance.notes || ''}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add any notes about this crop instance..."
                />
              </div>

              <div className="flex items-center space-x-3 pt-4 border-t border-gray-700">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditCropModal(false);
                    setEditingCropInstance(null);
                    setEditingKcValues({});
                  }}
                  className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};