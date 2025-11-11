// Frost Warning Email Service
// Add to src/services/frostEmailService.ts
import { EmailSubscriptionService } from './supabaseService';
import type { FrostWarning } from '../utils/frostWarnings';
import type { EmailSubscription } from '../types/weather';

export interface FrostEmailSubscription {
  id?: string;
  email: string;
  locationIds: string[];
  enabled: boolean;
  frostThreshold: number; // Temperature threshold for alerts (°F)
  severityLevels: string[]; // Which severity levels to alert on
  advanceWarning: number; // Hours in advance to warn (12, 24, 48)
  lastSent?: Date;
  createdAt?: Date;
}

export class FrostEmailService {
  
  // Subscribe to frost warnings for specific locations
  static async subscribeFrostAlerts(subscription: FrostEmailSubscription): Promise<string> {
    try {
      // Create email subscription with frost-specific metadata
      const emailSub = await EmailSubscriptionService.createSubscription({
        email: subscription.email,
        name: `Frost Alert - ${subscription.email}`,
        selected_location_ids: subscription.locationIds,
        schedule_timezone: 'America/New_York',
        scheduled_at: new Date(Date.now() + 60000).toISOString(), // Check in 1 minute
        is_recurring: false,
        enabled: subscription.enabled
      });

      return emailSub.id;
    } catch (error) {
      console.error('Error creating frost alert subscription:', error);
      throw error;
    }
  }

  // Send immediate frost warning email
  static async sendFrostWarning(
    email: string, 
    warnings: FrostWarning[], 
    locationNames: string[]
  ): Promise<void> {
    try {
      // Find the most severe warning for subject line
      const severityOrder = ['hard-freeze', 'frost-warning', 'frost-advisory', 'frost-watch'];
      const mostSevere = warnings.reduce((prev, current) => {
        const prevIndex = severityOrder.indexOf(prev.severity);
        const currentIndex = severityOrder.indexOf(current.severity);
        return currentIndex < prevIndex ? current : prev;
      });

      // Create one-time email subscription for immediate sending
      await EmailSubscriptionService.createSubscription({
        email: email,
        name: `Frost Alert - ${mostSevere.severity.toUpperCase()}`,
        selected_location_ids: warnings.map(w => w.locationId),
        schedule_timezone: 'America/New_York', 
        scheduled_at: new Date(Date.now() - 60000).toISOString(), // Schedule in the past for immediate send
        is_recurring: false,
        enabled: true
      });

      console.log(`Frost warning email queued for ${email}`);
    } catch (error) {
      console.error('Error sending frost warning email:', error);
      throw error;
    }
  }

  // Generate frost alert email content
  static generateFrostEmailContent(warnings: FrostWarning[]): {
    subject: string;
    htmlContent: string;
    textContent: string;
  } {
    const severityOrder = ['hard-freeze', 'frost-warning', 'frost-advisory', 'frost-watch'];
    const criticalWarnings = warnings.filter(w => ['hard-freeze', 'frost-warning'].includes(w.severity));
    const advisoryWarnings = warnings.filter(w => ['frost-advisory', 'frost-watch'].includes(w.severity));

    // Sort by severity
    const sortedWarnings = warnings.sort((a, b) => {
      return severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity);
    });

    const mostSevere = sortedWarnings[0];
    const subject = `🧊 ${mostSevere.severity.replace('-', ' ').toUpperCase()} Alert - ${warnings.length} Location(s)`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Frost Warning Alert</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
          .container { max-width: 600px; margin: 0 auto; background: white; }
          .header { background: linear-gradient(135deg, #3b82f6, #1e40af); color: white; padding: 20px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { padding: 20px; }
          .warning-card { border: 2px solid; border-radius: 8px; margin: 16px 0; padding: 16px; }
          .critical { border-color: #ef4444; background: #fef2f2; }
          .warning { border-color: #f59e0b; background: #fffbeb; }
          .advisory { border-color: #3b82f6; background: #eff6ff; }
          .watch { border-color: #6b7280; background: #f9fafb; }
          .temp { font-size: 28px; font-weight: bold; color: #1f2937; }
          .location { font-size: 18px; font-weight: 600; margin-bottom: 8px; }
          .timeframe { color: #6b7280; font-size: 14px; }
          .recommendations { background: #f3f4f6; padding: 12px; border-radius: 6px; margin-top: 12px; }
          .recommendations h4 { margin: 0 0 8px 0; color: #374151; }
          .recommendations ul { margin: 0; padding-left: 16px; }
          .recommendations li { margin: 4px 0; color: #4b5563; }
          .footer { background: #f8fafc; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
          .risk-badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; margin-left: 8px; }
          .risk-critical { background: #fecaca; color: #991b1b; }
          .risk-high { background: #fed7aa; color: #c2410c; }
          .risk-moderate { background: #fef3c7; color: #a16207; }
          .risk-low { background: #dbeafe; color: #1d4ed8; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🧊 Frost Warning Alert</h1>
            <p style="margin: 8px 0 0 0; opacity: 0.9;">Protect your crops and plants from freezing temperatures</p>
          </div>
          
          <div class="content">
            ${criticalWarnings.length > 0 ? `
              <div style="background: #fee2e2; border: 2px solid #ef4444; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                <h3 style="margin: 0 0 8px 0; color: #dc2626;">⚠️ CRITICAL FROST CONDITIONS</h3>
                <p style="margin: 0; color: #7f1d1d;">
                  ${criticalWarnings.length} location(s) have critical frost conditions requiring immediate action.
                </p>
              </div>
            ` : ''}
            
            ${sortedWarnings.map(warning => {
              const cardClass = warning.severity === 'hard-freeze' ? 'critical' : 
                               warning.severity === 'frost-warning' ? 'warning' :
                               warning.severity === 'frost-advisory' ? 'advisory' : 'watch';
              
              const riskClass = warning.cropRisk === 'critical' ? 'risk-critical' :
                               warning.cropRisk === 'high' ? 'risk-high' :
                               warning.cropRisk === 'moderate' ? 'risk-moderate' : 'risk-low';

              return `
                <div class="warning-card ${cardClass}">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <div>
                      <div class="location">${warning.locationName}</div>
                      <div class="timeframe">${warning.timeframe} • ${warning.probability}% probability</div>
                    </div>
                    <div style="text-align: right;">
                      <div class="temp">${warning.temperature}°F</div>
                      <span class="risk-badge ${riskClass}">${warning.cropRisk.toUpperCase()} RISK</span>
                    </div>
                  </div>
                  
                  <div class="recommendations">
                    <h4>🛡️ Protection Recommendations:</h4>
                    <ul>
                      ${warning.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                    </ul>
                  </div>
                </div>
              `;
            }).join('')}
            
            <div style="background: #f0f9ff; padding: 16px; border-radius: 8px; margin-top: 20px;">
              <h3 style="margin: 0 0 12px 0; color: #0369a1;">📱 Next Steps</h3>
              <ul style="margin: 0; padding-left: 16px; color: #0c4a6e;">
                <li>Check your weather app dashboard for real-time updates</li>
                <li>Monitor conditions throughout the evening</li>
                <li>Prepare backup protection methods if primary methods fail</li>
                <li>Document any crop damage for insurance or planning purposes</li>
              </ul>
            </div>
          </div>
          
          <div class="footer">
            <p>This alert was sent because you subscribed to frost warnings for these locations.</p>
            <p style="margin-top: 8px;">Stay warm and protect your plants! 🌱</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
FROST WARNING ALERT 🧊

${sortedWarnings.map(warning => `
${warning.locationName.toUpperCase()}
${warning.severity.replace('-', ' ').toUpperCase()} - ${warning.temperature}°F
${warning.timeframe} (${warning.probability}% probability)
Crop Risk: ${warning.cropRisk.toUpperCase()}

Protection Recommendations:
${warning.recommendations.map(rec => `• ${rec}`).join('\n')}

---
`).join('')}

Stay vigilant and protect your crops!
Check your weather dashboard for real-time updates.

This alert was sent because you subscribed to frost warnings.
    `;

    return { subject, htmlContent, textContent };
  }

  // Get all frost alert subscriptions (simplified)
  static async getFrostSubscriptions(): Promise<EmailSubscription[]> {
    try {
      const subscriptions = await EmailSubscriptionService.getActiveSubscriptions();
      // Filter for frost-related subscriptions by name pattern
      return subscriptions.filter((sub: EmailSubscription) => 
        sub.name.includes('Frost Alert') || sub.name.includes('frost')
      );
    } catch (error) {
      console.error('Error fetching frost subscriptions:', error);
      return [];
    }
  }

  // Update frost subscription (simplified)
  static async updateFrostSubscription(
    subscriptionId: string, 
    enabled: boolean
  ): Promise<void> {
    try {
      await EmailSubscriptionService.updateSubscription(subscriptionId, {
        enabled: enabled
      });
    } catch (error) {
      console.error('Error updating frost subscription:', error);
      throw error;
    }
  }
}

export default FrostEmailService;