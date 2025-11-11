// Default California locations for quick setup
export interface DefaultLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

export const DEFAULT_CALIFORNIA_LOCATIONS: DefaultLocation[] = [
  {
    id: 'trial-cimis-125',
    name: 'Castroville Agricultural Station (CIMIS #125)',
    latitude: 36.7650,
    longitude: -121.7569
  },
  {
    id: 'trial-cimis-80',
    name: 'Fresno State University (CIMIS #80)',
    latitude: 36.8175,
    longitude: -119.7417
  },
  {
    id: 'trial-cimis-71',
    name: 'Manteca Farm Station (CIMIS #71)',
    latitude: 37.7633,
    longitude: -121.2158
  },
  {
    id: 'trial-cimis-250',
    name: 'Buttonwillow Agricultural Station (CIMIS #250)',
    latitude: 35.3986,
    longitude: -119.4692
  },
  {
    id: 'trial-cimis-77',
    name: 'Oakville Vineyard Station (CIMIS #77)',
    latitude: 38.4321,
    longitude: -122.4106
  },
  {
    id: 'trial-cimis-214',
    name: 'Torrey Pines Coastal Station (CIMIS #214)',
    latitude: 32.8831,
    longitude: -117.2419
  },
  {
    id: 'trial-cimis-202',
    name: 'Atwater Research Station (CIMIS #202)',
    latitude: 37.3472,
    longitude: -120.5878
  },
  {
    id: 'trial-cimis-258',
    name: 'Temecula Valley Station (CIMIS #258)',
    latitude: 33.4833,
    longitude: -117.1400
  },
  {
    id: 'trial-cimis-2',
    name: 'Five Points Agricultural Station (CIMIS #2)',
    latitude: 36.3350,
    longitude: -120.1058
  }
];