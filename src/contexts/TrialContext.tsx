import React, { createContext, useContext, useState, useEffect } from 'react';

interface TrialLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  state: string;
  region: string;
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

// Default California locations for trial
const DEFAULT_CA_LOCATIONS: TrialLocation[] = [
  {
    id: 'trial-fresno',
    name: 'Fresno, CA',
    latitude: 36.7378,
    longitude: -119.7871,
    state: 'California',
    region: 'Central Valley'
  },
  {
    id: 'trial-salinas',
    name: 'Salinas, CA',
    latitude: 36.6777,
    longitude: -121.6555,
    state: 'California',
    region: 'Salinas Valley'
  },
  {
    id: 'trial-bakersfield',
    name: 'Bakersfield, CA',
    latitude: 35.3733,
    longitude: -119.0187,
    state: 'California',
    region: 'San Joaquin Valley'
  },
  {
    id: 'trial-modesto',
    name: 'Modesto, CA',
    latitude: 37.6391,
    longitude: -120.9969,
    state: 'California',
    region: 'Central Valley'
  },
  {
    id: 'trial-stockton',
    name: 'Stockton, CA',
    latitude: 37.9577,
    longitude: -121.2908,
    state: 'California',
    region: 'San Joaquin Valley'
  }
];

export const TrialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isTrialMode, setIsTrialMode] = useState(false);
  const [trialLocations, setTrialLocations] = useState<TrialLocation[]>(() => {
    // Load locations from localStorage or use defaults
    const savedLocations = localStorage.getItem('etweather_trial_locations');
    if (savedLocations) {
      try {
        return JSON.parse(savedLocations);
      } catch (error) {
        console.error('Error parsing saved locations:', error);
      }
    }
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