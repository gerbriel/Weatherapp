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

  const textColor = isDarkMode ? '#7d8590' : '#656d76';
  const gridColor = isDarkMode ? '#21262d' : '#d1d9e0';
  const backgroundColor = isDarkMode ? '#0d1117' : '#ffffff';
  
  return (
    <div className="space-y-6">
      {/* Precipitation Chart */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-github-fg-default dark:text-github-dark-fg-default mb-4">
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
                backgroundColor: backgroundColor,
                border: `1px solid ${gridColor}`,
                borderRadius: '6px',
                color: textColor,
                fontSize: '12px'
              }}
              formatter={(value: number, name: string) => [
                `${value.toFixed(2)} inches`,
                name === 'precipitation' ? 'Total Precipitation' : 'Rain'
              ]}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Legend 
              wrapperStyle={{ color: textColor, fontSize: '12px' }}
              formatter={(value) => 
                value === 'precipitation' ? 'Total Precipitation' : 'Rain'
              }
            />
            <Bar dataKey="precipitation" fill={isDarkMode ? '#2f81f7' : '#0969da'} name="precipitation" />
            <Bar dataKey="rain" fill={isDarkMode ? '#3fb950' : '#1a7f37'} name="rain" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Evapotranspiration Chart */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-github-fg-default dark:text-github-dark-fg-default mb-4">
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
                backgroundColor: backgroundColor,
                border: `1px solid ${gridColor}`,
                borderRadius: '6px',
                color: textColor,
                fontSize: '12px'
              }}
              formatter={(value: number, name: string) => [
                `${value.toFixed(2)} mm`,
                name === 'et0_daily' ? 'Daily ET₀' : 'Cumulative ET₀'
              ]}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Legend 
              wrapperStyle={{ color: textColor, fontSize: '12px' }}
              formatter={(value) => 
                value === 'et0_daily' ? 'Daily ET₀' : 'Cumulative ET₀'
              }
            />
            <Line 
              type="monotone" 
              dataKey="et0_daily" 
              stroke={isDarkMode ? '#d29922' : '#9a6700'}
              strokeWidth={2}
              name="et0_daily"
              dot={{ fill: isDarkMode ? '#d29922' : '#9a6700', strokeWidth: 2, r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="et0_sum" 
              stroke={isDarkMode ? '#da7633' : '#bc4c00'}
              strokeWidth={2}
              name="et0_sum"
              dot={{ fill: isDarkMode ? '#da7633' : '#bc4c00', strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};