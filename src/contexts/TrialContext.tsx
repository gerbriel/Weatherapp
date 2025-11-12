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
// Reduced to 3 locations to avoid API rate limiting
const DEFAULT_CA_LOCATIONS: TrialLocation[] = [
  {
    id: 'trial-cimis-125',
    name: 'Castroville',
    latitude: 36.7650,
    longitude: -121.7569,
    state: 'California',
    region: 'Monterey County',
    cimisStationId: '125'
  },
  {
    id: 'trial-cimis-80',
    name: 'Fresno State',
    latitude: 36.8175,
    longitude: -119.7417,
    state: 'California',
    region: 'Fresno County',
    cimisStationId: '80'
  },
  {
    id: 'trial-cimis-71',
    name: 'Manteca',
    latitude: 37.7633,
    longitude: -121.2158,
    state: 'California',
    region: 'San Joaquin County',
    cimisStationId: '71'
  }
];

export const TrialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isTrialMode, setIsTrialMode] = useState(false);
  const [trialLocations, setTrialLocations] = useState<TrialLocation[]>(() => {
    // Force DEFAULT_CA_LOCATIONS for now to show CIMIS stations
    return DEFAULT_CA_LOCATIONS;
  });

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