// Serverless function to send HTML weather reports via Resend
import type { VercelRequest, VercelResponse } from '@vercel/node';

interface SendReportRequest {
  email: string;
  htmlContent: string;
  subject?: string;
  locationNames?: string[];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const FROM_EMAIL = process.env.FROM_EMAIL || 'weather@resend.dev';
    
    if (!RESEND_API_KEY || RESEND_API_KEY === 'your_resend_api_key_here') {
      return res.status(500).json({ 
        error: 'Email service not configured',
        message: 'Resend API key is missing. Please configure RESEND_API_KEY in environment variables.'
      });
    }

    const body: SendReportRequest = req.body;
    const { email, htmlContent, subject, locationNames } = body;

    // Validate inputs
    if (!email || !htmlContent) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'Email and htmlContent are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Invalid email',
        message: 'Please provide a valid email address'
      });
    }

    // Generate subject line
    const timestamp = new Date().toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
    const locationText = locationNames && locationNames.length > 0 
      ? ` - ${locationNames.join(', ')}` 
      : '';
    const emailSubject = subject || `Weather Report${locationText} (${timestamp})`;

    // Send email via Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: email,
        subject: emailSubject,
        html: htmlContent,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Resend API error:', response.status, errorText);
      
      // Check for specific errors
      if (response.status === 403) {
        return res.status(403).json({
          error: 'Email domain not verified',
          message: 'The sending domain needs to be verified in Resend. Please verify your domain or use a verified sender address.'
        });
      }
      
      if (response.status === 422) {
        return res.status(422).json({
          error: 'Invalid email data',
          message: 'The email content or format is invalid. Please check the HTML content.'
        });
      }

      return res.status(response.status).json({
        error: 'Failed to send email',
        message: errorText || 'Unknown error occurred while sending email'
      });
    }

    const data = await response.json();
    
    return res.status(200).json({
      success: true,
      message: `Weather report successfully sent to ${email}`,
      emailId: data.id,
      to: email,
      subject: emailSubject
    });

  } catch (error) {
    console.error('Error in send-report API:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}
