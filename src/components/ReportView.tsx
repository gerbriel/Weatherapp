import React from 'react';
import { MapPin, Thermometer, Wind, Droplets, Gauge, Calendar, Download, FileSpreadsheet, Sprout, Calculator } from 'lucide-react';
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
}

export const ReportView: React.FC<ReportViewProps> = ({ 
  selectedCrops = [], 
  cropInstances = [], 
  calculatorResult = null,
  calculatorInputs = null
}) => {
  const { locations } = useLocations();

  // Filter locations that have weather data
  const locationsWithWeather = locations.filter(loc => loc.weatherData && !loc.error);

  if (locationsWithWeather.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
        <p className="text-gray-500 dark:text-gray-400 mb-2">No weather data available</p>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          Add locations and refresh their weather data to view the report
        </p>
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
    exportToCSV(locationsWithWeather, true);
  };

  const handleExportExcel = () => {
    exportToExcel(locationsWithWeather, true);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          📊 Comprehensive Weather Report
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Current conditions and recommendations for {locationsWithWeather.length} location{locationsWithWeather.length !== 1 ? 's' : ''}
        </p>
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
      {locationsWithWeather.map((location, locationIndex) => {
        const weather = location.weatherData!;
        
        // Get today's data (first day in forecast)
        const todayData = {
          tempMax: safe(weather.daily.temperature_2m_max[0]?.toFixed(0)),
          tempMin: safe(weather.daily.temperature_2m_min[0]?.toFixed(0)),
          windSpeed: safe(weather.daily.wind_speed_10m_max[0]?.toFixed(1)),
          precipitation: safe(weather.daily.precipitation_sum[0]?.toFixed(2)),
          et0: weather.daily.et0_fao_evapotranspiration[0] * 0.0393701 || 0,
          et0_sum: weather.daily.et0_fao_evapotranspiration_sum[0] * 0.0393701 || 0,
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
                    Location {locationIndex + 1} of {locationsWithWeather.length}
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
                    {weather.daily.time.slice(0, 14).map((date, index) => (
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
          📊 Report generated for {locationsWithWeather.length} location{locationsWithWeather.length !== 1 ? 's' : ''} • 
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