import React, { useState } from 'react';
import { Star, Trash2, RefreshCw, MapPin, Plus, X, CheckSquare, Square, RotateCcw } from 'lucide-react';
import { useLocations } from '../contexts/LocationsContext';
import { useAuth } from '../contexts/AuthContext';
import { DEFAULT_CALIFORNIA_LOCATIONS } from '../constants/defaultLocations';
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
    resetToTrialLocations, 
    user, 
    locations: authLocations, 
    addLocation: authAddLocation,
    deleteLocation: authDeleteLocation
  } = useAuth();
  
  const {
    locations: trialLocations,
    favorites,
    addLocation: trialAddLocation,
    removeLocation: trialRemoveLocation,
    toggleFavorite,
    refreshLocation,
    refreshAllLocations,
    loading: globalLoading
  } = useLocations();

  // Use appropriate locations and functions based on authentication
  const locations = user ? authLocations : trialLocations;
  
  // Wrapper functions to handle different location types
  const addLocationWrapper = (locationData: { name: string; latitude: number; longitude: number }) => {
    if (user) {
      // For authenticated users, add required fields for UserLocation
      return authAddLocation({
        ...locationData,
        description: '',
        elevation: 100,
        address: locationData.name,
        city: locationData.name.split(',')[0] || locationData.name,
        state: 'CA',
        country: 'United States',
        postal_code: '00000',
        timezone: 'America/Los_Angeles',
        is_default: authLocations.length === 0,
        is_active: true,
        metadata: {}
      });
    } else {
      // For trial users, use the trial format
      return trialAddLocation(locationData);
    }
  };

  const removeLocationWrapper = (id: string) => {
    if (user) {
      return authDeleteLocation(id);
    } else {
      return trialRemoveLocation(id);
    }
  };

  const [showAddForm, setShowAddForm] = useState(false);
  const [showDefaultLocations, setShowDefaultLocations] = useState(false);
  const [selectedDefaultLocations, setSelectedDefaultLocations] = useState<Set<string>>(new Set());
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

    addLocationWrapper({
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
      
      addLocationWrapper({
        name: 'Current Location',
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      });
    } catch (error) {
      console.error('Error getting current location:', error);
      alert('Could not get your current location');
    }
  };

  const handleToggleDefaultLocation = (locationId: string) => {
    setSelectedDefaultLocations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(locationId)) {
        newSet.delete(locationId);
      } else {
        newSet.add(locationId);
      }
      return newSet;
    });
  };

  const handleSelectAllDefaultLocations = () => {
    const allIds = DEFAULT_CALIFORNIA_LOCATIONS.map(loc => loc.id);
    setSelectedDefaultLocations(new Set(allIds));
  };

  const handleDeselectAllDefaultLocations = () => {
    setSelectedDefaultLocations(new Set());
  };

  const handleAddSelectedDefaultLocations = () => {
    const locationsToAdd = DEFAULT_CALIFORNIA_LOCATIONS.filter(loc => 
      selectedDefaultLocations.has(loc.id)
    );

    // Filter out locations that already exist
    const existingNames = locations.map(loc => loc.name.toLowerCase());
    const newLocations = locationsToAdd.filter(loc => 
      !existingNames.includes(loc.name.toLowerCase())
    );

    if (newLocations.length === 0) {
      alert('All selected locations are already added!');
      return;
    }

    // Add each new location
    newLocations.forEach(loc => {
      addLocationWrapper({
        name: loc.name,
        latitude: loc.latitude,
        longitude: loc.longitude
      });
    });

    // Reset selection and close form
    setSelectedDefaultLocations(new Set());
    setShowDefaultLocations(false);

    alert(`Added ${newLocations.length} new location${newLocations.length !== 1 ? 's' : ''}!`);
  };

  const handleResetToTrialLocations = async () => {
    if (!user) return;
    
    const confirmMessage = 'This will replace all your current locations with the agricultural trial locations. Are you sure?';
    if (window.confirm(confirmMessage)) {
      try {
        const result = await resetToTrialLocations();
        if (result.error) {
          alert('Failed to reset locations: ' + result.error.message);
        } else {
          alert('Successfully reset to trial locations! These include CIMIS agricultural weather stations for accurate crop data.');
          // Refresh the page to update the locations in the UI
          window.location.reload();
        }
      } catch (error) {
        console.error('Error resetting locations:', error);
        alert('Failed to reset locations. Please try again.');
      }
    }
  };

  const LocationCard: React.FC<{ location: LocationWithWeather | any }> = ({ location }) => {
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
                removeLocationWrapper(location.id);
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
                {(todayData.et0 * 0.0393701).toFixed(3)} inches
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
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Manage Locations
              </h2>
              <button
                onClick={refreshAllLocations}
                disabled={globalLoading}
                className="gh-btn text-sm"
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${globalLoading ? 'animate-spin' : ''}`} />
                Refresh All
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="gh-btn gh-btn-primary text-sm w-full"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Location
              </button>
              <button
                onClick={() => setShowDefaultLocations(!showDefaultLocations)}
                className="gh-btn text-sm w-full"
              >
                <CheckSquare className="h-4 w-4 mr-1" />
                CA Defaults
              </button>
              <button
                onClick={handleResetToTrialLocations}
                className="gh-btn gh-btn-warning text-sm w-full"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset Trial
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

      {/* Default California Locations Form */}
      {showDefaultLocations && (
        <div className="p-4 border border-green-200 dark:border-green-700 rounded-lg bg-green-50 dark:bg-green-900/20 mt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-900 dark:text-white">California Default Locations</h3>
            <button
              onClick={() => setShowDefaultLocations(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Select common California locations to add to your weather tracking:
          </p>

          {/* Select All/None Controls */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={handleSelectAllDefaultLocations}
              className="gh-btn text-xs"
            >
              Select All
            </button>
            <button
              onClick={handleDeselectAllDefaultLocations}
              className="gh-btn text-xs"
            >
              Select None
            </button>
          </div>

          {/* Location Checkboxes */}
          <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
            {DEFAULT_CALIFORNIA_LOCATIONS.map((location) => {
              const isSelected = selectedDefaultLocations.has(location.id);
              const alreadyExists = locations.some(loc => 
                loc.name.toLowerCase() === location.name.toLowerCase()
              );
              
              return (
                <div
                  key={location.id}
                  className={`flex items-center justify-between p-2 rounded border ${
                    alreadyExists 
                      ? 'bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 opacity-60'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-750'
                  }`}
                >
                  <div className="flex items-center flex-1">
                    <button
                      onClick={() => !alreadyExists && handleToggleDefaultLocation(location.id)}
                      disabled={alreadyExists}
                      className={`mr-3 ${alreadyExists ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      {isSelected ? (
                        <CheckSquare className="h-4 w-4 text-green-600" />
                      ) : (
                        <Square className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {location.name}
                        {alreadyExists && (
                          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                            (Already added)
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                        {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Selected Button */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {selectedDefaultLocations.size} location{selectedDefaultLocations.size !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={handleAddSelectedDefaultLocations}
              disabled={selectedDefaultLocations.size === 0}
              className="gh-btn gh-btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Selected ({selectedDefaultLocations.size})
            </button>
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
    </div>
  );
};