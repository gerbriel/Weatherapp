import React, { createContext, useContext, useState, useEffect } from 'react';

interface TrialLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  state: string;
  region: string;
  cimisStationId?: string; // Optional CIMIS station ID for trial locations
}

interface TrialContextType {
  isTrialMode: boolean;
  trialLocations: TrialLocation[];
  enableTrialMode: () => void;
  disableTrialMode: () => void;
  addLocation: (location: Omit<TrialLocation, 'id'>) => void;
  removeLocation: (id: string) => void;
  updateLocation: (id: string, updates: Partial<TrialLocation>) => void;
}

const TrialContext = createContext<TrialContextType | undefined>(undefined);

// Default California locations for trial - Specific CIMIS Stations
// All 9 major agricultural weather stations
const DEFAULT_CA_LOCATIONS: TrialLocation[] = [
  {
    id: 'trial-cimis-125',
    name: 'Bakersfield',
    latitude: 35.205583,
    longitude: -118.77841,
    state: 'California',
    region: 'Kern County',
    cimisStationId: '125'
  },
  {
    id: 'trial-cimis-80',
    name: 'Fresno',
    latitude: 36.820833,
    longitude: -119.74231,
    state: 'California',
    region: 'Fresno County',
    cimisStationId: '80'
  },
  {
    id: 'trial-cimis-71',
    name: 'Modesto',
    latitude: 37.645222,
    longitude: -121.18776,
    state: 'California',
    region: 'Stanislaus County',
    cimisStationId: '71'
  },
  {
    id: 'trial-cimis-250',
    name: 'Colusa',
    latitude: 39.210667,
    longitude: -122.16889,
    state: 'California',
    region: 'Colusa County',
    cimisStationId: '250'
  },
  {
    id: 'trial-cimis-77',
    name: 'Napa',
    latitude: 38.428475,
    longitude: -122.41021,
    state: 'California',
    region: 'Napa County',
    cimisStationId: '77'
  },
  {
    id: 'trial-cimis-214',
    name: 'Salinas',
    latitude: 36.625619,
    longitude: -121.537889,
    state: 'California',
    region: 'Monterey County',
    cimisStationId: '214'
  },
  {
    id: 'trial-cimis-202',
    name: 'Santa Maria',
    latitude: 35.028281,
    longitude: -120.56003,
    state: 'California',
    region: 'San Luis Obispo County',
    cimisStationId: '202'
  },
  {
    id: 'trial-cimis-258',
    name: 'Exeter',
    latitude: 36.376917,
    longitude: -119.037972,
    state: 'California',
    region: 'Tulare County',
    cimisStationId: '258'
  },
  {
    id: 'trial-cimis-2',
    name: 'Five Points',
    latitude: 36.336222,
    longitude: -120.11291,
    state: 'California',
    region: 'Fresno County',
    cimisStationId: '2'
  }
];

export const TrialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isTrialMode, setIsTrialMode] = useState(false);
  const [trialLocations, setTrialLocations] = useState<TrialLocation[]>(() => {
    // Force DEFAULT_CA_LOCATIONS for now to show CIMIS stations
    return DEFAULT_CA_LOCATIONS;
  });

  // Check and upgrade cache version for hourly data
  useEffect(() => {
    const CACHE_VERSION = '2.1'; // Increment when API structure changes
    const currentVersion = localStorage.getItem('weatherCacheVersion');
    
    if (currentVersion !== CACHE_VERSION) {
      console.log('Upgrading weather cache to include hourly data...');
      localStorage.removeItem('weatherCache');
      localStorage.setItem('weatherCacheVersion', CACHE_VERSION);
    }
  }, []);

  // Check for trial mode in localStorage on mount
  useEffect(() => {
    const savedTrialMode = localStorage.getItem('etweather_trial_mode');
    if (savedTrialMode === 'true') {
      setIsTrialMode(true);
    }
  }, []);

  // Save locations to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('etweather_trial_locations', JSON.stringify(trialLocations));
  }, [trialLocations]);

  const enableTrialMode = () => {
    setIsTrialMode(true);
    localStorage.setItem('etweather_trial_mode', 'true');
  };

  const disableTrialMode = () => {
    setIsTrialMode(false);
    localStorage.removeItem('etweather_trial_mode');
  };

  const addLocation = (locationData: Omit<TrialLocation, 'id'>) => {
    const newLocation: TrialLocation = {
      ...locationData,
      id: `trial-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    setTrialLocations(prev => [...prev, newLocation]);
  };

  const removeLocation = (id: string) => {
    setTrialLocations(prev => prev.filter(loc => loc.id !== id));
  };

  const updateLocation = (id: string, updates: Partial<TrialLocation>) => {
    setTrialLocations(prev => 
      prev.map(loc => loc.id === id ? { ...loc, ...updates } : loc)
    );
  };

  return (
    <TrialContext.Provider value={{
      isTrialMode,
      trialLocations,
      enableTrialMode,
      disableTrialMode,
      addLocation,
      removeLocation,
      updateLocation
    }}>
      {children}
    </TrialContext.Provider>
  );
};

export const useTrial = () => {
  const context = useContext(TrialContext);
  if (context === undefined) {
    throw new Error('useTrial must be used within a TrialProvider');
  }
  return context;
};