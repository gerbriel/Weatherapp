// Types for Open Meteo API responses
export interface DailyWeatherData {
  time: string[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  wind_speed_10m_max: number[];
  precipitation_sum: number[];
  rain_sum: number[];
  et0_fao_evapotranspiration: number[];
  et0_fao_evapotranspiration_sum: number[];
  weather_code: number[];
}

export interface HourlyWeatherData {
  time: string[];
  temperature_2m: number[];
  relative_humidity_2m: number[];
  precipitation: number[];
  precipitation_probability: number[];
  weather_code: number[];
  wind_speed_10m: number[];
}

export interface WeatherApiResponse {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  daily_units: {
    time: string;
    temperature_2m_max: string;
    temperature_2m_min: string;
    wind_speed_10m_max: string;
    precipitation_sum: string;
    rain_sum: string;
    et0_fao_evapotranspiration: string;
    et0_fao_evapotranspiration_sum: string;
    weather_code: string;
  };
  daily: DailyWeatherData;
  hourly_units?: {
    time: string;
    temperature_2m: string;
    relative_humidity_2m: string;
    precipitation: string;
    precipitation_probability: string;
    weather_code: string;
    wind_speed_10m: string;
  };
  hourly?: HourlyWeatherData;
}

export interface LocationData {
  id: string;
  latitude: number;
  longitude: number;
  name: string;
  weatherstation?: string;
  weatherstationID?: string;
  isFavorite: boolean;
  sortOrder?: number;
  lastUpdated?: string;
}

export interface LocationWithWeather extends LocationData {
  weatherData?: WeatherApiResponse;
  loading?: boolean;
  error?: string;
  lastUpdated?: string;
}

export interface EmailSubscription {
  id: string;
  email: string;
  name: string;
  enabled: boolean;
  is_recurring: boolean;
  created_at: string;
  updated_at: string;
  
  // Recurring schedule (minute precision)
  schedule_day_of_week?: number; // 1 = Monday, 7 = Sunday
  schedule_hour?: number; // 0-23
  schedule_minute?: number; // 0-59
  schedule_timezone: string;
  
  // One-time schedule
  scheduled_at?: string; // ISO datetime for non-recurring
  
  // Location preferences
  selected_location_ids: string[];
  
  // Email tracking
  last_sent_at?: string;
  next_send_at?: string;
}

export interface EmailSendLog {
  id: string;
  subscription_id: string;
  sent_at: string;
  status: 'pending' | 'sent' | 'failed';
  error_message?: string;
  locations_count?: number;
  weather_data?: any;
}

export interface WeatherLocation {
  id: string;
  user_id?: string;
  name: string;
  latitude: number;
  longitude: number;
  is_favorite: boolean;
  created_at: string;
  last_updated: string;
}

// Legacy interface for backwards compatibility
export interface EmailPreferences {
  id: string;
  email: string;
  name: string;
  enabled: boolean;
  selectedLocationIds: string[];
  dayOfWeek: number; // 1 = Monday, 7 = Sunday
  hour: number; // 0-23
  timezone: string;
  createdAt: string;
  lastSent?: string;
}

// Enhanced interfaces for admin analytics
export interface EmailStats {
  totalSubscriptions: number;
  activeSubscriptions: number;
  recurringSubscriptions: number;
  oneTimeSubscriptions: number;
  totalEmailsSent: number;
  successfulSends: number;
  failedSends: number;
  recentSends: EnhancedEmailSendLog[];
  subscriptionsByDay: { [key: string]: number };
  emailsByStatus: { [key: string]: number };
}

export interface EnhancedEmailSendLog extends EmailSendLog {
  subscription?: {
    email: string;
    name: string;
  };
  email_subscriptions?: {
    email: string;
    name: string;
    is_recurring?: boolean;
  };
}

export interface SubscriptionAnalytics {
  creationTimeline: Array<{
    created_at: string;
    is_recurring: boolean;
  }>;
  sendTimeline: Array<{
    sent_at: string;
    status: string;
  }>;
}

// Subscriber Profile System
export interface SubscriberProfile {
  email: string;
  name: string;
  subscriptions: EmailSubscription[];
  
  // Overall totals
  totalSubscriptions: number;
  activeSubscriptions: number;
  totalEmailsSent: number;
  successfulSends: number;
  failedSends: number;
  
  // Recurring vs Single Send breakdown
  recurringSubscriptions: number;
  singleSends: number;
  activeRecurringSubscriptions: number;
  completedSingleSends: number;
  pendingSingleSends: number;
  
  // Analytics
  firstSubscribed: string;
  lastActive: string;
  uniqueLocations: number;
  locationNames: string[];
  recentActivity: EnhancedEmailSendLog[];
  apiRequestCount?: number;
  avgEmailsPerMonth?: number;
  preferredSchedule?: {
    days: number[];
    times: string[];
  };
}

export interface SubscriberStats {
  // Overall metrics
  totalSubscribers: number;
  activeSubscribers: number;
  totalApiRequests: number;
  avgSubscriptionsPerUser: number;
  
  // Recurring vs Single Send breakdown
  recurringSubscribers: number;
  singleSendUsers: number;
  activeRecurringSubscriptions: number;
  totalSingleSends: number;
  completedSingleSends: number;
  pendingSingleSends: number;
  
  // Analytics
  topLocations: Array<{
    locationId: string;
    locationName: string;
    subscriberCount: number;
    singleSendCount?: number;
  }>;
  recentSubscribers: SubscriberProfile[];
}export interface ApiUsageLog {
  id: string;
  subscriber_email: string;
  endpoint: string;
  method: string;
  timestamp: string;
  ip_address?: string;
  user_agent?: string;
  response_status: number;
  response_time_ms?: number;
}