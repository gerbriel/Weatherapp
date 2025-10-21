import React, { useState } from 'react';
import { Star, Trash2, RefreshCw, MapPin, Plus, X, Mail } from 'lucide-react';
import { useLocations } from '../contexts/LocationsContext';
import { EmailNotifications } from './EmailNotifications';
import type { LocationWithWeather } from '../types/weather';

interface LocationsListProps {
  onLocationSelect?: (location: LocationWithWeather) => void;
  selectedLocationId?: string;
}

export const LocationsList: React.FC<LocationsListProps> = ({ 
  onLocationSelect, 
  selectedLocationId 
}) => {
  const {
    locations,
    favorites,
    addLocation,
    removeLocation,
    toggleFavorite,
    refreshLocation,
    refreshAllLocations,
    loading: globalLoading
  } = useLocations();

  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'locations' | 'emails'>('locations');
  const [newLocation, setNewLocation] = useState({
    name: '',
    latitude: '',
    longitude: ''
  });

  const handleAddLocation = () => {
    const lat = parseFloat(newLocation.latitude);
    const lng = parseFloat(newLocation.longitude);
    
    if (isNaN(lat) || isNaN(lng) || !newLocation.name.trim()) {
      alert('Please enter valid location data');
      return;
    }
    
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      alert('Invalid coordinates. Latitude: -90 to 90, Longitude: -180 to 180');
      return;
    }

    addLocation({
      name: newLocation.name.trim(),
      latitude: lat,
      longitude: lng
    });

    setNewLocation({ name: '', latitude: '', longitude: '' });
    setShowAddForm(false);
  };

  const handleUseCurrentLocation = async () => {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
      
      addLocation({
        name: 'Current Location',
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      });
    } catch (error) {
      console.error('Error getting current location:', error);
      alert('Could not get your current location');
    }
  };

  const LocationCard: React.FC<{ location: LocationWithWeather }> = ({ location }) => {
    const isSelected = selectedLocationId === location.id;
    const todayData = location.weatherData?.daily ? {
      precipitation: location.weatherData.daily.precipitation_sum[0] || 0,
      et0: location.weatherData.daily.et0_fao_evapotranspiration[0] || 0,
    } : null;

    return (
      <div 
        className={`p-4 border rounded-lg cursor-pointer transition-all ${
          isSelected 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
        } bg-white dark:bg-gray-800`}
        onClick={() => onLocationSelect?.(location)}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {location.name}
              </h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
              {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
            </p>
          </div>
          
          <div className="flex items-center space-x-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(location.id);
              }}
              className={`p-1 rounded ${
                location.isFavorite
                  ? 'text-yellow-500 hover:text-yellow-600'
                  : 'text-gray-400 hover:text-yellow-500'
              }`}
            >
              <Star className={`h-4 w-4 ${location.isFavorite ? 'fill-current' : ''}`} />
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                refreshLocation(location.id);
              }}
              disabled={location.loading}
              className="p-1 rounded text-gray-400 hover:text-blue-500"
            >
              <RefreshCw className={`h-4 w-4 ${location.loading ? 'animate-spin' : ''}`} />
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeLocation(location.id);
              }}
              className="p-1 rounded text-gray-400 hover:text-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {location.error && (
          <p className="text-sm text-red-600 dark:text-red-400 mb-2">{location.error}</p>
        )}

        {todayData && (
          <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Precipitation</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {todayData.precipitation.toFixed(2)} in
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">ET₀</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {todayData.et0.toFixed(2)} mm
              </p>
            </div>
          </div>
        )}

        {location.lastUpdated && (
          <p className="text-xs text-gray-400 mt-2">
            Updated: {new Date(location.lastUpdated).toLocaleTimeString()}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('locations')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'locations'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <MapPin className="h-4 w-4 mr-1 inline" />
            Locations ({locations.length})
          </button>
          <button
            onClick={() => setActiveTab('emails')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'emails'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <Mail className="h-4 w-4 mr-1 inline" />
            Email Reports
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'locations' ? (
        <>
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Manage Locations
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={refreshAllLocations}
                disabled={globalLoading}
                className="gh-btn text-sm"
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${globalLoading ? 'animate-spin' : ''}`} />
                Refresh All
              </button>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="gh-btn gh-btn-primary text-sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Location
              </button>
            </div>
          </div>

      {/* Add Location Form */}
      {showAddForm && (
        <div className="p-4 border border-blue-200 dark:border-blue-700 rounded-lg bg-blue-50 dark:bg-blue-900/20">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-900 dark:text-white">Add New Location</h3>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Location name (e.g., New York, NY)"
              value={newLocation.name}
              onChange={(e) => setNewLocation(prev => ({ ...prev, name: e.target.value }))}
              className="gh-input w-full"
            />
            
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                step="any"
                placeholder="Latitude"
                value={newLocation.latitude}
                onChange={(e) => setNewLocation(prev => ({ ...prev, latitude: e.target.value }))}
                className="gh-input w-full"
              />
              <input
                type="number"
                step="any"
                placeholder="Longitude"
                value={newLocation.longitude}
                onChange={(e) => setNewLocation(prev => ({ ...prev, longitude: e.target.value }))}
                className="gh-input w-full"
              />
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={handleAddLocation}
                className="gh-btn gh-btn-primary text-sm flex-1"
              >
                Add Location
              </button>
              <button
                onClick={handleUseCurrentLocation}
                className="gh-btn text-sm"
              >
                <MapPin className="h-4 w-4 mr-1" />
                Use Current
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Favorites Section */}
      {favorites.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
            <Star className="h-4 w-4 mr-1 text-yellow-500 fill-current" />
            Favorites ({favorites.length})
          </h3>
          <div className="space-y-2">
            {favorites.map(location => (
              <LocationCard key={location.id} location={location} />
            ))}
          </div>
        </div>
      )}

      {/* All Locations */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          All Locations
        </h3>
        <div className="space-y-2">
          {locations.map(location => (
            <LocationCard key={location.id} location={location} />
          ))}
        </div>
      </div>

          {locations.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <MapPin className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No locations added yet</p>
              <p className="text-sm">Add a location to get started</p>
            </div>
          )}
        </>
      ) : (
        <EmailNotifications />
      )}
    </div>
  );
};