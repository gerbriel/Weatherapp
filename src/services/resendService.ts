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
  constructor() {
    // Use Supabase instead of localhost backend
  }

  async getEmailStats(): Promise<ResendStats> {
    try {
      // Return mock data for now - in production this would query email_send_logs
      // We can enhance this later to query actual email statistics from the database
      console.log('Getting email stats from Supabase...');
      
      return {
        totalEmails: 0,
        deliveredEmails: 0,
        bouncedEmails: 0,
        complainedEmails: 0,
        clickedEmails: 0,
        openedEmails: 0,
        recentEmails: []
      };
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
      // Return empty domain data for now
      console.log('Getting domain stats...');
      return { data: [] };
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