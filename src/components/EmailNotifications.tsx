import React, { useState } from 'react';
import { Mail, Clock, MapPin, Send, Trash2, Settings, Plus } from 'lucide-react';
import { useEmail } from '../contexts/EmailContext';
import { useLocations } from '../contexts/LocationsContext';

export const EmailNotifications: React.FC = () => {
  const { subscriptions, addSubscription, updateSubscription, removeSubscription, sendTestEmail, loading, error } = useEmail();
  const { locations } = useLocations();
  const [showAddForm, setShowAddForm] = useState(false);
  const [testEmailSent, setTestEmailSent] = useState<string | null>(null);
  
  const [newSubscription, setNewSubscription] = useState({
    email: '',
    name: '',
    selectedLocationIds: [] as string[],
    dayOfWeek: 1, // Monday
    hour: 8, // 8 AM
    enabled: true,
  });

  const daysOfWeek = [
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
    { value: 7, label: 'Sunday' },
  ];

  const hours = Array.from({ length: 24 }, (_, i) => ({
    value: i,
    label: `${i.toString().padStart(2, '0')}:00`,
  }));

  const handleAddSubscription = () => {
    if (!newSubscription.email.trim() || !newSubscription.name.trim()) {
      alert('Please enter both email and name');
      return;
    }

    if (newSubscription.selectedLocationIds.length === 0) {
      alert('Please select at least one location');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newSubscription.email)) {
      alert('Please enter a valid email address');
      return;
    }

    addSubscription({
      ...newSubscription,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });

    setNewSubscription({
      email: '',
      name: '',
      selectedLocationIds: [],
      dayOfWeek: 1,
      hour: 8,
      enabled: true,
    });
    setShowAddForm(false);
  };

  const handleLocationToggle = (locationId: string, isSubscription: boolean = false, subscriptionId?: string) => {
    if (isSubscription && subscriptionId) {
      const subscription = subscriptions.find(sub => sub.id === subscriptionId);
      if (subscription) {
        const currentIds = subscription.preferences.selectedLocationIds;
        const newIds = currentIds.includes(locationId)
          ? currentIds.filter(id => id !== locationId)
          : [...currentIds, locationId];
        
        updateSubscription(subscriptionId, { selectedLocationIds: newIds });
      }
    } else {
      setNewSubscription(prev => ({
        ...prev,
        selectedLocationIds: prev.selectedLocationIds.includes(locationId)
          ? prev.selectedLocationIds.filter(id => id !== locationId)
          : [...prev.selectedLocationIds, locationId]
      }));
    }
  };

  const handleSendTestEmail = async (subscriptionId: string) => {
    try {
      const subscription = subscriptions.find(sub => sub.id === subscriptionId);
      if (!subscription) return;

      const selectedLocations = locations.filter(loc => 
        subscription.preferences.selectedLocationIds.includes(loc.id) && loc.weatherData
      );

      if (selectedLocations.length === 0) {
        alert('No locations with weather data available. Please ensure your locations have loaded weather data first.');
        return;
      }

      await sendTestEmail(subscription.preferences.email, selectedLocations);
      setTestEmailSent(subscriptionId);
      setTimeout(() => setTestEmailSent(null), 3000);
    } catch (err) {
      console.error('Failed to send test email:', err);
      alert('Failed to send test email. Please check your email settings.');
    }
  };

  const getDayLabel = (dayOfWeek: number) => {
    return daysOfWeek.find(day => day.value === dayOfWeek)?.label || 'Monday';
  };

  const getTimeLabel = (hour: number) => {
    return `${hour.toString().padStart(2, '0')}:00`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <Mail className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
            Email Notifications
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Get weekly weather reports delivered to your inbox
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="gh-btn gh-btn-primary text-sm"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Subscription
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Add Subscription Form */}
      {showAddForm && (
        <div className="p-6 border border-blue-200 dark:border-blue-700 rounded-lg bg-blue-50 dark:bg-blue-900/20">
          <h3 className="font-medium text-gray-900 dark:text-white mb-4">Add Email Subscription</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={newSubscription.email}
                onChange={(e) => setNewSubscription(prev => ({ ...prev, email: e.target.value }))}
                className="gh-input w-full"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Name
              </label>
              <input
                type="text"
                value={newSubscription.name}
                onChange={(e) => setNewSubscription(prev => ({ ...prev, name: e.target.value }))}
                className="gh-input w-full"
                placeholder="Your Name"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Day of Week
              </label>
              <select
                value={newSubscription.dayOfWeek}
                onChange={(e) => setNewSubscription(prev => ({ ...prev, dayOfWeek: parseInt(e.target.value) }))}
                className="gh-input w-full"
              >
                {daysOfWeek.map(day => (
                  <option key={day.value} value={day.value}>{day.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Time
              </label>
              <select
                value={newSubscription.hour}
                onChange={(e) => setNewSubscription(prev => ({ ...prev, hour: parseInt(e.target.value) }))}
                className="gh-input w-full"
              >
                {hours.map(hour => (
                  <option key={hour.value} value={hour.value}>{hour.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Locations ({newSubscription.selectedLocationIds.length} selected)
            </label>
            <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded p-3">
              {locations.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No locations available. Please add some locations first.</p>
              ) : (
                locations.map(location => (
                  <label key={location.id} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newSubscription.selectedLocationIds.includes(location.id)}
                      onChange={() => handleLocationToggle(location.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{location.name}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                      {location.latitude.toFixed(2)}, {location.longitude.toFixed(2)}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowAddForm(false)}
              className="gh-btn text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleAddSubscription}
              className="gh-btn gh-btn-primary text-sm"
            >
              Add Subscription
            </button>
          </div>
        </div>
      )}

      {/* Existing Subscriptions */}
      <div className="space-y-4">
        {subscriptions.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Mail className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No email subscriptions yet</p>
            <p className="text-sm">Add a subscription to get weekly weather reports</p>
          </div>
        ) : (
          subscriptions.map(subscription => (
            <div key={subscription.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {subscription.preferences.name}
                    </h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      subscription.preferences.enabled 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                      {subscription.preferences.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {subscription.preferences.email}
                  </p>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{getDayLabel(subscription.preferences.dayOfWeek)}s at {getTimeLabel(subscription.preferences.hour)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>{subscription.preferences.selectedLocationIds.length} locations</span>
                    </div>
                  </div>

                  {subscription.preferences.lastSent && (
                    <p className="text-xs text-gray-400 mt-2">
                      Last sent: {new Date(subscription.preferences.lastSent).toLocaleDateString()}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleSendTestEmail(subscription.id)}
                    disabled={loading}
                    className="gh-btn text-sm"
                    title="Send test email"
                  >
                    <Send className="h-4 w-4" />
                    {testEmailSent === subscription.id ? '✓' : ''}
                  </button>
                  
                  <button
                    onClick={() => updateSubscription(subscription.id, { 
                      enabled: !subscription.preferences.enabled 
                    })}
                    className="gh-btn text-sm"
                    title={subscription.preferences.enabled ? 'Disable' : 'Enable'}
                  >
                    <Settings className="h-4 w-4" />
                  </button>
                  
                  <button
                    onClick={() => removeSubscription(subscription.id)}
                    className="gh-btn text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                    title="Delete subscription"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Location list for this subscription */}
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Selected Locations:</p>
                <div className="flex flex-wrap gap-2">
                  {subscription.preferences.selectedLocationIds.map(locationId => {
                    const location = locations.find(loc => loc.id === locationId);
                    return location ? (
                      <span
                        key={locationId}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 rounded"
                      >
                        {location.name}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Instructions */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
        <h3 className="font-medium text-blue-900 dark:text-blue-300 mb-2">Setup Instructions</h3>
        <div className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
          <p>1. Add your email and select the locations you want to monitor</p>
          <p>2. Choose when you want to receive reports (day and time)</p>
          <p>3. Use the "Send Test" button to preview your email format</p>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
            Note: Email scheduling requires the browser to be open at the scheduled time. For production use, consider setting up a backend service.
          </p>
        </div>
      </div>
    </div>
  );
};