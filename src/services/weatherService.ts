import axios from 'axios';
import type { WeatherApiResponse, LocationData } from '../types/weather';

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const HISTORICAL_URL = 'https://archive-api.open-meteo.com/v1/archive';

// NOAA Weather Models Configuration:
// - GFS Global: NOAA Global Forecast System - primary US weather model
// - NAM CONUS: NOAA North American Mesoscale Model - high-resolution US model
// - ERA5: European Centre reanalysis data (used for historical, comparable to NOAA quality)

interface DateRange {
  startDate: string; // YYYY-MM-DD format
  endDate: string;   // YYYY-MM-DD format
}

class WeatherService {
  private cache = new Map<string, { data: WeatherApiResponse; timestamp: number }>();
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes cache (increased to reduce API calls)
  private readonly CACHE_VERSION = '2'; // Increment this to invalidate all caches
  private requestQueue: Promise<any> = Promise.resolve();
  private readonly REQUEST_DELAY = 5000; // 5 second delay between requests to avoid rate limits (increased from 3s)
  private lastRequestTime = 0;
  private readonly MAX_RETRIES = 1; // Reduced to 1 retry to avoid overwhelming API
  private readonly RETRY_DELAY = 10000; // 10 second delay before retry (increased from 5s)
  
  constructor() {
    // Clear old cache version and load current cache
    this.validateAndLoadCache();
  }
  
  // Public method to clear cache
  clearCache() {
    this.cache.clear();
    try {
      localStorage.removeItem('weather_cache');
      localStorage.removeItem('weather_cache_version');
    } catch (error) {
      console.error('Failed to clear weather cache from storage:', error);
    }
  }
  
  private validateAndLoadCache() {
    try {
      const storedVersion = localStorage.getItem('weather_cache_version');
      
      // If version doesn't match, clear old cache
      if (storedVersion !== this.CACHE_VERSION) {
        console.log('Weather cache version mismatch. Clearing old cache...');
        localStorage.removeItem('weather_cache');
        localStorage.setItem('weather_cache_version', this.CACHE_VERSION);
        return;
      }
      
      // Load cache if version matches
      this.loadCacheFromStorage();
    } catch (error) {
      console.error('Failed to validate cache version:', error);
    }
  }
  
  private loadCacheFromStorage() {
    try {
      const stored = localStorage.getItem('weather_cache');
      if (stored) {
        const parsed = JSON.parse(stored);
        Object.entries(parsed).forEach(([key, value]: [string, any]) => {
          if (value && value.data && value.timestamp) {
            this.cache.set(key, value);
          }
        });
      }
    } catch (error) {
      console.error('Failed to load weather cache from storage:', error);
    }
  }
  
  private saveCacheToStorage() {
    try {
      const cacheObj: Record<string, any> = {};
      this.cache.forEach((value, key) => {
        cacheObj[key] = value;
      });
      localStorage.setItem('weather_cache', JSON.stringify(cacheObj));
    } catch (error) {
      console.error('Failed to save weather cache to storage:', error);
    }
  }
  
  async getWeatherData(location: LocationData): Promise<WeatherApiResponse> {
    const cacheKey = `${location.latitude},${location.longitude}`;
    const now = Date.now();
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && (now - cached.timestamp) < this.CACHE_DURATION) {
      return cached.data;
    }

    // Add to request queue with delay to avoid rate limiting
    return new Promise((resolve, reject) => {
      this.requestQueue = this.requestQueue
        .then(() => {
          // Ensure minimum time between requests
          const timeSinceLastRequest = Date.now() - this.lastRequestTime;
          const additionalDelay = Math.max(0, this.REQUEST_DELAY - timeSinceLastRequest);
          return new Promise(resolve => setTimeout(resolve, additionalDelay));
        })
        .then(() => {
          // Check cache again after waiting in queue
          const cachedAfterWait = this.cache.get(cacheKey);
          if (cachedAfterWait && (Date.now() - cachedAfterWait.timestamp) < this.CACHE_DURATION) {
            return cachedAfterWait.data;
          }
          this.lastRequestTime = Date.now();
          return this.fetchWeatherData(location, cacheKey, now);
        })
        .then(resolve)
        .catch(reject);
    });
  }
  
  private async fetchWeatherData(location: LocationData, cacheKey: string, timestamp: number, retryCount = 0): Promise<WeatherApiResponse> {
    // Double-check cache after waiting in queue
    const cached = this.cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      return cached.data;
    }
    const params = {
      latitude: location.latitude,
      longitude: location.longitude,
      daily: [
        'temperature_2m_max',
        'temperature_2m_min',
        'wind_speed_10m_max',
        'precipitation_sum',
        'rain_sum', 
        'et0_fao_evapotranspiration',
        'et0_fao_evapotranspiration_sum',
        'weather_code'
      ].join(','),
      hourly: [
        'temperature_2m',
        'relative_humidity_2m',
        'precipitation',
        'precipitation_probability',
        'weather_code',
        'wind_speed_10m'
      ].join(','),
      forecast_days: 16, // Increased to support 14-day future reports
      forecast_hours: 24, // Get 24 hours of hourly forecast data
      past_days: 0, // No past data needed - focus on upcoming forecasts
      models: 'gfs_global', // Use NOAA GFS Global model for reliable US weather data
      timezone: 'America/Los_Angeles',
      temperature_unit: 'fahrenheit',
      wind_speed_unit: 'mph',
      precipitation_unit: 'inch'
    };

    try {
      const response = await axios.get<WeatherApiResponse>(FORECAST_URL, { params });
      
      // Cache the successful response
      this.cache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now()
      });
      
      // Persist to localStorage
      this.saveCacheToStorage();
      
      return response.data;
    } catch (error) {
      // Check if it's a rate limiting error
      if (axios.isAxiosError(error) && error.response?.status === 429) {
        // Retry with exponential backoff if we haven't exceeded max retries
        if (retryCount < this.MAX_RETRIES) {
          const delay = this.RETRY_DELAY * Math.pow(2, retryCount);
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.fetchWeatherData(location, cacheKey, timestamp, retryCount + 1);
        }
        // Silently throw without console.error to avoid cluttering console
        throw new Error('Rate limit exceeded. Please wait before refreshing weather data.');
      }
      
      // Only log non-rate-limit errors
      console.error('Error fetching weather data:', error);
      throw new Error('Failed to fetch weather data');
    }
  }

  async getHistoricalWeatherData(location: LocationData, dateRange: DateRange): Promise<WeatherApiResponse> {
    const params = {
      latitude: location.latitude,
      longitude: location.longitude,
      start_date: dateRange.startDate,
      end_date: dateRange.endDate,
      daily: [
        'temperature_2m_max',
        'temperature_2m_min',
        'wind_speed_10m_max',
        'precipitation_sum',
        'rain_sum',
        'et0_fao_evapotranspiration'
      ].join(','),
      models: 'era5', // Use ERA5 reanalysis data for historical weather (NOAA-quality historical data)
      timezone: 'America/Los_Angeles',
      temperature_unit: 'fahrenheit',
      wind_speed_unit: 'mph',
      precipitation_unit: 'inch'
    };

    try {
      const response = await axios.get<WeatherApiResponse>(HISTORICAL_URL, { params });
      
      // Calculate cumulative ET0 sum for historical data (not provided by historical API)
      if (response.data.daily?.et0_fao_evapotranspiration) {
        const et0Values = response.data.daily.et0_fao_evapotranspiration;
        const et0SumValues = [];
        let cumulativeSum = 0;
        
        for (const value of et0Values) {
          if (value !== null && value !== undefined) {
            cumulativeSum += value;
          }
          et0SumValues.push(cumulativeSum);
        }
        
        // Add the calculated sum to the response
        response.data.daily.et0_fao_evapotranspiration_sum = et0SumValues;
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching historical weather data:', error);
      
      if (axios.isAxiosError(error) && error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please wait before refreshing historical data.');
      }
      
      throw new Error('Failed to fetch historical weather data');
    }
  }

  // Get user's current location
  async getCurrentLocation(): Promise<Omit<LocationData, 'id' | 'isFavorite'>> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            name: 'Current Location'
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          // Default to Los Angeles if geolocation fails
          resolve({
            latitude: 34.0522,
            longitude: -118.2437,
            name: 'Los Angeles, CA'
          });
        }
      );
    });
  }
}

export const weatherService = new WeatherService();