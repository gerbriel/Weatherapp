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
  },
  {
    id: 'trial-cimis-250',
    name: 'Buttonwillow',
    latitude: 35.3986,
    longitude: -119.4692,
    state: 'California',
    region: 'Kern County',
    cimisStationId: '250'
  },
  {
    id: 'trial-cimis-77',
    name: 'Oakville',
    latitude: 38.4321,
    longitude: -122.4106,
    state: 'California',
    region: 'Napa County',
    cimisStationId: '77'
  },
  {
    id: 'trial-cimis-214',
    name: 'Torrey Pines',
    latitude: 32.8831,
    longitude: -117.2419,
    state: 'California',
    region: 'San Diego County',
    cimisStationId: '214'
  },
  {
    id: 'trial-cimis-202',
    name: 'Atwater',
    latitude: 37.3472,
    longitude: -120.5878,
    state: 'California',
    region: 'Merced County',
    cimisStationId: '202'
  },
  {
    id: 'trial-cimis-258',
    name: 'Temecula',
    latitude: 33.4833,
    longitude: -117.1400,
    state: 'California',
    region: 'Riverside County',
    cimisStationId: '258'
  },
  {
    id: 'trial-cimis-2',
    name: 'Five Points',
    latitude: 36.3350,
    longitude: -120.1058,
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