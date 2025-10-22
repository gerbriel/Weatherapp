import React, { useState } from 'react';
import { Mail, Plus, MapPin, CheckCircle, AlertCircle, CalendarDays, Repeat, Send, Square, CheckSquare } from 'lucide-react';
import { useLocations } from '../contexts/LocationsContext';
import { EmailSubscriptionService, LocationService } from '../services/supabaseService';

// One-time email sender component
const OneTimeEmailSender: React.FC = () => {
  const { locations } = useLocations();
  const [email, setEmail] = useState('');
  const [selectedLocations, setSelectedLocations] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const locationsWithWeather = locations.filter(loc => loc.weatherData && !loc.error);

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

  const handleSelectAll = () => {
    setSelectedLocations(new Set(locationsWithWeather.map(loc => loc.id)));
  };

  const handleDeselectAll = () => {
    setSelectedLocations(new Set());
  };

  const handleSendNow = async () => {
    if (!email) {
      setError('Please enter an email address');
      return;
    }

    if (selectedLocations.size === 0) {
      setError('Please select at least one location');
      return;
    }

    setError(null);
    setSending(true);

    try {
      // Create a one-time subscription that gets processed immediately
      await EmailSubscriptionService.createSubscription({
        email: email,
        name: 'One-time Send',
        selected_location_ids: Array.from(selectedLocations),
        is_recurring: false,
        enabled: true,
        schedule_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        scheduled_at: new Date().toISOString(), // Send immediately
      });

      setSuccess(true);
      setEmail('');
      setSelectedLocations(new Set());
      
      setTimeout(() => setSuccess(false), 5000); // Hide success message after 5 seconds
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send email');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-6">
      <div className="flex items-center mb-4">
        <Send className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Send Weather Report Now</h3>
      </div>
      
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        Get an instant weather report for your selected locations sent directly to your email.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <span className="text-red-700 dark:text-red-300 text-sm">{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center space-x-2">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <span className="text-green-700 dark:text-green-300 text-sm">
            Weather report sent successfully to {email}!
          </span>
        </div>
      )}

      <div className="space-y-4">
        {/* Email Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="gh-input w-full"
            placeholder="your.email@example.com"
            disabled={sending}
          />
        </div>

        {/* Location Selection */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Select Locations ({selectedLocations.size} selected)
            </label>
            <div className="flex gap-2">
              <button
                onClick={handleSelectAll}
                disabled={sending}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                Select All
              </button>
              <span className="text-gray-400">•</span>
              <button
                onClick={handleDeselectAll}
                disabled={sending}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {locationsWithWeather.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                No locations with weather data available. Add and refresh some locations first.
              </p>
            ) : (
              locationsWithWeather.map((location) => {
                const isSelected = selectedLocations.has(location.id);
                
                return (
                  <div
                    key={location.id}
                    className="flex items-center p-2 rounded border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <button
                      onClick={() => handleLocationToggle(location.id)}
                      disabled={sending}
                      className="mr-3"
                    >
                      {isSelected ? (
                        <CheckSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <Square className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {location.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                        {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Send Button */}
        <button
          onClick={handleSendNow}
          disabled={sending || !email || selectedLocations.size === 0}
          className="gh-btn gh-btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Sending Weather Report...
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <Send className="h-4 w-4 mr-2" />
              Send Now ({selectedLocations.size} location{selectedLocations.size !== 1 ? 's' : ''})
            </div>
          )}
        </button>
      </div>
    </div>
  );
};

export const EmailNotifications: React.FC = () => {
  const { locations } = useLocations();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [subscriptionCreated, setSubscriptionCreated] = useState(false);
  const [newSubscription, setNewSubscription] = useState({
    email: '',
    name: '',
    selected_location_ids: [] as string[],
    is_recurring: true,
    schedule_day_of_week: 1, // Monday
    schedule_hour: 8, // 8 AM
    schedule_minute: 0, // 0 minutes
    schedule_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    scheduled_at: '', // For one-time emails
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

  // No need to load subscriptions for privacy - they are hidden from UI

  const handleLocationToggle = (locationId: string) => {
    setNewSubscription(prev => ({
      ...prev,
      selected_location_ids: prev.selected_location_ids.includes(locationId)
        ? prev.selected_location_ids.filter(id => id !== locationId)
        : [...prev.selected_location_ids, locationId]
    }));
  };

  const handleAddSubscription = async () => {
    if (!newSubscription.email || !newSubscription.name) {
      setError('Email and name are required');
      return;
    }

    if (newSubscription.selected_location_ids.length === 0) {
      setError('Please select at least one location');
      return;
    }

    if (!newSubscription.is_recurring && !newSubscription.scheduled_at) {
      setError('Please set a scheduled date/time for one-time emails');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Save selected locations to Supabase first to get proper UUIDs
      const selectedLocations = locations.filter(loc => 
        newSubscription.selected_location_ids.includes(loc.id)
      );
      
      const supabaseLocationIds: string[] = [];
      
      for (const location of selectedLocations) {
        try {
          const savedLocation = await LocationService.saveLocation({
            name: location.name,
            latitude: location.latitude,
            longitude: location.longitude,
            is_favorite: location.isFavorite,
          });
          supabaseLocationIds.push(savedLocation.id);
        } catch (err) {
          // Location might already exist, skip it for now
          console.warn('Could not save location:', location.name, err);
        }
      }
      
      if (supabaseLocationIds.length === 0) {
        setError('Could not save locations to database. Please try again.');
        return;
      }
      
      const subscriptionData = {
        ...newSubscription,
        selected_location_ids: supabaseLocationIds, // Use Supabase UUIDs
        scheduled_at: newSubscription.is_recurring ? undefined : new Date(newSubscription.scheduled_at).toISOString(),
        schedule_day_of_week: newSubscription.is_recurring ? newSubscription.schedule_day_of_week : undefined,
        schedule_hour: newSubscription.is_recurring ? newSubscription.schedule_hour : undefined,
        schedule_minute: newSubscription.is_recurring ? newSubscription.schedule_minute : undefined,
      };

      await EmailSubscriptionService.createSubscription(subscriptionData);
      // Don't add to subscriptions list for privacy - keep it hidden from UI
      
      // Mark subscription as created and show success modal
      setSubscriptionCreated(true);
      setSuccessMessage(
        `Success! Your ${newSubscription.is_recurring ? 'recurring' : 'one-time'} weather email subscription has been created. ` +
        `You'll receive your first email shortly at ${newSubscription.email}. ` +
        `${newSubscription.is_recurring ? 
          `Then you'll get emails every ${daysOfWeek.find(d => d.value === newSubscription.schedule_day_of_week)?.label} at ${String(newSubscription.schedule_hour).padStart(2, '0')}:${String(newSubscription.schedule_minute).padStart(2, '0')}.` :
          'This is a one-time email.'}`
      );
      setShowSuccessModal(true);
      
      // Hide form after successful submission
      setShowAddForm(false);
      
      // Reset form
      setNewSubscription({
        email: '',
        name: '',
        selected_location_ids: [],
        is_recurring: true,
        schedule_day_of_week: 1,
        schedule_hour: 8,
        schedule_minute: 0,
        schedule_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        scheduled_at: '',
        enabled: true,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create subscription');
    } finally {
      setLoading(false);
    }
  };

  // Removed subscription management functions for privacy - subscriptions are hidden from UI

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Email Notifications</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Automated weather reports sent via Supabase Edge Functions
          </p>
        </div>
        {!showAddForm && !subscriptionCreated && (
          <button
            onClick={() => setShowAddForm(true)}
            className="gh-btn gh-btn-primary"
            disabled={loading}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Subscription
          </button>
        )}
        {subscriptionCreated && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Subscription created! Check your email for updates.
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
          <span className="text-red-700 dark:text-red-300">{error}</span>
        </div>
      )}

      {/* One-Time Email Send */}
      <OneTimeEmailSender />

      {/* Add Subscription Form */}
      {showAddForm && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Create Email Subscription</h3>
          
          <div className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={newSubscription.name}
                  onChange={(e) => setNewSubscription(prev => ({ ...prev, name: e.target.value }))}
                  className="gh-input w-full"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={newSubscription.email}
                  onChange={(e) => setNewSubscription(prev => ({ ...prev, email: e.target.value }))}
                  className="gh-input w-full"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            {/* Recurring vs One-time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Schedule Type
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="scheduleType"
                    checked={newSubscription.is_recurring}
                    onChange={() => setNewSubscription(prev => ({ ...prev, is_recurring: true }))}
                    className="mr-2"
                  />
                  <Repeat className="h-4 w-4 mr-1" />
                  Recurring
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="scheduleType"
                    checked={!newSubscription.is_recurring}
                    onChange={() => setNewSubscription(prev => ({ ...prev, is_recurring: false }))}
                    className="mr-2"
                  />
                  <CalendarDays className="h-4 w-4 mr-1" />
                  One-time
                </label>
              </div>
            </div>

            {/* Schedule Settings */}
            {newSubscription.is_recurring ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Day of Week
                  </label>
                  <select
                    value={newSubscription.schedule_day_of_week}
                    onChange={(e) => setNewSubscription(prev => ({ ...prev, schedule_day_of_week: Number(e.target.value) }))}
                    className="gh-input w-full"
                  >
                    {daysOfWeek.map(day => (
                      <option key={day.value} value={day.value}>{day.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Hour
                  </label>
                  <select
                    value={newSubscription.schedule_hour}
                    onChange={(e) => setNewSubscription(prev => ({ ...prev, schedule_hour: Number(e.target.value) }))}
                    className="gh-input w-full"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Minute
                  </label>
                  <select
                    value={newSubscription.schedule_minute}
                    onChange={(e) => setNewSubscription(prev => ({ ...prev, schedule_minute: Number(e.target.value) }))}
                    className="gh-input w-full"
                  >
                    {Array.from({ length: 60 }, (_, i) => (
                      <option key={i} value={i}>{i.toString().padStart(2, '0')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Timezone
                  </label>
                  <input
                    type="text"
                    value={newSubscription.schedule_timezone}
                    onChange={(e) => setNewSubscription(prev => ({ ...prev, schedule_timezone: e.target.value }))}
                    className="gh-input w-full"
                    placeholder="UTC"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Scheduled Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={newSubscription.scheduled_at}
                  onChange={(e) => setNewSubscription(prev => ({ ...prev, scheduled_at: e.target.value }))}
                  className="gh-input w-full"
                />
              </div>
            )}

            {/* Location Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Locations
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-40 overflow-y-auto">
                {locations.map((location) => (
                  <label
                    key={location.id}
                    className="flex items-center space-x-2 p-2 border border-gray-200 dark:border-gray-600 rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <input
                      type="checkbox"
                      checked={newSubscription.selected_location_ids.includes(location.id)}
                      onChange={() => handleLocationToggle(location.id)}
                      className="rounded border-gray-300 text-blue-600"
                    />
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                      {location.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-600">
              <button
                onClick={() => setShowAddForm(false)}
                className="gh-btn"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleAddSubscription}
                className="gh-btn gh-btn-primary"
                disabled={loading || !newSubscription.email || !newSubscription.name}
              >
                {loading ? 'Creating...' : 'Create Subscription'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Notice */}
      {!subscriptionCreated && !showAddForm && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No email subscriptions configured</p>
          <p className="text-sm">Click "Add Subscription" to get started</p>
        </div>
      )}
      
      {subscriptionCreated && (
        <div className="text-center py-8">
          <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
          <p className="text-gray-700 dark:text-gray-300 mb-2">Email subscription is active!</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Your subscription details are kept private and not displayed here for security.
          </p>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Subscription Created!
                  </h3>
                </div>
              </div>
              
              <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                {successMessage}
              </p>
              
              <div className="flex justify-end">
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="gh-btn gh-btn-primary"
                >
                  Got it!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};