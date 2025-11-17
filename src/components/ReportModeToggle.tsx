import React from 'react';
import { Calendar, TrendingUp, Clock, BarChart3, Sun, CloudRain, CalendarCheck } from 'lucide-react';

interface ReportModeToggleProps {
  mode: 'current' | 'historical' | 'future';
  onModeChange: (mode: 'current' | 'historical' | 'future') => void;
  forecastPreset?: 'today' | '7day' | '14day';
  onPresetChange?: (preset: 'today' | '7day' | '14day') => void;
  className?: string;
}

export const ReportModeToggle: React.FC<ReportModeToggleProps> = ({
  mode,
  onModeChange,
  forecastPreset = '14day',
  onPresetChange,
  className = ""
}) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-medium text-gray-900 dark:text-white flex items-center gap-1.5">
          <BarChart3 className="h-3.5 w-3.5 text-green-500" />
          Report Type
        </h3>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {/* Current Report */}
        <button
          onClick={() => onModeChange('current')}
          className={`p-2.5 rounded-lg border transition-all duration-200 text-left h-full ${
            mode === 'current'
              ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-900 dark:text-blue-100'
              : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
          }`}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">Current Report</span>
          </div>
          <div className="text-[11px] opacity-80">
            {forecastPreset === 'today' ? 'Today\'s forecast' : 
             forecastPreset === '7day' ? '7-day forecast from today' : 
             '14-day forecast from today'}
          </div>
          {mode === 'current' && (
            <div className="flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 mt-1">
              <Clock className="h-2.5 w-2.5" />
              Real-time data
            </div>
          )}
        </button>

        {/* Future Report */}
        <button
          onClick={() => onModeChange('future')}
          className={`p-2.5 rounded-lg border transition-all duration-200 text-left h-full ${
            mode === 'future'
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 text-green-900 dark:text-green-100'
              : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
          }`}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <CalendarCheck className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">Future Report</span>
          </div>
          <div className="text-[11px] opacity-80">
            Plan ahead for specific date
          </div>
        </button>

        {/* Historical Report */}
        <button
          onClick={() => onModeChange('historical')}
          className={`p-2.5 rounded-lg border transition-all duration-200 text-left h-full ${
            mode === 'historical'
              ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700 text-purple-900 dark:text-purple-100'
              : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
          }`}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <Calendar className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">Historical Report</span>
          </div>
          <div className="text-[11px] opacity-80">
            Custom date range analysis
          </div>
        </button>
      </div>

      {/* Forecast Presets - Only show when in Current or Future mode */}
      {(mode === 'current' || mode === 'future') && onPresetChange && (
        <div className="mt-2.5">
          <h4 className="text-[11px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            {mode === 'current' ? 'Forecast Period' : 'Future Period Length'}
          </h4>
          <div className="grid grid-cols-3 gap-1.5">
            {mode === 'current' && (
              <button
                onClick={() => onPresetChange('today')}
                className={`px-2 py-1.5 rounded-md text-[11px] font-medium transition-all ${
                  forecastPreset === 'today'
                    ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-600'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Sun className="h-2.5 w-2.5 inline mr-1" />
                Today
              </button>
            )}
            <button
              onClick={() => onPresetChange('7day')}
              className={`px-2 py-1.5 rounded-md text-[11px] font-medium transition-all ${
                forecastPreset === '7day'
                  ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-600'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <CloudRain className="h-2.5 w-2.5 inline mr-1" />
              7 Days
            </button>
            <button
              onClick={() => onPresetChange('14day')}
              className={`px-2 py-1.5 rounded-md text-[11px] font-medium transition-all ${
                forecastPreset === '14day'
                  ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-600'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <TrendingUp className="h-2.5 w-2.5 inline mr-1" />
              14 Days
            </button>
          </div>
        </div>
      )}

      {/* Mode Description */}
      <div className="mt-2.5 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div className="text-[11px] text-gray-600 dark:text-gray-400">
          {mode === 'current' ? (
            <div>
              <strong>Current Mode:</strong> Real-time forecasts and live crop conditions from Open-Meteo and CMIS APIs.
            </div>
          ) : mode === 'future' ? (
            <div>
              <strong>Future Mode:</strong> Plan ahead with forecasts starting from a specific future date.
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