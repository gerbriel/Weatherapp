// Frost Alert Subscription Component
// Add to src/components/FrostAlertSubscription.tsx
import React, { useState } from 'react';
import { Bell, Mail, MapPin, Thermometer, Clock, Shield } from 'lucide-react';
import { useLocations } from '../contexts/LocationsContext';
import { FrostEmailService } from '../services/frostEmailService';

const FrostAlertSubscription: React.FC = () => {
  const { locations } = useLocations();
  const [email, setEmail] = useState('');
  const [selectedLocations, setSelectedLocations] = useState<Set<string>>(new Set());
  const [frostThreshold, setFrostThreshold] = useState(32);
  const [severityLevels, setSeverityLevels] = useState<Set<string>>(
    new Set(['frost-warning', 'hard-freeze'])
  );
  const [advanceWarning, setAdvanceWarning] = useState(24);
  const [subscribing, setSubscribing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableLocations = locations.filter(loc => 
    loc.latitude && loc.longitude && loc.name
  );

  const severityOptions = [
    { id: 'frost-watch', label: 'Frost Watch (36-33°F)', icon: '❄️', color: 'blue' },
    { id: 'frost-advisory', label: 'Frost Advisory (32-28°F)', icon: '🧊', color: 'yellow' },
    { id: 'frost-warning', label: 'Frost Warning (28-25°F)', icon: '⚠️', color: 'orange' },
    { id: 'hard-freeze', label: 'Hard Freeze (≤25°F)', icon: '🥶', color: 'red' }
  ];

  const handleLocationToggle = (locationId: string) => {
    setSelectedLocations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(locationId)) {
        newSet.delete(locationId);
      } else {
        newSet.add(locationId);
      }
      return newSet;
    });
  };

  const handleSeverityToggle = (severity: string) => {
    setSeverityLevels(prev => {
      const newSet = new Set(prev);
      if (newSet.has(severity)) {
        newSet.delete(severity);
      } else {
        newSet.add(severity);
      }
      return newSet;
    });
  };

  const handleSubscribe = async () => {
    if (!email) {
      setError('Please enter an email address');
      return;
    }

    if (selectedLocations.size === 0) {
      setError('Please select at least one location');
      return;
    }

    if (severityLevels.size === 0) {
      setError('Please select at least one severity level');
      return;
    }

    setError(null);
    setSuccess(false);
    setSubscribing(true);

    try {
      await FrostEmailService.subscribeFrostAlerts({
        email: email,
        locationIds: Array.from(selectedLocations),
        enabled: true,
        frostThreshold: frostThreshold,
        severityLevels: Array.from(severityLevels),
        advanceWarning: advanceWarning
      });

      setSuccess(true);
      setEmail('');
      setSelectedLocations(new Set());
      
      setTimeout(() => {
        setSuccess(false);
      }, 5000);

    } catch (err) {
      console.error('Error subscribing to frost alerts:', err);
      setError('Failed to subscribe to frost alerts. Please try again.');
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
          <Bell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Frost Alert Subscription</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Get notified when frost conditions threaten your locations</p>
        </div>
      </div>

      {success && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
            <p className="text-green-800 dark:text-green-200 font-medium">
              Frost alerts subscription created successfully!
            </p>
          </div>
          <p className="text-green-700 dark:text-green-300 text-sm mt-1">
            You'll receive email notifications when frost conditions are detected for your selected locations.
          </p>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-800 dark:text-red-200 font-medium">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Email Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Mail className="w-4 h-4 inline mr-2" />
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your.email@example.com"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        {/* Location Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            <MapPin className="w-4 h-4 inline mr-2" />
            Locations to Monitor ({selectedLocations.size} selected)
          </label>
          {availableLocations.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No locations available. Please add some locations first.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {availableLocations.map((location) => (
                <label
                  key={location.id}
                  className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedLocations.has(location.id)
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'
                      : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedLocations.has(location.id)}
                    onChange={() => handleLocationToggle(location.id)}
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 mr-3"
                  />
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">{location.name}</span>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {location.latitude.toFixed(3)}, {location.longitude.toFixed(3)}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Temperature Threshold */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Thermometer className="w-4 h-4 inline mr-2" />
            Frost Temperature Threshold: {frostThreshold}°F
          </label>
          <input
            type="range"
            min="25"
            max="40"
            step="1"
            value={frostThreshold}
            onChange={(e) => setFrostThreshold(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>25°F (Hard Freeze)</span>
            <span>32°F (Frost)</span>
            <span>40°F (Early Warning)</span>
          </div>
        </div>

        {/* Alert Severity Levels */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Alert Severity Levels ({severityLevels.size} selected)
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {severityOptions.map((option) => (
              <label
                key={option.id}
                className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                  severityLevels.has(option.id)
                    ? `bg-${option.color}-50 dark:bg-${option.color}-900/20 border-${option.color}-200 dark:border-${option.color}-700`
                    : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                <input
                  type="checkbox"
                  checked={severityLevels.has(option.id)}
                  onChange={() => handleSeverityToggle(option.id)}
                  className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 mr-3"
                />
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{option.icon}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{option.label}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Advance Warning */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Clock className="w-4 h-4 inline mr-2" />
            Advance Warning: {advanceWarning} hours
          </label>
          <select
            value={advanceWarning}
            onChange={(e) => setAdvanceWarning(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value={12}>12 hours ahead</option>
            <option value={24}>24 hours ahead</option>
            <option value={48}>48 hours ahead</option>
            <option value={72}>72 hours ahead</option>
          </select>
        </div>

        {/* Subscribe Button */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
          <button
            onClick={handleSubscribe}
            disabled={subscribing || availableLocations.length === 0}
            className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {subscribing ? 'Subscribing...' : 'Subscribe to Frost Alerts'}
          </button>
        </div>

        {/* Information */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">How Frost Alerts Work</h4>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• Alerts are sent when temperatures are predicted to drop to your threshold</li>
            <li>• You'll receive advance warnings based on your preference (12-72 hours)</li>
            <li>• Different severity levels help you prepare appropriate protection measures</li>
            <li>• Crop risk assessments included based on agricultural best practices</li>
            <li>• Protection recommendations provided for each alert</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default FrostAlertSubscription;