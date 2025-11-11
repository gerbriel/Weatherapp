import React from 'react';
import { TrendingUp } from 'lucide-react';

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
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-blue-600 dark:text-blue-400">
            {icon}
          </div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
        </div>
        {trend && (
          <TrendingUp className={`h-4 w-4 ${getTrendColor()}`} />
        )}
      </div>
      
      <div className="flex items-baseline space-x-2 mb-2">
        <span className="text-2xl font-bold text-gray-900 dark:text-white">
          {value.toFixed(2)}
        </span>
        <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
          {unit}
        </span>
      </div>
      
      {description && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {description}
        </p>
      )}
    </div>
  );
};