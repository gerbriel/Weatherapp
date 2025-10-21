import { supabase } from '../lib/supabase';
import type { EmailSubscription, EmailSendLog, WeatherLocation } from '../types/weather';

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

  // Get send logs for a subscription
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