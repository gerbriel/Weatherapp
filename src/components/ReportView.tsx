import React, { useState, useEffect, useMemo } from 'react';
import { MapPin, Thermometer, Droplets, Gauge, Calendar, Download, FileSpreadsheet, Sprout, Calculator, Filter, TrendingUp } from 'lucide-react';
import { useLocations } from '../contexts/LocationsContext';
import { exportToCSV, exportToExcel } from '../utils/exportUtils';
import { SimpleWeatherCharts } from './SimpleWeatherCharts';
import { ChartErrorBoundary } from './ChartErrorBoundary';
import { CropETCCharts } from './CropETCCharts';
import { DateRangePicker } from './DateRangePicker';
import { ReportModeToggle } from './ReportModeToggle';
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
  fieldBlocks?: any[]; // Field blocks for location-specific field data
  availableLocations?: any[]; // Available locations - same as sidebar
  onDisplayLocationsChange?: (locations: any[]) => void; // Callback to notify parent of filtered locations
}

export const ReportView: React.FC<ReportViewProps> = ({ 
  selectedCrops = [], 
  cropInstances = [], 
  calculatorResult = null,
  calculatorInputs = null,
  selectedLocation = null,
  fieldBlocks = [],
  availableLocations = [],
  onDisplayLocationsChange = () => {}
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
  
  // State for location filtering
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [showCropInsights, setShowCropInsights] = useState(true);
  const [hasTriedRefresh, setHasTriedRefresh] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
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
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshAllLocations();
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle historical data fetching
  const fetchHistoricalData = async () => {
    if (!dateRange.startDate || !dateRange.endDate) return;
    
    setIsLoadingHistorical(true);
    const newHistoricalData = new Map();
    
    try {
      for (const location of displayLocations) {
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
    return dayData ? `${dayData.etc_actual.toFixed(3)} in` : '— in';
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
  
  // Apply location filter (memoized for performance)
  const filteredLocations = useMemo(() => {
    return locationFilter === 'all' 
      ? locationsWithWeather
      : locationsWithWeather.filter(loc => loc.id === locationFilter);
  }, [locationsWithWeather, locationFilter]);
  
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
                  cimisStationId: (location as any).cimisStationId  // Include CIMIS station ID from trial locations
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

  if (displayLocations.length === 0) {
    // Check if we're in trial mode (locations without weatherData property)
    const isTrialMode = locations.length > 0 && !('weatherData' in (locations[0] || {}));
    
    return (
      <div className="space-y-6">
        {/* Location Filter Controls */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <label htmlFor="location-filter" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Filter by Location:
              </label>
              <select
                id="location-filter"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
              >
                <option value="all">All Locations ({locationsWithWeather.length})</option>
                {locationsWithWeather.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={showCropInsights}
                  onChange={(e) => setShowCropInsights(e.target.checked)}
                  className="mr-2"
                />
                Show Crop Watering Insights
              </label>
            </div>
          </div>
        </div>

        <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-lg shadow">
          <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
          <p className="text-gray-500 dark:text-gray-400 mb-2">
            {isTrialMode ? 
              'Weather data not available in trial mode' :
              selectedLocation ? 
                `No weather data available for ${selectedLocation.name}` :
                'No weather data available'
            }
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
            {isTrialMode ?
              'Sign up for a full account to access weather reports and data' :
              'Add locations and refresh their weather data to view the report'
            }
          </p>
          
          {!isTrialMode && (
            <div className="mt-4">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors duration-200"
              >
                {isRefreshing ? 'Refreshing...' : 'Refresh Weather Data'}
              </button>
              {isRefreshing && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Refreshing locations with 1-second delays to prevent rate limiting...
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
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
    exportToCSV(displayLocations, true);
  };

  const handleExportExcel = () => {
    exportToExcel(displayLocations, true);
  };

  return (
    <div className="space-y-6">
      {/* Location Filter Controls */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <label htmlFor="location-filter" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Filter by Location:
            </label>
            <select
              id="location-filter"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            >
              <option value="all">All Locations ({locationsWithWeather.length})</option>
              {locationsWithWeather.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={showCropInsights}
                onChange={(e) => setShowCropInsights(e.target.checked)}
                className="mr-2"
              />
              Show Crop Watering Insights
            </label>
          </div>
        </div>
      </div>

      <div className="text-center mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          📊 Comprehensive Reports - {displayLocations.length} Location{displayLocations.length !== 1 ? 's' : ''}
        </h2>
        
        {/* Dynamic Location List */}
        <div className="mb-3">
          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
            📍 Locations: 
            <span className="ml-1 text-gray-800 dark:text-gray-200">
              {displayLocations.length > 0 ? 
                displayLocations.map(loc => loc.name).join(', ') : 
                'No locations selected'
              }
            </span>
          </p>
        </div>

        {/* Dynamic Crop List */}
        {(selectedCrops.length > 0 || cropInstances.length > 0) && (
          <div className="mb-3">
            <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
              🌱 Active Crops: 
              <span className="ml-1 text-gray-800 dark:text-gray-200">
                {(() => {
                  const allCrops = new Set();
                  
                  // Add selected crops
                  selectedCrops.forEach(crop => allCrops.add(crop));
                  
                  // Add crops from crop instances
                  cropInstances.forEach(instance => allCrops.add(instance.cropId));
                  
                  return allCrops.size > 0 ? 
                    Array.from(allCrops).join(', ') : 
                    'No crops selected';
                })()}
              </span>
            </p>
          </div>
        )}

        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
          Current conditions and weather forecasts with ETC actuals comparison
        </p>

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
                🌤️ Weather Data
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                <strong>API:</strong> Open-Meteo {reportMode === 'historical' ? 'Archive' : 'Forecast'}<br/>
                <strong>Data:</strong> Temperature, precipitation, wind, humidity<br/>
                <strong>Coverage:</strong> {reportMode === 'historical' ? 'Historical records' : 'GFS Global forecast'}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded p-3 border border-green-200 dark:border-green-600">
              <div className="font-medium text-green-800 dark:text-green-200 mb-1">💧 Evapotranspiration</div>
              <div className="text-gray-600 dark:text-gray-400">
                <strong>API:</strong> Open-Meteo ET₀<br/>
                <strong>Method:</strong> FAO-56 Penman-Monteith<br/>
                <strong>Type:</strong> {reportMode === 'historical' ? 'Historical ET₀' : 'Reference evapotranspiration'}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded p-3 border border-purple-200 dark:border-purple-600">
              <div className="font-medium text-purple-800 dark:text-purple-200 mb-1">🌾 Crop Coefficients</div>
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

            {/* Field Blocks */}
            {fieldBlocks.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Field Blocks ({fieldBlocks.length})</h4>
                <div className="space-y-1">
                  {fieldBlocks.slice(0, 3).map((block) => (
                    <div key={block.id} className="text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-3 w-3 text-blue-500" />
                        <span>{block.name}</span>
                      </div>
                      <div className="text-xs text-gray-500 ml-4">
                        {block.crop_name} • {block.acres} acres • {block.status}
                        {block.address && ` • ${block.address}`}
                      </div>
                    </div>
                  ))}
                  {fieldBlocks.length > 3 && (
                    <div className="text-sm text-gray-500 dark:text-gray-500">
                      +{fieldBlocks.length - 3} more blocks
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
          className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </button>
        <button
          onClick={handleExportExcel}
          className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
        >
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export Excel
        </button>
      </div>

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
                et0: et0_inches.toFixed(3),
                et0_sum: et0_sum_inches.toFixed(3)
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
                      📍 Trial Location - Mock Weather Data
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      Location {locationIndex + 1} of {displayLocations.length}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Demo Data
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
                      {todayData.et0} inches
                    </div>
                  </div>

                  {/* ET₀ Sum */}
                  <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center mb-2">
                      <Gauge className="h-4 w-4 text-green-600 mr-1" />
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">ET₀ Sum</span>
                    </div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {todayData.et0_sum} inches
                    </div>
                  </div>
                </div>
              </div>

              {/* 14-Day Forecast Table */}
              <div className="p-6">
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-2">
                  📈 14-Day Forecast Data
                </h4>
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
                          ETC Actual (in)
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                          ET₀ Sum (inches)
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
                            {day.et0}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
                            <div className="flex items-center">
                              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                              {getETCDisplayText(location, day.date).replace(' in', '')}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
                            {day.et0_sum}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Weather Charts */}
              <div className="mt-6">
                <ChartErrorBoundary>
                  <SimpleWeatherCharts location={location} />
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
                    📍 {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
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
                    {todayData.et0.toFixed(3)} inches
                  </div>
                </div>

                {/* ET₀ Sum */}
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center mb-2">
                    <Gauge className="h-4 w-4 text-green-600 mr-1" />
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">ET₀ Sum</span>
                  </div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {todayData.et0_sum.toFixed(3)} inches
                  </div>
                </div>
              </div>
            </div>

            {/* 14-Day Forecast Table */}
            <div className="p-6">
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-2">
                📈 14-Day Forecast Data
              </h4>
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
                        ETC Actual (in)
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                        ET₀ Sum (inches)
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
                          {safe((weather.daily.et0_fao_evapotranspiration[index] * 0.0393701)?.toFixed(3))}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
                          <div className="flex items-center">
                            <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                            {getETCDisplayText(location, date).replace(' in', '')}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
                          {safe((weather.daily.et0_fao_evapotranspiration_sum[index] * 0.0393701)?.toFixed(3))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Weather Charts */}
            <div className="mt-6">
              <ChartErrorBoundary>
                <SimpleWeatherCharts location={location} />
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
                  />
                </ChartErrorBoundary>
              </div>
            )}
          </div>
        );
      })}

      {/* Summary Footer */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 text-center">
        <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
          📊 Comprehensive Report Generated for {displayLocations.length} Location{displayLocations.length !== 1 ? 's' : ''}
        </p>
        
        {displayLocations.length > 0 && (
          <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">
            📍 <strong>Locations:</strong> {displayLocations.map(loc => loc.name).join(', ')}
          </p>
        )}
        
        {(selectedCrops.length > 0 || cropInstances.length > 0) && (
          <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">
            🌱 <strong>Active Crops:</strong> {(() => {
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
    </div>
  );
};