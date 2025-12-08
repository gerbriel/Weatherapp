import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, ResponsiveContainer } from 'recharts';
import ChartAIInsights from './ChartAIInsights';
import { useTheme } from '../contexts/ThemeContext';
import type { LocationWithWeather } from '../types/weather';

interface SimpleWeatherChartsProps {
  location: LocationWithWeather;
  showAIInsights?: boolean;
  dateRange?: { startDate: string; endDate: string };
  reportMode?: 'current' | 'historical' | 'future';
  forecastPreset?: 'today' | '7day' | '14day';
  reportDate?: string; // The specific date to center the report around
  insights?: { 
    precipitationChart: string;
    temperatureChart: string; 
    cropCoefficientsChart: string;
    etcEtoComparisonChart: string;
    dataTable: string;
    general: string;
  };
  onInsightsChange?: (insights: { 
    precipitationChart: string;
    temperatureChart: string; 
    cropCoefficientsChart: string;
    etcEtoComparisonChart: string;
    dataTable: string;
    general: string;
  }) => void;
}

export const SimpleWeatherCharts: React.FC<SimpleWeatherChartsProps> = ({ 
  location, 
  showAIInsights = false,
  dateRange,
  reportMode = 'current',
  forecastPreset = '7day',
  reportDate,
  insights = { 
    precipitationChart: '', 
    temperatureChart: '', 
    cropCoefficientsChart: '', 
    etcEtoComparisonChart: '', 
    dataTable: '', 
    general: '' 
  },
  onInsightsChange 
}) => {
  const [isReady, setIsReady] = useState(false);
  const { isDarkMode } = useTheme();

  // Delay rendering to ensure parent container has proper dimensions
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Process weather data into chart format
  const chartData = React.useMemo(() => {
    if (!location?.weatherData?.daily) {
      // Return empty array if no NOAA weather data available - this will show error state
      return [];
    }

    const weather = location.weatherData.daily;
    const dates = weather.time || [];
    const precipitation = weather.precipitation_sum || [];
    const et0 = weather.et0_fao_evapotranspiration || [];

    const processedData = dates.map((date: string, index: number) => {
      const dateObj = new Date(date);
      return {
        date: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        fullDate: date, // Keep full date for finding today
        precipitation: precipitation[index] || 0,
        et0: et0[index] || 0 // API already returns in inches
      };
    });
    
    // In historical mode, show all data in the range
    if (reportMode === 'historical') {
      return processedData; // Show all historical data
    }
    
    // In current or future mode, find the target date and slice forward from there
    const formatDateLocal = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    // In future mode, use reportDate. In current mode, always use today
    const targetDate = reportMode === 'future' ? reportDate : formatDateLocal(new Date());
    const targetIndex = processedData.findIndex(d => d.fullDate === targetDate);
    const startIndex = targetIndex >= 0 ? targetIndex : 0;
    
    const daysToShow = forecastPreset === 'today' ? 1 : 
                      forecastPreset === '7day' ? 7 : 14;
    
    return processedData.slice(startIndex, startIndex + daysToShow);
  }, [location?.weatherData, reportMode, forecastPreset, reportDate]);

  // Show loading placeholder until ready
  if (!isReady) {
    return (
      <div className="space-y-6">
        <div style={{ width: '100%', height: '400px', backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: 'white', fontSize: '16px' }}>Loading NOAA weather data...</div>
        </div>
        <div style={{ width: '100%', height: '400px', backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: 'white', fontSize: '16px' }}>Loading NOAA weather data...</div>
        </div>
      </div>
    );
  }

  // Show error state if no weather data is available
  if (chartData.length === 0) {
    return (
      <div className="space-y-6" style={{ width: '100%', minWidth: '400px' }}>
        <div style={{ width: '100%', height: '400px', backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', color: '#f87171' }}>
            <div style={{ fontSize: '16px', marginBottom: '8px' }}>⚠️ No NOAA Weather Data Available</div>
            <div style={{ fontSize: '12px', color: '#9CA3AF' }}>Unable to fetch NOAA data from Open-Meteo API</div>
          </div>
        </div>
        <div style={{ width: '100%', height: '400px', backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', color: '#f87171' }}>
            <div style={{ fontSize: '16px', marginBottom: '8px' }}>⚠️ No NOAA Weather Data Available</div>
            <div style={{ fontSize: '12px', color: '#9CA3AF' }}>Unable to fetch NOAA data from Open-Meteo API</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" style={{ width: '100%', minWidth: '400px' }}>
      <div className="w-full bg-white dark:bg-slate-800 p-5 rounded-lg relative border border-gray-200 dark:border-gray-700">
        <h3 className="text-gray-900 dark:text-white text-center mb-3 text-base font-semibold">
          Precipitation Data {location?.name ? `- ${location.name}` : ''}
          {reportMode === 'historical' && dateRange?.startDate && dateRange?.endDate ? (
            <div className="text-sm font-normal text-gray-600 dark:text-gray-400 mt-1">
              ({dateRange.startDate} to {dateRange.endDate})
            </div>
          ) : reportMode === 'current' && (
            <div className="text-sm font-normal text-gray-600 dark:text-gray-400 mt-1">
              ({forecastPreset === 'today' ? "Today's Data" : 
                forecastPreset === '7day' ? '7-Day Forecast' : 
                '14-Day Forecast'})
            </div>
          )}
        </h3>
        <div className="text-gray-600 dark:text-gray-400 text-center mb-4 text-xs">
          📡 Data Source: {reportMode === 'historical' ? 'NOAA ERA5 Archive via Open-Meteo' : 'NOAA GFS Global & NAM CONUS models via Open-Meteo API'} • Precipitation, temperature, and wind data
        </div>
        <div style={{ width: '100%', height: '320px', minWidth: '360px', minHeight: '300px' }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={360} minHeight={320}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#374151" : "#e5e7eb"} />
              <XAxis dataKey="date" tick={{ fill: isDarkMode ? 'white' : '#374151', fontSize: 12 }} axisLine={{ stroke: isDarkMode ? '#6b7280' : '#9ca3af' }} />
              <YAxis tick={{ fill: isDarkMode ? 'white' : '#374151', fontSize: 12 }} axisLine={{ stroke: isDarkMode ? '#6b7280' : '#9ca3af' }} />
              <Tooltip contentStyle={{ 
                backgroundColor: isDarkMode ? '#374151' : '#ffffff', 
                border: isDarkMode ? 'none' : '1px solid #e5e7eb', 
                borderRadius: '4px', 
                color: isDarkMode ? 'white' : '#374151'
              }} />
              <Legend />
              <Bar dataKey="precipitation" fill="#3b82f6" name="Total Precipitation" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* AI Insights for Precipitation - Centered */}
        {showAIInsights && (
          <ChartAIInsights
            chartType="precipitation"
            chartData={chartData}
            location={location?.name || 'Field Location'}
            className=""
            compact={true}
          />
        )}

      </div>

      <div className="w-full bg-white dark:bg-slate-800 p-5 rounded-lg relative border border-gray-200 dark:border-gray-700">
        <h3 className="text-gray-900 dark:text-white text-center mb-3 text-base font-semibold">
          Evapotranspiration (ET₀) {location?.name ? `- ${location.name}` : ''}
          {reportMode === 'historical' && dateRange?.startDate && dateRange?.endDate ? (
            <div className="text-sm font-normal text-gray-600 dark:text-gray-400 mt-1">
              ({dateRange.startDate} to {dateRange.endDate})
            </div>
          ) : reportMode === 'current' && (
            <div className="text-sm font-normal text-gray-600 dark:text-gray-400 mt-1">
              ({forecastPreset === 'today' ? "Today's Data" : 
                forecastPreset === '7day' ? '7-Day Forecast' : 
                '14-Day Forecast'})
            </div>
          )}
        </h3>
        <div className="text-gray-600 dark:text-gray-400 text-center mb-4 text-xs">
          📡 Data Source: {reportMode === 'historical' ? 'NOAA ERA5 Archive via Open-Meteo' : 'NOAA GFS Global & NAM CONUS models via Open-Meteo API'} • FAO-56 reference evapotranspiration
        </div>
        <div style={{ width: '100%', height: '320px', minWidth: '360px', minHeight: '300px' }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={360} minHeight={320}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#374151" : "#e5e7eb"} />
              <XAxis dataKey="date" tick={{ fill: isDarkMode ? 'white' : '#374151', fontSize: 12 }} axisLine={{ stroke: isDarkMode ? '#6b7280' : '#9ca3af' }} />
              <YAxis tick={{ fill: isDarkMode ? 'white' : '#374151', fontSize: 12 }} axisLine={{ stroke: isDarkMode ? '#6b7280' : '#9ca3af' }} domain={[0, 0.01]} />
              <Tooltip contentStyle={{ 
                backgroundColor: isDarkMode ? '#374151' : '#ffffff', 
                border: isDarkMode ? 'none' : '1px solid #e5e7eb', 
                borderRadius: '4px', 
                color: isDarkMode ? 'white' : '#374151'
              }} />
              <Legend />
              <Line type="monotone" dataKey="et0" stroke="#f97316" strokeWidth={2} name="Daily ET₀" dot={{ fill: '#f97316', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, fill: '#f97316' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* AI Insights for Evapotranspiration - Centered */}
        {showAIInsights && (
          <ChartAIInsights
            chartType="evapotranspiration"
            chartData={chartData}
            location={location?.name || 'Field Location'}
            className=""
            compact={true}
          />
        )}
        
      </div>
    </div>
  );
};
