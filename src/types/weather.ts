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
  };
  daily: DailyWeatherData;
}

export interface LocationData {
  id: string;
  latitude: number;
  longitude: number;
  name: string;
  isFavorite: boolean;
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