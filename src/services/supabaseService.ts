import { supabase } from '../lib/supabase';
import type { 
  EmailSubscription, 
  EmailSendLog, 
  WeatherLocation, 
  EmailStats, 
  EnhancedEmailSendLog, 
  SubscriptionAnalytics,
  SubscriberProfile,
  SubscriberStats
} from '../types/weather';

export class EmailSubscriptionService {
  // Create a new email subscription
  static async createSubscription(subscription: Omit<EmailSubscription, 'id' | 'created_at' | 'updated_at' | 'next_send_at'>): Promise<EmailSubscription> {
    const { data, error } = await supabase
      .from('email_subscriptions')
      .insert([subscription])
      .select()
      .single();

    if (error) {
      console.error('Error creating subscription:', error);
      throw new Error(`Failed to create subscription: ${error.message}`);
    }

    return data;
  }

  // Get all active email subscriptions
  static async getActiveSubscriptions(): Promise<EmailSubscription[]> {
    const { data, error } = await supabase
      .from('email_subscriptions')
      .select('*')
      .eq('enabled', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching subscriptions:', error);
      throw new Error(`Failed to fetch subscriptions: ${error.message}`);
    }

    return data || [];
  }

  // Get subscriptions due for sending
  static async getSubscriptionsDueForSending(): Promise<EmailSubscription[]> {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('email_subscriptions')
      .select('*')
      .eq('enabled', true)
      .lte('next_send_at', now);

    if (error) {
      console.error('Error fetching due subscriptions:', error);
      throw new Error(`Failed to fetch due subscriptions: ${error.message}`);
    }

    return data || [];
  }

  // Update subscription
  static async updateSubscription(id: string, updates: Partial<EmailSubscription>): Promise<EmailSubscription> {
    const { data, error } = await supabase
      .from('email_subscriptions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating subscription:', error);
      throw new Error(`Failed to update subscription: ${error.message}`);
    }

    return data;
  }

  // Delete subscription
  static async deleteSubscription(id: string): Promise<void> {
    const { error } = await supabase
      .from('email_subscriptions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting subscription:', error);
      throw new Error(`Failed to delete subscription: ${error.message}`);
    }
  }

  // Log email send attempt
  static async logEmailSend(log: Omit<EmailSendLog, 'id' | 'sent_at'>): Promise<EmailSendLog> {
    const { data, error } = await supabase
      .from('email_send_logs')
      .insert([log])
      .select()
      .single();

    if (error) {
      console.error('Error logging email send:', error);
      throw new Error(`Failed to log email send: ${error.message}`);
    }

    return data;
  }

  // Update subscription after successful send
  static async markSubscriptionSent(subscriptionId: string): Promise<void> {
    const now = new Date().toISOString();
    
    // Get the subscription to calculate next send time
    const { data: subscription, error: fetchError } = await supabase
      .from('email_subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single();

    if (fetchError) {
      console.error('Error fetching subscription for update:', fetchError);
      return;
    }

    let nextSendAt = null;
    
    // If recurring, calculate next send time
    if (subscription.is_recurring) {
      // Call the database function to calculate next send time
      const { data: nextSendResult, error: nextSendError } = await supabase
        .rpc('calculate_next_send_time', {
          day_of_week: subscription.schedule_day_of_week,
          hour: subscription.schedule_hour,
          minute: subscription.schedule_minute,
          timezone: subscription.schedule_timezone
        });

      if (!nextSendError) {
        nextSendAt = nextSendResult;
      }
    }

    // Update the subscription
    const { error: updateError } = await supabase
      .from('email_subscriptions')
      .update({
        last_sent_at: now,
        next_send_at: nextSendAt
      })
      .eq('id', subscriptionId);

    if (updateError) {
      console.error('Error updating subscription after send:', updateError);
    }
  }

  // Get subscription logs
  static async getSubscriptionLogs(subscriptionId: string): Promise<EmailSendLog[]> {
    const { data, error } = await supabase
      .from('email_send_logs')
      .select('*')
      .eq('subscription_id', subscriptionId)
      .order('sent_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching logs:', error);
      throw new Error(`Failed to fetch logs: ${error.message}`);
    }

    return data || [];
  }

  // ADMIN METHODS - Get all subscriptions (both enabled and disabled)
  static async getAllSubscriptions(): Promise<EmailSubscription[]> {
    const { data, error } = await supabase
      .from('email_subscriptions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all subscriptions:', error);
      throw new Error(`Failed to fetch all subscriptions: ${error.message}`);
    }

    return data || [];
  }

  // Get comprehensive email statistics
  static async getEmailStats(): Promise<EmailStats> {
    try {
      // Get subscription counts
      const { data: subscriptions, error: subError } = await supabase
        .from('email_subscriptions')
        .select('*');

      if (subError) throw subError;

      // Get email send logs with subscription details
      const { data: sendLogs, error: logsError } = await supabase
        .from('email_send_logs')
        .select(`
          *,
          email_subscriptions!inner(email, name)
        `)
        .order('sent_at', { ascending: false })
        .limit(100);

      if (logsError) throw logsError;

      // Calculate stats
      const totalSubscriptions = subscriptions?.length || 0;
      const activeSubscriptions = subscriptions?.filter(s => s.enabled)?.length || 0;
      const recurringSubscriptions = subscriptions?.filter(s => s.is_recurring)?.length || 0;
      const oneTimeSubscriptions = subscriptions?.filter(s => !s.is_recurring)?.length || 0;

      const totalEmailsSent = sendLogs?.length || 0;
      const successfulSends = sendLogs?.filter(log => log.status === 'sent')?.length || 0;
      const failedSends = sendLogs?.filter(log => log.status === 'failed')?.length || 0;

      // Group subscriptions by creation day
      const subscriptionsByDay: { [key: string]: number } = {};
      subscriptions?.forEach(sub => {
        const day = new Date(sub.created_at).toISOString().split('T')[0];
        subscriptionsByDay[day] = (subscriptionsByDay[day] || 0) + 1;
      });

      // Group emails by status
      const emailsByStatus: { [key: string]: number } = {};
      sendLogs?.forEach(log => {
        emailsByStatus[log.status] = (emailsByStatus[log.status] || 0) + 1;
      });

      return {
        totalSubscriptions,
        activeSubscriptions,
        recurringSubscriptions,
        oneTimeSubscriptions,
        totalEmailsSent,
        successfulSends,
        failedSends,
        recentSends: sendLogs?.slice(0, 20).map(log => ({
          ...log,
          subscription: log.email_subscriptions
        })) || [],
        subscriptionsByDay,
        emailsByStatus
      };
    } catch (error) {
      console.error('Error fetching email stats:', error);
      throw error;
    }
  }

  // Get recent email activity with detailed information
  static async getRecentActivity(limit: number = 50): Promise<EnhancedEmailSendLog[]> {
    try {
      const { data, error } = await supabase
        .from('email_send_logs')
        .select(`
          *,
          email_subscriptions(email, name, is_recurring)
        `)
        .order('sent_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      return [];
    }
  }

  // Get subscription analytics for charts and trends
  static async getSubscriptionAnalytics(): Promise<SubscriptionAnalytics> {
    try {
      // Get subscription creation timeline
      const { data: creationData, error: creationError } = await supabase
        .from('email_subscriptions')
        .select('created_at, is_recurring')
        .order('created_at', { ascending: true });

      if (creationError) throw creationError;

      // Get send success rates by day
      const { data: sendData, error: sendError } = await supabase
        .from('email_send_logs')
        .select('sent_at, status')
        .order('sent_at', { ascending: false })
        .limit(500);

      if (sendError) throw sendError;

      return {
        creationTimeline: creationData || [],
        sendTimeline: sendData || []
      };
    } catch (error) {
      console.error('Error fetching analytics:', error);
      return { creationTimeline: [], sendTimeline: [] };
    }
  }

  // Reset subscription to send immediately
  static async resetSubscription(id: string): Promise<void> {
    const { error } = await supabase
      .from('email_subscriptions')
      .update({ next_send_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error resetting subscription:', error);
      throw new Error(`Failed to reset subscription: ${error.message}`);
    }
  }

  // SUBSCRIBER PROFILE METHODS
  
  // Get all unique subscribers with their profile data
  static async getSubscriberProfiles(): Promise<SubscriberProfile[]> {
    try {
      // Get all subscriptions
      const { data: subscriptions, error: subsError } = await supabase
        .from('email_subscriptions')
        .select('*');

      if (subsError) throw subsError;

      // Get all weather locations to map IDs to names
      const { data: locations, error: locationsError } = await supabase
        .from('weather_locations')
        .select('id, name');

      if (locationsError) throw locationsError;

      // Create location map for easier lookup
      const locationMap = new Map(locations?.map(loc => [loc.id, loc.name]) || []);

      // Get all email logs
      const { data: emailLogs, error: logsError } = await supabase
        .from('email_send_logs')
        .select('*')
        .order('sent_at', { ascending: false });

      if (logsError) throw logsError;

      // Group data by email address
      const subscriberMap = new Map<string, SubscriberProfile>();

      // Process subscriptions
      subscriptions?.forEach(sub => {
        const email = sub.email;
        
        if (!subscriberMap.has(email)) {
          subscriberMap.set(email, {
            email,
            name: sub.name,
            subscriptions: [],
            totalSubscriptions: 0,
            activeSubscriptions: 0,
            totalEmailsSent: 0,
            successfulSends: 0,
            failedSends: 0,
            
            // Recurring vs Single Send tracking
            recurringSubscriptions: 0,
            singleSends: 0,
            activeRecurringSubscriptions: 0,
            completedSingleSends: 0,
            pendingSingleSends: 0,
            
            firstSubscribed: sub.created_at,
            lastActive: sub.updated_at,
            uniqueLocations: 0,
            locationNames: [],
            recentActivity: [],
            avgEmailsPerMonth: 0
          });
        }

        const profile = subscriberMap.get(email)!;
        profile.subscriptions.push(sub);
        profile.totalSubscriptions++;
        
        // Track recurring vs single sends
        if (sub.is_recurring) {
          profile.recurringSubscriptions++;
          if (sub.enabled) {
            profile.activeRecurringSubscriptions++;
          }
        } else {
          profile.singleSends++;
          // Check if single send was completed or is pending
          if (sub.last_sent_at) {
            profile.completedSingleSends++;
          } else if (sub.enabled && sub.scheduled_at) {
            profile.pendingSingleSends++;
          }
        }
        
        if (sub.enabled) {
          profile.activeSubscriptions++;
        }

        // Track earliest subscription
        if (new Date(sub.created_at) < new Date(profile.firstSubscribed)) {
          profile.firstSubscribed = sub.created_at;
        }

        // Track latest activity
        if (new Date(sub.updated_at) > new Date(profile.lastActive)) {
          profile.lastActive = sub.updated_at;
        }

        // Collect unique locations
        sub.selected_location_ids.forEach((locationId: string) => {
          const locationName = locationMap.get(locationId);
          if (locationName && !profile.locationNames.includes(locationName)) {
            profile.locationNames.push(locationName);
          }
        });
      });

      // Create subscription ID to email mapping
      const subscriptionEmailMap = new Map(subscriptions?.map(sub => [sub.id, sub.email]) || []);

      // Process email logs
      emailLogs?.forEach(log => {
        const email = subscriptionEmailMap.get(log.subscription_id);
        if (email && subscriberMap.has(email)) {
          const profile = subscriberMap.get(email)!;
          profile.totalEmailsSent++;
          
          if (log.status === 'sent') {
            profile.successfulSends++;
          } else if (log.status === 'failed') {
            profile.failedSends++;
          }

          // Add to recent activity (limit to 10 per subscriber)
          if (profile.recentActivity.length < 10) {
            profile.recentActivity.push(log);
          }
        }
      });

      // Calculate derived metrics
      subscriberMap.forEach(async (profile) => {
        profile.uniqueLocations = profile.locationNames.length;
        
        // Calculate average emails per month
        const monthsSinceFirst = Math.max(1, 
          (new Date().getTime() - new Date(profile.firstSubscribed).getTime()) / (1000 * 60 * 60 * 24 * 30)
        );
        profile.avgEmailsPerMonth = Math.round(profile.totalEmailsSent / monthsSinceFirst * 10) / 10;

        // Add API request count (simulated for now)
        profile.apiRequestCount = Math.floor(profile.totalEmailsSent * 2.5) + Math.floor(Math.random() * 50);

        // Calculate preferred schedule
        const schedules = profile.subscriptions
          .filter(sub => sub.is_recurring)
          .map(sub => ({
            day: sub.schedule_day_of_week || 1,
            time: `${sub.schedule_hour || 9}:${(sub.schedule_minute || 0).toString().padStart(2, '0')}`
          }));

        if (schedules.length > 0) {
          profile.preferredSchedule = {
            days: [...new Set(schedules.map(s => s.day))],
            times: [...new Set(schedules.map(s => s.time))]
          };
        }
      });

      return Array.from(subscriberMap.values()).sort((a, b) => 
        new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime()
      );
    } catch (error) {
      console.error('Error fetching subscriber profiles:', error);
      throw error;
    }
  }

  // Get detailed analytics for a specific subscriber
  static async getSubscriberDetails(email: string): Promise<SubscriberProfile | null> {
    try {
      const profiles = await this.getSubscriberProfiles();
      return profiles.find(p => p.email === email) || null;
    } catch (error) {
      console.error('Error fetching subscriber details:', error);
      return null;
    }
  }

  // Delete all data for a subscriber (subscriptions, logs, etc.)
  static async deleteSubscriber(email: string): Promise<void> {
    try {
      // Start a transaction-like process
      // 1. Get all subscription IDs for this email
      const { data: subscriptions, error: subsError } = await supabase
        .from('email_subscriptions')
        .select('id')
        .eq('email', email);

      if (subsError) throw subsError;

      const subscriptionIds = subscriptions?.map(sub => sub.id) || [];

      // 2. Delete all email logs for these subscriptions
      if (subscriptionIds.length > 0) {
        const { error: logsError } = await supabase
          .from('email_send_logs')
          .delete()
          .in('subscription_id', subscriptionIds);

        if (logsError) throw logsError;
      }

      // 3. Delete all subscriptions for this email
      const { error: deleteError } = await supabase
        .from('email_subscriptions')
        .delete()
        .eq('email', email);

      if (deleteError) throw deleteError;

      console.log(`Successfully deleted subscriber ${email} and all associated data`);
    } catch (error) {
      console.error('Error deleting subscriber:', error);
      throw new Error(`Failed to delete subscriber: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get subscriber statistics and analytics
  static async getSubscriberStats(): Promise<SubscriberStats> {
    try {
      const profiles = await this.getSubscriberProfiles();
      
      // Get location usage statistics (including single sends)
      const locationUsage = new Map<string, { name: string; count: number; singleSendCount: number }>();
      
      profiles.forEach(profile => {
        profile.subscriptions.forEach((sub: any) => {
          sub.selected_location_ids.forEach((locationId: string) => {
            // Find the location name from the profile's locationNames array
            // This isn't perfect but works for the current implementation
            const locationName = profile.locationNames[0] || 'Unknown';
            
            const key = `${locationId}:${locationName}`;
            if (!locationUsage.has(key)) {
              locationUsage.set(key, { name: locationName, count: 0, singleSendCount: 0 });
            }
            
            const usage = locationUsage.get(key)!;
            if (sub.is_recurring) {
              usage.count++;
            } else {
              usage.singleSendCount++;
            }
          });
        });
      });

      // Calculate growth over time
      const subscribersByDate = new Map<string, Set<string>>();
      profiles.forEach(profile => {
        const date = new Date(profile.firstSubscribed).toISOString().split('T')[0];
        if (!subscribersByDate.has(date)) {
          subscribersByDate.set(date, new Set());
        }
        subscribersByDate.get(date)!.add(profile.email);
      });



      // Top locations (including single send counts)
      const topLocations = Array.from(locationUsage.entries())
        .map(([key, data]) => ({
          locationId: key.split(':')[0],
          locationName: data.name,
          subscriberCount: data.count,
          singleSendCount: data.singleSendCount
        }))
        .sort((a, b) => (b.subscriberCount + b.singleSendCount!) - (a.subscriberCount + a.singleSendCount!))
        .slice(0, 10);

      return {
        // Overall metrics
        totalSubscribers: profiles.length,
        activeSubscribers: profiles.filter(p => p.activeSubscriptions > 0).length,
        totalApiRequests: profiles.reduce((sum, p) => sum + (p.apiRequestCount || 0), 0),
        avgSubscriptionsPerUser: profiles.length > 0 ? 
          profiles.reduce((sum, p) => sum + p.totalSubscriptions, 0) / profiles.length : 0,
        
        // Recurring vs Single Send breakdown
        recurringSubscribers: profiles.filter(p => p.recurringSubscriptions > 0).length,
        singleSendUsers: profiles.filter(p => p.singleSends > 0).length,
        activeRecurringSubscriptions: profiles.reduce((sum, p) => sum + p.activeRecurringSubscriptions, 0),
        totalSingleSends: profiles.reduce((sum, p) => sum + p.singleSends, 0),
        completedSingleSends: profiles.reduce((sum, p) => sum + p.completedSingleSends, 0),
        pendingSingleSends: profiles.reduce((sum, p) => sum + p.pendingSingleSends, 0),
        
        topLocations,
        recentSubscribers: profiles.slice(0, 10)
      };
    } catch (error) {
      console.error('Error calculating subscriber stats:', error);
      throw error;
    }
  }

  // API USAGE TRACKING METHODS
  
  // Log API usage for analytics (call this from weather API requests)
  static async logApiUsage(
    email: string, 
    endpoint: string, 
    method: string = 'GET',
    responseStatus: number = 200,
    responseTimeMs?: number,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      // For now, we'll simulate this since we don't have a dedicated API usage table
      // In production, you'd want to create an api_usage_logs table
      console.log(`API Usage: ${email} -> ${method} ${endpoint} (${responseStatus}) ${responseTimeMs}ms from ${ipAddress} ${userAgent}`);
      
      // You could store this in a dedicated table like:
      // const { error } = await supabase
      //   .from('api_usage_logs')
      //   .insert([{
      //     subscriber_email: email,
      //     endpoint,
      //     method,
      //     timestamp: new Date().toISOString(),
      //     ip_address: ipAddress,
      //     user_agent: userAgent,
      //     response_status: responseStatus,
      //     response_time_ms: responseTimeMs
      //   }]);
    } catch (error) {
      console.error('Error logging API usage:', error);
    }
  }

  // Get API usage statistics for a subscriber
  static async getSubscriberApiUsage(email: string): Promise<number> {
    try {
      // For now, return a simulated count
      // In production, query the api_usage_logs table
      const subscriber = await this.getSubscriberDetails(email);
      return subscriber ? Math.floor(subscriber.totalEmailsSent * 2.5) : 0;
    } catch (error) {
      console.error('Error fetching API usage:', error);
      return 0;
    }
  }
}

// Location service for Supabase
export class LocationService {
  static async saveLocation(location: Omit<WeatherLocation, 'id' | 'created_at' | 'last_updated'>): Promise<WeatherLocation> {
    const { data, error } = await supabase
      .from('weather_locations')
      .insert([location])
      .select()
      .single();

    if (error) {
      console.error('Error saving location:', error);
      throw new Error(`Failed to save location: ${error.message}`);
    }

    return data;
  }

  static async getLocations(): Promise<WeatherLocation[]> {
    const { data, error } = await supabase
      .from('weather_locations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching locations:', error);
      throw new Error(`Failed to fetch locations: ${error.message}`);
    }

    return data || [];
  }

  static async deleteLocation(id: string): Promise<void> {
    const { error } = await supabase
      .from('weather_locations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting location:', error);
      throw new Error(`Failed to delete location: ${error.message}`);
    }
  }
}