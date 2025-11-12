import React, { useState } from 'react';
import { MapPin, Plus, Search, X, Globe, Navigation } from 'lucide-react';
import { useTrial } from '../contexts/TrialContext';

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
  weatherstation?: string;
  weatherstationID?: string;
}

interface LocationAddModalProps {
  isOpen: boolean;
  onClose: () => void;
}

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

const POPULAR_LOCATIONS = [
  { name: 'Phoenix, AZ', latitude: 33.4484, longitude: -112.0740, state: 'Arizona', region: 'Sonoran Desert' },
  { name: 'Denver, CO', latitude: 39.7392, longitude: -104.9903, state: 'Colorado', region: 'Front Range' },
  { name: 'Orlando, FL', latitude: 28.5383, longitude: -81.3792, state: 'Florida', region: 'Central Florida' },
  { name: 'Atlanta, GA', latitude: 33.7490, longitude: -84.3880, state: 'Georgia', region: 'North Georgia' },
  { name: 'Des Moines, IA', latitude: 41.5868, longitude: -93.6250, state: 'Iowa', region: 'Central Iowa' },
  { name: 'Wichita, KS', latitude: 37.6872, longitude: -97.3301, state: 'Kansas', region: 'South Central Kansas' },
  { name: 'Portland, OR', latitude: 45.5152, longitude: -122.6784, state: 'Oregon', region: 'Willamette Valley' },
  { name: 'Dallas, TX', latitude: 32.7767, longitude: -96.7970, state: 'Texas', region: 'North Texas' },
  { name: 'Salt Lake City, UT', latitude: 40.7608, longitude: -111.8910, state: 'Utah', region: 'Salt Lake Valley' },
  { name: 'Seattle, WA', latitude: 47.6062, longitude: -122.3321, state: 'Washington', region: 'Puget Sound' },
];

export const LocationAddModal: React.FC<LocationAddModalProps> = ({ isOpen, onClose }) => {
  const { addLocation } = useTrial();
  const [formData, setFormData] = useState<LocationFormData>({
    name: '',
    latitude: '',
    longitude: '',
    state: '',
    region: '',
    weatherstation: '',
    weatherstationID: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<LocationFormErrors>({});

  if (!isOpen) return null;

  const filteredLocations = POPULAR_LOCATIONS.filter(location =>
    location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    location.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
    location.region.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const validateForm = (): boolean => {
    const newErrors: LocationFormErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Location name is required';
    }
    
    if (formData.latitude === '' || formData.latitude < -90 || formData.latitude > 90) {
      newErrors.latitude = 'Valid latitude (-90 to 90) is required';
    }
    
    if (formData.longitude === '' || formData.longitude < -180 || formData.longitude > 180) {
      newErrors.longitude = 'Valid longitude (-180 to 180) is required';
    }
    
    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }
    
    if (!formData.region.trim()) {
      newErrors.region = 'Region is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      // Add the location
      addLocation({
        name: formData.name.trim(),
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude),
        state: formData.state,
        region: formData.region.trim(),
        ...(formData.weatherstation && { weatherstation: formData.weatherstation.trim() }),
        ...(formData.weatherstationID && { weatherstationID: formData.weatherstationID.trim() })
      });
      
      // Reset form and close modal
      setFormData({
        name: '',
        latitude: '',
        longitude: '',
        state: '',
        region: '',
        weatherstation: '',
        weatherstationID: ''
      });
      setErrors({});
      onClose();
    } catch (error) {
      console.error('Error adding location:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePopularLocationSelect = (location: typeof POPULAR_LOCATIONS[0]) => {
    setFormData({
      name: location.name,
      latitude: location.latitude,
      longitude: location.longitude,
      state: location.state,
      region: location.region,
      weatherstation: '',
      weatherstationID: ''
    });
    setIsManualEntry(true);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Use reverse geocoding to get location details
        try {
          // For demo purposes, create a basic location entry
          setFormData({
            name: `Location ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            latitude: parseFloat(latitude.toFixed(6)),
            longitude: parseFloat(longitude.toFixed(6)),
            state: '',
            region: 'Current Location',
            weatherstation: '',
            weatherstationID: ''
          });
          setIsManualEntry(true);
        } catch (error) {
          console.error('Error getting location details:', error);
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error('Error getting current location:', error);
        alert('Unable to get your current location. Please enter coordinates manually.');
        setLoading(false);
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              Add New Location
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {!isManualEntry ? (
            <>
              {/* Search Popular Locations */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search popular locations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Popular Locations Grid */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-white mb-3">Popular Agricultural Locations</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                  {filteredLocations.map((location, index) => (
                    <button
                      key={index}
                      onClick={() => handlePopularLocationSelect(location)}
                      className="text-left p-3 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 hover:border-blue-500 transition-colors"
                    >
                      <div className="font-medium text-white">{location.name}</div>
                      <div className="text-sm text-gray-400">{location.region}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={getCurrentLocation}
                  disabled={loading}
                  className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  <Navigation className="w-5 h-5 mr-2" />
                  {loading ? 'Getting Location...' : 'Use Current Location'}
                </button>
                
                <button
                  onClick={() => setIsManualEntry(true)}
                  className="w-full flex items-center justify-center px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  <Globe className="w-5 h-5 mr-2" />
                  Enter Location Manually
                </button>
              </div>
            </>
          ) : (
            /* Manual Entry Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Location Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Farm Name, City, CA"
                  className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 ${
                    errors.name ? 'border-red-500' : 'border-gray-700'
                  }`}
                />
                {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Latitude *
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                    placeholder="e.g., 36.7378"
                    className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 ${
                      errors.latitude ? 'border-red-500' : 'border-gray-700'
                    }`}
                  />
                  {errors.latitude && <p className="text-red-400 text-sm mt-1">{errors.latitude}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Longitude *
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                    placeholder="e.g., -119.7871"
                    className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 ${
                      errors.longitude ? 'border-red-500' : 'border-gray-700'
                    }`}
                  />
                  {errors.longitude && <p className="text-red-400 text-sm mt-1">{errors.longitude}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  State *
                </label>
                <select
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-white focus:outline-none focus:border-blue-500 ${
                    errors.state ? 'border-red-500' : 'border-gray-700'
                  }`}
                >
                  <option value="">Select a state</option>
                  {US_STATES.map((state) => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
                {errors.state && <p className="text-red-400 text-sm mt-1">{errors.state}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Region *
                </label>
                <input
                  type="text"
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  placeholder="e.g., Central Valley, Willamette Valley"
                  className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 ${
                    errors.region ? 'border-red-500' : 'border-gray-700'
                  }`}
                />
                {errors.region && <p className="text-red-400 text-sm mt-1">{errors.region}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Weather Station <span className="text-gray-400">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.weatherstation || ''}
                    onChange={(e) => setFormData({ ...formData, weatherstation: e.target.value })}
                    placeholder="e.g., Fresno State"
                    className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 ${
                      errors.weatherstation ? 'border-red-500' : 'border-gray-700'
                    }`}
                  />
                  {errors.weatherstation && <p className="text-red-400 text-sm mt-1">{errors.weatherstation}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Weather Station ID <span className="text-gray-400">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.weatherstationID || ''}
                    onChange={(e) => setFormData({ ...formData, weatherstationID: e.target.value })}
                    placeholder="e.g., 80"
                    className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 ${
                      errors.weatherstationID ? 'border-red-500' : 'border-gray-700'
                    }`}
                  />
                  {errors.weatherstationID && <p className="text-red-400 text-sm mt-1">{errors.weatherstationID}</p>}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsManualEntry(false)}
                  className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  {loading ? 'Adding...' : 'Add Location'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};