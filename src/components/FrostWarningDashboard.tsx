// Frost Warning Dashboard Component
// Add to src/components/FrostWarningDashboard.tsx
import React from 'react';
import { AlertTriangle, Thermometer, Shield, Clock, MapPin, Droplets } from 'lucide-react';
import { useFrostWarnings, FROST_THRESHOLDS, type FrostWarning } from '../utils/frostWarnings';

interface FrostWarningDashboardProps {
  locations: any[];
  cropInstances: any[];
  onSendAlert?: (warning: FrostWarning) => void;
}

const FrostWarningDashboard: React.FC<FrostWarningDashboardProps> = ({
  locations,
  cropInstances,
  onSendAlert
}) => {
  const { frostWarnings, activeFrostWarnings, criticalFrostWarnings } = useFrostWarnings(
    locations, 
    cropInstances
  );

  const getRiskColor = (cropRisk: FrostWarning['cropRisk']) => {
    switch (cropRisk) {
      case 'critical': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'high': return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
      case 'moderate': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'low': return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700';
    }
  };

  const getSeverityColor = (severity: FrostWarning['severity']) => {
    const config = FROST_THRESHOLDS[severity as keyof typeof FROST_THRESHOLDS];
    return {
      backgroundColor: config.color + '20',
      borderColor: config.color,
      color: config.color
    };
  };

  if (activeFrostWarnings.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Thermometer className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Frost Conditions</h2>
        </div>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Shield className="w-12 h-12 mx-auto mb-2 text-green-400" />
          <p className="text-lg font-medium text-green-600 dark:text-green-400">No Frost Warnings</p>
          <p className="text-sm">All locations are currently safe from frost conditions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Critical Alerts Banner */}
      {criticalFrostWarnings.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <h3 className="font-semibold text-red-800 dark:text-red-300">Critical Frost Alert</h3>
          </div>
          <p className="text-red-700 dark:text-red-400">
            {criticalFrostWarnings.length} location(s) have critical frost conditions. 
            Take immediate protective action.
          </p>
        </div>
      )}

      {/* Frost Warnings Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center space-x-3">
            <Thermometer className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Active Frost Warnings</h2>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {activeFrostWarnings.length} active warning(s)
          </div>
        </div>

        <div className="p-6 space-y-4">
          {activeFrostWarnings.map((warning) => (
            <div
              key={warning.id}
              className="border rounded-lg p-4 space-y-3"
              style={getSeverityColor(warning.severity)}
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">
                    {FROST_THRESHOLDS[warning.severity].icon}
                  </span>
                  <div>
                    <h3 className="font-semibold capitalize text-gray-900 dark:text-white">
                      {warning.severity.replace('-', ' ')}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-700 dark:text-gray-300">
                      <span className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{warning.locationName}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{warning.timeframe}</span>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {warning.temperature}°F
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    {warning.probability}% probability
                  </div>
                </div>
              </div>

              {/* Crop Risk Assessment */}
              <div className={`rounded-lg p-3 border ${getRiskColor(warning.cropRisk)}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Crop Risk Level</span>
                  <span className="px-2 py-1 rounded text-xs font-medium bg-white dark:bg-gray-800 bg-opacity-50 dark:bg-opacity-50">
                    {warning.cropRisk.toUpperCase()}
                  </span>
                </div>
                {warning.cropRisk !== 'low' && (
                  <p className="text-sm">
                    Sensitive crops at this location may experience damage. 
                    Review protection recommendations below.
                  </p>
                )}
              </div>

              {/* Recommendations */}
              <div className="bg-white dark:bg-gray-800 bg-opacity-50 dark:bg-opacity-50 rounded-lg p-3">
                <h4 className="font-medium mb-2 flex items-center space-x-2 text-gray-900 dark:text-white">
                  <Shield className="w-4 h-4" />
                  <span>Protection Recommendations</span>
                </h4>
                <ul className="space-y-1">
                  {warning.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm flex items-start space-x-2 text-gray-700 dark:text-gray-300">
                      <span className="text-xs mt-1">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-300 dark:border-gray-600 border-opacity-30">
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Created: {new Date(warning.createdAt).toLocaleTimeString()}
                </div>
                <div className="flex space-x-2">
                  {onSendAlert && (
                    <button
                      onClick={() => onSendAlert(warning)}
                      className="px-3 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-300 dark:border-gray-600"
                    >
                      Send Alert
                    </button>
                  )}
                  <button className="px-3 py-1 bg-white dark:bg-gray-800 bg-opacity-50 dark:bg-opacity-50 text-gray-700 dark:text-gray-300 rounded text-sm font-medium hover:bg-white dark:hover:bg-gray-700 hover:bg-opacity-70 transition-colors border border-gray-300 dark:border-gray-600">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Thermometer className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Warnings</p>
              <p className="text-2xl font-bold text-gray-900">
                {activeFrostWarnings.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Critical</p>
              <p className="text-2xl font-bold text-gray-900">
                {criticalFrostWarnings.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Shield className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">High Risk Crops</p>
              <p className="text-2xl font-bold text-gray-900">
                {activeFrostWarnings.filter(w => w.cropRisk === 'high' || w.cropRisk === 'critical').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Droplets className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Locations Protected</p>
              <p className="text-2xl font-bold text-gray-900">
                {locations.length - activeFrostWarnings.length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FrostWarningDashboard;