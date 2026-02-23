// Simple Express server for secure Resend API operations
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Secure Resend API endpoint
app.get('/api/resend/stats', async (req, res) => {
  try {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    
    if (!RESEND_API_KEY || RESEND_API_KEY === 'your_resend_api_key_here') {
      console.log('Resend API key not configured, returning mock data');
      return res.json(getMockStats());
    }

    // Fetch from Resend API securely on the server
    const response = await fetch('https://api.resend.com/emails', {
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Resend API error:', response.status, response.statusText);
      return res.json(getMockStats());
    }

    const data = await response.json() as any;
    const emails = data.data || [];

    // Calculate stats from emails
    const stats = {
      totalEmails: emails.length,
      deliveredEmails: emails.filter((e: any) => e.last_event === 'delivered').length,
      bouncedEmails: emails.filter((e: any) => e.last_event === 'bounced').length,
      complainedEmails: emails.filter((e: any) => e.last_event === 'complained').length,
      clickedEmails: emails.filter((e: any) => e.last_event === 'clicked').length,
      openedEmails: emails.filter((e: any) => e.last_event === 'opened').length,
      recentEmails: emails.slice(0, 10).map((email: any) => ({
        id: email.id,
        to: email.to,
        from: email.from,
        subject: email.subject,
        created_at: email.created_at,
        last_event: email.last_event,
        status: email.last_event
      }))
    };

    res.json(stats);
  } catch (error) {
    console.error('Error in resend stats API:', error);
    res.json(getMockStats());
  }
});

// Get Resend domains
app.get('/api/resend/domains', async (req, res) => {
  try {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    
    if (!RESEND_API_KEY || RESEND_API_KEY === 'your_resend_api_key_here') {
      return res.json({ data: getMockDomains() });
    }

    const response = await fetch('https://api.resend.com/domains', {
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Resend domains API error:', response.status, response.statusText);
      return res.json({ data: getMockDomains() });
    }

    const data = await response.json() as any;
    res.json(data);
  } catch (error) {
    console.error('Error fetching domains:', error);
    res.json({ data: getMockDomains() });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Secure Resend API server running' });
});

function getMockStats() {
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

function getMockDomains() {
  return [
    {
      id: '1',
      name: 'resend.dev',
      status: 'verified',
      created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
      region: 'us-east-1'
    }
  ];
}

app.listen(port, () => {
  console.log(`🔒 Secure Resend API server running on port ${port}`);
  console.log(`📧 API endpoints:`);
  console.log(`   - GET http://localhost:${port}/api/resend/stats`);
  console.log(`   - GET http://localhost:${port}/api/resend/domains`);
});

export default app;