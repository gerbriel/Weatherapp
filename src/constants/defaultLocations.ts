// Default California locations for quick setup
export interface DefaultLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

export const DEFAULT_CALIFORNIA_LOCATIONS: DefaultLocation[] = [
  {
    id: 'cimis-125',
    name: 'Bakersfield - Arvin-Edison (CIMIS #125)',
    latitude: 35.205583,
    longitude: -118.77841
  },
  {
    id: 'cimis-80',
    name: 'Fresno - Fresno State (CIMIS #80)',
    latitude: 36.820833,
    longitude: -119.74231
  },
  {
    id: 'cimis-71',
    name: 'Modesto - Modesto (CIMIS #71)',
    latitude: 37.645222,
    longitude: -121.18776
  },
  {
    id: 'cimis-250',
    name: 'Colusa - Williams (CIMIS #250)',
    latitude: 39.210667,
    longitude: -122.16889
  },
  {
    id: 'cimis-77',
    name: 'Napa - Oakville (CIMIS #77)',
    latitude: 38.428475,
    longitude: -122.41021
  },
  {
    id: 'cimis-214',
    name: 'Salinas - Salinas South II (CIMIS #214)',
    latitude: 36.625619,
    longitude: -121.537889
  },
  {
    id: 'cimis-202',
    name: 'Santa Maria - Nipomo (CIMIS #202)',
    latitude: 35.028281,
    longitude: -120.56003
  },
  {
    id: 'cimis-258',
    name: 'Exeter - Lemon Cove (CIMIS #258)',
    latitude: 36.376917,
    longitude: -119.037972
  },
  {
    id: 'cimis-2',
    name: 'Five Points - Five Points (CIMIS #2)',
    latitude: 36.336222,
    longitude: -120.11291
  }
];