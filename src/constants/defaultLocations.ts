// Default California locations for quick setup
export interface DefaultLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

export const DEFAULT_CALIFORNIA_LOCATIONS: DefaultLocation[] = [
  {
    id: 'arvin-ca',
    name: 'Arvin, California',
    latitude: 35.1975,
    longitude: -118.7906
  },
  {
    id: 'fresno-ca',
    name: 'Fresno, California',
    latitude: 36.8122,
    longitude: -119.7515
  },
  {
    id: 'twin-rivers-ca',
    name: 'Twin Rivers, California',
    latitude: 37.638,
    longitude: -121.1693
  },
  {
    id: 'cortena-ca',
    name: 'Cortena, California',
    latitude: 39.2143,
    longitude: -122.1738
  },
  {
    id: 'oakville-ca',
    name: 'Oakville, California',
    latitude: 38.4377,
    longitude: -122.4016
  },
  {
    id: 'salinas-ca',
    name: 'Salinas, California',
    latitude: 36.6394,
    longitude: -121.5372
  },
  {
    id: 'callender-ca',
    name: 'Callender, California',
    latitude: 35.0334,
    longitude: -120.5721
  }
];