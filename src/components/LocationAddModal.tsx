import React, { useState } from 'react';
import { MapPin, Plus, Search, X, Droplets, ChevronDown, ChevronRight, PenLine, CheckSquare, Square, Heart } from 'lucide-react';
import { useTrial } from '../contexts/TrialContext';
import { DEFAULT_CALIFORNIA_LOCATIONS } from '../constants/defaultLocations';

interface LocationFormData {
  name: string;
  latitude: number | '';
  longitude: number | '';
  state: string;
  region: string;
  weatherstation?: string;
  weatherstationID?: string;
}

interface LocationFormErrors {
  name?: string;
  latitude?: string;
  longitude?: string;
  state?: string;
  region?: string;
}

interface LocationAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called with bulk-selected stations; parent owns the actual addLocation calls */
  onBulkAdd?: (stations: typeof DEFAULT_CALIFORNIA_LOCATIONS) => void;
  existingLocationNames?: string[];
  /** CIMIS station IDs currently pinned as defaults (shown with solid heart) */
  defaultStationIds?: Set<string>;
  /** Called when user clicks the heart on a station row — parent persists the change */
  onToggleDefault?: (cimisStationId: string) => void;
}

// All active CIMIS stations — from https://et.water.ca.gov/api/station
const CIMIS_STATIONS = [
  // Northern California
  { id: '43', name: 'McArthur', county: 'Shasta County', latitude: 41.063767, longitude: -121.45602, region: 'Northern California' },
  { id: '90', name: 'Alturas', county: 'Modoc County', latitude: 41.438214, longitude: -120.48031, region: 'Northern California' },
  { id: '91', name: 'Tulelake FS', county: 'Siskiyou County', latitude: 41.958869, longitude: -121.47237, region: 'Northern California' },
  { id: '222', name: 'Gerber South', county: 'Tehama County', latitude: 40.040006, longitude: -122.154539, region: 'Northern California' },
  { id: '224', name: 'Shasta College', county: 'Shasta County', latitude: 40.63, longitude: -122.31, region: 'Northern California' },
  { id: '225', name: 'Scott Valley', county: 'Siskiyou County', latitude: 41.577778, longitude: -122.838125, region: 'Northern California' },
  { id: '236', name: 'Macdoel II', county: 'Siskiyou County', latitude: 41.802476, longitude: -121.996159, region: 'Northern California' },
  { id: '244', name: 'Biggs', county: 'Butte County', latitude: 39.386632, longitude: -121.835278, region: 'Northern California' },
  { id: '250', name: 'Williams', county: 'Colusa County', latitude: 39.210667, longitude: -122.168889, region: 'Northern California' },
  { id: '259', name: 'Ferndale Plain', county: 'Humboldt County', latitude: 40.604467, longitude: -124.243186, region: 'Northern California' },
  { id: '260', name: 'Montague', county: 'Siskiyou County', latitude: 41.798331, longitude: -122.463425, region: 'Northern California' },
  { id: '261', name: 'Gazelle', county: 'Siskiyou County', latitude: 41.533989, longitude: -122.532279, region: 'Northern California' },
  { id: '263', name: 'Smith River', county: 'Del Norte County', latitude: 41.894592, longitude: -124.165043, region: 'Northern California' },
  { id: '264', name: 'Sierra Valley Center', county: 'Plumas County', latitude: 39.777452, longitude: -120.273609, region: 'Northern California' },
  { id: '267', name: 'Johnstonville', county: 'Lassen County', latitude: 40.364578, longitude: -120.559397, region: 'Northern California' },
  { id: '268', name: 'Nubieber', county: 'Lassen County', latitude: 41.105901, longitude: -121.165701, region: 'Northern California' },
  { id: '272', name: 'Anderson', county: 'Shasta County', latitude: 40.434911, longitude: -122.247425, region: 'Northern California' },
  // Central California (North)
  { id: '6', name: 'Davis', county: 'Yolo County', latitude: 38.535694, longitude: -121.77636, region: 'Central California (North)' },
  { id: '13', name: 'Camino', county: 'El Dorado County', latitude: 38.753136, longitude: -120.7336, region: 'Central California (North)' },
  { id: '47', name: 'Brentwood', county: 'Contra Costa County', latitude: 37.928258, longitude: -121.6599, region: 'Central California (North)' },
  { id: '70', name: 'Manteca', county: 'San Joaquin County', latitude: 37.834822, longitude: -121.22319, region: 'Central California (North)' },
  { id: '77', name: 'Oakville', county: 'Napa County', latitude: 38.428475, longitude: -122.41021, region: 'Central California (North)' },
  { id: '83', name: 'Santa Rosa', county: 'Sonoma County', latitude: 38.40355, longitude: -122.79993, region: 'Central California (North)' },
  { id: '84', name: 'Browns Valley', county: 'Yuba County', latitude: 39.252561, longitude: -121.31567, region: 'Central California (North)' },
  { id: '103', name: 'Windsor', county: 'Sonoma County', latitude: 38.52665, longitude: -122.813758, region: 'Central California (North)' },
  { id: '106', name: 'Sanel Valley', county: 'Mendocino County', latitude: 38.982581, longitude: -123.08928, region: 'Central California (North)' },
  { id: '131', name: 'Fair Oaks', county: 'Sacramento County', latitude: 38.649964, longitude: -121.21887, region: 'Central California (North)' },
  { id: '139', name: 'Winters', county: 'Solano County', latitude: 38.501258, longitude: -121.97853, region: 'Central California (North)' },
  { id: '140', name: 'Twitchell Island', county: 'Sacramento County', latitude: 38.121739, longitude: -121.674455, region: 'Central California (North)' },
  { id: '144', name: 'Petaluma East', county: 'Sonoma County', latitude: 38.266428, longitude: -122.61646, region: 'Central California (North)' },
  { id: '157', name: 'Point San Pedro', county: 'Marin County', latitude: 37.995478, longitude: -122.467656, region: 'Central California (North)' },
  { id: '158', name: 'Bennett Valley', county: 'Sonoma County', latitude: 38.419439, longitude: -122.65872, region: 'Central California (North)' },
  { id: '170', name: 'Concord', county: 'Contra Costa County', latitude: 38.015372, longitude: -122.02028, region: 'Central California (North)' },
  { id: '171', name: 'Union City', county: 'Alameda County', latitude: 37.598758, longitude: -122.05323, region: 'Central California (North)' },
  { id: '178', name: 'Moraga', county: 'Contra Costa County', latitude: 37.837614, longitude: -122.14074, region: 'Central California (North)' },
  { id: '187', name: 'Black Point', county: 'Marin County', latitude: 38.090933, longitude: -122.5267, region: 'Central California (North)' },
  { id: '191', name: 'Pleasanton', county: 'Alameda County', latitude: 37.663969, longitude: -121.88503, region: 'Central California (North)' },
  { id: '195', name: 'Auburn', county: 'Placer County', latitude: 38.887603, longitude: -121.10291, region: 'Central California (North)' },
  { id: '211', name: 'Gilroy', county: 'Santa Clara County', latitude: 37.015026, longitude: -121.53704, region: 'Central California (North)' },
  { id: '212', name: 'Hastings Tract East', county: 'Solano County', latitude: 38.278056, longitude: -121.74111, region: 'Central California (North)' },
  { id: '213', name: 'El Cerrito', county: 'Contra Costa County', latitude: 37.931539, longitude: -122.302714, region: 'Central California (North)' },
  { id: '226', name: 'Woodland', county: 'Yolo County', latitude: 38.672722, longitude: -121.81172, region: 'Central California (North)' },
  { id: '227', name: 'Plymouth', county: 'Amador County', latitude: 38.508333, longitude: -120.79972, region: 'Central California (North)' },
  { id: '228', name: 'Diamond Springs', county: 'El Dorado County', latitude: 38.636111, longitude: -120.79305, region: 'Central California (North)' },
  { id: '235', name: 'Verona', county: 'Sutter County', latitude: 38.797944, longitude: -121.61136, region: 'Central California (North)' },
  { id: '242', name: 'Staten Island', county: 'San Joaquin County', latitude: 38.192397, longitude: -121.510261, region: 'Central California (North)' },
  { id: '243', name: 'Ryde', county: 'Sacramento County', latitude: 38.249622, longitude: -121.555528, region: 'Central California (North)' },
  { id: '246', name: 'Markleeville', county: 'Alpine County', latitude: 38.773409, longitude: -119.79193, region: 'Central California (North)' },
  { id: '247', name: 'Jersey Island', county: 'Contra Costa County', latitude: 38.033386, longitude: -121.701247, region: 'Central California (North)' },
  { id: '248', name: 'Holt', county: 'San Joaquin County', latitude: 37.932072, longitude: -121.396661, region: 'Central California (North)' },
  { id: '249', name: 'Ripon', county: 'San Joaquin County', latitude: 37.755597, longitude: -121.266153, region: 'Central California (North)' },
  { id: '253', name: 'Pescadero', county: 'San Mateo County', latitude: 37.255333, longitude: -122.3708, region: 'Central California (North)' },
  { id: '254', name: 'Oakland Metro', county: 'Alameda County', latitude: 37.718167, longitude: -122.197111, region: 'Central California (North)' },
  { id: '262', name: 'Linden', county: 'San Joaquin County', latitude: 38.065692, longitude: -121.071747, region: 'Central California (North)' },
  { id: '273', name: 'WildHawk', county: 'Sacramento County', latitude: 38.479722, longitude: -121.314722, region: 'Central California (North)' },
  // Central California (South)
  { id: '2', name: 'FivePoints', county: 'Fresno County', latitude: 36.336222, longitude: -120.11291, region: 'Central California (South)' },
  { id: '5', name: 'Shafter', county: 'Kern County', latitude: 35.532556, longitude: -119.28179, region: 'Central California (South)' },
  { id: '7', name: 'Firebaugh/Telles', county: 'Fresno County', latitude: 36.851222, longitude: -120.59092, region: 'Central California (South)' },
  { id: '15', name: 'Stratford', county: 'Kings County', latitude: 36.157972, longitude: -119.85143, region: 'Central California (South)' },
  { id: '39', name: 'Parlier', county: 'Fresno County', latitude: 36.597444, longitude: -119.50404, region: 'Central California (South)' },
  { id: '71', name: 'Modesto', county: 'Stanislaus County', latitude: 37.645222, longitude: -121.18776, region: 'Central California (South)' },
  { id: '80', name: 'Fresno State', county: 'Fresno County', latitude: 36.820833, longitude: -119.74231, region: 'Central California (South)' },
  { id: '104', name: 'De Laveaga', county: 'Santa Cruz County', latitude: 36.997444, longitude: -121.99676, region: 'Central California (South)' },
  { id: '105', name: 'Westlands', county: 'Fresno County', latitude: 36.634028, longitude: -120.38181, region: 'Central California (South)' },
  { id: '113', name: 'King City-Oasis Rd.', county: 'Monterey County', latitude: 36.121083, longitude: -121.08457, region: 'Central California (South)' },
  { id: '114', name: 'Arroyo Seco', county: 'Monterey County', latitude: 36.347306, longitude: -121.29135, region: 'Central California (South)' },
  { id: '116', name: 'Salinas North', county: 'Monterey County', latitude: 36.716806, longitude: -121.69189, region: 'Central California (South)' },
  { id: '124', name: 'Panoche', county: 'Fresno County', latitude: 36.890056, longitude: -120.73141, region: 'Central California (South)' },
  { id: '125', name: 'Arvin-Edison', county: 'Kern County', latitude: 35.205583, longitude: -118.77841, region: 'Central California (South)' },
  { id: '126', name: 'San Benito', county: 'San Benito County', latitude: 36.854833, longitude: -121.36275, region: 'Central California (South)' },
  { id: '129', name: 'Pajaro', county: 'Monterey County', latitude: 36.902778, longitude: -121.74193, region: 'Central California (South)' },
  { id: '143', name: 'San Juan Valley', county: 'San Benito County', latitude: 36.822861, longitude: -121.46787, region: 'Central California (South)' },
  { id: '146', name: 'Belridge', county: 'Kern County', latitude: 35.505833, longitude: -119.69114, region: 'Central California (South)' },
  { id: '182', name: 'Delano', county: 'Tulare County', latitude: 35.833, longitude: -119.25596, region: 'Central California (South)' },
  { id: '193', name: 'Pacific Grove', county: 'Monterey County', latitude: 36.633222, longitude: -121.93486, region: 'Central California (South)' },
  { id: '194', name: 'Oakdale', county: 'Stanislaus County', latitude: 37.727194, longitude: -120.85086, region: 'Central California (South)' },
  { id: '205', name: 'Coalinga', county: 'Fresno County', latitude: 36.175833, longitude: -120.36027, region: 'Central California (South)' },
  { id: '206', name: 'Denair II', county: 'Stanislaus County', latitude: 37.545869, longitude: -120.75453, region: 'Central California (South)' },
  { id: '209', name: 'Watsonville West II', county: 'Santa Cruz County', latitude: 36.913083, longitude: -121.82365, region: 'Central California (South)' },
  { id: '210', name: 'Carmel', county: 'Monterey County', latitude: 36.540889, longitude: -121.88196, region: 'Central California (South)' },
  { id: '214', name: 'Salinas South II', county: 'Monterey County', latitude: 36.625619, longitude: -121.537889, region: 'Central California (South)' },
  { id: '229', name: 'Laguna Seca', county: 'Monterey County', latitude: 36.570111, longitude: -121.7865, region: 'Central California (South)' },
  { id: '252', name: 'Soledad II', county: 'Monterey County', latitude: 36.456728, longitude: -121.344388, region: 'Central California (South)' },
  { id: '258', name: 'Lemon Cove', county: 'Tulare County', latitude: 36.376917, longitude: -119.037972, region: 'Central California (South)' },
  { id: '269', name: 'Los Banos II', county: 'Merced County', latitude: 37.108935, longitude: -120.797387, region: 'Central California (South)' },
  { id: '270', name: 'COS Tulare', county: 'Tulare County', latitude: 36.189399, longitude: -119.285207, region: 'Central California (South)' },
  // Southern California
  { id: '35', name: 'Bishop', county: 'Inyo County', latitude: 37.358514, longitude: -118.40553, region: 'Southern California' },
  { id: '41', name: 'Calipatria/Mulberry', county: 'Imperial County', latitude: 33.042986, longitude: -115.41585, region: 'Southern California' },
  { id: '44', name: 'U.C. Riverside', county: 'Riverside County', latitude: 33.964942, longitude: -117.33698, region: 'Southern California' },
  { id: '52', name: 'San Luis Obispo', county: 'San Luis Obispo County', latitude: 35.305442, longitude: -120.66178, region: 'Southern California' },
  { id: '64', name: 'Santa Ynez', county: 'Santa Barbara County', latitude: 34.583144, longitude: -120.07924, region: 'Southern California' },
  { id: '75', name: 'Irvine', county: 'Orange County', latitude: 33.68845, longitude: -117.72118, region: 'Southern California' },
  { id: '78', name: 'Pomona', county: 'Los Angeles County', latitude: 34.056589, longitude: -117.81307, region: 'Southern California' },
  { id: '87', name: 'Meloland', county: 'Imperial County', latitude: 32.806183, longitude: -115.44626, region: 'Southern California' },
  { id: '88', name: 'Cuyama', county: 'Santa Barbara County', latitude: 34.942525, longitude: -119.6738, region: 'Southern California' },
  { id: '99', name: 'Santa Monica', county: 'Los Angeles County', latitude: 34.044311, longitude: -118.47689, region: 'Southern California' },
  { id: '107', name: 'Santa Barbara', county: 'Santa Barbara County', latitude: 34.437353, longitude: -119.73742, region: 'Southern California' },
  { id: '117', name: 'Victorville', county: 'San Bernardino County', latitude: 34.475914, longitude: -117.26351, region: 'Southern California' },
  { id: '135', name: 'Blythe NE', county: 'Riverside County', latitude: 33.662869, longitude: -114.55811, region: 'Southern California' },
  { id: '136', name: 'Oasis', county: 'Riverside County', latitude: 33.523694, longitude: -116.15575, region: 'Southern California' },
  { id: '147', name: 'Otay Lake', county: 'San Diego County', latitude: 32.628208, longitude: -116.93928, region: 'Southern California' },
  { id: '150', name: 'Miramar', county: 'San Diego County', latitude: 32.885847, longitude: -117.14314, region: 'Southern California' },
  { id: '151', name: 'Ripley', county: 'Riverside County', latitude: 33.532222, longitude: -114.63389, region: 'Southern California' },
  { id: '152', name: 'Camarillo', county: 'Ventura County', latitude: 34.219386, longitude: -118.99244, region: 'Southern California' },
  { id: '153', name: 'Escondido SPV', county: 'San Diego County', latitude: 33.08105, longitude: -116.9757, region: 'Southern California' },
  { id: '159', name: 'Monrovia', county: 'Los Angeles County', latitude: 34.146372, longitude: -117.9858, region: 'Southern California' },
  { id: '160', name: 'San Luis Obispo West', county: 'San Luis Obispo County', latitude: 35.335261, longitude: -120.73588, region: 'Southern California' },
  { id: '163', name: 'Atascadero', county: 'San Luis Obispo County', latitude: 35.472556, longitude: -120.64814, region: 'Southern California' },
  { id: '165', name: 'Sisquoc', county: 'Santa Barbara County', latitude: 34.841878, longitude: -120.21274, region: 'Southern California' },
  { id: '173', name: 'Torrey Pines', county: 'San Diego County', latitude: 32.901867, longitude: -117.25046, region: 'Southern California' },
  { id: '174', name: 'Long Beach', county: 'Los Angeles County', latitude: 33.798697, longitude: -118.09479, region: 'Southern California' },
  { id: '179', name: 'Winchester', county: 'Riverside County', latitude: 33.663325, longitude: -117.09338, region: 'Southern California' },
  { id: '181', name: 'Westmorland North', county: 'Imperial County', latitude: 33.078611, longitude: -115.66056, region: 'Southern California' },
  { id: '183', name: 'Owens Lake North', county: 'Inyo County', latitude: 36.488611, longitude: -117.91944, region: 'Southern California' },
  { id: '184', name: 'San Diego II', county: 'San Diego County', latitude: 32.729578, longitude: -117.13934, region: 'Southern California' },
  { id: '189', name: 'Owens Lake South', county: 'Inyo County', latitude: 36.358628, longitude: -117.94387, region: 'Southern California' },
  { id: '192', name: 'Lake Arrowhead', county: 'San Bernardino County', latitude: 34.255942, longitude: -117.21814, region: 'Southern California' },
  { id: '197', name: 'Palmdale', county: 'Los Angeles County', latitude: 34.614981, longitude: -118.03249, region: 'Southern California' },
  { id: '199', name: 'Big Bear Lake', county: 'San Bernardino County', latitude: 34.237419, longitude: -116.86571, region: 'Southern California' },
  { id: '200', name: 'Indio 2', county: 'Riverside County', latitude: 33.748586, longitude: -116.2529, region: 'Southern California' },
  { id: '202', name: 'Nipomo', county: 'San Luis Obispo County', latitude: 35.028281, longitude: -120.56003, region: 'Southern California' },
  { id: '204', name: 'Santa Clarita', county: 'Los Angeles County', latitude: 34.426361, longitude: -118.51758, region: 'Southern California' },
  { id: '207', name: 'Borrego Springs', county: 'San Diego County', latitude: 33.268447, longitude: -116.36505, region: 'Southern California' },
  { id: '208', name: 'La Quinta II', county: 'Riverside County', latitude: 33.678186, longitude: -116.27299, region: 'Southern California' },
  { id: '215', name: 'Chatsworth', county: 'Los Angeles County', latitude: 34.291331, longitude: -118.57004, region: 'Southern California' },
  { id: '216', name: 'Arleta', county: 'Los Angeles County', latitude: 34.256111, longitude: -118.38278, region: 'Southern California' },
  { id: '217', name: 'Moorpark', county: 'Ventura County', latitude: 34.269031, longitude: -118.849319, region: 'Southern California' },
  { id: '218', name: 'Thermal South', county: 'Riverside County', latitude: 33.595694, longitude: -116.15811, region: 'Southern California' },
  { id: '220', name: 'Palmdale Central', county: 'Los Angeles County', latitude: 34.592222, longitude: -118.1275, region: 'Southern California' },
  { id: '221', name: 'Cadiz Valley', county: 'San Bernardino County', latitude: 34.513611, longitude: -115.51056, region: 'Southern California' },
  { id: '223', name: 'North Hollywood', county: 'Los Angeles County', latitude: 34.142911, longitude: -118.36632, region: 'Southern California' },
  { id: '231', name: 'Lompoc', county: 'Santa Barbara County', latitude: 34.672222, longitude: -120.51306, region: 'Southern California' },
  { id: '232', name: 'Santa Maria II', county: 'Santa Barbara County', latitude: 34.913472, longitude: -120.46478, region: 'Southern California' },
  { id: '233', name: 'Joshua Tree', county: 'San Bernardino County', latitude: 34.138147, longitude: -116.21319, region: 'Southern California' },
  { id: '237', name: 'Temecula East III', county: 'Riverside County', latitude: 33.55281, longitude: -117.043302, region: 'Southern California' },
  { id: '239', name: 'Hemet', county: 'Riverside County', latitude: 33.664747, longitude: -116.955121, region: 'Southern California' },
  { id: '240', name: 'Perris - Menifee', county: 'Riverside County', latitude: 33.76, longitude: -117.2, region: 'Southern California' },
  { id: '241', name: 'San Clemente', county: 'Orange County', latitude: 33.4625, longitude: -117.586111, region: 'Southern California' },
  { id: '245', name: 'Coto de Caza', county: 'Orange County', latitude: 33.621667, longitude: -117.585278, region: 'Southern California' },
  { id: '251', name: 'Highland', county: 'San Bernardino County', latitude: 34.112042, longitude: -117.1857, region: 'Southern California' },
  { id: '256', name: 'Lancaster', county: 'Los Angeles County', latitude: 34.759475, longitude: -117.991997, region: 'Southern California' },
  { id: '257', name: 'Ridgecrest', county: 'Kern County', latitude: 35.659128, longitude: -117.636925, region: 'Southern California' },
  { id: '265', name: 'Paso Robles', county: 'San Luis Obispo County', latitude: 35.692266, longitude: -120.64855, region: 'Southern California' },
  { id: '266', name: 'Shandon', county: 'San Luis Obispo County', latitude: 35.643787, longitude: -120.403229, region: 'Southern California' },
  { id: '271', name: 'Pauma Valley', county: 'San Diego County', latitude: 33.299583, longitude: -116.979719, region: 'Southern California' },
];

// Group stations by region for the dropdown
const CIMIS_REGIONS = Array.from(new Set(CIMIS_STATIONS.map(s => s.region)));

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
  'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
  'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
  'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
  'Wisconsin', 'Wyoming'
];

const EMPTY_FORM: LocationFormData = {
  name: '', latitude: '', longitude: '', state: '', region: '',
  weatherstation: '', weatherstationID: ''
};

export const LocationAddModal: React.FC<LocationAddModalProps> = ({ isOpen, onClose, onBulkAdd, existingLocationNames = [], defaultStationIds = new Set(), onToggleDefault }) => {
  const { addLocation } = useTrial();

  // 'main' = landing view, 'form' = single-location confirm/edit form
  const [view, setView] = useState<'main' | 'form'>('main');
  // Accordion collapsed by default
  const [openRegions, setOpenRegions] = useState<Set<string>>(new Set());
  const [cimisSearch, setCimisSearch] = useState('');
  // Multi-select state (shared for single-station quick-add and bulk add)
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState<LocationFormData>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<LocationFormErrors>({});

  const BULK_REGIONS = Array.from(new Set(DEFAULT_CALIFORNIA_LOCATIONS.map(l => l.region)));
  const filteredBulk = DEFAULT_CALIFORNIA_LOCATIONS.filter(l =>
    `${l.name} ${l.region} ${l.cimisStationId}`.toLowerCase().includes(cimisSearch.toLowerCase())
  );

  if (!isOpen) return null;

  // ── helpers ──────────────────────────────────────────────────────────────

  const reset = () => {
    setFormData(EMPTY_FORM);
    setErrors({});
    setView('main');
    setCimisSearch('');
    setSelected(new Set());
    setOpenRegions(new Set());
  };

  const handleClose = () => { reset(); onClose(); };

  const toggleRegion = (region: string) => {
    setOpenRegions(prev => {
      const next = new Set(prev);
      next.has(region) ? next.delete(region) : next.add(region);
      return next;
    });
  };

  const toggleStation = (cimisStationId: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(cimisStationId) ? next.delete(cimisStationId) : next.add(cimisStationId);
      return next;
    });
  };

  const handleBulkSubmit = () => {
    const toAdd = DEFAULT_CALIFORNIA_LOCATIONS.filter(
      loc => loc.cimisStationId && selected.has(loc.cimisStationId)
    );
    if (toAdd.length === 0) return;
    if (onBulkAdd) onBulkAdd(toAdd);
    reset();
    onClose();
  };

  // Fill form from a single CIMIS station and jump to form view
  const handleCimisSelect = (station: typeof CIMIS_STATIONS[0]) => {
    setFormData({
      name: `${station.name}, CA`,
      latitude: station.latitude,
      longitude: station.longitude,
      state: 'California',
      region: `${station.county} — ${station.region}`,
      weatherstation: station.name,
      weatherstationID: station.id,
    });
    setErrors({});
    setView('form');
  };

  // When the state changes in the form
  const handleStateChange = (state: string) => {
    setFormData(prev => ({
      ...prev,
      state,
      ...(state !== 'California' ? { weatherstation: '', weatherstationID: '' } : {})
    }));
  };

  const handleFormCimisChange = (stationId: string) => {
    if (!stationId) {
      setFormData(prev => ({ ...prev, weatherstation: '', weatherstationID: '' }));
      return;
    }
    const station = CIMIS_STATIONS.find(s => s.id === stationId);
    if (!station) return;
    setFormData(prev => ({
      ...prev,
      name: prev.name || `${station.name}, CA`,
      latitude: prev.latitude !== '' ? prev.latitude : station.latitude,
      longitude: prev.longitude !== '' ? prev.longitude : station.longitude,
      region: prev.region || `${station.county} — ${station.region}`,
      weatherstation: station.name,
      weatherstationID: station.id,
    }));
  };

  // ── validation & submit ──────────────────────────────────────────────────

  const validate = (): boolean => {
    const e: LocationFormErrors = {};
    if (!formData.name.trim()) e.name = 'Location name is required';
    if (formData.latitude === '' || (formData.latitude as number) < -90 || (formData.latitude as number) > 90)
      e.latitude = 'Valid latitude (-90 to 90) is required';
    if (formData.longitude === '' || (formData.longitude as number) < -180 || (formData.longitude as number) > 180)
      e.longitude = 'Valid longitude (-180 to 180) is required';
    if (!formData.state.trim()) e.state = 'State is required';
    if (!formData.region.trim()) e.region = 'Region is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      addLocation({
        name: formData.name.trim(),
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude),
        state: formData.state,
        region: formData.region.trim(),
        ...(formData.weatherstation && { weatherstation: formData.weatherstation.trim() }),
        ...(formData.weatherstationID && { weatherstationID: formData.weatherstationID.trim() }),
      });
      reset();
      onClose();
    } catch (err) {
      console.error('Error adding location:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── render ───────────────────────────────────────────────────────────────

  const inputCls = (hasError?: string) =>
    `w-full px-4 py-3 bg-white dark:bg-gray-800 border rounded-lg text-gray-900 dark:text-white
     placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500
     ${hasError ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'}`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">

          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Add New Location
            </h2>
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* ── MAIN VIEW ── */}
          {view === 'main' && (
            <>
              {/* Select all / clear */}
              <div className="flex items-center gap-3 mb-2 text-xs">
                <button
                  type="button"
                  onClick={() => setSelected(new Set(DEFAULT_CALIFORNIA_LOCATIONS.map(l => l.cimisStationId!).filter(Boolean)))}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Select all
                </button>
                <span className="text-gray-300 dark:text-gray-600">|</span>
                <button
                  type="button"
                  onClick={() => setSelected(new Set())}
                  className="text-gray-500 dark:text-gray-400 hover:underline"
                >
                  Clear
                </button>
                {selected.size > 0 && (
                  <span className="text-blue-600 dark:text-blue-400 font-medium ml-1">
                    {selected.size} selected
                  </span>
                )}
              </div>

              {/* Search */}
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search stations by name, county, or ID…"
                  value={cimisSearch}
                  onChange={e => {
                    setCimisSearch(e.target.value);
                    if (e.target.value.length > 0) setOpenRegions(new Set(CIMIS_REGIONS));
                  }}
                  className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>

              {/* Accordion region list */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden max-h-[55vh] overflow-y-auto mb-3">
                {BULK_REGIONS.map((region, idx) => {
                  const regionStations = filteredBulk.filter(l => l.region === region);
                  const isOpen = !!region && (openRegions.has(region) || cimisSearch.length > 0);
                  if (cimisSearch.length > 0 && regionStations.length === 0) return null;
                  return (
                    <div key={region ?? idx} className={idx > 0 ? 'border-t border-gray-200 dark:border-gray-700' : ''}>
                      {/* Region header */}
                      <button
                        type="button"
                        onClick={() => region && toggleRegion(region)}
                        className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors text-left"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{region}</span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            ({regionStations.length})
                          </span>
                        </div>
                        {isOpen
                          ? <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          : <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        }
                      </button>

                      {/* Station rows with checkboxes */}
                      {isOpen && regionStations.map(loc => {
                        const stationId = loc.cimisStationId;
                        const isDefault = !!stationId && defaultStationIds.has(stationId);
                        return (
                        <div
                          key={stationId || loc.id}
                          className="flex items-center gap-2 px-4 py-2.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-t border-gray-100 dark:border-gray-700/50"
                        >
                          {/* Checkbox area — clicking anywhere except heart toggles selection */}
                          <label className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer">
                            <div className="flex-shrink-0 text-blue-500 dark:text-blue-400">
                              {stationId && selected.has(stationId)
                                ? <CheckSquare className="w-4 h-4" />
                                : <Square className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                              }
                            </div>
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={stationId ? selected.has(stationId) : false}
                              onChange={() => { if (stationId) toggleStation(stationId); }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{loc.name}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{loc.region}</div>
                            </div>
                            <span className="text-xs font-mono bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded flex-shrink-0">
                              #{stationId}
                            </span>
                          </label>

                          {/* Heart — toggles this station in/out of the reset defaults */}
                          {onToggleDefault && stationId && (
                            <button
                              type="button"
                              onClick={(e) => { e.preventDefault(); onToggleDefault(stationId); }}
                              title={isDefault ? 'Remove from default list' : 'Add to default list (will appear when you reset)'}
                              className={`flex-shrink-0 p-1 rounded transition-colors ${
                                isDefault
                                  ? 'text-red-500 hover:text-red-400'
                                  : 'text-gray-300 dark:text-gray-600 hover:text-red-400 dark:hover:text-red-400'
                              }`}
                            >
                              <Heart className={`w-4 h-4 ${isDefault ? 'fill-current' : ''}`} />
                            </button>
                          )}
                        </div>
                        );
                      })}
                    </div>
                  );
                })}
                {filteredBulk.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6 px-4">No stations match.</p>
                )}
              </div>

              {/* Divider */}
              {/* TODO: re-enable when expanding to other states / non-CIMIS weather stations
              <div className="flex items-center gap-3 my-3">
                <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
                <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">or</span>
                <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
              </div>
              */}

              {/* Bottom actions */}
              <div className="flex gap-2 mt-3">
                {/* TODO: restore "Enter Manually" button for non-CA / non-CIMIS locations
                <button
                  type="button"
                  onClick={() => { setFormData(EMPTY_FORM); setErrors({}); setView('form'); }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors text-sm border border-gray-300 dark:border-gray-700"
                >
                  <PenLine className="w-4 h-4" />
                  Enter Manually
                </button>
                */}
                {selected.size > 0 && onBulkAdd && (
                  <button
                    type="button"
                    onClick={handleBulkSubmit}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Add Selected ({selected.size})
                  </button>
                )}
              </div>
            </>
          )}

          {/* ── FORM VIEW: confirm / edit details ── */}
          {view === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Source badge */}
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                {formData.weatherstationID
                  ? <><Droplets className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" /> CIMIS Station #{formData.weatherstationID} selected — edit any field below if needed</>
                  : <><PenLine className="w-3.5 h-3.5 flex-shrink-0" /> Enter your location details below</>
                }
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1.5">
                  Location Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., My Farm — Fresno State"
                  className={inputCls(errors.name)}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              {/* Lat / Lon */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1.5">Latitude *</label>
                  <input
                    type="number" step="0.000001"
                    value={formData.latitude}
                    onChange={e => setFormData({ ...formData, latitude: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                    placeholder="e.g., 36.8208"
                    className={inputCls(errors.latitude)}
                  />
                  {errors.latitude && <p className="text-red-500 text-xs mt-1">{errors.latitude}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1.5">Longitude *</label>
                  <input
                    type="number" step="0.000001"
                    value={formData.longitude}
                    onChange={e => setFormData({ ...formData, longitude: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                    placeholder="e.g., -119.7423"
                    className={inputCls(errors.longitude)}
                  />
                  {errors.longitude && <p className="text-red-500 text-xs mt-1">{errors.longitude}</p>}
                </div>
              </div>

              {/* State */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1.5">State *</label>
                <div className="relative">
                  <select
                    value={formData.state}
                    onChange={e => handleStateChange(e.target.value)}
                    className={inputCls(errors.state) + ' appearance-none pr-10'}
                  >
                    <option value="">Select a state</option>
                    {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
              </div>

              {/* Region */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1.5">Region *</label>
                <input
                  type="text"
                  value={formData.region}
                  onChange={e => setFormData({ ...formData, region: e.target.value })}
                  placeholder="e.g., San Joaquin Valley, Willamette Valley"
                  className={inputCls(errors.region)}
                />
                {errors.region && <p className="text-red-500 text-xs mt-1">{errors.region}</p>}
              </div>

              {/* CIMIS station — shown when state is California */}
              {formData.state === 'California' && (
                <div className="border border-blue-200 dark:border-blue-800 rounded-lg p-4 bg-blue-50 dark:bg-blue-950/30">
                  <label className="block text-sm font-medium text-blue-800 dark:text-blue-300 mb-1.5 flex items-center gap-1.5">
                    <Droplets className="w-4 h-4" /> CIMIS Station
                    <span className="text-xs font-normal text-blue-600 dark:text-blue-400">(optional — enables actual ET₀ data)</span>
                  </label>
                  <div className="relative">
                    <select
                      value={formData.weatherstationID || ''}
                      onChange={e => handleFormCimisChange(e.target.value)}
                      className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 appearance-none pr-10"
                    >
                      <option value="">— No CIMIS station (use Open-Meteo only) —</option>
                      {CIMIS_REGIONS.map(region => (
                        <optgroup key={region} label={region}>
                          {CIMIS_STATIONS.filter(s => s.region === region).map(s => (
                            <option key={s.id} value={s.id}>
                              #{s.id} — {s.name} ({s.county})
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                  {formData.weatherstationID && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1.5">
                      ✓ Station #{formData.weatherstationID} ({formData.weatherstation}) will be used for actual ET₀ data in reports.
                    </p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setView('main'); setErrors({}); }}
                  className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors text-sm"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  {loading ? 'Adding…' : 'Add Location'}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};