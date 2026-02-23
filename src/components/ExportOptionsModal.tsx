import React, { useState } from 'react';
import { X, Download, FileSpreadsheet, CheckCircle2, Info, Calendar, Sprout, Calculator, Map, TrendingUp, Globe } from 'lucide-react';
import type { ComprehensiveExportOptions } from '../utils/exportUtils';

interface ExportOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: ComprehensiveExportOptions) => void;
  availableDataTypes: {
    hasWeatherData: boolean;
    hasCMISData: boolean;
    hasCropData: boolean;
    hasCalculatorResults: boolean;
    hasFieldBlocks: boolean;
    hasHistoricalData: boolean;
    hasCharts: boolean;
  };
}

export const ExportOptionsModal: React.FC<ExportOptionsModalProps> = ({
  isOpen,
  onClose,
  onExport,
  availableDataTypes
}) => {
  const [options, setOptions] = useState<ComprehensiveExportOptions>({
    includeWeatherData: true,
    includeCMISData: availableDataTypes.hasCMISData, // Auto-include when available
    includeCropData: availableDataTypes.hasCropData,
    includeCalculatorResults: false, // Always false since we removed this option
    includeFieldBlocks: false, // Removed from UI - not available
    includeHistoricalData: false,
    includeCharts: availableDataTypes.hasCharts, // Auto-include when available
    fileFormat: 'html', // Default to HTML Report
    separateSheets: true
  });

  if (!isOpen) return null;

  const handleExport = () => {
    onExport(options);
    onClose();
  };

  const toggleOption = (key: keyof ComprehensiveExportOptions, value?: any) => {
    setOptions(prev => {
      const newOptions = {
        ...prev,
        [key]: value !== undefined ? value : !prev[key]
      };
      
      // Auto-switch to chart-compatible format when charts are enabled
      if (key === 'includeCharts' && newOptions.includeCharts) {
        newOptions.fileFormat = 'html';
      }
      
      // Switch back to regular format when charts are disabled
      if (key === 'includeCharts' && !newOptions.includeCharts && 
          (prev.fileFormat === 'charts-excel' || prev.fileFormat === 'html')) {
        newOptions.fileFormat = 'excel';
      }
      
      return newOptions;
    });
  };

  const getSelectedCount = () => {
    return [
      options.includeWeatherData,
      options.includeCMISData && availableDataTypes.hasCMISData,
      options.includeCropData && availableDataTypes.hasCropData,
      options.includeCharts && availableDataTypes.hasCharts
    ].filter(Boolean).length;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Export Report Data
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Choose which data to include in your export ({getSelectedCount()} selected)
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Data Types Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Select Data Types
            </h3>
            
            {/* Weather Data */}
            <div className="flex items-start space-x-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex-shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  id="weatherData"
                  checked={options.includeWeatherData}
                  onChange={() => toggleOption('includeWeatherData')}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
              <div className="flex-grow">
                <label htmlFor="weatherData" className="flex items-center text-sm font-medium text-gray-900 dark:text-white cursor-pointer">
                  <TrendingUp className="h-4 w-4 mr-2 text-blue-500" />
                  Weather Data & Forecasts
                </label>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Temperature, precipitation, wind speed, ET₀ values for up to 14 days
                </p>
                {availableDataTypes.hasWeatherData && (
                  <div className="flex items-center mt-1">
                    <CheckCircle2 className="h-3 w-3 text-green-500 mr-1" />
                    <span className="text-xs text-green-600 dark:text-green-400">Available</span>
                  </div>
                )}
              </div>
            </div>

            {/* CMIS Data */}
            <div className="flex items-start space-x-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex-shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  id="cmisData"
                  checked={availableDataTypes.hasCMISData ? true : false}
                  onChange={() => toggleOption('includeCMISData')}
                  disabled={!availableDataTypes.hasCMISData}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
                />
              </div>
              <div className="flex-grow">
                <label htmlFor="cmisData" className="flex items-center text-sm font-medium text-gray-900 dark:text-white cursor-pointer">
                  <Calendar className="h-4 w-4 mr-2 text-orange-500" />
                  CMIS Actual ETC Data
                </label>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Actual evapotranspiration measurements vs projected values (California only)
                </p>
                {availableDataTypes.hasCMISData ? (
                  <div className="flex items-center mt-1">
                    <CheckCircle2 className="h-3 w-3 text-green-500 mr-1" />
                    <span className="text-xs text-green-600 dark:text-green-400">Available for California locations - Auto-included</span>
                  </div>
                ) : (
                  <div className="flex items-center mt-1">
                    <Info className="h-3 w-3 text-gray-400 mr-1" />
                    <span className="text-xs text-gray-500">Only available for California locations</span>
                  </div>
                )}
              </div>
            </div>

            {/* Crop Data */}
            <div className="flex items-start space-x-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex-shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  id="cropData"
                  checked={options.includeCropData && availableDataTypes.hasCropData}
                  onChange={() => toggleOption('includeCropData')}
                  disabled={!availableDataTypes.hasCropData}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
                />
              </div>
              <div className="flex-grow">
                <label htmlFor="cropData" className="flex items-center text-sm font-medium text-gray-900 dark:text-white cursor-pointer">
                  <Sprout className="h-4 w-4 mr-2 text-green-500" />
                  Crop Calculations & Coefficients
                </label>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Kc values, ETc calculations, planting dates, growth stages
                </p>
                {availableDataTypes.hasCropData ? (
                  <div className="flex items-center mt-1">
                    <CheckCircle2 className="h-3 w-3 text-green-500 mr-1" />
                    <span className="text-xs text-green-600 dark:text-green-400">Available</span>
                  </div>
                ) : (
                  <div className="flex items-center mt-1">
                    <Info className="h-3 w-3 text-gray-400 mr-1" />
                    <span className="text-xs text-gray-500">No crops selected</span>
                  </div>
                )}
              </div>
            </div>



            {/* Charts & Visual Reports */}
            <div className="flex items-start space-x-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
              <div className="flex-shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  id="charts"
                  checked={availableDataTypes.hasCharts ? true : false}
                  onChange={() => toggleOption('includeCharts')}
                  disabled={!availableDataTypes.hasCharts}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
                />
              </div>
              <div className="flex-grow">
                <label htmlFor="charts" className="flex items-center text-sm font-medium text-gray-900 dark:text-white cursor-pointer">
                  <TrendingUp className="h-4 w-4 mr-2 text-blue-500" />
                  Charts & Visual Reports ✨
                </label>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Interactive charts as images: precipitation, ET₀, crop water requirements
                </p>
                {availableDataTypes.hasCharts ? (
                  <div className="flex items-center mt-1">
                    <CheckCircle2 className="h-3 w-3 text-green-500 mr-1" />
                    <span className="text-xs text-green-600 dark:text-green-400">Available - Auto-included</span>
                  </div>
                ) : (
                  <div className="flex items-center mt-1">
                    <Info className="h-3 w-3 text-gray-400 mr-1" />
                    <span className="text-xs text-gray-500">No chart data available</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* File Format Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Export Format
            </h3>
            
            {/* HTML Report - Primary/Default Option */}
            <button
              onClick={() => toggleOption('fileFormat', 'html')}
              className={`w-full p-6 border-2 rounded-lg text-left transition-all ${
                options.fileFormat === 'html'
                  ? 'border-indigo-500 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 shadow-lg'
                  : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <Globe className="h-6 w-6 text-indigo-500 mr-3" />
                  <div>
                    <span className="font-semibold text-lg text-gray-900 dark:text-white">HTML Report</span>
                    <span className="ml-2 text-xs px-2 py-1 bg-indigo-500 text-white rounded-full">RECOMMENDED</span>
                  </div>
                </div>
                {options.fileFormat === 'html' && (
                  <CheckCircle2 className="h-6 w-6 text-indigo-500" />
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Beautiful, professional report with embedded charts and visual data. Perfect for sharing and presentations.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="text-xs px-2 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded">
                  ✨ Visual Charts
                </span>
                <span className="text-xs px-2 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded">
                  📊 Comprehensive Data
                </span>
                <span className="text-xs px-2 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded">
                  🎨 Professional Design
                </span>
              </div>
            </button>

            {/* Alternative Formats - Minimized */}
            <details className="group">
              <summary className="cursor-pointer text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 flex items-center">
                <span>Other formats (CSV, Excel)</span>
                <svg className="ml-2 h-4 w-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              
              <div className="mt-3 grid grid-cols-2 gap-3">
                <button
                  onClick={() => toggleOption('fileFormat', 'csv')}
                  className={`p-3 border rounded-lg text-left transition-all ${
                    options.fileFormat === 'csv'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center mb-1">
                    <Download className="h-4 w-4 text-blue-500 mr-2" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">CSV Files</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Raw data files
                  </p>
                </button>

                <button
                  onClick={() => toggleOption('fileFormat', 'excel')}
                  className={`p-3 border rounded-lg text-left transition-all ${
                    options.fileFormat === 'excel'
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center mb-1">
                    <FileSpreadsheet className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Excel File</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Spreadsheet format
                  </p>
                </button>
              </div>
            </details>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {getSelectedCount() === 0 ? (
              'Select at least one data type to export'
            ) : (
              `Ready to export ${getSelectedCount()} data type${getSelectedCount() !== 1 ? 's' : ''}`
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={getSelectedCount() === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {options.fileFormat === 'html' ? (
                <>
                  <Globe className="h-4 w-4 mr-2" />
                  Export HTML Report
                </>
              ) : options.fileFormat === 'excel' ? (
                <>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export Excel
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};