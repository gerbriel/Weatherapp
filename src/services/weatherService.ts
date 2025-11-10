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
  async getWeatherData(location: LocationData): Promise<WeatherApiResponse> {
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
        'et0_fao_evapotranspiration_sum'
      ].join(','),
      forecast_days: 14,
      models: 'gfs_global', // Use NOAA GFS Global model for reliable US weather data
      timezone: 'America/Los_Angeles',
      temperature_unit: 'fahrenheit',
      wind_speed_unit: 'mph',
      precipitation_unit: 'inch'
    };

    try {
      const response = await axios.get<WeatherApiResponse>(FORECAST_URL, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching weather data:', error);
      
      // Check if it's a rate limiting error
      if (axios.isAxiosError(error) && error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please wait before refreshing weather data.');
      }
      
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