// Default California locations for quick setup
export interface DefaultLocation {
  id: string;
  name: string;
  weatherstation?: string;
  weatherstationID?: string;
  cimisStationId?: string;
  region?: string;
  state?: string;
  latitude: number;
  longitude: number;
}

export const DEFAULT_CALIFORNIA_LOCATIONS: DefaultLocation[] = [
  {
    id: 'cimis-125',
    name: 'Bakersfield',
    weatherstation: 'Arvin-Edison',
    weatherstationID: '125',
    cimisStationId: '125',
    region: 'Bakersfield Area',
    state: 'CA',
    latitude: 35.205583,
    longitude: -118.77841
  },
  {
    id: 'cimis-80',
    name: 'Fresno',
    weatherstation: 'Fresno State',
    weatherstationID: '80',
    cimisStationId: '80',
    region: 'Fresno Area',
    state: 'CA',
    latitude: 36.820833,
    longitude: -119.74231
  },
  {
    id: 'cimis-71',
    name: 'Modesto',
    weatherstation: 'Modesto',
    weatherstationID: '71',
    cimisStationId: '71',
    region: 'Modesto Area',
    state: 'CA',
    latitude: 37.645222,
    longitude: -121.18776
  },
  {
    id: 'cimis-250',
    name: 'Colusa',
    weatherstation: 'Williams',
    weatherstationID: '250',
    cimisStationId: '250',
    region: 'Colusa Area',
    state: 'CA',
    latitude: 39.210667,
    longitude: -122.16889
  },
  {
    id: 'cimis-77',
    name: 'Napa',
    weatherstation: 'Oakville',
    weatherstationID: '77',
    cimisStationId: '77',
    region: 'Napa Area',
    state: 'CA',
    latitude: 38.428475,
    longitude: -122.41021
  },
  {
    id: 'cimis-214',
    name: 'Salinas',
    weatherstation: 'Salinas South II',
    weatherstationID: '214',
    latitude: 36.625619,
    longitude: -121.537889
  },
  {
    id: 'cimis-202',
    name: 'Santa Maria',
    weatherstation: 'Nipomo',
    weatherstationID: '202',
    latitude: 35.028281,
    longitude: -120.56003
  },
  {
    id: 'cimis-258',
    name: 'Exeter',
    weatherstation: 'Lemon Cove',
    weatherstationID: '258',
    latitude: 36.376917,
    longitude: -119.037972
  },
  {
    id: 'cimis-2',
    name: 'Five Points',
    weatherstation: 'Five Points',
    weatherstationID: '2',
    latitude: 36.336222,
    longitude: -120.11291
  }
];