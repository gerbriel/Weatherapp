import React, { createContext, useContext, useEffect, useState } from 'react';
import type { LocationData, LocationWithWeather } from '../types/weather';
import { weatherService } from '../services/weatherService';

interface LocationsContextType {
  locations: LocationWithWeather[];
  favorites: LocationWithWeather[];
  addLocation: (location: Omit<LocationData, 'id' | 'isFavorite'>) => void;
  removeLocation: (id: string) => void;
  toggleFavorite: (id: string) => void;
  updateLocation: (id: string, updates: Partial<LocationData>) => void;
  reorderLocations: (locationIds: string[]) => void;
  refreshLocation: (id: string) => void;
  refreshAllLocations: () => void;
  loading: boolean;
}

const LocationsContext = createContext<LocationsContextType | undefined>(undefined);

export const useLocations = () => {
  const context = useContext(LocationsContext);
  if (context === undefined) {
    throw new Error('useLocations must be used within a LocationsProvider');
  }
  return context;
};

// Helper function to generate UUID v4 compatible IDs
const generateId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

interface LocationsProviderProps {
  children: React.ReactNode;
}

export const LocationsProvider: React.FC<LocationsProviderProps> = ({ children }) => {
  const [locations, setLocations] = useState<LocationWithWeather[]>([]);
  const [loading, setLoading] = useState(false);
  const [defaultsInitialized, setDefaultsInitialized] = useState(false);

  // Check and upgrade cache version for hourly data
  useEffect(() => {
    const CACHE_VERSION = '2.1'; // Increment when API structure changes
    const currentVersion = localStorage.getItem('weatherCacheVersion');
    
    if (currentVersion !== CACHE_VERSION) {
      localStorage.removeItem('weatherCache');
      localStorage.removeItem('weatherLocations');
      localStorage.setItem('weatherCacheVersion', CACHE_VERSION);
    }
  }, []);

  // Load locations from localStorage on component mount
  useEffect(() => {
    if (defaultsInitialized) {
      return; // Prevent running multiple times
    }
    
    const savedLocations = localStorage.getItem('weatherLocations');
    if (savedLocations) {
      try {
        const parsedLocations = JSON.parse(savedLocations);
        setLocations(parsedLocations);
        setDefaultsInitialized(true);
      } catch (error) {
        console.error('Error parsing saved locations:', error);
      }
    } else {
      // Add all 9 default CIMIS stations covering major agricultural regions
      const defaultLocations = [
        { latitude: 35.205583, longitude: -118.77841, name: 'Bakersfield', weatherstation: 'Arvin-Edison', weatherstationID: '125', sortOrder: 0 },
        { latitude: 36.820833, longitude: -119.74231, name: 'Fresno', weatherstation: 'Fresno State', weatherstationID: '80', sortOrder: 1 },
        { latitude: 37.645222, longitude: -121.18776, name: 'Modesto', weatherstation: 'Modesto', weatherstationID: '71', sortOrder: 2 },
        { latitude: 39.210667, longitude: -122.16889, name: 'Colusa', weatherstation: 'Williams', weatherstationID: '250', sortOrder: 3 },
        { latitude: 38.428475, longitude: -122.41021, name: 'Napa', weatherstation: 'Oakville', weatherstationID: '77', sortOrder: 4 },
        { latitude: 36.625619, longitude: -121.537889, name: 'Salinas', weatherstation: 'Salinas South II', weatherstationID: '214', sortOrder: 5 },
        { latitude: 35.028281, longitude: -120.56003, name: 'Santa Maria', weatherstation: 'Nipomo', weatherstationID: '202', sortOrder: 6 },
        { latitude: 36.376917, longitude: -119.037972, name: 'Exeter', weatherstation: 'Lemon Cove', weatherstationID: '258', sortOrder: 7 },
        { latitude: 36.336222, longitude: -120.11291, name: 'Five Points', weatherstation: 'Five Points', weatherstationID: '2', sortOrder: 8 },
        { latitude: 36.336222, longitude: -120.11291, name: 'Elk Grove', weatherstation: 'WildHawk', weatherstationID: '273', sortOrder: 9 }
      ];
      
      // Create all locations at once with proper IDs (don't set loading initially)
      const newLocations = defaultLocations.map(loc => ({
        ...loc,
        id: generateId(),
        isFavorite: false,
        loading: false // Will be set to true when weather data is fetched
      }));
      
      setLocations(newLocations);
      setDefaultsInitialized(true);
    }
  }, [defaultsInitialized]);

  // Save locations to localStorage whenever locations change (but don't save loading states)
  useEffect(() => {
    if (locations.length > 0) {
      // Clean the locations before saving - remove loading states to prevent persistence
      const cleanedLocations = locations.map(loc => ({
        ...loc,
        loading: false, // Never persist loading state
        error: undefined // Don't persist errors
      }));
      localStorage.setItem('weatherLocations', JSON.stringify(cleanedLocations));
    }
  }, [locations]);

  // Fetch weather data only for the first location on initial load (for faster startup)
  useEffect(() => {
    if (!defaultsInitialized || locations.length === 0) return;

    // Only fetch data for the first location (the one that will be selected by default)
    const firstLocation = locations[0];
    if (firstLocation && !firstLocation.weatherData && !firstLocation.loading) {
      refreshLocationData(firstLocation.id);
    }
  }, [defaultsInitialized, locations.length]); // Only run when initialization status changes or location count changes

  const addLocation = (locationData: Omit<LocationData, 'id' | 'isFavorite'>) => {
    const newLocation: LocationWithWeather = {
      ...locationData,
      id: generateId(),
      isFavorite: false,
      sortOrder: locationData.sortOrder ?? locations.length,
      loading: true,
    };

    setLocations(prev => [...prev, newLocation]);
    
    // Fetch weather data for the new location
    refreshLocationData(newLocation.id, newLocation);
  };

  const removeLocation = (id: string) => {
    setLocations(prev => prev.filter(location => location.id !== id));
  };

  const toggleFavorite = (id: string) => {
    setLocations(prev =>
      prev.map(location =>
        location.id === id
          ? { ...location, isFavorite: !location.isFavorite }
          : location
      )
    );
  };

  const updateLocation = (id: string, updates: Partial<LocationData>) => {
    setLocations(prev =>
      prev.map(location =>
        location.id === id
          ? { ...location, ...updates }
          : location
      )
    );
  };

  const reorderLocations = (locationIds: string[]) => {
    const reorderedLocations = locationIds.map((id, index) => {
      const location = locations.find(loc => loc.id === id);
      return location ? { ...location, sortOrder: index } : null;
    }).filter(Boolean) as LocationWithWeather[];

    // Add any locations that weren't in the reorder list
    const reorderedIds = new Set(locationIds);
    const remainingLocations = locations
      .filter(loc => !reorderedIds.has(loc.id))
      .map((loc, index) => ({ ...loc, sortOrder: locationIds.length + index }));

    const finalLocations = [...reorderedLocations, ...remainingLocations]
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

    setLocations(finalLocations);
  };

  const refreshLocationData = async (id: string, locationData?: LocationWithWeather) => {
    const location = locationData || locations.find(loc => loc.id === id);
    if (!location) return;

    setLocations(prev =>
      prev.map(loc =>
        loc.id === id
          ? { ...loc, loading: true, error: undefined }
          : loc
      )
    );

    try {
      const weatherData = await weatherService.getWeatherData(location);

      setLocations(prev =>
        prev.map(loc =>
          loc.id === id
            ? {
                ...loc,
                weatherData,
                loading: false,
                error: undefined,
                lastUpdated: new Date().toISOString()
              }
            : loc
        )
      );
    } catch (error) {
      setLocations(prev =>
        prev.map(loc =>
          loc.id === id
            ? {
                ...loc,
                loading: false,
                error: error instanceof Error ? error.message : 'Failed to fetch weather data'
              }
            : loc
        )
      );
    }
  };

  const refreshLocation = (id: string) => {
    refreshLocationData(id);
  };

  const refreshAllLocations = async () => {
    setLoading(true);
    
    // Refresh locations sequentially with delay to avoid rate limiting
    for (let i = 0; i < locations.length; i++) {
      try {
        await refreshLocationData(locations[i].id);
        // Add 5 second delay between requests to avoid rate limiting (safe for 9+ locations)
        if (i < locations.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      } catch (error) {
        console.error(`Failed to refresh location ${locations[i].name}:`, error);
      }
    }
    
    setLoading(false);
  };

  const favorites = locations.filter(location => location.isFavorite);

  return (
    <LocationsContext.Provider
      value={{
        locations,
        favorites,
        addLocation,
        removeLocation,
        toggleFavorite,
        updateLocation,
        reorderLocations,
        refreshLocation,
        refreshAllLocations,
        loading,
      }}
    >
      {children}
    </LocationsContext.Provider>
  );
};