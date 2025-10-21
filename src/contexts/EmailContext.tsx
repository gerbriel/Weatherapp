import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import emailjs from '@emailjs/browser';
import type { EmailPreferences, EmailSubscription, LocationWithWeather } from '../types/weather';
import { EMAIL_CONFIG } from '../config/emailConfig';
import { initializeEmailScheduler, stopEmailScheduler } from '../services/emailScheduler';

interface EmailContextType {
  subscriptions: EmailSubscription[];
  addSubscription: (preferences: Omit<EmailPreferences, 'id' | 'createdAt'>) => void;
  updateSubscription: (id: string, preferences: Partial<EmailPreferences>) => void;
  removeSubscription: (id: string) => void;
  sendWeatherReport: (subscriptionId: string, locations: LocationWithWeather[]) => Promise<void>;
  sendTestEmail: (email: string, locations: LocationWithWeather[]) => Promise<void>;
  loading: boolean;
  error: string | null;
}

const EmailContext = createContext<EmailContextType | undefined>(undefined);

interface EmailProviderProps {
  children: ReactNode;
}

export const EmailProvider: React.FC<EmailProviderProps> = ({ children }) => {
  const [subscriptions, setSubscriptions] = useState<EmailSubscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load subscriptions from localStorage on mount
  useEffect(() => {
    const savedSubscriptions = localStorage.getItem('email-subscriptions');
    if (savedSubscriptions) {
      try {
        setSubscriptions(JSON.parse(savedSubscriptions));
      } catch (err) {
        console.error('Failed to parse saved subscriptions:', err);
        localStorage.removeItem('email-subscriptions');
      }
    }
  }, []);

  // Save subscriptions to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('email-subscriptions', JSON.stringify(subscriptions));
  }, [subscriptions]);

  // Initialize EmailJS and scheduler
  useEffect(() => {
    emailjs.init(EMAIL_CONFIG.PUBLIC_KEY);
    
    // Start the email scheduler
    initializeEmailScheduler();
    
    // Listen for scheduled email events
    const handleScheduledEmail = (event: CustomEvent) => {
      const { subscriptionId } = event.detail;
      console.log('Scheduled email triggered for subscription:', subscriptionId);
      // Note: In a real implementation, you'd need access to current locations here
      // For now, this just logs the event
    };

    window.addEventListener('scheduledEmailTrigger', handleScheduledEmail as EventListener);

    return () => {
      window.removeEventListener('scheduledEmailTrigger', handleScheduledEmail as EventListener);
      stopEmailScheduler();
    };
  }, []);

  const generateId = () => `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const addSubscription = (preferences: Omit<EmailPreferences, 'id' | 'createdAt'>) => {
    const newSubscription: EmailSubscription = {
      id: generateId(),
      preferences: {
        ...preferences,
        id: generateId(),
        createdAt: new Date().toISOString(),
      },
      active: true,
    };
    
    setSubscriptions(prev => [...prev, newSubscription]);
  };

  const updateSubscription = (id: string, updatedPreferences: Partial<EmailPreferences>) => {
    setSubscriptions(prev => prev.map(sub => 
      sub.id === id 
        ? { ...sub, preferences: { ...sub.preferences, ...updatedPreferences } }
        : sub
    ));
  };

  const removeSubscription = (id: string) => {
    setSubscriptions(prev => prev.filter(sub => sub.id !== id));
  };

  const formatWeatherData = (locations: LocationWithWeather[]) => {
    return locations.map(location => {
      if (!location.weatherData) return null;
      
      const today = new Date().toISOString().split('T')[0];
      const todayIndex = location.weatherData.daily.time.findIndex(date => date === today) || 0;
      
      return {
        name: location.name,
        coordinates: `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`,
        precipitation: location.weatherData.daily.precipitation_sum[todayIndex]?.toFixed(2) || '0.00',
        et0: location.weatherData.daily.et0_fao_evapotranspiration[todayIndex]?.toFixed(2) || '0.00',
        forecast: location.weatherData.daily.time.slice(0, 7).map((date, index) => ({
          date: new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
          precipitation: location.weatherData!.daily.precipitation_sum[index]?.toFixed(2) || '0.00',
          et0: location.weatherData!.daily.et0_fao_evapotranspiration[index]?.toFixed(2) || '0.00',
        }))
      };
    }).filter(Boolean);
  };

  const createEmailContent = (locations: LocationWithWeather[], recipientName: string) => {
    const weatherData = formatWeatherData(locations);
    const currentDate = new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    let htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <header style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e1e4e8;">
          <h1 style="color: #0366d6; margin: 0; font-size: 28px;">🌦️ Weekly Weather Report</h1>
          <p style="color: #586069; margin: 10px 0 0; font-size: 16px;">${currentDate}</p>
          <p style="color: #586069; margin: 5px 0 0; font-size: 14px;">Hello ${recipientName}!</p>
        </header>

        <main>
    `;

    weatherData.forEach((location: any) => {
      htmlContent += `
          <div style="margin-bottom: 30px; padding: 20px; border: 1px solid #e1e4e8; border-radius: 8px; background: #f6f8fa;">
            <h2 style="color: #24292e; margin: 0 0 10px; font-size: 20px; display: flex; align-items: center;">
              📍 ${location.name}
            </h2>
            <p style="color: #586069; margin: 0 0 15px; font-size: 14px; font-family: 'SFMono-Regular', Consolas, monospace;">
              ${location.coordinates}
            </p>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
              <div style="padding: 12px; background: white; border-radius: 6px; border-left: 4px solid #0366d6;">
                <h3 style="margin: 0 0 5px; font-size: 14px; color: #586069; text-transform: uppercase; letter-spacing: 0.5px;">Today's Precipitation</h3>
                <p style="margin: 0; font-size: 24px; font-weight: bold; color: #0366d6;">${location.precipitation}" in</p>
              </div>
              <div style="padding: 12px; background: white; border-radius: 6px; border-left: 4px solid #28a745;">
                <h3 style="margin: 0 0 5px; font-size: 14px; color: #586069; text-transform: uppercase; letter-spacing: 0.5px;">Today's ET₀</h3>
                <p style="margin: 0; font-size: 24px; font-weight: bold; color: #28a745;">${location.et0} mm</p>
              </div>
            </div>

            <h3 style="color: #24292e; margin: 20px 0 10px; font-size: 16px;">7-Day Forecast</h3>
            <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 6px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.12);">
              <thead>
                <tr style="background: #f1f3f4;">
                  <th style="padding: 12px; text-align: left; font-size: 12px; color: #586069; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e1e4e8;">Date</th>
                  <th style="padding: 12px; text-align: right; font-size: 12px; color: #586069; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e1e4e8;">Precipitation (in)</th>
                  <th style="padding: 12px; text-align: right; font-size: 12px; color: #586069; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e1e4e8;">ET₀ (mm)</th>
                </tr>
              </thead>
              <tbody>
      `;

      location.forecast.forEach((day: any, index: number) => {
        htmlContent += `
                <tr style="${index % 2 === 0 ? 'background: #fafbfc;' : 'background: white;'}">
                  <td style="padding: 10px 12px; font-size: 14px; color: #24292e;">${day.date}</td>
                  <td style="padding: 10px 12px; text-align: right; font-family: 'SFMono-Regular', Consolas, monospace; font-size: 14px; color: #0366d6;">${day.precipitation}</td>
                  <td style="padding: 10px 12px; text-align: right; font-family: 'SFMono-Regular', Consolas, monospace; font-size: 14px; color: #28a745;">${day.et0}</td>
                </tr>
        `;
      });

      htmlContent += `
              </tbody>
            </table>
          </div>
      `;
    });

    htmlContent += `
        </main>
        
        <footer style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e1e4e8; text-align: center;">
          <p style="color: #586069; font-size: 14px; margin: 0;">
            This report was generated by ET Weather App<br>
            Data provided by Open Meteo API • NCEP GFS Seamless Model
          </p>
          <p style="color: #959da5; font-size: 12px; margin: 10px 0 0;">
            To unsubscribe or modify your preferences, please visit the app settings.
          </p>
        </footer>
      </div>
    `;

    return htmlContent;
  };

  const sendWeatherReport = async (subscriptionId: string, locations: LocationWithWeather[]) => {
    const subscription = subscriptions.find(sub => sub.id === subscriptionId);
    if (!subscription || !subscription.active) {
      throw new Error('Subscription not found or inactive');
    }

    const { preferences } = subscription;
    const filteredLocations = locations.filter(loc => 
      preferences.selectedLocationIds.includes(loc.id) && loc.weatherData
    );

    if (filteredLocations.length === 0) {
      throw new Error('No valid locations with weather data found');
    }

    return sendEmailReport(preferences.email, preferences.name, filteredLocations);
  };

  const sendTestEmail = async (email: string, locations: LocationWithWeather[]) => {
    const validLocations = locations.filter(loc => loc.weatherData);
    if (validLocations.length === 0) {
      throw new Error('No locations with weather data available for test email');
    }

    return sendEmailReport(email, 'Weather App User', validLocations);
  };

  const sendEmailReport = async (email: string, name: string, locations: LocationWithWeather[]) => {
    setLoading(true);
    setError(null);

    try {
      const htmlContent = createEmailContent(locations, name);
      
      const templateParams = {
        to_email: email,
        to_name: name,
        subject: `Weekly Weather Report - ${new Date().toLocaleDateString()}`,
        html_content: htmlContent,
        location_count: locations.length,
        report_date: new Date().toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
      };

      await emailjs.send(EMAIL_CONFIG.SERVICE_ID, EMAIL_CONFIG.TEMPLATE_ID, templateParams);
      
      // Update last sent time for subscriptions
      setSubscriptions(prev => prev.map(sub => 
        sub.preferences.email === email 
          ? { ...sub, preferences: { ...sub.preferences, lastSent: new Date().toISOString() } }
          : sub
      ));

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send email';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const contextValue: EmailContextType = {
    subscriptions,
    addSubscription,
    updateSubscription,
    removeSubscription,
    sendWeatherReport,
    sendTestEmail,
    loading,
    error,
  };

  return (
    <EmailContext.Provider value={contextValue}>
      {children}
    </EmailContext.Provider>
  );
};

export const useEmail = (): EmailContextType => {
  const context = useContext(EmailContext);
  if (context === undefined) {
    throw new Error('useEmail must be used within an EmailProvider');
  }
  return context;
};