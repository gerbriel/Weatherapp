import React, { useState } from 'react';
import { Calendar, RotateCcw, Clock, TrendingUp } from 'lucide-react';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onApply: () => void;
  onReset: () => void;
  isLoading?: boolean;
  className?: string;
}

interface PresetRange {
  label: string;
  days: number;
  icon: React.ReactNode;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onApply,
  onReset,
  isLoading = false,
  className = ""
}) => {
  const [showPresets, setShowPresets] = useState(false);

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  
  // Calculate max date (today) and min date (1 year ago)
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const minDate = oneYearAgo.toISOString().split('T')[0];

  // Preset date ranges
  const presetRanges: PresetRange[] = [
    { label: 'Last 2 weeks', days: 14, icon: <Calendar className="h-3 w-3" /> },
    { label: 'Last 30 days', days: 30, icon: <TrendingUp className="h-3 w-3" /> },
    { label: 'Last 90 days', days: 90, icon: <TrendingUp className="h-3 w-3" /> },
    { label: 'Last 180 days', days: 180, icon: <TrendingUp className="h-3 w-3" /> },
    { label: 'Last year', days: 365, icon: <Clock className="h-3 w-3" /> },
  ];

  const handlePresetSelect = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    
    onEndDateChange(end.toISOString().split('T')[0]);
    onStartDateChange(start.toISOString().split('T')[0]);
    setShowPresets(false);
  };

  const getPresetDescription = (days: number): string => {
    switch (days) {
      case 14: return 'Recent weather trends and short-term crop analysis';
      case 30: return 'Monthly patterns and irrigation planning';
      case 90: return 'Seasonal analysis and quarterly comparisons';
      case 180: return 'Half-year trends and crop cycle analysis';
      case 365: return 'Full year analysis and annual comparisons';
      default: return 'Historical weather analysis';
    }
  };

  const isValidRange = () => {
    if (!startDate || !endDate) return false;
    const start = new Date(startDate);
    const end = new Date(endDate);
    return start <= end && start >= new Date(minDate) && end <= new Date(today);
  };

  const getDaysDifference = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
          <Calendar className="h-4 w-4 text-blue-500" />
          Custom Date Range
        </h4>
        <button
          onClick={() => setShowPresets(!showPresets)}
          className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors flex items-center gap-1"
        >
          <Clock className="h-3 w-3" />
          {showPresets ? 'Hide Presets' : 'Quick Presets'}
        </button>
      </div>

      {/* Preset Ranges */}
      {showPresets && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-3">
            Choose a preset range for common analysis periods:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2">
            {presetRanges.map((preset) => (
              <button
                key={preset.days}
                onClick={() => handlePresetSelect(preset.days)}
                className="flex items-center gap-2 px-3 py-2 text-xs bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors whitespace-nowrap group"
                title={getPresetDescription(preset.days)}
              >
                {preset.icon}
                <span className="flex-1">{preset.label}</span>
              </button>
            ))}
          </div>
          <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            💡 <strong>Tip:</strong> Use 2 weeks for recent trends, 30-90 days for seasonal patterns, 180+ days for long-term analysis
          </div>
        </div>
      )}

      {/* Date Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            min={minDate}
            max={endDate || today}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            min={startDate}
            max={today}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      {/* Range Info */}
      {startDate && endDate && (
        <div className="mb-4 text-xs text-gray-600 dark:text-gray-400">
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Selected range: {getDaysDifference()} days
            {getDaysDifference() > 90 && getDaysDifference() <= 180 && (
              <span className="text-orange-600 dark:text-orange-400 ml-2">
                (Large range)
              </span>
            )}
            {getDaysDifference() > 180 && (
              <span className="text-red-600 dark:text-red-400 ml-2">
                (Very large range)
              </span>
            )}
          </span>
          {getDaysDifference() > 180 && (
            <div className="text-orange-600 dark:text-orange-400 mt-1">
              ⚠️ Large date ranges may take significantly longer to load and process
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onApply}
          disabled={!isValidRange() || isLoading}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            isValidRange() && !isLoading
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
          }`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Loading...
            </span>
          ) : (
            'Apply Range'
          )}
        </button>
        <button
          onClick={onReset}
          className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      {/* Validation Messages */}
      {startDate && endDate && !isValidRange() && (
        <div className="mt-2 text-xs text-red-600 dark:text-red-400">
          Please select a valid date range (start date must be before end date, within the last year)
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;