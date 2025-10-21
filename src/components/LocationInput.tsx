import React, { useState } from 'react';
import { MapPin, Search } from 'lucide-react';
import type { LocationData } from '../types/weather';

interface LocationInputProps {
  onLocationSubmit: (location: LocationData) => void;
  currentLocation: LocationData | null;
  loading: boolean;
}

export const LocationInput: React.FC<LocationInputProps> = ({
  onLocationSubmit,
  currentLocation,
  loading
}) => {
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [locationName, setLocationName] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    
    if (isNaN(lat) || isNaN(lng)) {
      alert('Please enter valid latitude and longitude values');
      return;
    }
    
    if (lat < -90 || lat > 90) {
      alert('Latitude must be between -90 and 90');
      return;
    }
    
    if (lng < -180 || lng > 180) {
      alert('Longitude must be between -180 and 180');
      return;
    }

    onLocationSubmit({
      latitude: lat,
      longitude: lng,
      name: locationName || `${lat.toFixed(4)}, ${lng.toFixed(4)}`
    });
    
    setIsExpanded(false);
  };

  const handleUseCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          name: 'Current Location'
        };
        onLocationSubmit(location);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Could not get your current location. Please enter coordinates manually.');
      }
    );
  };

  return (
    <div className="gh-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-github-canvas-subtle dark:bg-github-dark-canvas-subtle rounded-gh">
            <MapPin className="h-4 w-4 text-github-accent-emphasis dark:text-github-dark-accent-emphasis" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-github-fg-default dark:text-github-dark-fg-default">
              Location
            </h3>
            {currentLocation && (
              <p className="text-xs text-github-fg-muted dark:text-github-dark-fg-muted font-mono">
                {currentLocation.name || `${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}`}
              </p>
            )}
          </div>
        </div>
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="gh-btn text-sm"
          disabled={loading}
        >
          {isExpanded ? 'Cancel' : 'Change'}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-github-fg-default dark:text-github-dark-fg-default mb-2">
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  min="-90"
                  max="90"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="e.g., 34.0522"
                  className="gh-input w-full"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-github-fg-default dark:text-github-dark-fg-default mb-2">
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  min="-180"
                  max="180"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="e.g., -118.2437"
                  className="gh-input w-full"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-github-fg-default dark:text-github-dark-fg-default mb-2">
                Location Name (Optional)
              </label>
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="e.g., Los Angeles, CA"
                className="gh-input w-full"
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={loading}
                className="gh-btn gh-btn-primary flex items-center space-x-2"
              >
                <Search className="h-4 w-4" />
                <span>Get Weather Data</span>
              </button>
              
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={loading}
                className="gh-btn flex items-center space-x-2"
              >
                <MapPin className="h-4 w-4" />
                <span>Use Current Location</span>
              </button>
            </div>
          </form>
          
          <div className="text-xs text-github-fg-muted dark:text-github-dark-fg-muted bg-github-canvas-subtle dark:bg-github-dark-canvas-subtle p-3 rounded-gh">
            <p>• Latitude: -90 to 90 (negative for South)</p>
            <p>• Longitude: -180 to 180 (negative for West)</p>
            <p>• Uses NCEP GFS Seamless weather model</p>
          </div>
        </div>
      )}
    </div>
  );
};