import React, { useState } from 'react';
import { MapPin, Thermometer, Wind, Droplets, Gauge, Calendar, Download, FileSpreadsheet, Sprout, Calculator, Filter } from 'lucide-react';
import { useLocations } from '../contexts/LocationsContext';
import { exportToCSV, exportToExcel } from '../utils/exportUtils';
import { WeatherCharts } from './LocationWeatherCharts';

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
}

export const ReportView: React.FC<ReportViewProps> = ({ 
  selectedCrops = [], 
  cropInstances = [], 
  calculatorResult = null,
  calculatorInputs = null,
  selectedLocation = null,
  fieldBlocks = [],
  availableLocations = []
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

  // Auto-refresh weather data only once if locations exist but have no weather data
  React.useEffect(() => {
    if (!hasTriedRefresh) {
      // Only try to refresh if we have user locations (not trial locations)
      const hasUserLocations = locations.length > 0 && 'weatherData' in (locations[0] || {});
      if (hasUserLocations) {
        const locationsWithoutWeather = locations.filter(loc => !loc.weatherData && !loc.loading && !loc.error);
        if (locationsWithoutWeather.length > 0) {
          console.log('Found user locations without weather data, triggering refresh...');
          setHasTriedRefresh(true);
          refreshAllLocations();
        }
      }
    }
  }, [locations, refreshAllLocations, hasTriedRefresh]);

  // Filter locations that have weather data
  // Handle both trial locations (no weatherData property) and user locations (with weatherData)
  const locationsWithWeather = locations.filter(loc => {
    // If it's a trial location (no weatherData property), include it
    if (!('weatherData' in loc)) {
      return true;
    }
    // If it's a user location, check for weatherData and no error
    return loc.weatherData && !loc.error;
  });
  
  // Apply location filter
  const filteredLocations = locationFilter === 'all' 
    ? locationsWithWeather
    : locationsWithWeather.filter(loc => loc.id === locationFilter);
  
  // If a specific location is selected, only show that location's data
  const displayLocations = selectedLocation ? 
    filteredLocations.filter(loc => loc.id === selectedLocation.id || loc.name === selectedLocation.name) :
    filteredLocations;

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
          📊 {selectedLocation ? `${selectedLocation.name} ` : ''}Weather Report
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          {selectedLocation ? 
            `Current conditions and recommendations for ${selectedLocation.name}` :
            `Current conditions and recommendations for ${displayLocations.length} location${displayLocations.length !== 1 ? 's' : ''}`
          }
        </p>
        {selectedLocation && cropInstances.length > 0 && (
          <div className="mt-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              🌱 {cropInstances.length} active planting{cropInstances.length !== 1 ? 's' : ''} at this location
            </span>
          </div>
        )}
      </div>

      {/* Crop Watering Insights per Location */}
      {showCropInsights && displayLocations.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            🌾 Crop Watering Insights by Location
          </h3>
          
          {displayLocations.map((location) => {
            // Filter crop instances for this location
            const locationCrops = cropInstances.filter(crop => 
              crop.locationId === location.id
            );
            
            // Filter field blocks for this location
            const locationFieldBlocks = fieldBlocks.filter(block =>
              block.location_name === location.name
            );

            if (locationCrops.length === 0 && locationFieldBlocks.length === 0) return null;

            return (
              <div key={location.id} className="mb-6 last:mb-0">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                    📍 {location.name}
                  </h4>
                  
                  {/* Crop Instances */}
                  {locationCrops.length > 0 && (
                    <div className="mb-4">
                      <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Active Crops ({locationCrops.length})
                      </h5>
                      <div className="grid gap-2">
                        {locationCrops.map((crop, idx) => (
                          <div key={idx} className="bg-gray-50 dark:bg-gray-700 p-3 rounded text-sm">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="font-medium text-green-700 dark:text-green-400">
                                  Crop ID: {crop.cropId}
                                </span>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  Stage: {crop.currentStage} • 
                                  Planted: {new Date(crop.plantingDate).toLocaleDateString()}
                                  {crop.fieldName && ` • Field: ${crop.fieldName}`}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                                  Active
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Field Blocks */}
                  {locationFieldBlocks.length > 0 && (
                    <div className="mb-4">
                      <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Field Blocks ({locationFieldBlocks.length})
                      </h5>
                      <div className="grid gap-2">
                        {locationFieldBlocks.map((block) => (
                          <div key={block.id} className="bg-gray-50 dark:bg-gray-700 p-3 rounded text-sm">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="font-medium text-blue-700 dark:text-blue-400">
                                  {block.name}
                                </span>
                                {block.crop && (
                                  <span className="text-gray-600 dark:text-gray-400 ml-2">
                                    • {block.crop}
                                  </span>
                                )}
                                {block.acres && (
                                  <span className="text-gray-500 dark:text-gray-400 ml-2">
                                    • {block.acres} acres
                                  </span>
                                )}
                              </div>
                              <div className="text-right">
                                {block.irrigation_methods && block.irrigation_methods.length > 0 && (
                                  <div className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                                    {block.irrigation_methods.join(', ')}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Weather-based Recommendations */}
                  {location.weatherData && location.weatherData.daily && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded text-sm">
                      <div className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                        💧 Current Weather Conditions
                      </div>
                      <div className="text-blue-700 dark:text-blue-300 text-xs">
                        Location: {location.name} • 
                        Recent Max Temp: {location.weatherData.daily.temperature_2m_max?.[0] || 'N/A'}°C • 
                        Recent Min Temp: {location.weatherData.daily.temperature_2m_min?.[0] || 'N/A'}°C • 
                        Wind Speed: {location.weatherData.daily.wind_speed_10m_max?.[0] || 'N/A'} km/h
                        {location.weatherData.daily.precipitation_sum?.[0] && (
                          <span> • Precipitation: {location.weatherData.daily.precipitation_sum[0]}mm</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

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
        if (!weather || !weather.daily) {
          return null; // Skip locations without proper weather data
        }
        
        // Get today's data (first day in forecast)
        const todayData = {
          tempMax: safe(weather.daily.temperature_2m_max?.[0]?.toFixed(0)),
          tempMin: safe(weather.daily.temperature_2m_min?.[0]?.toFixed(0)),
          windSpeed: safe(weather.daily.wind_speed_10m_max?.[0]?.toFixed(1)),
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

                {/* Wind */}
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center mb-2">
                    <Wind className="h-4 w-4 text-gray-500 mr-1" />
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Wind</span>
                  </div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {todayData.windSpeed} mph
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
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                📈 14-Day Forecast Data
              </h4>
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
                        Wind (mph)
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                        Precip (in)
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                        ET₀ (inches)
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
                          {safe(weather.daily.wind_speed_10m_max[index]?.toFixed(1))}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
                          {safe(weather.daily.precipitation_sum[index]?.toFixed(2))}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
                          {safe((weather.daily.et0_fao_evapotranspiration[index] * 0.0393701)?.toFixed(3))}
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
              <WeatherCharts location={location} />
            </div>
          </div>
        );
      })}

      {/* Summary Footer */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 text-center">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          📊 Report generated for {displayLocations.length} location{displayLocations.length !== 1 ? 's' : ''} • 
          Data from NCEP GFS Seamless Model • 
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