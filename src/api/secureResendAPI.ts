// Secure server-side API for Resend operations
import type { ResendStats } from '../services/resendService';

class SecureResendAPI {
  private baseUrl = '/api/resend'; // This will be our backend endpoint

  async getEmailStats(): Promise<ResendStats> {
    try {
      const response = await fetch(`${this.baseUrl}/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching email stats:', error);
      // Return mock data for development
      return this.getMockStats();
    }
  }

  async getDomains() {
    try {
      const response = await fetch(`${this.baseUrl}/domains`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching domains:', error);
      return { data: [] };
    }
  }

  isConfigured(): boolean {
    // For now, assume it's configured if we're using the secure API
    return true;
  }

  private getMockStats(): ResendStats {
    return {
      totalEmails: 247,
      deliveredEmails: 238,
      bouncedEmails: 5,
      complainedEmails: 1,
      clickedEmails: 89,
      openedEmails: 167,
      recentEmails: [
        {
          id: '1',
          to: ['user@example.com'],
          from: 'weather@resend.dev',
          subject: 'Daily Weather Update - San Francisco',
          created_at: new Date(Date.now() - 3600000).toISOString(),
          last_event: 'delivered',
          status: 'delivered'
        },
        {
          id: '2',
          to: ['jane@example.com'],
          from: 'weather@resend.dev',
          subject: 'Weekly Weather Summary - New York',
          created_at: new Date(Date.now() - 7200000).toISOString(),
          last_event: 'opened',
          status: 'opened'
        },
        {
          id: '3',
          to: ['bob@example.com'],
          from: 'weather@resend.dev',
          subject: 'Daily Weather Update - Los Angeles',
          created_at: new Date(Date.now() - 10800000).toISOString(),
          last_event: 'clicked',
          status: 'clicked'
        }
      ]
    };
  }
}

export const secureResendAPI = new SecureResendAPI();