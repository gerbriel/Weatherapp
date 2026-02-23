/**
 * CMIS (California Irrigation Management Information System) API Service
 * Provides actual ETC (Evapotranspiration of Crop) dat      // If we have a real API key, use the actual CMIS API
      if (this.apiKey) {
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];
        
        try {
          // CIMIS API format: unitOfMeasure should be 'E' for English units
          const apiUrl = `${this.baseUrl}?appKey=${this.apiKey}&targets=${stationId}&startDate=${startDateStr}&endDate=${endDateStr}&dataItems=day-asce-eto&unitOfMeasure=E`;arison with projected ET₀
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
    // Use appropriate URL based on environment
    if (import.meta.env.DEV) {
      // Use Vite proxy in development
      this.baseUrl = '/api/cmis';
    } else {
      // Use Supabase Edge Function proxy in production to avoid CORS
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (supabaseUrl) {
        this.baseUrl = `${supabaseUrl}/functions/v1/cmis-proxy`;
      } else {
        // Fallback to direct URL (will fail with CORS on GitHub Pages)
        this.baseUrl = import.meta.env.VITE_CMIS_BASE_URL || 'https://et.water.ca.gov/api/data';
      }
    }
    this.apiKey = import.meta.env.VITE_CMIS_API_KEY || null;
    
    // Validate environment setup - use info level since missing key is expected in dev
    const cmisValidation = environmentValidator.validateCMIS();
    if (!cmisValidation.isValid) {
      console.info('CMIS API Configuration:', cmisValidation.message);
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

      // Full CIMIS station list — from https://et.water.ca.gov/api/station
      const mockStations: CMISStation[] = [
        // Northern California
        { id: '43', name: 'McArthur', latitude: 41.063767, longitude: -121.45602 },
        { id: '90', name: 'Alturas', latitude: 41.438214, longitude: -120.48031 },
        { id: '91', name: 'Tulelake FS', latitude: 41.958869, longitude: -121.47237 },
        { id: '222', name: 'Gerber South', latitude: 40.040006, longitude: -122.154539 },
        { id: '224', name: 'Shasta College', latitude: 40.63, longitude: -122.31 },
        { id: '225', name: 'Scott Valley', latitude: 41.577778, longitude: -122.838125 },
        { id: '236', name: 'Macdoel II', latitude: 41.802476, longitude: -121.996159 },
        { id: '244', name: 'Biggs', latitude: 39.386632, longitude: -121.835278 },
        { id: '250', name: 'Williams', latitude: 39.210667, longitude: -122.168889 },
        { id: '259', name: 'Ferndale Plain', latitude: 40.604467, longitude: -124.243186 },
        { id: '260', name: 'Montague', latitude: 41.798331, longitude: -122.463425 },
        { id: '261', name: 'Gazelle', latitude: 41.533989, longitude: -122.532279 },
        { id: '263', name: 'Smith River', latitude: 41.894592, longitude: -124.165043 },
        { id: '264', name: 'Sierra Valley Center', latitude: 39.777452, longitude: -120.273609 },
        { id: '267', name: 'Johnstonville', latitude: 40.364578, longitude: -120.559397 },
        { id: '268', name: 'Nubieber', latitude: 41.105901, longitude: -121.165701 },
        { id: '272', name: 'Anderson', latitude: 40.434911, longitude: -122.247425 },
        // Central California (North)
        { id: '6', name: 'Davis', latitude: 38.535694, longitude: -121.77636 },
        { id: '13', name: 'Camino', latitude: 38.753136, longitude: -120.7336 },
        { id: '47', name: 'Brentwood', latitude: 37.928258, longitude: -121.6599 },
        { id: '70', name: 'Manteca', latitude: 37.834822, longitude: -121.22319 },
        { id: '77', name: 'Oakville', latitude: 38.428475, longitude: -122.41021 },
        { id: '83', name: 'Santa Rosa', latitude: 38.40355, longitude: -122.79993 },
        { id: '84', name: 'Browns Valley', latitude: 39.252561, longitude: -121.31567 },
        { id: '103', name: 'Windsor', latitude: 38.52665, longitude: -122.813758 },
        { id: '106', name: 'Sanel Valley', latitude: 38.982581, longitude: -123.08928 },
        { id: '131', name: 'Fair Oaks', latitude: 38.649964, longitude: -121.21887 },
        { id: '139', name: 'Winters', latitude: 38.501258, longitude: -121.97853 },
        { id: '140', name: 'Twitchell Island', latitude: 38.121739, longitude: -121.674455 },
        { id: '144', name: 'Petaluma East', latitude: 38.266428, longitude: -122.61646 },
        { id: '157', name: 'Point San Pedro', latitude: 37.995478, longitude: -122.467656 },
        { id: '158', name: 'Bennett Valley', latitude: 38.419439, longitude: -122.65872 },
        { id: '170', name: 'Concord', latitude: 38.015372, longitude: -122.02028 },
        { id: '171', name: 'Union City', latitude: 37.598758, longitude: -122.05323 },
        { id: '178', name: 'Moraga', latitude: 37.837614, longitude: -122.14074 },
        { id: '187', name: 'Black Point', latitude: 38.090933, longitude: -122.5267 },
        { id: '191', name: 'Pleasanton', latitude: 37.663969, longitude: -121.88503 },
        { id: '195', name: 'Auburn', latitude: 38.887603, longitude: -121.10291 },
        { id: '211', name: 'Gilroy', latitude: 37.015026, longitude: -121.53704 },
        { id: '212', name: 'Hastings Tract East', latitude: 38.278056, longitude: -121.74111 },
        { id: '213', name: 'El Cerrito', latitude: 37.931539, longitude: -122.302714 },
        { id: '226', name: 'Woodland', latitude: 38.672722, longitude: -121.81172 },
        { id: '227', name: 'Plymouth', latitude: 38.508333, longitude: -120.79972 },
        { id: '228', name: 'Diamond Springs', latitude: 38.636111, longitude: -120.79305 },
        { id: '235', name: 'Verona', latitude: 38.797944, longitude: -121.61136 },
        { id: '242', name: 'Staten Island', latitude: 38.192397, longitude: -121.510261 },
        { id: '243', name: 'Ryde', latitude: 38.249622, longitude: -121.555528 },
        { id: '246', name: 'Markleeville', latitude: 38.773409, longitude: -119.79193 },
        { id: '247', name: 'Jersey Island', latitude: 38.033386, longitude: -121.701247 },
        { id: '248', name: 'Holt', latitude: 37.932072, longitude: -121.396661 },
        { id: '249', name: 'Ripon', latitude: 37.755597, longitude: -121.266153 },
        { id: '253', name: 'Pescadero', latitude: 37.255333, longitude: -122.3708 },
        { id: '254', name: 'Oakland Metro', latitude: 37.718167, longitude: -122.197111 },
        { id: '262', name: 'Linden', latitude: 38.065692, longitude: -121.071747 },
        { id: '273', name: 'WildHawk', latitude: 38.479722, longitude: -121.314722 },
        // Central California (South)
        { id: '2', name: 'FivePoints', latitude: 36.336222, longitude: -120.11291 },
        { id: '5', name: 'Shafter', latitude: 35.532556, longitude: -119.28179 },
        { id: '7', name: 'Firebaugh/Telles', latitude: 36.851222, longitude: -120.59092 },
        { id: '15', name: 'Stratford', latitude: 36.157972, longitude: -119.85143 },
        { id: '39', name: 'Parlier', latitude: 36.597444, longitude: -119.50404 },
        { id: '71', name: 'Modesto', latitude: 37.645222, longitude: -121.18776 },
        { id: '80', name: 'Fresno State', latitude: 36.820833, longitude: -119.74231 },
        { id: '104', name: 'De Laveaga', latitude: 36.997444, longitude: -121.99676 },
        { id: '105', name: 'Westlands', latitude: 36.634028, longitude: -120.38181 },
        { id: '113', name: 'King City-Oasis Rd.', latitude: 36.121083, longitude: -121.08457 },
        { id: '114', name: 'Arroyo Seco', latitude: 36.347306, longitude: -121.29135 },
        { id: '116', name: 'Salinas North', latitude: 36.716806, longitude: -121.69189 },
        { id: '124', name: 'Panoche', latitude: 36.890056, longitude: -120.73141 },
        { id: '125', name: 'Arvin-Edison', latitude: 35.205583, longitude: -118.77841 },
        { id: '126', name: 'San Benito', latitude: 36.854833, longitude: -121.36275 },
        { id: '129', name: 'Pajaro', latitude: 36.902778, longitude: -121.74193 },
        { id: '143', name: 'San Juan Valley', latitude: 36.822861, longitude: -121.46787 },
        { id: '146', name: 'Belridge', latitude: 35.505833, longitude: -119.69114 },
        { id: '182', name: 'Delano', latitude: 35.833, longitude: -119.25596 },
        { id: '193', name: 'Pacific Grove', latitude: 36.633222, longitude: -121.93486 },
        { id: '194', name: 'Oakdale', latitude: 37.727194, longitude: -120.85086 },
        { id: '205', name: 'Coalinga', latitude: 36.175833, longitude: -120.36027 },
        { id: '206', name: 'Denair II', latitude: 37.545869, longitude: -120.75453 },
        { id: '209', name: 'Watsonville West II', latitude: 36.913083, longitude: -121.82365 },
        { id: '210', name: 'Carmel', latitude: 36.540889, longitude: -121.88196 },
        { id: '214', name: 'Salinas South II', latitude: 36.625619, longitude: -121.537889 },
        { id: '229', name: 'Laguna Seca', latitude: 36.570111, longitude: -121.7865 },
        { id: '252', name: 'Soledad II', latitude: 36.456728, longitude: -121.344388 },
        { id: '258', name: 'Lemon Cove', latitude: 36.376917, longitude: -119.037972 },
        { id: '269', name: 'Los Banos II', latitude: 37.108935, longitude: -120.797387 },
        { id: '270', name: 'COS Tulare', latitude: 36.189399, longitude: -119.285207 },
        // Southern California
        { id: '35', name: 'Bishop', latitude: 37.358514, longitude: -118.40553 },
        { id: '41', name: 'Calipatria/Mulberry', latitude: 33.042986, longitude: -115.41585 },
        { id: '44', name: 'U.C. Riverside', latitude: 33.964942, longitude: -117.33698 },
        { id: '52', name: 'San Luis Obispo', latitude: 35.305442, longitude: -120.66178 },
        { id: '64', name: 'Santa Ynez', latitude: 34.583144, longitude: -120.07924 },
        { id: '75', name: 'Irvine', latitude: 33.68845, longitude: -117.72118 },
        { id: '78', name: 'Pomona', latitude: 34.056589, longitude: -117.81307 },
        { id: '87', name: 'Meloland', latitude: 32.806183, longitude: -115.44626 },
        { id: '88', name: 'Cuyama', latitude: 34.942525, longitude: -119.6738 },
        { id: '99', name: 'Santa Monica', latitude: 34.044311, longitude: -118.47689 },
        { id: '107', name: 'Santa Barbara', latitude: 34.437353, longitude: -119.73742 },
        { id: '117', name: 'Victorville', latitude: 34.475914, longitude: -117.26351 },
        { id: '135', name: 'Blythe NE', latitude: 33.662869, longitude: -114.55811 },
        { id: '136', name: 'Oasis', latitude: 33.523694, longitude: -116.15575 },
        { id: '147', name: 'Otay Lake', latitude: 32.628208, longitude: -116.93928 },
        { id: '150', name: 'Miramar', latitude: 32.885847, longitude: -117.14314 },
        { id: '151', name: 'Ripley', latitude: 33.532222, longitude: -114.63389 },
        { id: '152', name: 'Camarillo', latitude: 34.219386, longitude: -118.99244 },
        { id: '153', name: 'Escondido SPV', latitude: 33.08105, longitude: -116.9757 },
        { id: '159', name: 'Monrovia', latitude: 34.146372, longitude: -117.9858 },
        { id: '160', name: 'San Luis Obispo West', latitude: 35.335261, longitude: -120.73588 },
        { id: '163', name: 'Atascadero', latitude: 35.472556, longitude: -120.64814 },
        { id: '165', name: 'Sisquoc', latitude: 34.841878, longitude: -120.21274 },
        { id: '173', name: 'Torrey Pines', latitude: 32.901867, longitude: -117.25046 },
        { id: '174', name: 'Long Beach', latitude: 33.798697, longitude: -118.09479 },
        { id: '179', name: 'Winchester', latitude: 33.663325, longitude: -117.09338 },
        { id: '181', name: 'Westmorland North', latitude: 33.078611, longitude: -115.66056 },
        { id: '183', name: 'Owens Lake North', latitude: 36.488611, longitude: -117.91944 },
        { id: '184', name: 'San Diego II', latitude: 32.729578, longitude: -117.13934 },
        { id: '189', name: 'Owens Lake South', latitude: 36.358628, longitude: -117.94387 },
        { id: '192', name: 'Lake Arrowhead', latitude: 34.255942, longitude: -117.21814 },
        { id: '197', name: 'Palmdale', latitude: 34.614981, longitude: -118.03249 },
        { id: '199', name: 'Big Bear Lake', latitude: 34.237419, longitude: -116.86571 },
        { id: '200', name: 'Indio 2', latitude: 33.748586, longitude: -116.2529 },
        { id: '202', name: 'Nipomo', latitude: 35.028281, longitude: -120.56003 },
        { id: '204', name: 'Santa Clarita', latitude: 34.426361, longitude: -118.51758 },
        { id: '207', name: 'Borrego Springs', latitude: 33.268447, longitude: -116.36505 },
        { id: '208', name: 'La Quinta II', latitude: 33.678186, longitude: -116.27299 },
        { id: '215', name: 'Chatsworth', latitude: 34.291331, longitude: -118.57004 },
        { id: '216', name: 'Arleta', latitude: 34.256111, longitude: -118.38278 },
        { id: '217', name: 'Moorpark', latitude: 34.269031, longitude: -118.849319 },
        { id: '218', name: 'Thermal South', latitude: 33.595694, longitude: -116.15811 },
        { id: '220', name: 'Palmdale Central', latitude: 34.592222, longitude: -118.1275 },
        { id: '221', name: 'Cadiz Valley', latitude: 34.513611, longitude: -115.51056 },
        { id: '223', name: 'North Hollywood', latitude: 34.142911, longitude: -118.36632 },
        { id: '231', name: 'Lompoc', latitude: 34.672222, longitude: -120.51306 },
        { id: '232', name: 'Santa Maria II', latitude: 34.913472, longitude: -120.46478 },
        { id: '233', name: 'Joshua Tree', latitude: 34.138147, longitude: -116.21319 },
        { id: '237', name: 'Temecula East III', latitude: 33.55281, longitude: -117.043302 },
        { id: '239', name: 'Hemet', latitude: 33.664747, longitude: -116.955121 },
        { id: '240', name: 'Perris - Menifee', latitude: 33.76, longitude: -117.2 },
        { id: '241', name: 'San Clemente', latitude: 33.4625, longitude: -117.586111 },
        { id: '245', name: 'Coto de Caza', latitude: 33.621667, longitude: -117.585278 },
        { id: '251', name: 'Highland', latitude: 34.112042, longitude: -117.1857 },
        { id: '256', name: 'Lancaster', latitude: 34.759475, longitude: -117.991997 },
        { id: '257', name: 'Ridgecrest', latitude: 35.659128, longitude: -117.636925 },
        { id: '265', name: 'Paso Robles', latitude: 35.692266, longitude: -120.64855 },
        { id: '266', name: 'Shandon', latitude: 35.643787, longitude: -120.403229 },
        { id: '271', name: 'Pauma Valley', latitude: 33.299583, longitude: -116.979719 },
      ];

      // If a specific CIMIS station ID is provided (e.g., from trial locations), use that station
      if (locationInfo?.cimisStationId) {
        const specificStation = mockStations.find(station => station.id === locationInfo.cimisStationId);
        if (specificStation) {
          return specificStation;
        }
        // Station ID not in the known list — construct a station entry directly
        // from the provided coordinates so we query the correct station ID from CIMIS
        return {
          id: locationInfo.cimisStationId,
          name: locationInfo.name || `CIMIS Station ${locationInfo.cimisStationId}`,
          latitude,
          longitude
        };
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
            throw new Error(`CMIS API error: ${response.status} - ${errorText.substring(0, 200)}`);
          }
          
          const data = await response.json();
          const result = this.parseETCResponse(data);
          
          return {
            success: result.success,
            data: result.data,
            error: result.error,
            isCaliforniaLocation: true
          };
        } catch (networkError) {
          
          return {
            success: false,
            data: [],
            error: networkError instanceof Error ? networkError.message : 'Failed to fetch CMIS data',
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
          provider.Records.forEach((record: any, index: number) => {
            // Each record contains daily data
            if (record.DayAsceEto && record.DayAsceEto.Value !== null) {
              const rawValue = Number(record.DayAsceEto.Value);
              // CIMIS API actually returns INCHES, not mm! No conversion needed.
              const valueInInches = Number(rawValue.toFixed(3));
              
              // Log first 3 records to verify values
              if (index < 3) {
              }
              
              data.push({
                date: record.Date,
                etc_actual: valueInInches, // CIMIS API returns inches directly
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