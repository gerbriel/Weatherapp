import React from 'react';
import { Calendar, Droplets, Thermometer, Wind, Sun } from 'lucide-react';

interface ReportSnapshotProps {
  location: any;
  weatherData: any;
  cropInstances: any[];
  reportDate: string;
  reportMode: 'current' | 'historical' | 'future';
  forecastPreset: 'today' | '7day' | '14day';
}

export const ReportSnapshot: React.FC<ReportSnapshotProps> = ({
  location,
  weatherData,
  cropInstances,
  reportDate,
  reportMode,
  forecastPreset
}) => {
  // Calculate date range based on preset
  const getDaysCount = () => {
    switch (forecastPreset) {
      case 'today': return 1;
      case '7day': return 7;
      case '14day': return 14;
      default: return 7;
    }
  };

  const daysCount = getDaysCount();
  const startDate = new Date(reportDate);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + daysCount - 1);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  // Calculate weather stats from data
  const calculateStats = () => {
    if (!weatherData?.daily) return null;

    const temps = weatherData.daily.temperature_2m_max || [];
    const precip = weatherData.daily.precipitation_sum || [];
    const wind = weatherData.daily.wind_speed_10m_max || [];
    
    const avgTemp = temps.length > 0 
      ? (temps.reduce((a: number, b: number) => a + b, 0) / temps.length).toFixed(1)
      : 'N/A';
    
    const totalPrecip = precip.length > 0
      ? precip.reduce((a: number, b: number) => a + b, 0).toFixed(2)
      : '0.00';
    
    const avgWind = wind.length > 0
      ? (wind.reduce((a: number, b: number) => a + b, 0) / wind.length).toFixed(1)
      : 'N/A';

    return { avgTemp, totalPrecip, avgWind };
  };

  const stats = calculateStats();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 border-b border-gray-200 dark:border-gray-700 pb-6">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
              <Droplets className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {reportMode === 'current' ? 'Current' : reportMode === 'future' ? 'Future' : 'Historical'} Irrigation Snapshot
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Week of {formatDate(startDate)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">{location.name}</p>
        </div>
      </div>

      {/* Today's Weather State */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Sun className="h-5 w-5 mr-2" />
          Today's Weather State
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {/* Avg Temperature */}
          <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
            <div className="flex items-center justify-between mb-2">
              <Thermometer className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              <span className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                {stats?.avgTemp}°F
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Avg Temp</p>
          </div>

          {/* Total Precipitation */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between mb-2">
              <Droplets className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {stats?.totalPrecip}"
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Precip</p>
          </div>

          {/* Avg Wind Speed */}
          <div className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <Wind className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <span className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                {stats?.avgWind} mph
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Avg Wind</p>
          </div>
        </div>
      </div>

      {/* ET Chart Table - Placeholder for now */}
      <div className="mb-8">
        <div className="bg-blue-600 text-white px-4 py-2 rounded-t-lg">
          <h2 className="font-semibold">ET Chart</h2>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-b-lg p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            ET data will be displayed here based on crop instances and weather data
          </p>
        </div>
      </div>

      {/* Week Summary */}
      <div className="mb-8 bg-gray-50 dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Week's Summary</h2>
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          This {daysCount}-day period shows weather patterns and irrigation requirements for {location.name}. 
          {cropInstances.length > 0 
            ? ` Currently tracking ${cropInstances.length} active crop${cropInstances.length > 1 ? 's' : ''}.`
            : ' No active crops are currently being tracked for this location.'}
        </p>
      </div>

      {/* Charts Section - Will integrate existing charts */}
      <div className="space-y-6">
        <div className="text-center text-gray-500 dark:text-gray-400 text-sm">
          Weather and ET charts will be integrated here
        </div>
      </div>
    </div>
  );
};
