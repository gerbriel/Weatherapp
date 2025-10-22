import React, { useState, useEffect } from 'react';
import { Mail, Plus, Trash2, Clock, MapPin, CheckCircle, AlertCircle, Calendar, Repeat, CalendarDays, Send } from 'lucide-react';
import { useLocations } from '../contexts/LocationsContext';
import { EmailSubscriptionService, LocationService } from '../services/supabaseService';
import type { EmailSubscription } from '../types/weather';

export const EmailNotifications: React.FC = () => {
  const { locations } = useLocations();
  const [subscriptions, setSubscriptions] = useState<EmailSubscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
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

  // Load subscriptions on component mount
  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const data = await EmailSubscriptionService.getActiveSubscriptions();
      setSubscriptions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

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

      const created = await EmailSubscriptionService.createSubscription(subscriptionData);
      setSubscriptions(prev => [created, ...prev]);
      
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
      setShowAddForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create subscription');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubscription = async (id: string) => {
    try {
      setLoading(true);
      await EmailSubscriptionService.deleteSubscription(id);
      setSubscriptions(prev => prev.filter(sub => sub.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete subscription');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSubscription = async (id: string, enabled: boolean) => {
    try {
      setLoading(true);
      const updated = await EmailSubscriptionService.updateSubscription(id, { enabled });
      setSubscriptions(prev => 
        prev.map(sub => sub.id === id ? updated : sub)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update subscription');
    } finally {
      setLoading(false);
    }
  };

  const getScheduleDisplay = (subscription: EmailSubscription) => {
    if (subscription.is_recurring) {
      const dayName = daysOfWeek.find(d => d.value === subscription.schedule_day_of_week)?.label;
      const time = `${subscription.schedule_hour?.toString().padStart(2, '0')}:${subscription.schedule_minute?.toString().padStart(2, '0')}`;
      return `Every ${dayName} at ${time} (${subscription.schedule_timezone})`;
    } else {
      return `Once on ${new Date(subscription.scheduled_at!).toLocaleDateString()} at ${new Date(subscription.scheduled_at!).toLocaleTimeString()}`;
    }
  };

  const getNextSendDisplay = (subscription: EmailSubscription) => {
    if (!subscription.next_send_at) return 'Not scheduled';
    
    const nextSend = new Date(subscription.next_send_at);
    const now = new Date();
    const diff = nextSend.getTime() - now.getTime();
    
    if (diff < 0) return 'Overdue';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `In ${days}d ${hours}h`;
    if (hours > 0) return `In ${hours}h ${minutes}m`;
    return `In ${minutes}m`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Email Notifications</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Automated weather reports sent via Supabase Edge Functions
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="gh-btn gh-btn-primary"
          disabled={loading}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Subscription
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
          <span className="text-red-700 dark:text-red-300">{error}</span>
        </div>
      )}

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

      {/* Subscriptions List */}
      <div className="space-y-4">
        {subscriptions.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No email subscriptions configured</p>
            <p className="text-sm">Click "Add Subscription" to get started</p>
          </div>
        ) : (
          subscriptions.map((subscription) => (
            <div key={subscription.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <span className="font-medium text-gray-900 dark:text-white">{subscription.name}</span>
                    <span className="text-sm text-gray-500">({subscription.email})</span>
                    {subscription.enabled ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                  
                  <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center space-x-2">
                      {subscription.is_recurring ? (
                        <Repeat className="h-4 w-4" />
                      ) : (
                        <Calendar className="h-4 w-4" />
                      )}
                      <span>{getScheduleDisplay(subscription)}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span>Next: {getNextSendDisplay(subscription)}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4" />
                      <span>{subscription.selected_location_ids.length} location(s)</span>
                    </div>
                    
                    {subscription.last_sent_at && (
                      <div className="flex items-center space-x-2">
                        <Send className="h-4 w-4" />
                        <span>Last sent: {new Date(subscription.last_sent_at).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleToggleSubscription(subscription.id, !subscription.enabled)}
                    className={`gh-btn ${subscription.enabled ? '' : 'gh-btn-primary'}`}
                    disabled={loading}
                  >
                    {subscription.enabled ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    onClick={() => handleDeleteSubscription(subscription.id)}
                    className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                    disabled={loading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};