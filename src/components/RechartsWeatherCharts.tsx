import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, ResponsiveContainer } from 'recharts';
import { useTheme } from '../contexts/ThemeContext';

interface RechartsWeatherChartsProps {
  location: {
    id?: string;
    name?: string;
    latitude?: number;
    longitude?: number;
    weatherData?: any;
  };
}

export const RechartsWeatherCharts: React.FC<RechartsWeatherChartsProps> = ({ location }) => {
  const { isDarkMode } = useTheme();
  // State for chart rendering readiness
  const [isChartsReady, setIsChartsReady] = useState(false);

  // Delay chart rendering to ensure containers have proper dimensions
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsChartsReady(true);
    }, 200);
    
    return () => clearTimeout(timer);
  }, []);

  // Check if this is a trial location (no weatherData property) and create mock data
  let chartData;
  
  if (!location.weatherData) {
    // This is likely a trial location - create mock chart data
    const mockDates = Array.from({ length: 14 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + i);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    
    chartData = mockDates.map((date) => ({
      date,
      precipitation: Math.random() * 0.5, // Random precipitation 0-0.5 inches
      rain: Math.random() * 0.3, // Random rain 0-0.3 inches
      et0: 0.15 + Math.random() * 0.1, // Random ET0 0.15-0.25 inches
    }));
  } else if (!location.weatherData.daily) {
    return (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
        <strong>No Weather Data:</strong> Charts cannot be displayed for {location?.name}
      </div>
    );
  } else {
    // Real user location with weather data
    const daily = location.weatherData.daily;
    
    chartData = daily.time.slice(0, 14).map((date: string, index: number) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      precipitation: daily.precipitation_sum[index] || 0,
      rain: daily.rain_sum[index] || 0,
      et0: (daily.et0_fao_evapotranspiration[index] * 0.0393701) || 0, // Convert mm to inches
    }));
  }

  return (
    <div className="space-y-6">
      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        📊 Weather Charts for {location?.name}
      </h4>
      
      {/* Debug Info */}
      <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
        <p><strong>Debug Info:</strong></p>
        <p>Location: {location?.name}</p>
        <p>Chart Data Points: {chartData.length}</p>
        <p>First Date: {chartData[0]?.date}</p>
        <p>Sample Data: Precip={chartData[0]?.precipitation}, ET0={chartData[0]?.et0}</p>
      </div>
      
      {/* Precipitation Chart */}
            {/* Precipitation Chart */}
      <div className="mb-8">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          📊 Precipitation Forecast (14 Days)
        </h4>
        <div style={{ width: '100%', height: '300px' }}>
          {!isChartsReady ? (
            <div className="w-full h-full bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-600 dark:text-gray-400">
                <div className="text-lg mb-2">📊</div>
                <div>Loading charts...</div>
              </div>
            </div>
          ) : (
          <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={250}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#374151" : "#e5e7eb"} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12, fill: isDarkMode ? '#9CA3AF' : '#6b7280' }}
                angle={-45}
                textAnchor="end"
                height={80}
                axisLine={{ stroke: isDarkMode ? '#6b7280' : '#9ca3af' }}
              />
              <YAxis 
                label={{ value: 'Inches', angle: -90, position: 'insideLeft' }}
                tick={{ fontSize: 12, fill: isDarkMode ? '#9CA3AF' : '#6b7280' }}
                axisLine={{ stroke: isDarkMode ? '#6b7280' : '#9ca3af' }}
              />
              <Tooltip 
                labelFormatter={(value) => `Date: ${value}`}
                formatter={(value: any) => [`${value}"`, 'Precipitation']}
                contentStyle={{
                  backgroundColor: isDarkMode ? '#374151' : '#ffffff',
                  border: isDarkMode ? 'none' : '1px solid #e5e7eb',
                  borderRadius: '4px',
                  color: isDarkMode ? 'white' : '#374151'
                }}
              />
              <Legend />
              <Bar 
                dataKey="precipitation" 
                fill="#3B82F6" 
                name="Total Precipitation"
                radius={[2, 2, 0, 0]}
              />
              <Bar 
                dataKey="rain" 
                fill="#10B981" 
                name="Rain"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ET0 Chart */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          📈 Evapotranspiration (ET₀) Forecast
        </h4>
        <div style={{ width: '100%', height: '300px' }}>
          {!isChartsReady ? (
            <div className="w-full h-full bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-600 dark:text-gray-400">
                <div className="text-lg mb-2">📊</div>
                <div>Loading charts...</div>
              </div>
            </div>
          ) : (
          <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={250}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#374151" : "#e5e7eb"} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12, fill: isDarkMode ? '#9CA3AF' : '#6b7280' }}
                angle={-45}
                textAnchor="end"
                height={80}
                axisLine={{ stroke: isDarkMode ? '#6b7280' : '#9ca3af' }}
              />
              <YAxis 
                label={{ value: 'Daily ET₀ (inches)', angle: -90, position: 'insideLeft' }}
                tick={{ fontSize: 12, fill: isDarkMode ? '#9CA3AF' : '#6b7280' }}
                axisLine={{ stroke: isDarkMode ? '#6b7280' : '#9ca3af' }}
              />
              <Tooltip 
                labelFormatter={(value) => `Date: ${value}`}
                formatter={(value: any) => [`${value}"`, 'Daily ET₀']}
                contentStyle={{
                  backgroundColor: isDarkMode ? '#374151' : '#ffffff',
                  border: isDarkMode ? 'none' : '1px solid #e5e7eb',
                  borderRadius: '4px',
                  color: isDarkMode ? 'white' : '#374151'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="et0" 
                stroke="#F59E0B" 
                strokeWidth={3}
                name="Daily ET₀"
                dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ET₀ Chart */}
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-4 shadow-sm">
        <h5 className="text-md font-medium text-gray-900 dark:text-white mb-3">
          Reference Evapotranspiration (ET₀) Forecast
        </h5>
        <div className="h-80 w-full" style={{ minHeight: '320px', minWidth: '360px' }}>
          {!isChartsReady ? (
            <div className="w-full h-full bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-600 dark:text-gray-400">
                <div className="text-lg mb-2">📊</div>
                <div>Loading charts...</div>
              </div>
            </div>
          ) : (
          <ResponsiveContainer width="100%" height="100%" minWidth={360} minHeight={320}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#374151" : "#e5e7eb"} />
              <XAxis 
                dataKey="date" 
                tick={{ fill: isDarkMode ? '#9CA3AF' : '#6b7280' }}
                axisLine={{ stroke: isDarkMode ? '#6b7280' : '#9ca3af' }}
              />
              <YAxis 
                label={{ value: 'Inches', angle: -90, position: 'insideLeft' }} 
                tick={{ fill: isDarkMode ? '#9CA3AF' : '#6b7280' }}
                axisLine={{ stroke: isDarkMode ? '#6b7280' : '#9ca3af' }}
              />
              <Tooltip 
                formatter={(value) => [`${Number(value).toFixed(3)} inches`, 'Daily ET₀']}
                contentStyle={{
                  backgroundColor: isDarkMode ? '#374151' : '#ffffff',
                  border: isDarkMode ? 'none' : '1px solid #e5e7eb',
                  borderRadius: '4px',
                  color: isDarkMode ? 'white' : '#374151'
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="et0" stroke="#F59E0B" strokeWidth={2} name="Daily ET₀" />
            </LineChart>
          </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};