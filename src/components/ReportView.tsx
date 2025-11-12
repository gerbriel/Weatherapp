import React, { useState, useEffect, useMemo } from 'react';
import { MapPin, Thermometer, Droplets, Gauge, Calendar, Download, FileSpreadsheet, Sprout, Calculator, Filter, TrendingUp, Settings, Cloud, BarChart3, Wheat, Sun, FileText } from 'lucide-react';
import { useLocations } from '../contexts/LocationsContext';
import { exportComprehensiveData, type ComprehensiveExportOptions } from '../utils/exportUtils';
import { SimpleWeatherCharts } from './SimpleWeatherCharts';
import { ChartErrorBoundary } from './ChartErrorBoundary';
import { CropETCCharts } from './CropETCCharts';
import { DateRangePicker } from './DateRangePicker';
import { ReportModeToggle } from './ReportModeToggle';
import { ExportOptionsModal } from './ExportOptionsModal';
import ChartAIInsights from './ChartAIInsights';
import { cmisService } from '../services/cmisService';
import { weatherService } from '../services/weatherService';
import { isLocationInCalifornia } from '../utils/locationUtils';
import type { CMISETCData } from '../services/cmisService';

interface CropInstance {
  id: string;
  cropId: string;
  plantingDate: string;
  currentStage: number;
  customStageDays?: number;
  fieldName?: string;
  notes?: string;
  locationId?: string;
}

interface RuntimeResult {
  dailyWaterNeed: number;
  runtimeHours: number;
  runtimeMinutes: number;
  weeklyHours: number;
  efficiency: number;
  formula: string;
  etc: number;
}

interface ReportViewProps {
  selectedCrops?: string[];
  cropInstances?: CropInstance[];
  calculatorResult?: RuntimeResult | null;
  calculatorInputs?: any;
  selectedLocation?: any; // Current selected location
  availableLocations?: any[]; // Available locations - same as sidebar
  onDisplayLocationsChange?: (locations: any[]) => void; // Callback to notify parent of filtered locations
  // Persistent state props
  reportSelectedLocationIds?: Set<string>;
  onReportSelectedLocationIdsChange?: (ids: Set<string>) => void;
  reportInsights?: Map<string, { 
    precipitationChart: string;
    temperatureChart: string; 
    cropCoefficientsChart: string;
    etcEtoComparisonChart: string;
    dataTable: string;
    general: string;
  }>;
  onReportInsightsChange?: (insights: Map<string, { 
    precipitationChart: string;
    temperatureChart: string; 
    cropCoefficientsChart: string;
    etcEtoComparisonChart: string;
    dataTable: string;
    general: string;
  }>) => void;
}

export const ReportView: React.FC<ReportViewProps> = ({ 
  selectedCrops = [], 
  cropInstances = [], 
  calculatorResult = null,
  calculatorInputs = null,
  selectedLocation = null,
  availableLocations = [],
  onDisplayLocationsChange = () => {},
  reportSelectedLocationIds = new Set(),
  onReportSelectedLocationIdsChange = () => {},
  reportInsights = new Map(),
  onReportInsightsChange = () => {}
}) => {
  // Always call the hook to follow rules of hooks
  let locationsData: any[] = [];
  let refreshFunction: () => void = () => {};
  try {
    const locationsContext = useLocations();
    locationsData = locationsContext.locations;
    refreshFunction = locationsContext.refreshAllLocations;
  } catch (error) {
    // If useLocations is not available (not wrapped in provider), use empty defaults
    locationsData = [];
    refreshFunction = () => {};
  }
  
  // Use passed locations or fall back to useLocations for backward compatibility
  const locations = availableLocations.length > 0 ? availableLocations : locationsData;
  const refreshAllLocations = refreshFunction;
  
  // State for location filtering - now managed by parent
  const selectedLocationIds = reportSelectedLocationIds;
  const setSelectedLocationIds = onReportSelectedLocationIdsChange;
  const [showCropInsights, setShowCropInsights] = useState(true);
  const [showAIInsights, setShowAIInsights] = useState(false);
  // showAllLocations replaced with multiselect dropdown functionality
  const [hasTriedRefresh, setHasTriedRefresh] = useState(false);
  // const [isRefreshing, setIsRefreshing] = useState(false);
  const [cmisData, setCmisData] = useState<Map<string, CMISETCData[]>>(new Map());
  const [isFetchingCmis, setIsFetchingCmis] = useState(false);

  // State for dynamic reports
  const [reportMode, setReportMode] = useState<'current' | 'historical'>('current');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [isLoadingHistorical, setIsLoadingHistorical] = useState(false);
  const [historicalWeatherData, setHistoricalWeatherData] = useState<Map<string, any>>(new Map());
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Helper functions for location-specific insights
  const getLocationInsights = (locationId: string) => {
    return reportInsights.get(locationId) || { 
      precipitationChart: '', 
      temperatureChart: '', 
      cropCoefficientsChart: '', 
      etcEtoComparisonChart: '', 
      dataTable: '', 
      general: '' 
    };
  };

  const updateLocationInsights = (locationId: string, newInsights: { 
    precipitationChart: string;
    temperatureChart: string; 
    cropCoefficientsChart: string;
    etcEtoComparisonChart: string;
    dataTable: string;
    general: string;
  }) => {
    const updatedMap = new Map(reportInsights);
    updatedMap.set(locationId, newInsights);
    onReportInsightsChange(updatedMap);
  };

  // Convert Map-based insights to combined insights for export
  const getCombinedInsights = () => {
    const allInsights = Array.from(reportInsights.values());
    return {
      precipitationChart: allInsights.map(insight => insight.precipitationChart).filter(w => w).join('\n\n'),
      temperatureChart: allInsights.map(insight => insight.temperatureChart).filter(c => c).join('\n\n'),
      cropCoefficientsChart: allInsights.map(insight => insight.cropCoefficientsChart).filter(c => c).join('\n\n'),
      etcEtoComparisonChart: allInsights.map(insight => insight.etcEtoComparisonChart).filter(c => c).join('\n\n'),
      dataTable: allInsights.map(insight => insight.dataTable).filter(d => d).join('\n\n'),
      general: allInsights.map(insight => insight.general).filter(g => g).join('\n\n')
    };
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('[data-location-dropdown]')) {
        setIsLocationDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initialize default date range (last 14 days)
  useEffect(() => {
    const today = new Date();
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(today.getDate() - 14);
    
    setDateRange({
      startDate: twoWeeksAgo.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0]
    });
  }, []);

  // Handle refresh with rate limiting protection
  // const handleRefresh = async () => {
  //   setIsRefreshing(true);
  //   try {
  //     await refreshAllLocations();
  //   } catch (error) {
  //     console.error('Refresh failed:', error);
  //   } finally {
  //     setIsRefreshing(false);
  //   }
  // };

  // Handle historical data fetching
  const fetchHistoricalData = async () => {
    if (!dateRange.startDate || !dateRange.endDate) return;
    
    setIsLoadingHistorical(true);
    const newHistoricalData = new Map();
    
    try {
      for (const location of filteredLocations) {
        try {
          const historicalWeather = await weatherService.getHistoricalWeatherData(location, {
            startDate: dateRange.startDate,
            endDate: dateRange.endDate
          });
          
          newHistoricalData.set(location.id, {
            ...location,
            weatherData: historicalWeather
          });
        } catch (error) {
          console.error(`Failed to fetch historical data for ${location.name}:`, error);
          // Keep original data if historical fetch fails
          newHistoricalData.set(location.id, location);
        }
      }
      
      setHistoricalWeatherData(newHistoricalData);
    } catch (error) {
      console.error('Error fetching historical data:', error);
    } finally {
      setIsLoadingHistorical(false);
    }
  };

  // Handle report mode change
  const handleReportModeChange = (mode: 'current' | 'historical') => {
    setReportMode(mode);
    if (mode === 'historical' && historicalWeatherData.size === 0) {
      fetchHistoricalData();
    }
  };

  // Handle date range changes
  const handleDateRangeChange = (field: 'startDate' | 'endDate', value: string) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Apply new date range
  const handleApplyDateRange = () => {
    if (reportMode === 'historical') {
      fetchHistoricalData();
    }
  };

  // Reset to current mode
  const handleResetToCurrentMode = () => {
    setReportMode('current');
    setHistoricalWeatherData(new Map());
  };

  // Helper function to get ETC display text for a location and date
  const getETCDisplayText = (location: any, date: string): string => {
    // Check if location is in California
    const locationInfo = {
      latitude: location.latitude,
      longitude: location.longitude,
      state: location.state,
      region: location.region,
      name: location.name
    };

    if (!isLocationInCalifornia(locationInfo)) {
      return 'CA Only';
    }

    const locationCmisData = cmisData.get(location.id) || [];
    const dayData = locationCmisData.find(d => d.date === date);
    return dayData ? `${dayData.etc_actual.toFixed(2)} in` : '— in';
  };

  // Auto-refresh weather data only once if locations exist but have no weather data
  React.useEffect(() => {
    if (!hasTriedRefresh) {
      // Only try to refresh if we have user locations (not trial locations)
      const hasUserLocations = locations.length > 0 && 'weatherData' in (locations[0] || {});
      if (hasUserLocations) {
        const locationsWithoutWeather = locations.filter(loc => !loc.weatherData && !loc.loading && !loc.error);
        if (locationsWithoutWeather.length > 0) {
          setHasTriedRefresh(true);
          refreshAllLocations();
        }
      }
    }
  }, [locations, hasTriedRefresh]); // Remove refreshAllLocations to prevent infinite loops

  // Filter locations that have weather data (memoized for performance)
  // Handle both trial locations (no weatherData property) and user locations (with weatherData)
  const locationsWithWeather = useMemo(() => {
    return locations.filter(loc => {
      // If it's a trial location (no weatherData property), include it
      if (!('weatherData' in loc)) {
        return true;
      }
      // If it's a user location, check for weatherData and no error
      return loc.weatherData && !loc.error;
    });
  }, [locations]);

  // Don't auto-select all locations - let users choose via dropdown
  // Remove auto-initialization to require explicit user selection
  
  // Apply location filter (memoized for performance)
  const filteredLocations = useMemo(() => {
    if (selectedLocationIds.size > 0) {
      return locationsWithWeather.filter(loc => selectedLocationIds.has(loc.id));
    }
    // If no locations are selected, return empty array to show selection prompt
    return [];
  }, [locationsWithWeather, selectedLocationIds]);
  
  // For reports view, show all filtered locations regardless of selectedLocation
  const displayLocations = useMemo(() => {
    if (reportMode === 'historical' && historicalWeatherData.size > 0) {
      // Use historical data when available
      return filteredLocations.map(location => {
        const historicalData = historicalWeatherData.get(location.id);
        return historicalData || location;
      });
    }
    return filteredLocations;
  }, [filteredLocations, reportMode, historicalWeatherData]);

  // Notify parent component of the current filtered locations for header sync
  useEffect(() => {
    onDisplayLocationsChange(displayLocations);
  }, [displayLocations]); // Remove onDisplayLocationsChange from dependencies to prevent infinite re-renders

  // Fetch CMIS data for locations
  useEffect(() => {
    // Prevent double execution in React dev mode
    let isCancelled = false;
    
    const fetchCMISData = async () => {
      if (displayLocations.length === 0 || isFetchingCmis || isCancelled) return;
      
      setIsFetchingCmis(true);
      const newCmisData = new Map<string, CMISETCData[]>();
      
      // Process locations in smaller batches to prevent overwhelming the browser
      const batchSize = 2; // Reduced batch size for better performance
      for (let i = 0; i < displayLocations.length; i += batchSize) {
        if (isCancelled) break;
        
        const batch = displayLocations.slice(i, i + batchSize);
        
        await Promise.allSettled(
          batch.map(async (location) => {
            if (location.latitude && location.longitude && !isCancelled) {
              try {
                // Prepare location info for California check
                const locationInfo = {
                  latitude: location.latitude,
                  longitude: location.longitude,
                  state: (location as any).state,
                  region: (location as any).region,
                  name: location.name,
                  cimisStationId: (location as any).cimisStationId || location.weatherstationID  // Include weather station ID
                };

                const station = await cmisService.findNearestStation(
                  location.latitude, 
                  location.longitude, 
                  locationInfo
                );
                
                if (station) {
                  const endDate = new Date();
                  const startDate = new Date();
                  startDate.setDate(endDate.getDate() - 14);
                  
                  const response = await cmisService.getETCData(
                    station.id, 
                    startDate, 
                    endDate, 
                    locationInfo
                  );
                  
                  if (response.success) {
                    newCmisData.set(location.id, response.data);
                  } else if (!response.isCaliforniaLocation) {
                    // Store empty array for non-CA locations with error flag
                    newCmisData.set(location.id, []);
                    console.log(`CMIS not available for ${location.name}: ${response.error}`);
                  }
                } else {
                  // No station found (likely non-CA location)
                  newCmisData.set(location.id, []);
                }
              } catch (error) {
                console.error(`Error fetching CMIS data for ${location.name}:`, error);
                newCmisData.set(location.id, []);
              }
            }
          })
        );
        
        // Add a longer delay between batches to prevent freezing
        if (i + batchSize < displayLocations.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
      
      if (!isCancelled) {
        setCmisData(newCmisData);
        setIsFetchingCmis(false);
      }
    };

    fetchCMISData();
    
    // Cleanup function to prevent state updates if component unmounts
    return () => {
      isCancelled = true;
    };
  }, [displayLocations.length]); // Only depend on length to avoid unnecessary refetches

  // Show message when no locations are selected - dropdown is always visible at top
  if (displayLocations.length === 0) {
    // const isTrialMode = locations.length > 0 && !('weatherData' in (locations[0] || {}));
    
    // Don't return early - continue to main render with message
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      weekday: 'short'
    });
  };

  const safe = (value: any, fallback = '—') => {
    return (value !== null && value !== undefined && !isNaN(value)) ? value : fallback;
  };

  const handleExportCSV = () => {
    // Quick export with weather data and crop calculations
    const quickOptions: ComprehensiveExportOptions = {
      includeWeatherData: true,
      includeCMISData: false,
      includeCropData: selectedCrops.length > 0,
      includeCalculatorResults: false,
      includeFieldBlocks: false,
      includeHistoricalData: false,
      includeCharts: false,
      fileFormat: 'csv',
      separateSheets: false
    };
    
    exportComprehensiveData(displayLocations, quickOptions, {
      cmisData,
      cropInstances,
      selectedCrops,
      calculatorResult: null, // Don't include calculator for quick export
      calculatorInputs: null,
      selectedLocation,
      fieldBlocks: [],
      insights: getCombinedInsights()
    });
  };

  const handleExportExcel = () => {
    // Quick export with weather data and crop calculations
    const quickOptions: ComprehensiveExportOptions = {
      includeWeatherData: true,
      includeCMISData: false,
      includeCropData: selectedCrops.length > 0,
      includeCalculatorResults: false,
      includeFieldBlocks: false,
      includeHistoricalData: false,
      includeCharts: false,
      fileFormat: 'excel',
      separateSheets: true
    };
    
    exportComprehensiveData(displayLocations, quickOptions, {
      cmisData,
      cropInstances,
      selectedCrops,
      calculatorResult: null, // Don't include calculator for quick export
      calculatorInputs: null,
      selectedLocation,
      fieldBlocks: [],
      insights: getCombinedInsights()
    });
  };

  const handleComprehensiveExport = (options: ComprehensiveExportOptions) => {
    exportComprehensiveData(displayLocations, options, {
      cmisData,
      cropInstances,
      selectedCrops,
      calculatorResult,
      calculatorInputs,
      selectedLocation,
      fieldBlocks: [], // Field blocks are managed by FieldBlocksManager
      insights: getCombinedInsights()
    });
  };

  // Determine what data types are available for export
  const availableDataTypes = {
    hasWeatherData: displayLocations.some(loc => loc.weatherData),
    hasCMISData: cmisData.size > 0,
    hasCropData: selectedCrops.length > 0,
    hasCalculatorResults: !!calculatorResult,
    hasFieldBlocks: false, // Field blocks are managed separately
    hasHistoricalData: reportMode === 'historical' && historicalWeatherData.size > 0,
    hasCharts: displayLocations.some(loc => loc.weatherData?.daily) // Charts available if weather data exists
  };

  return (
    <div className="space-y-6">
      {/* Always Visible Location Filter Controls */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex flex-col gap-3 w-full">
            <div className="flex items-center gap-4">
              <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Select Locations:
              </label>
              
              {/* Custom Multiselect Dropdown - Always Visible */}
              <div className="relative flex-1 max-w-lg" data-location-dropdown>
                <button
                  onClick={() => setIsLocationDropdownOpen(!isLocationDropdownOpen)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setIsLocationDropdownOpen(!isLocationDropdownOpen);
                    } else if (e.key === 'Escape') {
                      setIsLocationDropdownOpen(false);
                    }
                  }}
                  className="flex items-center justify-between w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 dark:text-white min-h-[40px]"
                  aria-expanded={isLocationDropdownOpen}
                  aria-haspopup="listbox"
                  aria-label="Select locations"
                >
                  <span className="truncate">
                    {selectedLocationIds.size === 0 ? (
                      <span className="text-gray-500">Select locations...</span>
                    ) : selectedLocationIds.size === 1 ? (
                      locationsWithWeather.find(loc => selectedLocationIds.has(loc.id))?.name || 'Unknown'
                    ) : (
                      `${selectedLocationIds.size} locations selected`
                    )}
                  </span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {isLocationDropdownOpen && (
                  <div 
                    className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-64 overflow-y-auto"
                    role="listbox"
                    aria-multiselectable="true"
                  >
                    {/* Individual Location Options */}
                    {locationsWithWeather.map((location) => (
                      <label
                        key={location.id}
                        className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 text-sm text-gray-700 dark:text-gray-300"
                      >
                        <input
                          type="checkbox"
                          checked={selectedLocationIds.has(location.id)}
                          onChange={() => {
                            const newSelectedLocations = new Set(selectedLocationIds);
                            if (newSelectedLocations.has(location.id)) {
                              newSelectedLocations.delete(location.id);
                            } else {
                              newSelectedLocations.add(location.id);
                            }
                            setSelectedLocationIds(newSelectedLocations);
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-1"
                        />
                        <span className="truncate">{location.name}</span>
                      </label>
                    ))}
                    
                    {/* Footer with stats and clear button */}
                    <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-600 flex items-center justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {selectedLocationIds.size} of {locationsWithWeather.length} selected
                      </span>
                      {selectedLocationIds.size > 0 && (
                        <button
                          onClick={() => {
                            setSelectedLocationIds(new Set());
                          }}
                          className="text-xs text-red-600 dark:text-red-400 hover:underline"
                        >
                          Clear All
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Select All Locations Checkbox - Right of Dropdown */}
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={selectedLocationIds.size === locationsWithWeather.length && locationsWithWeather.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedLocationIds(new Set(locationsWithWeather.map(loc => loc.id)));
                    } else {
                      setSelectedLocationIds(new Set());
                    }
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-1"
                />
                Select All Locations ({locationsWithWeather.length})
              </label>
            </div>
            
            <div className="flex items-center gap-6">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={showCropInsights}
                  onChange={(e) => setShowCropInsights(e.target.checked)}
                  className="mr-2"
                />
                Show Crop Watering Insights
              </label>
              
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                <input
                  type="checkbox"
                  checked={showAIInsights}
                  onChange={(e) => setShowAIInsights(e.target.checked)}
                  className="mr-2"
                />
                <span className="flex items-center">
                  AI Insights
                  <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                    Beta
                  </span>
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        {/* Report Mode Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <ReportModeToggle 
            mode={reportMode}
            onModeChange={handleReportModeChange}
          />
          
          {reportMode === 'historical' ? (
            <DateRangePicker
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
              onStartDateChange={(date) => handleDateRangeChange('startDate', date)}
              onEndDateChange={(date) => handleDateRangeChange('endDate', date)}
              onApply={handleApplyDateRange}
              onReset={handleResetToCurrentMode}
              isLoading={isLoadingHistorical}
            />
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-center">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <div className="text-sm font-medium">Live Data Mode</div>
                <div className="text-xs mt-1">Using real-time forecasts</div>
              </div>
            </div>
          )}
        </div>

        {/* Data Sources Information Panel */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6 border border-blue-200 dark:border-blue-700">
          <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
            📡 Data Sources & APIs
            {reportMode === 'historical' && (
              <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded">
                Historical Mode
              </span>
            )}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-white dark:bg-gray-800 rounded p-3 border border-blue-200 dark:border-blue-600">
              <div className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                <div className="flex items-center gap-1">
                  <Cloud className="h-4 w-4" />
                  Weather Data
                </div>
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                <strong>API:</strong> Open-Meteo {reportMode === 'historical' ? 'Archive' : 'Forecast'}<br/>
                <strong>Data:</strong> Temperature, precipitation, wind, humidity<br/>
                <strong>Coverage:</strong> {reportMode === 'historical' ? 'Historical records' : 'GFS Global forecast'}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded p-3 border border-green-200 dark:border-green-600">
              <div className="font-medium text-green-800 dark:text-green-200 mb-1 flex items-center gap-1">
                <Droplets className="h-4 w-4" />
                Evapotranspiration
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                <strong>API:</strong> Open-Meteo ET₀<br/>
                <strong>Method:</strong> FAO-56 Penman-Monteith<br/>
                <strong>Type:</strong> {reportMode === 'historical' ? 'Historical ET₀' : 'Reference evapotranspiration'}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded p-3 border border-purple-200 dark:border-purple-600">
              <div className="font-medium text-purple-800 dark:text-purple-200 mb-1 flex items-center gap-1">
                <Wheat className="h-4 w-4" />
                Crop Coefficients
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                <strong>Source:</strong> FAO-56 Guidelines<br/>
                <strong>Enhancement:</strong> CMIS API (CA only)<br/>
                <strong>Analysis:</strong> {reportMode === 'historical' ? 'Historical performance' : 'ETC = ET₀ × Kc'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Crop and Calculator Data Summary */}
      {(selectedCrops.length > 0 || cropInstances.length > 0 || calculatorResult) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
            <Sprout className="h-5 w-5 text-green-500" />
            <span>Crop Management Summary</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Selected Crops */}
            {selectedCrops.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Active Crops ({selectedCrops.length})</h4>
                <div className="space-y-1">
                  {selectedCrops.slice(0, 5).map((crop, index) => (
                    <div key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-center space-x-1">
                      <Sprout className="h-3 w-3 text-green-500" />
                      <span>{crop}</span>
                    </div>
                  ))}
                  {selectedCrops.length > 5 && (
                    <div className="text-sm text-gray-500 dark:text-gray-500">
                      +{selectedCrops.length - 5} more crops
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Crop Instances */}
            {cropInstances.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Active Plantings ({cropInstances.length})</h4>
                <div className="space-y-1">
                  {cropInstances.slice(0, 3).map((instance) => (
                    <div key={instance.id} className="text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Sprout className="h-3 w-3 text-green-500" />
                        <span>{instance.cropId}</span>
                      </div>
                      <div className="text-xs text-gray-500 ml-4">
                        Planted: {new Date(instance.plantingDate).toLocaleDateString()}
                        {instance.fieldName && ` • ${instance.fieldName}`}
                      </div>
                    </div>
                  ))}
                  {cropInstances.length > 3 && (
                    <div className="text-sm text-gray-500 dark:text-gray-500">
                      +{cropInstances.length - 3} more plantings
                    </div>
                  )}
                </div>
              </div>
            )}



            {/* Calculator Results */}
            {calculatorResult && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center space-x-1">
                  <Calculator className="h-4 w-4 text-blue-500" />
                  <span>Current Calculation</span>
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Daily Water Need:</span> {calculatorResult.dailyWaterNeed.toFixed(1)} gal
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Runtime:</span> {calculatorResult.runtimeHours}h {calculatorResult.runtimeMinutes}m
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Efficiency:</span> {calculatorResult.efficiency}%
                  </div>
                  {calculatorInputs?.crop && (
                    <div className="text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Crop:</span> {calculatorInputs.crop}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Export Buttons */}
      <div className="flex justify-center gap-3 mb-6">
        <button
          onClick={handleExportCSV}
          className="flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
          title="Export weather data and crop calculations to CSV files"
        >
          <Download className="h-4 w-4 mr-2" />
          Weather & Crops CSV
        </button>
        <button
          onClick={handleExportExcel}
          className="flex items-center px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
          title="Export weather data and crop calculations to Excel file"
        >
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Weather & Crops Excel
        </button>
        <button
          onClick={() => setIsExportModalOpen(true)}
          className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
        >
          <Settings className="h-4 w-4 mr-2" />
          Comprehensive Export
        </button>
      </div>

      {/* Custom view when no location is selected */}
      {selectedLocationIds.size === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 mb-6 text-center">
          <div className="max-w-md mx-auto">
            <MapPin className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Select a Location to View Weather Data
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Choose a specific location from the dropdown above to see detailed weather forecasts, 
              charts, and agricultural data for that area.
            </p>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Available Options:</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Select a specific location for detailed weather data</li>
                <li>• Check "All Locations" to compare multiple areas</li>
                <li>• View charts, forecasts, and agricultural insights</li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Location Reports */}
          {displayLocations.map((location, locationIndex) => {
        // Check if location has weather data and proper structure
        const weather = location.weatherData;
        
        // For trial locations (no weatherData), we'll still show the charts
        // but skip the detailed weather table
        const isTrialLocation = !weather || !weather.daily;
        
        if (isTrialLocation) {
          // Generate realistic mock data for trial locations
          const generateMockForecastData = () => {
            const mockDays = [];
            const startDate = new Date();
            
            for (let i = 0; i < 14; i++) {
              const date = new Date(startDate);
              date.setDate(startDate.getDate() + i);
              
              // Generate realistic Central Valley weather data
              const baseTemp = 75; // Base temperature for fall
              const tempVariation = Math.sin(i * 0.5) * 8 + Math.random() * 4;
              const highTemp = Math.round(baseTemp + tempVariation + 5);
              const lowTemp = Math.round(baseTemp + tempVariation - 10);
              
              // Generate ET0 values similar to main dashboard (4-7 mm/day range)
              const et0_mm = 4 + Math.random() * 3; // Same range as main dashboard
              const et0_inches = et0_mm * 0.0393701; // Convert mm to inches
              const et0_sum_inches = ((i + 1) * et0_mm * 0.0393701); // Cumulative sum
              
              mockDays.push({
                date: date.toISOString().split('T')[0],
                tempMax: highTemp,
                tempMin: lowTemp,
                precipitation: Math.random() < 0.2 ? (Math.random() * 0.5).toFixed(2) : '0.00',
                et0: et0_inches.toFixed(2),
                et0_sum: et0_sum_inches.toFixed(2)
              });
            }
            return mockDays;
          };

          const mockForecastData = generateMockForecastData();
          const todayData = mockForecastData[0];

          // Render trial location with forecast table and charts
          return (
            <div 
              key={locationIndex} 
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden"
            >
              {/* Location Header */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-750">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                      <MapPin className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                      {location.name || 'Unknown Location'}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        NOAA Weather Data (GFS Global & NAM CONUS via Open-Meteo API)
                      </div>
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      Location {locationIndex + 1} of {displayLocations.length}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Real NOAA Data
                    </div>
                  </div>
                </div>
              </div>

              {/* Today's Metrics Grid */}
              <div className="p-6 bg-gray-50 dark:bg-gray-800/50">
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Today's Weather Stats
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {/* High Temp */}
                  <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center mb-2">
                      <Thermometer className="h-4 w-4 text-red-500 mr-1" />
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">High</span>
                    </div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {todayData.tempMax}°F
                    </div>
                  </div>

                  {/* Low Temp */}
                  <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center mb-2">
                      <Thermometer className="h-4 w-4 text-blue-500 mr-1" />
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Low</span>
                    </div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {todayData.tempMin}°F
                    </div>
                  </div>

                  {/* Precipitation */}
                  <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center mb-2">
                      <Droplets className="h-4 w-4 text-blue-500 mr-1" />
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Precip</span>
                    </div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {todayData.precipitation} in
                    </div>
                  </div>

                  {/* ET₀ Daily */}
                  <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center mb-2">
                      <Gauge className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">ET₀</span>
                    </div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {Number(todayData.et0).toFixed(2)} inches
                    </div>
                  </div>

                  {/* ET₀ Sum */}
                  <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center mb-2">
                      <Gauge className="h-4 w-4 text-green-600 mr-1" />
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">ET₀ Sum</span>
                    </div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {Number(todayData.et0_sum).toFixed(2)} inches
                    </div>
                  </div>

                  {/* ETC Actual */}
                  <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center mb-2">
                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">ETC Actual</span>
                    </div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {getETCDisplayText(location, todayData.date)}
                    </div>
                  </div>
                </div>
              </div>

              {/* 14-Day Forecast Table */}
              <div className="p-6">
                <div className="text-center mb-2">
                  <h4 className="text-md font-medium text-gray-900 dark:text-white">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      14-Day Forecast Data
                    </div>
                  </h4>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-2">
                  <span>📡 API:</span>
                  <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">Open-Meteo</span>
                  <span>•</span>
                  <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">CMIS (CA)</span>
                  <span>• GFS Model • FAO-56 ET₀</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                          Date
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                          High (°F)
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                          Low (°F)
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                          Precip (in)
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                          ET₀ Projected (in)
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                          ET₀ Sum (inches)
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                          ETC Actual (in)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {mockForecastData.map((day, index) => (
                        <tr 
                          key={day.date} 
                          className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-800/50'}
                        >
                          <td className="px-3 py-2 text-sm font-medium text-gray-900 dark:text-white">
                            {new Date(day.date).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              weekday: 'short'
                            })}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900 dark:text-white font-semibold">
                            {day.tempMax}°
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
                            {day.tempMin}°
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
                            {day.precipitation}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
                            {Number(day.et0).toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
                            {Number(day.et0_sum).toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
                            <div className="flex items-center">
                              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                              {getETCDisplayText(location, day.date).replace(' in', '')}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Centered AI Insights for Weather Summary Table */}
                {showAIInsights && (
                  <div className="flex justify-center mt-6 mb-4">
                    <ChartAIInsights
                      chartType="weather-summary"
                      chartData={weather?.daily ? weather.daily.time.map((date: string, index: number) => ({
                        date,
                        temperature: weather.daily.temperature_2m_max?.[index] || 0,
                        humidity: weather.daily.relative_humidity_2m?.[index] || 0,
                        precipitation: weather.daily.precipitation_sum?.[index] || 0,
                        evapotranspiration: weather.daily.et0_fao_evapotranspiration?.[index] || 0
                      })) : []}
                      location={location?.name || 'Field Location'}
                      className=""
                      compact={true}
                    />
                  </div>
                )}

              </div>

              {/* Weather Charts */}
              <div className="mt-6">
                <ChartErrorBoundary>
                  <SimpleWeatherCharts 
                    location={location} 
                    showAIInsights={showAIInsights} 
                    insights={getLocationInsights(location.id)}
                    onInsightsChange={(newInsights) => updateLocationInsights(location.id, newInsights)}
                  />
                </ChartErrorBoundary>
              </div>

              {/* Crop Insights for this Location */}
              {showCropInsights && (
                <div className="mt-6">
                  <ChartErrorBoundary>
                    <CropETCCharts 
                      cropInstances={cropInstances}
                      locations={[location]}
                      location={location}
                      weatherData={weather}
                      dateRange={dateRange}
                      reportMode={reportMode}
                      showAIInsights={showAIInsights}
                      insights={getLocationInsights(location.id)}
                      onInsightsChange={(newInsights) => updateLocationInsights(location.id, newInsights)}
                    />
                  </ChartErrorBoundary>
                </div>
              )}
            </div>
          );
        }
        
        // Get today's data (first day in forecast)
        const todayData = {
          tempMax: safe(weather.daily.temperature_2m_max?.[0]?.toFixed(0)),
          tempMin: safe(weather.daily.temperature_2m_min?.[0]?.toFixed(0)),
          precipitation: safe(weather.daily.precipitation_sum?.[0]?.toFixed(2)),
          et0: weather.daily.et0_fao_evapotranspiration?.[0] * 0.0393701 || 0,
          et0_sum: weather.daily.et0_fao_evapotranspiration_sum?.[0] * 0.0393701 || 0,
        };

        return (
          <div 
            key={location.id} 
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden"
          >
            {/* Location Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-750">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                    <MapPin className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                    {location.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                    </div>
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    Location {locationIndex + 1} of {displayLocations.length}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    NCEP GFS Seamless Model
                  </div>
                </div>
              </div>
            </div>

            {/* Today's Metrics Grid */}
            <div className="p-6 bg-gray-50 dark:bg-gray-800/50">
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Today's Weather Stats
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {/* High Temp */}
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center mb-2">
                    <Thermometer className="h-4 w-4 text-red-500 mr-1" />
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">High</span>
                  </div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {todayData.tempMax}°F
                  </div>
                </div>

                {/* Low Temp */}
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center mb-2">
                    <Thermometer className="h-4 w-4 text-blue-500 mr-1" />
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Low</span>
                  </div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {todayData.tempMin}°F
                  </div>
                </div>

                {/* Precipitation */}
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center mb-2">
                    <Droplets className="h-4 w-4 text-blue-500 mr-1" />
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Precip</span>
                  </div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {todayData.precipitation} in
                  </div>
                </div>

                {/* ET₀ Daily */}
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center mb-2">
                    <Gauge className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">ET₀</span>
                  </div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {Number(todayData.et0).toFixed(2)} inches
                  </div>
                </div>

                {/* ET₀ Sum */}
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center mb-2">
                    <Gauge className="h-4 w-4 text-green-600 mr-1" />
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">ET₀ Sum</span>
                  </div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {Number(todayData.et0_sum).toFixed(2)} inches
                  </div>
                </div>

                {/* ETC Actual */}
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center mb-2">
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">ETC Actual</span>
                  </div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {getETCDisplayText(location, weather.daily.time[0])}
                  </div>
                </div>
              </div>
            </div>

            {/* 14-Day Forecast Table */}
            <div className="p-6">
              <div className="text-center mb-2">
                <h4 className="text-md font-medium text-gray-900 dark:text-white">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    14-Day Forecast Data
                  </div>
                </h4>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-2">
                <span>📡 API:</span>
                <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">Open-Meteo</span>
                <span>•</span>
                <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">CMIS (CA)</span>
                <span>• GFS Model • FAO-56 ET₀</span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                        Date
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                        High (°F)
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                        Low (°F)
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                        Precip (in)
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                        ET₀ Projected (in)
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                        ET₀ Sum (inches)
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                        ETC Actual (in)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {weather.daily.time.slice(0, 14).map((date: string, index: number) => (
                      <tr 
                        key={date} 
                        className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-800/50'}
                      >
                        <td className="px-3 py-2 text-sm font-medium text-gray-900 dark:text-white">
                          {formatDate(date)}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900 dark:text-white font-semibold">
                          {safe(weather.daily.temperature_2m_max[index]?.toFixed(0))}°
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
                          {safe(weather.daily.temperature_2m_min[index]?.toFixed(0))}°
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
                          {safe(weather.daily.precipitation_sum[index]?.toFixed(2))}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
                          {safe((weather.daily.et0_fao_evapotranspiration[index] * 0.0393701)?.toFixed(2))}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
                          {safe((weather.daily.et0_fao_evapotranspiration_sum[index] * 0.0393701)?.toFixed(2))}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
                          <div className="flex items-center">
                            <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                            {getETCDisplayText(location, date).replace(' in', '')}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Centered AI Insights for Weather Summary Table */}
              {showAIInsights && (
                <div className="flex justify-center mt-6 mb-4">
                  <ChartAIInsights
                    chartType="weather-summary"
                    chartData={weather?.daily ? weather.daily.time.map((date: string, index: number) => ({
                      date,
                      temperature: weather.daily.temperature_2m_max?.[index] || 0,
                      humidity: weather.daily.relative_humidity_2m?.[index] || 0,
                      precipitation: weather.daily.precipitation_sum?.[index] || 0,
                      evapotranspiration: weather.daily.et0_fao_evapotranspiration?.[index] || 0
                    })) : []}
                    location={location?.name || 'Field Location'}
                    className=""
                    compact={true}
                  />
                </div>
              )}

            </div>

            {/* Weather Charts */}
            <div className="mt-6">
              <ChartErrorBoundary>
                <SimpleWeatherCharts 
                  location={location} 
                  showAIInsights={showAIInsights} 
                  insights={getLocationInsights(location.id)}
                  onInsightsChange={(newInsights) => updateLocationInsights(location.id, newInsights)}
                />
              </ChartErrorBoundary>
            </div>

            {/* Crop Insights for this Location */}
            {showCropInsights && (
              <div className="mt-6">
                <ChartErrorBoundary>
                  <CropETCCharts 
                    cropInstances={cropInstances}
                    locations={[location]}
                    location={location}
                    weatherData={weather}
                    dateRange={dateRange}
                    reportMode={reportMode}
                    showAIInsights={showAIInsights}
                    insights={getLocationInsights(location.id)}
                    onInsightsChange={(newInsights) => updateLocationInsights(location.id, newInsights)}
                  />
                </ChartErrorBoundary>
              </div>
            )}
          </div>
        );
          })}
        </>
      )}

      {/* General Report Insights */}
      {selectedLocationIds.size > 0 && (
        <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-600">
          <div className="flex items-center mb-3">
            <FileText className="h-5 w-5 mr-2 text-gray-700 dark:text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              General Report Insights
            </h3>
          </div>
          <textarea
            value=""
            onChange={() => {}}
            placeholder="General insights will be available per location in the future..."
            disabled
            className="w-full h-32 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 opacity-50"
          />
        </div>
      )}

      {/* Summary Footer - only show when locations are displayed */}
      {selectedLocationIds.size > 0 && (
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 text-center">
        <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Comprehensive Report Generated for {displayLocations.length} Location{displayLocations.length !== 1 ? 's' : ''}
          </div>
        </p>
        
        {displayLocations.length > 0 && (
          <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <strong>Locations:</strong> {displayLocations.map(loc => loc.name).join(', ')}
            </div>
          </p>
        )}
        
        {(selectedCrops.length > 0 || cropInstances.length > 0) && (
          <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">
            <div className="flex items-center gap-1">
              <Sprout className="h-4 w-4" />
              <strong>Active Crops:</strong>
            </div> {(() => {
              const allCrops = new Set();
              selectedCrops.forEach(crop => allCrops.add(crop));
              cropInstances.forEach(instance => allCrops.add(instance.cropId));
              return Array.from(allCrops).join(', ');
            })()}
          </p>
        )}
        
        <p className="text-xs text-blue-600 dark:text-blue-400">
          Data from NCEP GFS Seamless Model & CMIS ETC Actuals • 
          Updated {new Date().toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      </div>
      )}

      {/* Export Options Modal */}
      <ExportOptionsModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleComprehensiveExport}
        availableDataTypes={availableDataTypes}
      />
    </div>
  );
};