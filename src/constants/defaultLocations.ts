// Default California locations for quick setup
export interface DefaultLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

export const DEFAULT_CALIFORNIA_LOCATIONS: DefaultLocation[] = [
  {
    id: 'los-angeles-ca',
    name: 'Los Angeles, CA',
    latitude: 34.0522,
    longitude: -118.2437
  },
  {
    id: 'san-francisco-ca',
    name: 'San Francisco, CA',
    latitude: 37.7749,
    longitude: -122.4194
  },
  {
    id: 'san-diego-ca',
    name: 'San Diego, CA',
    latitude: 32.7157,
    longitude: -117.1611
  },
  {
    id: 'sacramento-ca',
    name: 'Sacramento, CA',
    latitude: 38.5816,
    longitude: -121.4944
  },
  {
    id: 'fresno-ca',
    name: 'Fresno, CA',
    latitude: 36.7378,
    longitude: -119.7871
  },
  {
    id: 'bakersfield-ca',
    name: 'Bakersfield, CA',
    latitude: 35.3733,
    longitude: -119.0187
  },
  {
    id: 'modesto-ca',
    name: 'Modesto, CA',
    latitude: 37.6391,
    longitude: -120.9969
  },
  {
    id: 'stockton-ca',
    name: 'Stockton, CA',
    latitude: 37.9577,
    longitude: -121.2908
  },
  {
    id: 'salinas-ca',
    name: 'Salinas, CA',
    latitude: 36.6777,
    longitude: -121.6555
  },
  {
    id: 'riverside-ca',
    name: 'Riverside, CA',
    latitude: 33.9533,
    longitude: -117.3962
  },
  {
    id: 'anaheim-ca',
    name: 'Anaheim, CA',
    latitude: 33.8366,
    longitude: -117.9143
  },
  {
    id: 'oakland-ca',
    name: 'Oakland, CA',
    latitude: 37.8044,
    longitude: -122.2712
  }
];