import React from 'react';
import { Calendar, TrendingUp, Clock, BarChart3 } from 'lucide-react';

interface ReportModeToggleProps {
  mode: 'current' | 'historical';
  onModeChange: (mode: 'current' | 'historical') => void;
  className?: string;
}

export const ReportModeToggle: React.FC<ReportModeToggleProps> = ({
  mode,
  onModeChange,
  className = ""
}) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-green-500" />
          Report Type
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Current Report */}
        <button
          onClick={() => onModeChange('current')}
          className={`p-4 rounded-lg border transition-all duration-200 text-left h-full ${
            mode === 'current'
              ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-900 dark:text-blue-100'
              : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm font-medium">Current Report</span>
          </div>
          <div className="text-xs opacity-80 mb-2">
            14-day forecast from today
          </div>
          {mode === 'current' && (
            <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
              <Clock className="h-3 w-3" />
              Real-time data
            </div>
          )}
        </button>

        {/* Historical Report */}
        <button
          onClick={() => onModeChange('historical')}
          className={`p-4 rounded-lg border transition-all duration-200 text-left h-full ${
            mode === 'historical'
              ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700 text-purple-900 dark:text-purple-100'
              : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4" />
            <span className="text-sm font-medium">Historical Report</span>
          </div>
          <div className="text-xs opacity-80 mb-2">
            Custom date range analysis
          </div>
          {mode === 'historical' && (
            <div className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400">
              <BarChart3 className="h-3 w-3" />
              Historical analysis
            </div>
          )}
        </button>
      </div>

      {/* Mode Description */}
      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div className="text-xs text-gray-600 dark:text-gray-400">
          {mode === 'current' ? (
            <div>
              <strong>Current Mode:</strong> Real-time forecasts and live crop conditions from Open-Meteo and CMIS APIs.
            </div>
          ) : (
            <div>
              <strong>Historical Mode:</strong> Analyze past weather patterns and crop performance over custom date ranges.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportModeToggle;