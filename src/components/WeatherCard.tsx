import React from 'react';
import { Droplets, Gauge, TrendingUp } from 'lucide-react';

interface WeatherCardProps {
  title: string;
  value: number;
  unit: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'stable';
  description?: string;
}

export const WeatherCard: React.FC<WeatherCardProps> = ({
  title,
  value,
  unit,
  icon,
  trend,
  description
}) => {
  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-red-500';
      case 'down': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="text-blue-500 dark:text-blue-400">
            {icon}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
        </div>
        {trend && (
          <TrendingUp className={`h-4 w-4 ${getTrendColor()}`} />
        )}
      </div>
      
      <div className="flex items-baseline space-x-2">
        <span className="text-3xl font-bold text-gray-900 dark:text-white">
          {value.toFixed(2)}
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {unit}
        </span>
      </div>
      
      {description && (
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          {description}
        </p>
      )}
    </div>
  );
};