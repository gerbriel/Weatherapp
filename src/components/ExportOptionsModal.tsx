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
    includeFieldBlocks: availableDataTypes.hasFieldBlocks,
    includeHistoricalData: false,
    includeCharts: availableDataTypes.hasCharts,
    fileFormat: 'excel',
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
      options.includeFieldBlocks && availableDataTypes.hasFieldBlocks,
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



            {/* Field Blocks */}
            <div className="flex items-start space-x-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex-shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  id="fieldBlocks"
                  checked={options.includeFieldBlocks && availableDataTypes.hasFieldBlocks}
                  onChange={() => toggleOption('includeFieldBlocks')}
                  disabled={!availableDataTypes.hasFieldBlocks}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
                />
              </div>
              <div className="flex-grow">
                <label htmlFor="fieldBlocks" className="flex items-center text-sm font-medium text-gray-900 dark:text-white cursor-pointer">
                  <Map className="h-4 w-4 mr-2 text-indigo-500" />
                  Field Block Management
                </label>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Field configurations, crop assignments, irrigation zones, acreage
                </p>
                {availableDataTypes.hasFieldBlocks ? (
                  <div className="flex items-center mt-1">
                    <CheckCircle2 className="h-3 w-3 text-green-500 mr-1" />
                    <span className="text-xs text-green-600 dark:text-green-400">Available</span>
                  </div>
                ) : (
                  <div className="flex items-center mt-1">
                    <Info className="h-3 w-3 text-gray-400 mr-1" />
                    <span className="text-xs text-gray-500">No field blocks configured</span>
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
                  checked={options.includeCharts && availableDataTypes.hasCharts}
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
                    <span className="text-xs text-green-600 dark:text-green-400">Available - Includes chart images and data</span>
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
            
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => toggleOption('fileFormat', 'csv')}
                disabled={options.includeCharts}
                className={`p-4 border rounded-lg text-left transition-all ${
                  options.fileFormat === 'csv'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                } ${options.includeCharts ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center mb-2">
                  <Download className="h-5 w-5 text-blue-500 mr-2" />
                  <span className="font-medium text-gray-900 dark:text-white">CSV Files</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Separate CSV files for each data type. Good for spreadsheet analysis.
                  {options.includeCharts && <span className="text-red-500 block">Charts not supported in CSV</span>}
                </p>
              </button>

              <button
                onClick={() => toggleOption('fileFormat', 'excel')}
                disabled={options.includeCharts}
                className={`p-4 border rounded-lg text-left transition-all ${
                  options.fileFormat === 'excel'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                } ${options.includeCharts ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center mb-2">
                  <FileSpreadsheet className="h-5 w-5 text-green-500 mr-2" />
                  <span className="font-medium text-gray-900 dark:text-white">Excel File</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Single Excel file with multiple sheets. Best for comprehensive reports.
                  {options.includeCharts && <span className="text-red-500 block">Charts not supported in basic Excel</span>}
                </p>
              </button>

              {options.includeCharts && (
                <>
                  <button
                    onClick={() => toggleOption('fileFormat', 'charts-excel')}
                    className={`p-4 border rounded-lg text-left transition-all ${
                      options.fileFormat === 'charts-excel'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center mb-2">
                      <FileSpreadsheet className="h-5 w-5 text-purple-500 mr-2" />
                      <span className="font-medium text-gray-900 dark:text-white">Charts + Excel ✨</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Excel file with chart URLs and data. Open URLs to view charts.
                    </p>
                  </button>

                  <button
                    onClick={() => toggleOption('fileFormat', 'html')}
                    className={`p-4 border rounded-lg text-left transition-all ${
                      options.fileFormat === 'html'
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center mb-2">
                      <Globe className="h-5 w-5 text-indigo-500 mr-2" />
                      <span className="font-medium text-gray-900 dark:text-white">HTML Report ✨</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Beautiful HTML report with embedded charts. Perfect for sharing!
                    </p>
                  </button>
                </>
              )}
            </div>
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
              {options.fileFormat === 'excel' ? (
                <FileSpreadsheet className="h-4 w-4 mr-2" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Export {options.fileFormat.toUpperCase()}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};