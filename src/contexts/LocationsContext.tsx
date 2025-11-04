import React, { createContext, useContext, useEffect, useState } from 'react';
import type { LocationData, LocationWithWeather } from '../types/weather';
import { weatherService } from '../services/weatherService';

interface LocationsContextType {
  locations: LocationWithWeather[];
  favorites: LocationWithWeather[];
  addLocation: (location: Omit<LocationData, 'id' | 'isFavorite'>) => void;
  removeLocation: (id: string) => void;
  toggleFavorite: (id: string) => void;
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

interface LocationsProviderProps {
  children: React.ReactNode;
}

export const LocationsProvider: React.FC<LocationsProviderProps> = ({ children }) => {
  const [locations, setLocations] = useState<LocationWithWeather[]>([]);
  const [loading, setLoading] = useState(false);

  // Load locations from localStorage on component mount
  useEffect(() => {
    const savedLocations = localStorage.getItem('weatherLocations');
    if (savedLocations) {
      try {
        const parsedLocations = JSON.parse(savedLocations);
        setLocations(parsedLocations);
      } catch (error) {
        console.error('Error parsing saved locations:', error);
      }
    } else {
      // Add default location if none saved - matching the user's previous setup
      addLocation({
        latitude: 35.1975,
        longitude: -118.7906,
        name: 'Arvin, California'
      });
    }
  }, []);

  // Save locations to localStorage whenever locations change
  useEffect(() => {
    if (locations.length > 0) {
      localStorage.setItem('weatherLocations', JSON.stringify(locations));
    }
  }, [locations]);

  const generateId = () => {
    // Generate a UUID v4 compatible string
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const addLocation = (locationData: Omit<LocationData, 'id' | 'isFavorite'>) => {
    const newLocation: LocationWithWeather = {
      ...locationData,
      id: generateId(),
      isFavorite: false,
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
        refreshLocation,
        refreshAllLocations,
        loading,
      }}
    >
      {children}
    </LocationsContext.Provider>
  );
};