import axios from 'axios';
import type { WeatherApiResponse, LocationData } from '../types/weather';

const BASE_URL = 'https://api.open-meteo.com/v1/forecast';

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
      models: 'gfs_seamless',
      timezone: 'America/Los_Angeles',
      temperature_unit: 'fahrenheit',
      wind_speed_unit: 'mph',
      precipitation_unit: 'inch'
    };

    try {
      const response = await axios.get<WeatherApiResponse>(BASE_URL, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching weather data:', error);
      throw new Error('Failed to fetch weather data');
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