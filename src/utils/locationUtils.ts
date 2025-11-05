/**
 * Utility functions for location-based services
 */

interface LocationCoordinates {
  latitude?: number;
  longitude?: number;
  state?: string;
  region?: string;
  name?: string;
}

/**
 * Check if a location is within California boundaries
 * Uses both coordinate bounds and state/name information for accuracy
 */
export function isLocationInCalifornia(location: LocationCoordinates): boolean {
  // First check if we have explicit state information
  if (location.state) {
    return location.state.toLowerCase() === 'california' || 
           location.state.toLowerCase() === 'ca';
  }

  // Check if location name contains "CA" or "California"
  if (location.name) {
    const nameLC = location.name.toLowerCase();
    if (nameLC.includes(', ca') || nameLC.includes('california')) {
      return true;
    }
  }

  // Check if region contains California indicators
  if (location.region) {
    const regionLC = location.region.toLowerCase();
    if (regionLC.includes('california') || 
        regionLC.includes('central valley') ||
        regionLC.includes('salinas valley') ||
        regionLC.includes('san joaquin valley') ||
        regionLC.includes('napa valley') ||
        regionLC.includes('sonoma county') ||
        regionLC.includes('kern county') ||
        regionLC.includes('fresno county') ||
        regionLC.includes('san luis obispo') ||
        regionLC.includes('monterey county') ||
        regionLC.includes('colusa county')) {
      return true;
    }
  }

  // Fallback: Check if coordinates are within California boundaries (if available)
  if (location.latitude !== undefined && location.longitude !== undefined) {
    // California approximate boundaries:
    // North: 42.0° N (Oregon border)
    // South: 32.5° N (Mexico border)  
    // East: -114.1° W (Arizona/Nevada border)
    // West: -124.4° W (Pacific Ocean)
    const { latitude, longitude } = location;
    
    return latitude >= 32.5 && 
           latitude <= 42.0 && 
           longitude >= -124.4 && 
           longitude <= -114.1;
  }

  // If no information available, assume not California
  return false;
}

/**
 * Get a message explaining why CMIS data is not available for non-CA locations
 */
export function getCMISUnavailableMessage(location: LocationCoordinates): string {
  if (location.state && location.state.toLowerCase() !== 'california' && location.state.toLowerCase() !== 'ca') {
    return `CMIS data only available for CA (location in ${location.state})`;
  }
  
  return 'CMIS data only available for California locations';
}

/**
 * Check if CMIS service should be used for this location
 */
export function shouldUseCMIS(location: LocationCoordinates): boolean {
  return isLocationInCalifornia(location);
}