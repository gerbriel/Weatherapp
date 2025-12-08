/**
 * CMIS (California Irrigation Management Information System) API Service
 * Provides actual ETC (Evapotranspiration of Crop) data for comparison with projected ET₀
 * NOTE: CMIS data is only available for California locations
 */

import { environmentValidator } from '../utils/environmentValidator';
import { isLocationInCalifornia, getCMISUnavailableMessage } from '../utils/locationUtils';

interface CMISStation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

interface CMISETCData {
  date: string;
  etc_actual: number; // inches/day
  station_id: string;
  crop_type?: string;
}

interface CMISResponse {
  success: boolean;
  data: CMISETCData[];
  error?: string;
  isCaliforniaLocation?: boolean; // Flag to indicate if location is in CA
}

class CMISService {
  private baseUrl: string;
  private apiKey: string | null = null;

  constructor() {
    // Use proxy in development to avoid CORS issues, direct URL in production
    if (import.meta.env.DEV) {
      // Use Vite proxy in development
      this.baseUrl = '/api/cmis';
    } else {
      // Use direct API URL in production (needs CORS configured on server or serverless function)
      this.baseUrl = import.meta.env.VITE_CMIS_BASE_URL || 'https://et.water.ca.gov/api/data';
    }
    this.apiKey = import.meta.env.VITE_CMIS_API_KEY || null;
    
    // Validate environment setup
    const cmisValidation = environmentValidator.validateCMIS();
    if (!cmisValidation.isValid) {
      console.warn('CMIS API Configuration:', cmisValidation.message);
    }
    
    // Log environment status in development
    if (import.meta.env.DEV) {
      environmentValidator.logStatus();
    }
  }

  /**
   * Find the nearest CMIS station to a given location
   * Only works for California locations - returns null for out-of-state locations
   */
  async findNearestStation(latitude: number, longitude: number, locationInfo?: { state?: string; region?: string; name?: string; cimisStationId?: string }): Promise<CMISStation | null> {
    try {
      // Check if location is in California
      const location = { latitude, longitude, ...locationInfo };
      if (!isLocationInCalifornia(location)) {
        console.log(`Location (${latitude}, ${longitude}) is outside California - CMIS not available`);
        return null;
      }

      // Updated mock stations with the specific CIMIS station IDs
      const mockStations: CMISStation[] = [
        { id: '125', name: 'Castroville', latitude: 36.7650, longitude: -121.7569 },
        { id: '80', name: 'Fresno State', latitude: 36.8175, longitude: -119.7417 },
        { id: '71', name: 'Manteca', latitude: 37.7633, longitude: -121.2158 },
        { id: '250', name: 'Buttonwillow', latitude: 35.3986, longitude: -119.4692 },
        { id: '77', name: 'Oakville', latitude: 38.4321, longitude: -122.4106 },
        { id: '214', name: 'Torrey Pines', latitude: 32.8831, longitude: -117.2419 },
        { id: '202', name: 'Atwater', latitude: 37.3472, longitude: -120.5878 },
        { id: '258', name: 'Temecula', latitude: 33.4833, longitude: -117.1400 },
        { id: '2', name: 'Five Points', latitude: 36.3350, longitude: -120.1058 }
      ];

      // If a specific CIMIS station ID is provided (e.g., from trial locations), use that station
      if (locationInfo?.cimisStationId) {
        const specificStation = mockStations.find(station => station.id === locationInfo.cimisStationId);
        if (specificStation) {
          return specificStation;
        }
      }

      // Find closest station using simple distance calculation
      let nearestStation = mockStations[0];
      let minDistance = this.calculateDistance(latitude, longitude, nearestStation.latitude, nearestStation.longitude);

      for (const station of mockStations) {
        const distance = this.calculateDistance(latitude, longitude, station.latitude, station.longitude);
        if (distance < minDistance) {
          minDistance = distance;
          nearestStation = station;
        }
      }

      return nearestStation;
    } catch (error) {
      console.error('Error finding nearest CMIS station:', error);
      return null;
    }
  }

  /**
   * Get ETC actual data for a station over the last 14 days
   * Returns error for non-California locations
   */
  async getETCData(stationId: string, startDate: Date, endDate: Date, locationInfo?: { latitude?: number; longitude?: number; state?: string; region?: string; name?: string }): Promise<CMISResponse> {
    try {
      // Check if location is in California if location info is provided
      if (locationInfo && !isLocationInCalifornia(locationInfo)) {
        return {
          success: false,
          data: [],
          error: getCMISUnavailableMessage(locationInfo),
          isCaliforniaLocation: false
        };
      }

      // If we have a real API key, use the actual CMIS API
      if (this.apiKey) {
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];
        
        try {
          // CIMIS API format: unitOfMeasure should be 'E' for English units
          const apiUrl = `${this.baseUrl}?appKey=${this.apiKey}&targets=${stationId}&startDate=${startDateStr}&endDate=${endDateStr}&dataItems=day-asce-eto&unitOfMeasure=E`;
          
          const response = await fetch(apiUrl);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('CMIS API Error Response:', errorText);
            throw new Error(`CMIS API error: ${response.status} ${response.statusText}`);
          }
          
          const data = await response.json();
          console.log('✅ CMIS API Response received:', data);
          const result = this.parseETCResponse(data);
          
          return {
            success: result.success,
            data: result.data,
            error: result.error,
            isCaliforniaLocation: true
          };
        } catch (networkError) {
          // Return error when API is not accessible (no mock data fallback)
          console.error('CMIS API network error:', networkError);
          return {
            success: false,
            data: [],
            error: 'CMIS API is currently unavailable. Please check your internet connection or try again later.',
            isCaliforniaLocation: true
          };
        }
      } else {
        // Return error when no API key is available (no mock data fallback)
        console.warn(`CMIS API key not configured for station ${stationId}`);
        
        return {
          success: false,
          data: [],
          error: 'CMIS API key is not configured. Please add your API key to use California irrigation data.',
          isCaliforniaLocation: true
        };
      }
    } catch (error) {
      console.error('Error fetching CMIS ETC data:', error);
      
      // Return error instead of falling back to mock data
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Failed to fetch CMIS data',
        isCaliforniaLocation: locationInfo ? isLocationInCalifornia(locationInfo) : true
      };
    }
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  /**
   * Parse CMIS API response into our standardized format
   */
  private parseETCResponse(apiResponse: any): CMISResponse {
    try {
      // Handle CMIS API response format
      if (!apiResponse.Data || !Array.isArray(apiResponse.Data.Providers)) {
        throw new Error('Invalid CMIS API response format');
      }

      const data: CMISETCData[] = [];
      
      // CMIS API returns data in a nested structure
      apiResponse.Data.Providers.forEach((provider: any) => {
        if (provider.Records && Array.isArray(provider.Records)) {
          provider.Records.forEach((record: any) => {
            // Each record contains daily data
            if (record.DayAsceEto && record.DayAsceEto.Value !== null) {
              data.push({
                date: record.Date,
                etc_actual: Number((record.DayAsceEto.Value * 0.0393701).toFixed(3)), // CIMIS API returns mm, convert to inches
                station_id: provider.StationNbr?.toString() || 'unknown',
                crop_type: 'Reference Crop (Grass)'
              });
            }
          });
        }
      });

      return {
        success: true,
        data: data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      };
    } catch (error) {
      console.error('Error parsing CMIS response:', error);
      return {
        success: false,
        data: [],
        error: 'Failed to parse CMIS response'
      };
    }
  }
}

export const cmisService = new CMISService();
export type { CMISStation, CMISETCData, CMISResponse };