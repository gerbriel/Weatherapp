export interface ResendStats {
  totalEmails: number;
  deliveredEmails: number;
  bouncedEmails: number;
  complainedEmails: number;
  clickedEmails: number;
  openedEmails: number;
  recentEmails: ResendEmail[];
}

export interface ResendEmail {
  id: string;
  to: string[];
  from: string;
  subject: string;
  created_at: string;
  last_event: string;
  status: 'sent' | 'delivered' | 'bounced' | 'complained' | 'opened' | 'clicked';
}

export interface ResendDomain {
  id: string;
  name: string;
  status: string;
  created_at: string;
  region: string;
}

class ResendService {
  private baseUrl = 'http://localhost:3001/api/resend'; // Our secure backend

  constructor() {
    // No API key needed on frontend - all secure operations happen on backend
  }

  async getEmailStats(): Promise<ResendStats> {
    try {
      // Call our secure backend API
      const response = await fetch(`${this.baseUrl}/stats`, {
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
      // Return empty stats instead of throwing to prevent admin panel from breaking
      return {
        totalEmails: 0,
        deliveredEmails: 0,
        bouncedEmails: 0,
        complainedEmails: 0,
        clickedEmails: 0,
        openedEmails: 0,
        recentEmails: [],
      };
    }
  }

  async getDomainStats(): Promise<{ data: ResendDomain[] }> {
    try {
      const response = await fetch(`${this.baseUrl}/domains`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching domain stats:', error);
      return { data: [] };
    }
  }

  async getEmailById(emailId: string): Promise<ResendEmail | null> {
    try {
      // This would require a new backend endpoint
      // For now, we'll return null since this isn't used in the admin panel
      console.log(`Email ID lookup not implemented: ${emailId}`);
      return null;
    } catch (error) {
      console.error('Error fetching email by ID:', error);
      return null;
    }
  }

  isConfigured(): boolean {
    // Always return true since we now use secure backend
    return true;
  }
}

export const resendService = new ResendService();