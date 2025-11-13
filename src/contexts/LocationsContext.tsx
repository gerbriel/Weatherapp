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
      // Add only 3 default CIMIS stations for trial users to avoid API rate limiting
      const defaultLocations = [
        { latitude: 36.7650, longitude: -121.7569, name: 'Castroville', weatherstation: 'Castroville', weatherstationID: '125', sortOrder: 0 },
        { latitude: 36.8175, longitude: -119.7417, name: 'Fresno State', weatherstation: 'Fresno State', weatherstationID: '80', sortOrder: 1 },
        { latitude: 37.7633, longitude: -121.2158, name: 'Manteca', weatherstation: 'Manteca', weatherstationID: '71', sortOrder: 2 }
      ];
      
      // Create all locations at once with proper IDs
      const newLocations = defaultLocations.map(loc => ({
        ...loc,
        id: generateId(),
        isFavorite: false,
        loading: true
      }));
      
      setLocations(newLocations);
      setDefaultsInitialized(true);
    }
  }, [defaultsInitialized]);

  // Save locations to localStorage whenever locations change
  useEffect(() => {
    if (locations.length > 0) {
      localStorage.setItem('weatherLocations', JSON.stringify(locations));
    }
  }, [locations]);

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
        // Add 1 second delay between requests to avoid rate limiting
        if (i < locations.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
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