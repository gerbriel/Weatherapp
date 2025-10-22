import React, { useState } from 'react';
import { 
  X, 
  RefreshCw, 
  Trash2, 
  RotateCcw, 
  Users, 
  Mail, 
  TrendingUp, 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  Clock,
  Shield,
  Send,
  Eye,
  EyeOff
} from 'lucide-react';
import { EmailSubscriptionService } from '../services/supabaseService';
import { resendService } from '../services/resendService';
import type { 
  EmailSubscription, 
  EmailStats, 
  EnhancedEmailSendLog,
  SubscriberProfile,
  SubscriberStats
} from '../types/weather';
import type { ResendStats } from '../services/resendService';

interface AdminPanelProps {
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [subscriptions, setSubscriptions] = useState<EmailSubscription[]>([]);
  const [supabaseStats, setSupabaseStats] = useState<EmailStats | null>(null);
  const [resendStats, setResendStats] = useState<ResendStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<EnhancedEmailSendLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'subscriptions' | 'subscribers' | 'activity' | 'resend'>('overview');
  const [subscriberProfiles, setSubscriberProfiles] = useState<SubscriberProfile[]>([]);
  const [subscriberStats, setSubscriberStats] = useState<SubscriberStats | null>(null);
  const [selectedSubscriber, setSelectedSubscriber] = useState<SubscriberProfile | null>(null);
  
  // Simple admin password - in production, use proper authentication
  const ADMIN_PASSWORD = 'weather-admin-2025';

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      setError(null);
      loadAllData();
    } else {
      setError('Invalid admin password');
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      // Load all data in parallel
      const [subsData, statsData, activityData, subscriberProfilesData, subscriberStatsData] = await Promise.all([
        EmailSubscriptionService.getAllSubscriptions(),
        EmailSubscriptionService.getEmailStats(),
        EmailSubscriptionService.getRecentActivity(50),
        EmailSubscriptionService.getSubscriberProfiles(),
        EmailSubscriptionService.getSubscriberStats()
      ]);

      setSubscriptions(subsData);
      setSupabaseStats(statsData);
      setRecentActivity(activityData);
      setSubscriberProfiles(subscriberProfilesData);
      setSubscriberStats(subscriberStatsData);

      // Load Resend stats if configured
      if (resendService.isConfigured()) {
        const resendData = await resendService.getEmailStats();
        setResendStats(resendData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubscription = async (id: string) => {
    if (!confirm('Are you sure you want to delete this subscription? This action cannot be undone.')) {
      return;
    }
    
    try {
      setLoading(true);
      await EmailSubscriptionService.deleteSubscription(id);
      await loadAllData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete subscription');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSubscription = async (id: string, enabled: boolean) => {
    try {
      setLoading(true);
      await EmailSubscriptionService.updateSubscription(id, { enabled });
      await loadAllData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update subscription');
    } finally {
      setLoading(false);
    }
  };

  const handleResetNextSend = async (id: string) => {
    if (!confirm('Reset this subscription to send immediately?')) {
      return;
    }
    
    try {
      setLoading(true);
      await EmailSubscriptionService.resetSubscription(id);
      await loadAllData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset send time');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubscriber = async (email: string) => {
    const subscriber = subscriberProfiles.find(p => p.email === email);
    if (!subscriber) return;

    const confirmMessage = `⚠️ DANGER: Delete subscriber "${subscriber.name}" (${email})?\n\nThis will permanently remove:\n• ${subscriber.totalSubscriptions} subscription(s)\n• ${subscriber.totalEmailsSent} email log(s)\n• All associated data\n\nThis action CANNOT be undone!`;
    
    if (!confirm(confirmMessage)) {
      return;
    }
    
    try {
      setLoading(true);
      await EmailSubscriptionService.deleteSubscriber(email);
      await loadAllData();
      setSelectedSubscriber(null); // Close details if this subscriber was selected
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete subscriber');
    } finally {
      setLoading(false);
    }
  };

  const getScheduleDisplay = (subscription: EmailSubscription) => {
    const daysOfWeek = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    if (subscription.is_recurring) {
      const dayName = daysOfWeek[subscription.schedule_day_of_week || 1];
      const time = `${subscription.schedule_hour?.toString().padStart(2, '0')}:${subscription.schedule_minute?.toString().padStart(2, '0')}`;
      return `Every ${dayName} at ${time} (${subscription.schedule_timezone})`;
    } else {
      return subscription.scheduled_at ? 
        `Once on ${new Date(subscription.scheduled_at).toLocaleDateString()} at ${new Date(subscription.scheduled_at).toLocaleTimeString()}` :
        'Not scheduled';
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered': return 'text-green-600 dark:text-green-400';
      case 'failed':
      case 'bounced': return 'text-red-600 dark:text-red-400';
      case 'pending': return 'text-yellow-600 dark:text-yellow-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered': return <CheckCircle className="w-4 h-4" />;
      case 'failed':
      case 'bounced': return <XCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  if (!authenticated) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Shield className="h-8 w-8 text-blue-500" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Admin Access Required
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Enter admin password to manage subscriptions
                </p>
              </div>
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
              </div>
            )}
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Admin Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  className="gh-input w-full pr-10"
                  placeholder="Enter admin password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="gh-btn"
              >
                Cancel
              </button>
              <button
                onClick={handleLogin}
                className="gh-btn gh-btn-primary"
                disabled={!password}
              >
                Access Admin Panel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-7xl w-full mx-4 my-8">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-blue-500" />
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Admin Dashboard - Email Analytics
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Comprehensive email system management and analytics
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={loadAllData}
                className="gh-btn"
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={onClose}
                className="gh-btn gh-btn-primary"
              >
                <X className="h-4 w-4 mr-2" />
                Close
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: TrendingUp },
              { id: 'subscriptions', label: 'Subscriptions', icon: Users },
              { id: 'subscribers', label: 'Subscribers', icon: Users },
              { id: 'activity', label: 'Activity', icon: Activity },
              { id: 'resend', label: 'Resend Stats', icon: Mail }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-3 font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400'
                    : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <span className="text-red-700 dark:text-red-300">{error}</span>
            </div>
          )}

          {/* Content Area */}
          <div className="max-h-[60vh] overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600 dark:text-gray-400">Loading analytics...</span>
              </div>
            )}

            {!loading && activeTab === 'overview' && supabaseStats && (
              <div className="space-y-6">
                {/* Key Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <h3 className="font-medium text-blue-900 dark:text-blue-100">Total Subscribers</h3>
                    </div>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{supabaseStats.totalSubscriptions}</p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">{supabaseStats.activeSubscriptions} active</p>
                  </div>

                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <h3 className="font-medium text-green-900 dark:text-green-100">Emails Sent</h3>
                    </div>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{supabaseStats.totalEmailsSent}</p>
                    <p className="text-sm text-green-700 dark:text-green-300">{supabaseStats.successfulSends} successful</p>
                  </div>

                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center gap-2 mb-2">
                      <RefreshCw className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      <h3 className="font-medium text-purple-900 dark:text-purple-100">Recurring Subs</h3>
                    </div>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{subscriberStats?.activeRecurringSubscriptions || 0}</p>
                    <p className="text-sm text-purple-700 dark:text-purple-300">{subscriberStats?.recurringSubscribers || 0} users</p>
                  </div>

                  <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Send className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                      <h3 className="font-medium text-orange-900 dark:text-orange-100">Single Sends</h3>
                    </div>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{subscriberStats?.totalSingleSends || 0}</p>
                    <p className="text-sm text-orange-700 dark:text-orange-300">
                      {subscriberStats?.completedSingleSends || 0} sent, {subscriberStats?.pendingSingleSends || 0} pending
                    </p>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Recent Email Activity</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {supabaseStats.recentSends.slice(0, 10).map(log => (
                      <div key={log.id} className="flex items-center justify-between py-2 px-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
                        <div className="flex items-center gap-3">
                          <div className={getStatusColor(log.status)}>
                            {getStatusIcon(log.status)}
                          </div>
                          <div>
                            <p className="font-medium text-sm text-gray-900 dark:text-white">
                              {log.subscription?.email || 'Unknown'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(log.sent_at).toLocaleString()} • {log.locations_count || 0} locations
                            </p>
                          </div>
                        </div>
                        <span className={`text-xs font-medium px-2 py-1 rounded ${getStatusColor(log.status)}`}>
                          {log.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {!loading && activeTab === 'subscriptions' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    All Subscriptions ({subscriptions.length})
                  </h3>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-200 dark:border-gray-700 rounded-lg">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Email</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Name</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Type</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Schedule</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Next Send</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {subscriptions.map(sub => (
                        <tr key={sub.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{sub.email}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{sub.name}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              sub.is_recurring 
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' 
                                : 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300'
                            }`}>
                              {sub.is_recurring ? 'Recurring' : 'One-time'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {getScheduleDisplay(sub)}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              sub.enabled 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' 
                                : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                            }`}>
                              {sub.enabled ? 'Active' : 'Disabled'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {sub.next_send_at ? (
                              <span className={
                                new Date(sub.next_send_at) < new Date() 
                                  ? 'text-red-600 dark:text-red-400 font-medium' 
                                  : 'text-gray-600 dark:text-gray-400'
                              }>
                                {getNextSendDisplay(sub)}
                              </span>
                            ) : (
                              <span className="text-gray-400">Not scheduled</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleResetNextSend(sub.id)}
                                className="p-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                                title="Reset to send now"
                                disabled={loading}
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleToggleSubscription(sub.id, !sub.enabled)}
                                className={`p-1 ${sub.enabled 
                                  ? 'text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300' 
                                  : 'text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300'
                                }`}
                                title={sub.enabled ? 'Disable subscription' : 'Enable subscription'}
                                disabled={loading}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteSubscription(sub.id)}
                                className="p-1 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                                title="Delete subscription"
                                disabled={loading}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {!loading && activeTab === 'subscribers' && (
              <div className="space-y-6">
                {/* Subscriber Overview Stats */}
                {subscriberStats && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                      <h3 className="font-medium text-blue-900 dark:text-blue-100">Total Subscribers</h3>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{subscriberStats.totalSubscribers}</p>
                      <p className="text-sm text-blue-700 dark:text-blue-300">{subscriberStats.activeSubscribers} active</p>
                    </div>
                    
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                      <h3 className="font-medium text-green-900 dark:text-green-100">Avg Subscriptions</h3>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {subscriberStats.avgSubscriptionsPerUser.toFixed(1)}
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-300">per subscriber</p>
                    </div>
                    
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                      <h3 className="font-medium text-purple-900 dark:text-purple-100">API Requests</h3>
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{subscriberStats.totalApiRequests}</p>
                      <p className="text-sm text-purple-700 dark:text-purple-300">total requests</p>
                    </div>
                    
                    <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                      <h3 className="font-medium text-orange-900 dark:text-orange-100">Top Location</h3>
                      <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                        {subscriberStats.topLocations[0]?.locationName || 'N/A'}
                      </p>
                      <p className="text-sm text-orange-700 dark:text-orange-300">
                        {subscriberStats.topLocations[0]?.subscriberCount || 0} users
                      </p>
                    </div>
                  </div>
                )}

                {/* Recurring vs Single Sends Breakdown */}
                {subscriberStats && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-lg border border-gray-200 dark:border-gray-600">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Subscription Types Breakdown
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Recurring Subscriptions */}
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                        <div className="flex items-center gap-2 mb-3">
                          <RefreshCw className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                          <h4 className="font-medium text-gray-900 dark:text-white">Recurring Subscriptions</h4>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-300">Total Users:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{subscriberStats.recurringSubscribers}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-300">Active Subscriptions:</span>
                            <span className="font-medium text-green-600 dark:text-green-400">{subscriberStats.activeRecurringSubscriptions}</span>
                          </div>
                        </div>
                      </div>

                      {/* Single Sends */}
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                        <div className="flex items-center gap-2 mb-3">
                          <Send className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                          <h4 className="font-medium text-gray-900 dark:text-white">Single Sends</h4>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-300">Total Users:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{subscriberStats.singleSendUsers}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-300">Total Sends:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{subscriberStats.totalSingleSends}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-300">Completed:</span>
                            <span className="font-medium text-green-600 dark:text-green-400">{subscriberStats.completedSingleSends}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-300">Pending:</span>
                            <span className="font-medium text-orange-600 dark:text-orange-400">{subscriberStats.pendingSingleSends}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Subscriber Profiles List */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Subscriber Profiles ({subscriberProfiles.length})
                    </h3>
                  </div>
                  
                  <div className="grid gap-4">
                    {subscriberProfiles.map(subscriber => (
                      <div key={subscriber.email} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold text-gray-900 dark:text-white">{subscriber.name}</h4>
                              <span className="text-sm text-gray-600 dark:text-gray-400">{subscriber.email}</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                subscriber.activeSubscriptions > 0
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                              }`}>
                                {subscriber.activeSubscriptions > 0 ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            
                            {/* Subscriber Stats Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-3">
                              <div className="text-center p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
                                <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{subscriber.recurringSubscriptions}</p>
                                <p className="text-xs text-purple-600 dark:text-purple-400">Recurring</p>
                              </div>
                              <div className="text-center p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
                                <p className="text-lg font-bold text-orange-600 dark:text-orange-400">{subscriber.singleSends}</p>
                                <p className="text-xs text-orange-600 dark:text-orange-400">Single Sends</p>
                              </div>
                              <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{subscriber.totalSubscriptions}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">Total</p>
                              </div>
                              <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                <p className="text-lg font-bold text-green-600 dark:text-green-400">{subscriber.totalEmailsSent}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">Emails Sent</p>
                              </div>
                              <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{subscriber.uniqueLocations}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">Locations</p>
                              </div>
                              <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                <p className="text-lg font-bold text-teal-600 dark:text-teal-400">
                                  {subscriber.apiRequestCount || 0}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">API Requests</p>
                              </div>
                            </div>
                            
                            {/* Subscription Type Breakdown */}
                            {(subscriber.recurringSubscriptions > 0 || subscriber.singleSends > 0) && (
                              <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-600">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subscription Activity:</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                  {subscriber.recurringSubscriptions > 0 && (
                                    <div className="flex items-center justify-between">
                                      <span className="text-gray-600 dark:text-gray-400">Active Recurring:</span>
                                      <span className="font-medium text-purple-600 dark:text-purple-400">
                                        {subscriber.activeRecurringSubscriptions}/{subscriber.recurringSubscriptions}
                                      </span>
                                    </div>
                                  )}
                                  {subscriber.singleSends > 0 && (
                                    <>
                                      <div className="flex items-center justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Completed Single:</span>
                                        <span className="font-medium text-green-600 dark:text-green-400">
                                          {subscriber.completedSingleSends}
                                        </span>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Pending Single:</span>
                                        <span className="font-medium text-orange-600 dark:text-orange-400">
                                          {subscriber.pendingSingleSends}
                                        </span>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Location Names */}
                            {subscriber.locationNames.length > 0 && (
                              <div className="mt-3">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Locations:</p>
                                <div className="flex flex-wrap gap-1">
                                  {subscriber.locationNames.map(location => (
                                    <span key={location} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs rounded">
                                      {location}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Subscription Schedule Info */}
                            {subscriber.preferredSchedule && (
                              <div className="mt-3">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Preferred Schedule:</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  Days: {subscriber.preferredSchedule.days.map(d => 
                                    ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][d]
                                  ).join(', ')} • 
                                  Times: {subscriber.preferredSchedule.times.join(', ')}
                                </p>
                              </div>
                            )}
                            
                            {/* Success Rate */}
                            <div className="mt-3 flex items-center gap-4 text-sm">
                              <span className="text-gray-600 dark:text-gray-400">
                                Success Rate: 
                                <span className={`ml-1 font-medium ${
                                  subscriber.totalEmailsSent > 0 && (subscriber.successfulSends / subscriber.totalEmailsSent) > 0.9
                                    ? 'text-green-600 dark:text-green-400'
                                    : subscriber.totalEmailsSent > 0 && (subscriber.successfulSends / subscriber.totalEmailsSent) > 0.7
                                    ? 'text-yellow-600 dark:text-yellow-400'
                                    : 'text-red-600 dark:text-red-400'
                                }`}>
                                  {subscriber.totalEmailsSent > 0 ? 
                                    ((subscriber.successfulSends / subscriber.totalEmailsSent) * 100).toFixed(1) + '%' : 
                                    'N/A'
                                  }
                                </span>
                              </span>
                              <span className="text-gray-600 dark:text-gray-400">
                                Member Since: {new Date(subscriber.firstSubscribed).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex flex-col gap-2 ml-4">
                            <button
                              onClick={() => setSelectedSubscriber(selectedSubscriber?.email === subscriber.email ? null : subscriber)}
                              className="gh-btn text-xs px-3 py-1"
                            >
                              {selectedSubscriber?.email === subscriber.email ? 'Hide Details' : 'View Details'}
                            </button>
                            <button
                              onClick={() => handleDeleteSubscriber(subscriber.email)}
                              className="gh-btn bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1"
                              disabled={loading}
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Delete All
                            </button>
                          </div>
                        </div>
                        
                        {/* Expanded Details */}
                        {selectedSubscriber?.email === subscriber.email && (
                          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                            <h5 className="font-medium text-gray-900 dark:text-white mb-3">Detailed Information</h5>
                            
                            {/* Individual Subscriptions */}
                            <div className="mb-4">
                              <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                All Subscriptions ({subscriber.subscriptions.length})
                              </h6>
                              <div className="space-y-2 max-h-40 overflow-y-auto">
                                {subscriber.subscriptions.map(sub => (
                                  <div key={sub.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm">
                                    <div>
                                      <span className={`px-2 py-1 rounded text-xs mr-2 ${
                                        sub.is_recurring 
                                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' 
                                          : 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300'
                                      }`}>
                                        {sub.is_recurring ? 'Recurring' : 'One-time'}
                                      </span>
                                      {getScheduleDisplay(sub)}
                                    </div>
                                    <span className={`text-xs ${
                                      sub.enabled 
                                        ? 'text-green-600 dark:text-green-400' 
                                        : 'text-red-600 dark:text-red-400'
                                    }`}>
                                      {sub.enabled ? 'Active' : 'Disabled'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            {/* Recent Activity */}
                            {subscriber.recentActivity.length > 0 && (
                              <div>
                                <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Recent Email Activity ({subscriber.recentActivity.length})
                                </h6>
                                <div className="space-y-1 max-h-32 overflow-y-auto">
                                  {subscriber.recentActivity.map(activity => (
                                    <div key={activity.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded text-xs">
                                      <div className="flex items-center gap-2">
                                        <div className={getStatusColor(activity.status)}>
                                          {getStatusIcon(activity.status)}
                                        </div>
                                        <span>{new Date(activity.sent_at).toLocaleDateString()}</span>
                                        <span className="text-gray-500">•</span>
                                        <span>{activity.locations_count || 0} locations</span>
                                      </div>
                                      <span className={getStatusColor(activity.status)}>
                                        {activity.status}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {subscriberProfiles.length === 0 && (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No subscribers found</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {!loading && activeTab === 'activity' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Recent Email Activity ({recentActivity.length})
                </h3>
                
                <div className="space-y-2">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={getStatusColor(activity.status)}>
                            {getStatusIcon(activity.status)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {activity.email_subscriptions?.email || 'Unknown Email'}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {activity.email_subscriptions?.name || 'Unknown Name'} • 
                              {activity.email_subscriptions?.is_recurring ? ' Recurring' : ' One-time'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              {new Date(activity.sent_at).toLocaleString()} • 
                              {activity.locations_count || 0} location{(activity.locations_count || 0) !== 1 ? 's' : ''}
                            </p>
                            {activity.error_message && (
                              <p className="text-xs text-red-600 dark:text-red-400 mt-1 bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-200 dark:border-red-800">
                                Error: {activity.error_message}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          activity.status === 'sent' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                            : activity.status === 'failed'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
                        }`}>
                          {activity.status}
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  {recentActivity.length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No recent email activity found</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!loading && activeTab === 'resend' && (
              <div className="space-y-6">
                {!resendService.isConfigured() ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
                    <p className="text-gray-600 dark:text-gray-400">
                      Resend API not configured. Add VITE_RESEND_API_KEY to environment variables.
                    </p>
                  </div>
                ) : resendStats ? (
                  <>
                    {/* Resend Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                        <h3 className="font-medium text-blue-900 dark:text-blue-100">Total Emails</h3>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{resendStats.totalEmails}</p>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                        <h3 className="font-medium text-green-900 dark:text-green-100">Delivered</h3>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{resendStats.deliveredEmails}</p>
                        <p className="text-sm text-green-700 dark:text-green-300">
                          {resendStats.totalEmails > 0 ? ((resendStats.deliveredEmails / resendStats.totalEmails) * 100).toFixed(1) : '0'}%
                        </p>
                      </div>
                      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                        <h3 className="font-medium text-red-900 dark:text-red-100">Issues</h3>
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                          {resendStats.bouncedEmails + resendStats.complainedEmails}
                        </p>
                        <p className="text-sm text-red-700 dark:text-red-300">
                          {resendStats.bouncedEmails} bounced, {resendStats.complainedEmails} complaints
                        </p>
                      </div>
                    </div>

                    {/* Engagement Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                        <h3 className="font-medium text-purple-900 dark:text-purple-100">Email Opens</h3>
                        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{resendStats.openedEmails}</p>
                        <p className="text-sm text-purple-700 dark:text-purple-300">
                          {resendStats.totalEmails > 0 ? ((resendStats.openedEmails / resendStats.totalEmails) * 100).toFixed(1) : '0'}% open rate
                        </p>
                      </div>
                      <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                        <h3 className="font-medium text-orange-900 dark:text-orange-100">Email Clicks</h3>
                        <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">{resendStats.clickedEmails}</p>
                        <p className="text-sm text-orange-700 dark:text-orange-300">
                          {resendStats.totalEmails > 0 ? ((resendStats.clickedEmails / resendStats.totalEmails) * 100).toFixed(1) : '0'}% click rate
                        </p>
                      </div>
                    </div>

                    {/* Recent Emails from Resend */}
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Recent Emails (Resend API)</h3>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {resendStats.recentEmails.map(email => (
                          <div key={email.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-white dark:bg-gray-800">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium text-sm text-gray-900 dark:text-white">{email.subject}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  To: {email.to.join(', ')} • From: {email.from}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-500">
                                  {new Date(email.created_at).toLocaleString()}
                                </p>
                              </div>
                              <div className="flex items-center gap-1">
                                <div className={getStatusColor(email.status)}>
                                  {getStatusIcon(email.status)}
                                </div>
                                <span className={`text-xs font-medium ${getStatusColor(email.status)}`}>
                                  {email.status}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {resendStats.recentEmails.length === 0 && (
                          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No recent emails found in Resend</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">Loading Resend statistics...</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};