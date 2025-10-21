// Email Scheduler Service
// This handles the scheduling logic for email notifications

export class EmailScheduler {
  private checkInterval: number | null = null;
  private readonly CHECK_INTERVAL_MS = 60000; // Check every minute

  constructor() {
    this.startScheduler();
  }

  private startScheduler() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = setInterval(() => {
      this.checkScheduledEmails();
    }, this.CHECK_INTERVAL_MS);

    // Also check immediately
    this.checkScheduledEmails();
  }

  private async checkScheduledEmails() {
    try {
      const subscriptions = this.getStoredSubscriptions();
      const now = new Date();
      
      for (const subscription of subscriptions) {
        if (!subscription.active || !subscription.preferences.enabled) {
          continue;
        }

        if (this.shouldSendEmail(subscription.preferences, now)) {
          console.log('Scheduled email trigger for:', subscription.preferences.email);
          
          // Trigger email sending event
          window.dispatchEvent(new CustomEvent('scheduledEmailTrigger', {
            detail: { subscriptionId: subscription.id }
          }));
        }
      }
    } catch (error) {
      console.error('Error in email scheduler:', error);
    }
  }

  private shouldSendEmail(preferences: any, now: Date): boolean {
    // Check if it's the right day of the week
    const currentDayOfWeek = now.getDay() || 7; // Convert Sunday (0) to 7
    if (currentDayOfWeek !== preferences.dayOfWeek) {
      return false;
    }

    // Check if it's the right hour
    if (now.getHours() !== preferences.hour) {
      return false;
    }

    // Check if we haven't sent today already
    if (preferences.lastSent) {
      const lastSentDate = new Date(preferences.lastSent);
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const lastSentDay = new Date(lastSentDate.getFullYear(), lastSentDate.getMonth(), lastSentDate.getDate());
      
      if (today.getTime() === lastSentDay.getTime()) {
        return false; // Already sent today
      }
    }

    return true;
  }

  private getStoredSubscriptions() {
    try {
      const stored = localStorage.getItem('email-subscriptions');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  public stopScheduler() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  public getNextScheduledTime(preferences: any): Date | null {
    const now = new Date();
    const targetDayOfWeek = preferences.dayOfWeek;
    const targetHour = preferences.hour;
    
    // Calculate next occurrence
    const daysUntilTarget = ((targetDayOfWeek - (now.getDay() || 7)) + 7) % 7;
    const nextScheduled = new Date(now);
    
    if (daysUntilTarget === 0) {
      // Same day - check if time has passed
      if (now.getHours() >= targetHour) {
        // Next week
        nextScheduled.setDate(nextScheduled.getDate() + 7);
      }
    } else {
      // Different day this week
      nextScheduled.setDate(nextScheduled.getDate() + daysUntilTarget);
    }
    
    nextScheduled.setHours(targetHour, 0, 0, 0);
    return nextScheduled;
  }
}

// Global scheduler instance
let globalScheduler: EmailScheduler | null = null;

export const initializeEmailScheduler = () => {
  if (!globalScheduler) {
    globalScheduler = new EmailScheduler();
  }
  return globalScheduler;
};

export const getEmailScheduler = () => globalScheduler;

export const stopEmailScheduler = () => {
  if (globalScheduler) {
    globalScheduler.stopScheduler();
    globalScheduler = null;
  }
};