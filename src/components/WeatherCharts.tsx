import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import type { WeatherApiResponse } from '../types/weather';

interface WeatherChartsProps {
  weatherData: WeatherApiResponse;
  isDarkMode: boolean;
}

export const WeatherCharts: React.FC<WeatherChartsProps> = ({ weatherData, isDarkMode }) => {
  const chartData = weatherData.daily.time.map((date, index) => ({
    date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    fullDate: date,
    precipitation: weatherData.daily.precipitation_sum[index] || 0,
    rain: weatherData.daily.rain_sum[index] || 0,
    et0_daily: weatherData.daily.et0_fao_evapotranspiration[index] || 0,
    et0_sum: weatherData.daily.et0_fao_evapotranspiration_sum[index] || 0,
  }));

  const textColor = isDarkMode ? '#e5e7eb' : '#374151';
  const gridColor = isDarkMode ? '#374151' : '#e5e7eb';
  
  return (
    <div className="space-y-8">
      {/* Precipitation Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Precipitation Forecast (14 Days)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis 
              dataKey="date" 
              tick={{ fill: textColor, fontSize: 12 }}
              axisLine={{ stroke: gridColor }}
            />
            <YAxis 
              tick={{ fill: textColor, fontSize: 12 }}
              axisLine={{ stroke: gridColor }}
              label={{ 
                value: 'Inches', 
                angle: -90, 
                position: 'insideLeft',
                style: { textAnchor: 'middle', fill: textColor }
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                border: `1px solid ${gridColor}`,
                borderRadius: '8px',
                color: textColor,
              }}
              formatter={(value: number, name: string) => [
                `${value.toFixed(2)} inches`,
                name === 'precipitation' ? 'Total Precipitation' : 'Rain'
              ]}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Legend 
              wrapperStyle={{ color: textColor }}
              formatter={(value) => 
                value === 'precipitation' ? 'Total Precipitation' : 'Rain'
              }
            />
            <Bar dataKey="precipitation" fill="#3b82f6" name="precipitation" />
            <Bar dataKey="rain" fill="#06b6d4" name="rain" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Evapotranspiration Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Evapotranspiration (ET₀) Forecast
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis 
              dataKey="date" 
              tick={{ fill: textColor, fontSize: 12 }}
              axisLine={{ stroke: gridColor }}
            />
            <YAxis 
              tick={{ fill: textColor, fontSize: 12 }}
              axisLine={{ stroke: gridColor }}
              label={{ 
                value: 'mm', 
                angle: -90, 
                position: 'insideLeft',
                style: { textAnchor: 'middle', fill: textColor }
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                border: `1px solid ${gridColor}`,
                borderRadius: '8px',
                color: textColor,
              }}
              formatter={(value: number, name: string) => [
                `${value.toFixed(2)} mm`,
                name === 'et0_daily' ? 'Daily ET₀' : 'Cumulative ET₀'
              ]}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Legend 
              wrapperStyle={{ color: textColor }}
              formatter={(value) => 
                value === 'et0_daily' ? 'Daily ET₀' : 'Cumulative ET₀'
              }
            />
            <Line 
              type="monotone" 
              dataKey="et0_daily" 
              stroke="#f59e0b" 
              strokeWidth={2}
              name="et0_daily"
              dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="et0_sum" 
              stroke="#ef4444" 
              strokeWidth={2}
              name="et0_sum"
              dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};