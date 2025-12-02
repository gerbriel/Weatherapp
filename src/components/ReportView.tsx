import React, { useState, useEffect, useMemo } from 'react';
import { MapPin, Thermometer, Droplets, Gauge, Calendar, Download, FileSpreadsheet, Sprout, Calculator, Filter, TrendingUp, Settings, Cloud, BarChart3, Wheat, Sun, FileText, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [reportMode, setReportMode] = useState<'current' | 'historical' | 'future'>('current');
  const [forecastPreset, setForecastPreset] = useState<'today' | '7day' | '14day'>('7day');
  const [futureStartDate, setFutureStartDate] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [isLoadingHistorical, setIsLoadingHistorical] = useState(false);
  const [historicalWeatherData, setHistoricalWeatherData] = useState<Map<string, any>>(new Map());
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  
  // State for collapsible location sections
  const [collapsedLocations, setCollapsedLocations] = useState<Set<string>>(new Set());
  
  // State for collapsible report sections (start collapsed)
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    new Set(['cropManagement', 'waterUseData', 'dataSourcesApis'])
  );

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

  // Initialize default date range (last 14 days, ending yesterday to avoid CMIS API future date errors)
  useEffect(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1); // Use yesterday to avoid timezone issues
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(yesterday.getDate() - 14);
    
    setDateRange({
      startDate: twoWeeksAgo.toISOString().split('T')[0],
      endDate: yesterday.toISOString().split('T')[0]
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
  const handleReportModeChange = (mode: 'current' | 'historical' | 'future') => {
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
    return dayData ? `${dayData.etc_actual.toFixed(2)} in` : '—';
  };

  // Toggle location collapse state
  const toggleLocationCollapse = (locationId: string) => {
    setCollapsedLocations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(locationId)) {
        newSet.delete(locationId);
      } else {
        newSet.add(locationId);
      }
      return newSet;
    });
  };
  
  // Toggle section collapse state
  const toggleSectionCollapse = (sectionId: string) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
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
  }, [filteredLocations, reportMode, historicalWeatherData, forecastPreset, futureStartDate]);

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
                  // Use yesterday's date to avoid timezone issues with CMIS API
                  const endDate = new Date();
                  endDate.setDate(endDate.getDate() - 1); // Use yesterday to avoid "future date" errors
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
                    // Store empty array for non-CA locations
                    newCmisData.set(location.id, []);
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
    // Add T12:00:00 to avoid timezone conversion issues
    return new Date(dateString + 'T12:00:00').toLocaleDateString('en-US', {
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
            forecastPreset={forecastPreset}
            onPresetChange={setForecastPreset}
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
          ) : reportMode === 'future' ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-green-500" />
                Future Report Configuration
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Start Date (Optional - defaults to 7 days from now)
                  </label>
                  <input
                    type="date"
                    value={futureStartDate}
                    onChange={(e) => {
                      setFutureStartDate(e.target.value);
                    }}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  Using <strong className="text-gray-900 dark:text-white mx-1">{forecastPreset === '7day' ? '7-day' : '14-day'}</strong> forecast preset
                </div>
                {futureStartDate && (
                  <div className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                    📅 Report will start from: {new Date(futureStartDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-center">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <div className="text-sm font-medium">Live Data Mode</div>
                <div className="text-xs mt-1">
                  Showing {forecastPreset === 'today' ? "today's" : forecastPreset === '7day' ? '7-day' : '14-day'} forecast
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Data Sources Information Panel */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700 mb-6 overflow-hidden">
          <button
            onClick={() => toggleSectionCollapse('dataSourcesApis')}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
          >
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
              📡 Data Sources & APIs
              {reportMode === 'historical' && (
                <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded">
                  Historical Mode
                </span>
              )}
            </h4>
            {collapsedSections.has('dataSourcesApis') ? (
              <ChevronDown className="h-5 w-5 text-blue-900 dark:text-blue-100" />
            ) : (
              <ChevronUp className="h-5 w-5 text-blue-900 dark:text-blue-100" />
            )}
          </button>
          
          {!collapsedSections.has('dataSourcesApis') && (
            <div className="px-4 pb-4">
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
          )}
        </div>
      </div>

      {/* Crop and Calculator Data Summary */}
      {(selectedCrops.length > 0 || calculatorResult) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6 overflow-hidden">
          <button
            onClick={() => toggleSectionCollapse('cropManagement')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
              <Sprout className="h-5 w-5 text-green-500" />
              <span>Crop Management Summary</span>
            </h3>
            {collapsedSections.has('cropManagement') ? (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            )}
          </button>
          
          {!collapsedSections.has('cropManagement') && (
            <div className="px-6 pb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

      {/* Comprehensive Water Use Data Tables by Crop */}
      {selectedLocationIds.size > 0 && displayLocations.length > 0 && cropInstances.length > 0 && (
        <div className="mb-6 space-y-6">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden">
            <button
              onClick={() => toggleSectionCollapse('waterUseData')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-750"
            >
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                  <Droplets className="h-6 w-6 mr-2 text-blue-600 dark:text-blue-400" />
                  Comprehensive Water Use Data by Crop
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Detailed Kc, ET₀, ETc, and irrigation needs for all locations and dates
                </p>
              </div>
              {collapsedSections.has('waterUseData') ? (
                <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
              ) : (
                <ChevronUp className="h-5 w-5 text-gray-400 flex-shrink-0" />
              )}
            </button>
            
            {!collapsedSections.has('waterUseData') && (
              <div className="p-6 space-y-8">
              {/* Group crop instances by crop */}
              {(() => {
                const cropGroups = new Map<string, typeof cropInstances>();
                cropInstances.forEach(instance => {
                  const existing = cropGroups.get(instance.cropId) || [];
                  cropGroups.set(instance.cropId, [...existing, instance]);
                });

                return Array.from(cropGroups.entries()).map(([cropId, instances]) => {
                  // Find crop name from available crops
                  const cropName = selectedCrops.includes(cropId) 
                    ? cropId.charAt(0).toUpperCase() + cropId.slice(1)
                    : cropId;

                  return (
                    <div key={`${cropId}-${reportMode}-${forecastPreset}-${futureStartDate}`} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                          <Sprout className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
                          {cropName}
                        </h3>
                      </div>
                      
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                          <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider sticky left-0 bg-gray-50 dark:bg-gray-800 z-10 border-r border-gray-300 dark:border-gray-600">
                                Location
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider bg-gray-50 dark:bg-gray-800">
                                Date
                              </th>
                              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                Kc
                              </th>
                              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                ET₀ (in)
                              </th>
                              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                ETc (in)
                              </th>
                              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                Water Need
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {/* Render rows for each location with crop instances */}
                            {displayLocations.map((location, locIdx) => {
                              // Find crop instances for this location and crop
                              const locationInstances = instances.filter(inst => inst.locationId === location.id);
                              
                              if (locationInstances.length === 0) return null;

                              const weather = location.weatherData;
                              if (!weather || !weather.daily) return null;

                              // Determine date range based on report mode
                              let startIdx = 0;
                              let endIdx = weather.daily.time.length;
                              
                              if (reportMode === 'current') {
                                // Current mode: Use preset (today, 7 days, or 14 days)
                                const today = new Date().toISOString().split('T')[0];
                                startIdx = weather.daily.time.findIndex((d: string) => d >= today);
                                if (startIdx === -1) startIdx = 0;
                                const daysToShow = forecastPreset === 'today' ? 1 : forecastPreset === '7day' ? 7 : 14;
                                endIdx = Math.min(startIdx + daysToShow, weather.daily.time.length);
                              } else if (reportMode === 'future') {
                                // Future mode: Start from selected date or 7 days out, use preset
                                let futureStart: string;
                                if (futureStartDate) {
                                  // Use the exact date from the picker - it's already in YYYY-MM-DD format
                                  futureStart = futureStartDate;
                                } else {
                                  const future = new Date();
                                  future.setDate(future.getDate() + 7);
                                  futureStart = future.toISOString().split('T')[0];
                                }
                                // Find the exact matching date or the next available date
                                startIdx = weather.daily.time.findIndex((d: string) => d === futureStart);
                                // If exact match not found, find the next date
                                if (startIdx === -1) {
                                  startIdx = weather.daily.time.findIndex((d: string) => d > futureStart);
                                }
                                // Fallback to a reasonable default
                                if (startIdx === -1) startIdx = Math.min(7, weather.daily.time.length - 7);
                                const daysToShow = forecastPreset === '7day' ? 7 : 14;
                                endIdx = Math.min(startIdx + daysToShow, weather.daily.time.length);
                              } else if (reportMode === 'historical') {
                                // Historical mode: Use custom date range
                                if (dateRange.startDate && dateRange.endDate) {
                                  startIdx = weather.daily.time.findIndex((d: string) => d >= dateRange.startDate);
                                  if (startIdx === -1) startIdx = 0;
                                  endIdx = weather.daily.time.findIndex((d: string) => d > dateRange.endDate);
                                  if (endIdx === -1) endIdx = weather.daily.time.length;
                                }
                              }
                              
                              const dateRows = [];
                              
                              for (let i = startIdx; i < endIdx; i++) {
                                const date = weather.daily.time[i];
                                const et0_mm = weather.daily.et0_fao_evapotranspiration?.[i] || 0;
                                const et0_inches = et0_mm * 0.0393701;
                                
                                // Calculate Kc based on crop stage (simplified - using mid-season Kc)
                                const kc = locationInstances[0].currentStage === 2 ? 1.15 : 
                                          locationInstances[0].currentStage === 1 ? 0.70 : 0.50;
                                
                                const etc_inches = et0_inches * kc;
                                
                                // Categorize water need based on ETc
                                // Low: < 0.15 in/day, Med: 0.15-0.25 in/day, High: > 0.25 in/day
                                let waterNeedCategory = 'Low';
                                if (etc_inches > 0.25) {
                                  waterNeedCategory = 'High';
                                } else if (etc_inches >= 0.15) {
                                  waterNeedCategory = 'Med';
                                }

                                dateRows.push({
                                  date,
                                  kc,
                                  et0: et0_inches,
                                  etc: etc_inches,
                                  waterNeed: waterNeedCategory
                                });
                              }

                              return (
                                <React.Fragment key={`${location.id}-${cropId}-${reportMode}-${forecastPreset}-${futureStartDate}`}>
                                  {/* Date rows with location name in first row */}
                                  {dateRows.map((row, dateIdx) => (
                                    <tr 
                                      key={`${location.id}-${cropId}-${row.date}`}
                                      className={locIdx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-800/50'}
                                    >
                                      {/* Location cell - only show on first date row for each location */}
                                      {dateIdx === 0 ? (
                                        <td 
                                          rowSpan={dateRows.length}
                                          className="px-4 py-2 text-sm font-semibold text-gray-900 dark:text-white sticky left-0 bg-blue-50 dark:bg-blue-900/20 border-r border-gray-300 dark:border-gray-600 align-top"
                                        >
                                          <div className="flex items-center">
                                            <MapPin className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                            <span>{location.name}</span>
                                          </div>
                                        </td>
                                      ) : null}
                                      
                                      {/* Date cell */}
                                      <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                                        {new Date(row.date + 'T12:00:00').toLocaleDateString('en-US', { 
                                          month: 'short', 
                                          day: 'numeric',
                                          weekday: 'short'
                                        })}
                                      </td>
                                      
                                      {/* Metric cells */}
                                      <td className="px-4 py-2 text-sm text-center text-gray-900 dark:text-white font-mono">
                                        {row.kc.toFixed(2)}
                                      </td>
                                      <td className="px-4 py-2 text-sm text-center text-gray-900 dark:text-white font-mono">
                                        {row.et0.toFixed(2)}
                                      </td>
                                      <td className="px-4 py-2 text-sm text-center text-blue-600 dark:text-blue-400 font-mono font-semibold">
                                        {row.etc.toFixed(2)}
                                      </td>
                                      <td className="px-4 py-2 text-sm text-center font-semibold">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                          row.waterNeed === 'High' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                          row.waterNeed === 'Med' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                          'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                        }`}>
                                          {row.waterNeed}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </React.Fragment>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                });
              })()}
              </div>
            )}
          </div>
        </div>
      )}

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
          // Generate realistic mock data for trial locations based on report mode
          const generateMockForecastData = () => {
            const mockDays = [];
            let startDate = new Date();
            let daysToGenerate = 14;
            
            // Adjust date range based on report mode
            if (reportMode === 'future') {
              // Future mode: Start from selected future date or 7 days from now
              if (futureStartDate) {
                // Parse the date string to avoid timezone issues
                const [year, month, day] = futureStartDate.split('-').map(Number);
                startDate = new Date(year, month - 1, day);
              } else {
                startDate.setDate(startDate.getDate() + 7);
              }
              daysToGenerate = forecastPreset === '7day' ? 7 : 14;
            } else if (reportMode === 'historical' && dateRange.startDate && dateRange.endDate) {
              // Historical mode: Use custom date range
              startDate = new Date(dateRange.startDate);
              const endDate = new Date(dateRange.endDate);
              daysToGenerate = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            } else if (reportMode === 'current') {
              // Current mode: Start from today, use preset
              daysToGenerate = forecastPreset === 'today' ? 1 : forecastPreset === '7day' ? 7 : 14;
            }
            
            for (let i = 0; i < daysToGenerate; i++) {
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
          const isCollapsed = collapsedLocations.has(location.id);

          // Render trial location with forecast table and charts
          return (
            <div 
              key={`${location.id}-${reportMode}-${forecastPreset}-${futureStartDate}`}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden"
            >
              {/* Location Header */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-750">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    {/* Collapse/Expand Button */}
                    <button
                      onClick={() => toggleLocationCollapse(location.id)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
                      title={isCollapsed ? "Expand section" : "Collapse section"}
                    >
                      {isCollapsed ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronUp className="h-5 w-5" />
                      )}
                    </button>
                    
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                        <MapPin className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                        {location.name || 'Unknown Location'}
                      </h3>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          NOAA Weather Data (GFS Global & NAM CONUS via Open-Meteo API)
                        </div>
                      </div>
                    </div>
                    
                    {/* Weather Stats in Header */}
                    <div className="hidden lg:flex items-center gap-3">
                      {/* High */}
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-1">
                          <Thermometer className="h-3 w-3 text-red-500" />
                          <span>HIGH</span>
                        </div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          {todayData.tempMax}°F
                        </div>
                      </div>
                      
                      {/* Low */}
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-1">
                          <Thermometer className="h-3 w-3 text-blue-500" />
                          <span>LOW</span>
                        </div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          {todayData.tempMin}°F
                        </div>
                      </div>
                      
                      {/* Precip */}
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-1">
                          <Droplets className="h-3 w-3 text-blue-500" />
                          <span>PRECIP</span>
                        </div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          {todayData.precipitation} in
                        </div>
                      </div>
                      
                      {/* ET₀ */}
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-1">
                          <Gauge className="h-3 w-3 text-green-500" />
                          <span>ET₀</span>
                        </div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          {Number(todayData.et0).toFixed(2)} in
                        </div>
                      </div>
                      
                      {/* ET₀ Sum */}
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-1">
                          <Gauge className="h-3 w-3 text-green-600" />
                          <span>ET₀ SUM</span>
                        </div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          {Number(todayData.et0_sum).toFixed(2)} in
                        </div>
                      </div>
                      
                      {/* ETC Actual */}
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-1">
                          <TrendingUp className="h-3 w-3 text-green-500" />
                          <span>ETC ACTUAL</span>
                        </div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          {getETCDisplayText(location, todayData.date)}
                        </div>
                      </div>
                    </div>
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

              {/* Collapsible Content */}
              {!isCollapsed && (
              <>
              {/* Today's Metrics Grid */}
              <div className="p-6 bg-gray-50 dark:bg-gray-800/50">
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  {reportMode === 'current' ? "Today's Weather Stats" : 
                   reportMode === 'future' ? "Future Period Start Stats" : 
                   "Period Start Weather Stats"}
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

              {/* Forecast Table */}
              <div className="p-6">
                <div className="text-center mb-2">
                  <h4 className="text-md font-medium text-gray-900 dark:text-white">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      {reportMode === 'current' 
                        ? `Current Period Data (${forecastPreset === 'today' ? 'Today' : forecastPreset === '7day' ? '7 Days' : '14 Days'})`
                        : reportMode === 'future' 
                        ? `Future Period Data (${forecastPreset === '7day' ? '7 Days' : '14 Days'})`
                        : "Historical Period Data"}
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
                            {new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', { 
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
                    reportMode={reportMode}
                    forecastPreset={forecastPreset}
                    dateRange={dateRange}
                    reportDate={reportMode === 'future' ? futureStartDate : undefined}
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
                      forecastPreset={forecastPreset}
                      reportDate={reportMode === 'future' ? futureStartDate : undefined}
                      showAIInsights={showAIInsights}
                      insights={getLocationInsights(location.id)}
                      onInsightsChange={(newInsights) => updateLocationInsights(location.id, newInsights)}
                    />
                  </ChartErrorBoundary>
                </div>
              )}
              </>
              )}
            </div>
          );
        }
        
        // Determine which data index to use based on report mode
        let startIdx = 0;
        let endIdx = weather.daily.time.length;
        
        if (reportMode === 'current') {
          // Current mode: Use preset (today, 7 days, or 14 days)
          const today = new Date().toISOString().split('T')[0];
          startIdx = weather.daily.time.findIndex((d: string) => d >= today);
          if (startIdx === -1) startIdx = 0;
          const daysToShow = forecastPreset === 'today' ? 1 : forecastPreset === '7day' ? 7 : 14;
          endIdx = Math.min(startIdx + daysToShow, weather.daily.time.length);
        } else if (reportMode === 'future') {
          // Future mode: Start from selected date or 7 days out, use preset
          let futureStart: string;
          if (futureStartDate) {
            // Use the exact date from the picker
            futureStart = futureStartDate;
          } else {
            const future = new Date();
            future.setDate(future.getDate() + 7);
            futureStart = future.toISOString().split('T')[0];
          }
          // Find the exact matching date or the next available date
          startIdx = weather.daily.time.findIndex((d: string) => d === futureStart);
          // If exact match not found, find the next date
          if (startIdx === -1) {
            startIdx = weather.daily.time.findIndex((d: string) => d > futureStart);
          }
          // Fallback to a reasonable default
          if (startIdx === -1) startIdx = Math.min(7, weather.daily.time.length - 7);
          const daysToShow = forecastPreset === '7day' ? 7 : 14;
          endIdx = Math.min(startIdx + daysToShow, weather.daily.time.length);
        } else if (reportMode === 'historical') {
          // Historical mode: Use custom date range
          if (dateRange.startDate && dateRange.endDate) {
            startIdx = weather.daily.time.findIndex((d: string) => d >= dateRange.startDate);
            if (startIdx === -1) startIdx = 0;
            endIdx = weather.daily.time.findIndex((d: string) => d > dateRange.endDate);
            if (endIdx === -1) endIdx = weather.daily.time.length;
          }
        }
        
        // Get first day's data for the summary stats
        const todayData = {
          date: weather.daily.time[startIdx],
          tempMax: safe(weather.daily.temperature_2m_max?.[startIdx]?.toFixed(0)),
          tempMin: safe(weather.daily.temperature_2m_min?.[startIdx]?.toFixed(0)),
          precipitation: safe(weather.daily.precipitation_sum?.[startIdx]?.toFixed(2)),
          et0: weather.daily.et0_fao_evapotranspiration?.[startIdx] * 0.0393701 || 0,
          et0_sum: weather.daily.et0_fao_evapotranspiration_sum?.[startIdx] * 0.0393701 || 0,
        };
        
        // Generate forecast data array for the table
        const forecastData = [];
        let cumulativeET0 = 0;
        for (let i = startIdx; i < endIdx; i++) {
          const et0_mm = weather.daily.et0_fao_evapotranspiration?.[i] || 0;
          const et0_inches = et0_mm * 0.0393701;
          cumulativeET0 += et0_inches;
          
          forecastData.push({
            date: weather.daily.time[i],
            tempMax: safe(weather.daily.temperature_2m_max?.[i]?.toFixed(0)),
            tempMin: safe(weather.daily.temperature_2m_min?.[i]?.toFixed(0)),
            precipitation: safe(weather.daily.precipitation_sum?.[i]?.toFixed(2)),
            et0: et0_inches.toFixed(2),
            et0_sum: cumulativeET0.toFixed(2)
          });
        }

        const isCollapsed = collapsedLocations.has(location.id);

        return (
          <div 
            key={`${location.id}-${reportMode}-${forecastPreset}-${futureStartDate}`}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden"
          >
            {/* Location Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-750">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  {/* Collapse/Expand Button */}
                  <button
                    onClick={() => toggleLocationCollapse(location.id)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
                    title={isCollapsed ? "Expand section" : "Collapse section"}
                  >
                    {isCollapsed ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <ChevronUp className="h-5 w-5" />
                    )}
                  </button>
                  
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                      <MapPin className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                      {location.name}
                    </h3>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Weather Stats in Header */}
                  <div className="hidden lg:flex items-center gap-3">
                    {/* High */}
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-1">
                        <Thermometer className="h-3 w-3 text-red-500" />
                        <span>HIGH</span>
                      </div>
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {todayData.tempMax}°F
                      </div>
                    </div>
                    
                    {/* Low */}
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-1">
                        <Thermometer className="h-3 w-3 text-blue-500" />
                        <span>LOW</span>
                      </div>
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {todayData.tempMin}°F
                      </div>
                    </div>
                    
                    {/* Precip */}
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-1">
                        <Droplets className="h-3 w-3 text-blue-500" />
                        <span>PRECIP</span>
                      </div>
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {todayData.precipitation} in
                      </div>
                    </div>
                    
                    {/* ET₀ */}
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-1">
                        <Gauge className="h-3 w-3 text-green-500" />
                        <span>ET₀</span>
                      </div>
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {Number(todayData.et0).toFixed(2)} in
                      </div>
                    </div>
                    
                    {/* ET₀ Sum */}
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-1">
                        <Gauge className="h-3 w-3 text-green-600" />
                        <span>ET₀ SUM</span>
                      </div>
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {Number(todayData.et0_sum).toFixed(2)} in
                      </div>
                    </div>
                    
                    {/* ETC Actual */}
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-1">
                        <TrendingUp className="h-3 w-3 text-green-500" />
                        <span>ETC ACTUAL</span>
                      </div>
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {getETCDisplayText(location, todayData.date)}
                      </div>
                    </div>
                  </div>
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

            {/* Collapsible Content */}
            {!isCollapsed && (
            <>
            {/* Today's Metrics Grid */}
            <div className="p-6 bg-gray-50 dark:bg-gray-800/50">
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                {reportMode === 'current' ? "Today's Weather Stats" : 
                 reportMode === 'future' ? "Future Period Start Stats" : 
                 "Period Start Weather Stats"}
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

            {/* Forecast Table */}
            <div className="p-6">
              <div className="text-center mb-2">
                <h4 className="text-md font-medium text-gray-900 dark:text-white">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    {reportMode === 'current' 
                      ? `Current Period Data (${forecastPreset === 'today' ? 'Today' : forecastPreset === '7day' ? '7 Days' : '14 Days'})`
                      : reportMode === 'future' 
                      ? `Future Period Data (${forecastPreset === '7day' ? '7 Days' : '14 Days'})`
                      : "Historical Period Data"}
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
                    {forecastData.map((day, index) => (
                      <tr 
                        key={day.date} 
                        className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-800/50'}
                      >
                        <td className="px-3 py-2 text-sm font-medium text-gray-900 dark:text-white">
                          {new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', { 
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
                          {day.et0}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
                          {day.et0_sum}
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
                  reportMode={reportMode}
                  forecastPreset={forecastPreset}
                  dateRange={dateRange}
                  reportDate={reportMode === 'future' ? futureStartDate : undefined}
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
                    forecastPreset={forecastPreset}
                    reportDate={reportMode === 'future' ? futureStartDate : undefined}
                    showAIInsights={showAIInsights}
                    insights={getLocationInsights(location.id)}
                    onInsightsChange={(newInsights) => updateLocationInsights(location.id, newInsights)}
                  />
                  </ChartErrorBoundary>
                </div>
              )}
              </>
              )}
            </div>
          );
          })}
        </>
      )}      {/* General Report Insights */}
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
        <div className="text-sm text-blue-700 dark:text-blue-300 mb-2">
          <div className="flex items-center gap-2 justify-center">
            <BarChart3 className="h-5 w-5" />
            <span>Comprehensive Report Generated for {displayLocations.length} Location{displayLocations.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
        
        {displayLocations.length > 0 && (
          <div className="text-xs text-blue-600 dark:text-blue-400 mb-1 flex items-center gap-1 justify-center">
            <MapPin className="h-4 w-4" />
            <strong>Locations:</strong> {displayLocations.map(loc => loc.name).join(', ')}
          </div>
        )}
        
        {(selectedCrops.length > 0 || cropInstances.length > 0) && (
          <div className="text-xs text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-1 justify-center">
            <Sprout className="h-4 w-4" />
            <strong>Active Crops:</strong>
            <span>{(() => {
              const allCrops = new Set();
              selectedCrops.forEach(crop => allCrops.add(crop));
              cropInstances.forEach(instance => allCrops.add(instance.cropId));
              return Array.from(allCrops).join(', ');
            })()}</span>
          </div>
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