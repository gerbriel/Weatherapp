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
    <div className="gh-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-github-canvas-subtle dark:bg-github-dark-canvas-subtle rounded-gh text-github-accent-emphasis dark:text-github-dark-accent-emphasis">
            {icon}
          </div>
          <h3 className="text-base font-semibold text-github-fg-default dark:text-github-dark-fg-default">
            {title}
          </h3>
        </div>
        {trend && (
          <TrendingUp className={`h-4 w-4 ${getTrendColor()}`} />
        )}
      </div>
      
      <div className="flex items-baseline space-x-2 mb-2">
        <span className="text-2xl font-bold text-github-fg-default dark:text-github-dark-fg-default">
          {value.toFixed(2)}
        </span>
        <span className="text-sm text-github-fg-muted dark:text-github-dark-fg-muted font-mono">
          {unit}
        </span>
      </div>
      
      {description && (
        <p className="text-sm text-github-fg-subtle dark:text-github-dark-fg-subtle">
          {description}
        </p>
      )}
    </div>
  );
};