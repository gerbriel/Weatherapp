import React, { useState } from 'react';
import { 
  Star, 
  Trash2, 
  RefreshCw, 
  MapPin, 
  Plus, 
  X, 
  CheckSquare, 
  Square, 
  RotateCcw,
  Edit3,
  GripVertical,
  Save,
  Heart,
  AlertCircle
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { useLocations } from '../contexts/LocationsContext';
import { useAuth } from '../contexts/AuthContext';
import { DEFAULT_CALIFORNIA_LOCATIONS } from '../constants/defaultLocations';
import type { LocationWithWeather } from '../types/weather';

interface EnhancedLocationsListProps {
  onLocationSelect?: (location: LocationWithWeather) => void;
  selectedLocationId?: string;
}

interface EditingLocation {
  id: string;
  name: string;
  latitude: string;
  longitude: string;
  weatherstation: string;
  weatherstation_id: string;
}

export const EnhancedLocationsList: React.FC<EnhancedLocationsListProps> = ({ 
  onLocationSelect, 
  selectedLocationId 
}) => {
  const { 
    user, 
    locations: authLocations, 
    addLocation: authAddLocation,
    updateLocation: authUpdateLocation,
    deleteLocation: authDeleteLocation,
    toggleLocationFavorite: authToggleFavorite,
    reorderLocations: authReorderLocations,
    resetToTrialLocations
  } = useAuth();
  
  const {
    locations: trialLocations,
    addLocation: trialAddLocation,
    removeLocation: trialRemoveLocation,
    toggleFavorite: trialToggleFavorite,
    updateLocation: trialUpdateLocation,
    reorderLocations: trialReorderLocations,
    refreshLocation,
    refreshAllLocations,
    loading: globalLoading
  } = useLocations();

  // Use auth locations for authenticated users, trial locations for trial users
  const locations = user ? authLocations : trialLocations;
  
  // State management
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDefaultLocations, setShowDefaultLocations] = useState(false);
  const [selectedDefaultLocations, setSelectedDefaultLocations] = useState<Set<string>>(new Set());
  const [editingLocation, setEditingLocation] = useState<EditingLocation | null>(null);
  const [newLocation, setNewLocation] = useState({
    name: '',
    latitude: '',
    longitude: '',
    weatherstation: '',
    weatherstation_id: ''
  });

  // Sort locations: favorites first, then by sort_order or creation order
  const sortedLocations = [...locations].sort((a, b) => {
    // For authenticated users, sort by favorites then sort_order
    if (user) {
      const aUserLocation = a as any; // UserLocation type
      const bUserLocation = b as any; // UserLocation type
      
      if (aUserLocation.is_favorite !== bUserLocation.is_favorite) {
        return aUserLocation.is_favorite ? -1 : 1;
      }
      return (aUserLocation.sort_order || 0) - (bUserLocation.sort_order || 0);
    }
    
    // For trial users, sort by favorites then original order (with safe property access)
    const aFavorite = (a as any).isFavorite || (a as any).is_favorite || false;
    const bFavorite = (b as any).isFavorite || (b as any).is_favorite || false;
    if (aFavorite !== bFavorite) {
      return aFavorite ? -1 : 1;
    }
    const aSortOrder = (a as any).sortOrder || (a as any).sort_order || 0;
    const bSortOrder = (b as any).sortOrder || (b as any).sort_order || 0;
    return aSortOrder - bSortOrder;
  });

  // Handle drag and drop
  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) return;

    // Reorder locations
    const reorderedLocations = Array.from(sortedLocations);
    const [removed] = reorderedLocations.splice(sourceIndex, 1);
    reorderedLocations.splice(destinationIndex, 0, removed);

    // Update order
    const locationIds = reorderedLocations.map(loc => loc.id);
    
    if (user) {
      await authReorderLocations(locationIds);
    } else {
      // For trial users, we'll need to implement reordering in LocationsContext
      // For now, just update local state (won't persist)
      console.log('Trial user reordering not yet implemented');
    }
  };

  // Handle favorite toggle
  const handleToggleFavorite = async (id: string) => {
    if (user) {
      await authToggleFavorite(id);
    } else {
      trialToggleFavorite(id);
    }
  };

  // Handle location deletion with confirmation
  const handleDeleteLocation = async (location: any) => {
    const confirmMessage = `Are you sure you want to delete "${location.name}"?${
      user ? '' : '\\n\\nNote: As a trial user, this will only last for this session.'
    }`;
    
    if (window.confirm(confirmMessage)) {
      if (user) {
        await authDeleteLocation(location.id);
      } else {
        trialRemoveLocation(location.id);
      }
    }
  };

  // Handle location editing
  const startEditing = (location: any) => {
    setEditingLocation({
      id: location.id,
      name: location.name,
      latitude: location.latitude.toString(),
      longitude: location.longitude.toString(),
      weatherstation: location.weatherstation || '',
      weatherstation_id: location.weatherstation_id || location.weatherstationID || ''
    });
  };

  const cancelEditing = () => {
    setEditingLocation(null);
  };

  const saveLocation = async () => {
    if (!editingLocation) return;

    const updates = {
      name: editingLocation.name.trim(),
      latitude: parseFloat(editingLocation.latitude),
      longitude: parseFloat(editingLocation.longitude),
      weatherstation: editingLocation.weatherstation.trim() || undefined,
      weatherstation_id: editingLocation.weatherstation_id.trim() || undefined
    };

    // Validate coordinates
    if (isNaN(updates.latitude) || isNaN(updates.longitude) || !updates.name) {
      alert('Please enter valid location data');
      return;
    }

    if (updates.latitude < -90 || updates.latitude > 90 || updates.longitude < -180 || updates.longitude > 180) {
      alert('Invalid coordinates. Latitude: -90 to 90, Longitude: -180 to 180');
      return;
    }

    if (user) {
      await authUpdateLocation(editingLocation.id, updates);
    } else {
      // For trial users, we'll need to implement updating in LocationsContext
      console.log('Trial user editing not yet implemented');
    }

    setEditingLocation(null);
  };

  // Handle adding new location
  const handleAddLocation = async () => {
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

    const locationData = {
      name: newLocation.name.trim(),
      latitude: lat,
      longitude: lng,
      weatherstation: newLocation.weatherstation.trim() || undefined,
      weatherstation_id: newLocation.weatherstation_id.trim() || undefined,
      description: '',
      elevation: 100,
      address: newLocation.name.trim(),
      city: newLocation.name.split(',')[0] || newLocation.name.trim(),
      state: 'CA',
      country: 'United States',
      postal_code: '00000',
      timezone: 'America/Los_Angeles',
      is_default: false,
      is_active: true,
      is_favorite: false,
      sort_order: locations.length,
      metadata: {}
    };

    if (user) {
      await authAddLocation(locationData);
    } else {
      trialAddLocation({
        name: locationData.name,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        weatherstation: locationData.weatherstation,
        weatherstationID: locationData.weatherstation_id,
        sortOrder: locationData.sort_order
      });
    }

    setNewLocation({
      name: '',
      latitude: '',
      longitude: '',
      weatherstation: '',
      weatherstation_id: ''
    });
    setShowAddForm(false);
  };

  // Handle bulk adding default locations
  const handleAddSelectedDefaults = () => {
    const locationsToAdd = DEFAULT_CALIFORNIA_LOCATIONS.filter(loc => 
      loc.cimisStationId && selectedDefaultLocations.has(loc.cimisStationId)
    );

    if (locationsToAdd.length === 0) {
      alert('No locations selected!');
      return;
    }

    const existingNames = locations.map(loc => loc.name.toLowerCase());
    const newLocations = locationsToAdd.filter(loc => 
      loc.region && !existingNames.includes(loc.region.replace(' Area', '').toLowerCase())
    );

    if (newLocations.length === 0) {
      alert('All selected locations are already added!');
      return;
    }

    newLocations.forEach(loc => {
      const locationData = {
        name: loc.region ? loc.region.replace(' Area', '') : loc.name,
        latitude: loc.latitude,
        longitude: loc.longitude,
        weatherstation: loc.name,
        weatherstation_id: loc.cimisStationId,
        description: `${loc.region} agricultural weather station`,
        elevation: 100,
        address: `${loc.name}, ${loc.state}`,
        city: loc.name,
        state: 'CA',
        country: 'United States',
        postal_code: '00000',
        timezone: 'America/Los_Angeles',
        is_default: false,
        is_active: true,
        is_favorite: false,
        sort_order: locations.length,
        metadata: { cimisStationId: loc.cimisStationId, region: loc.region, source: 'default_locations' }
      };

      if (user) {
        authAddLocation(locationData);
      } else {
        trialAddLocation({
          name: locationData.name,
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          weatherstation: locationData.weatherstation,
          weatherstationID: locationData.weatherstation_id,
          sortOrder: locationData.sort_order
        });
      }
    });

    setSelectedDefaultLocations(new Set());
    setShowDefaultLocations(false);
    alert(`Added ${newLocations.length} new location${newLocations.length !== 1 ? 's' : ''}!`);
  };

  const handleResetToTrialLocations = async () => {
    if (!user) return;
    
    const confirmMessage = 'This will replace all your current locations with the standard CIMIS agricultural weather stations. Are you sure?';
    if (window.confirm(confirmMessage)) {
      try {
        const result = await resetToTrialLocations();
        if (result.error) {
          alert('Failed to reset locations: ' + result.error.message);
        } else {
          alert('✅ Successfully reset to CIMIS agricultural weather stations!');
          // Note: locations will auto-refresh through context
        }
      } catch (error) {
        console.error('Error resetting locations:', error);
        alert('Failed to reset locations. Please try again.');
      }
    }
  };

  // Enhanced Location Card Component
  const LocationCard: React.FC<{ 
    location: LocationWithWeather | any; 
    index: number;
    isDragging: boolean;
  }> = ({ location, index, isDragging }) => {
    const isSelected = selectedLocationId === location.id;
    const isFavorite = user ? (location as any).is_favorite : location.isFavorite;
    const isEditing = editingLocation?.id === location.id;

    const todayData = location.weatherData?.daily ? {
      precipitation: location.weatherData.daily.precipitation_sum[0] || 0,
      et0: location.weatherData.daily.et0_fao_evapotranspiration[0] || 0,
    } : null;

    const weatherStationName = location.weatherstation || '';
    const weatherStationId = location.weatherstation_id || location.weatherstationID || '';

    if (isEditing) {
      // Edit mode
      return (
        <div className="p-4 border-2 border-blue-500 rounded-lg bg-blue-50 dark:bg-blue-900/20">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Location Name</label>
              <input
                type="text"
                value={editingLocation?.name || ''}
                onChange={(e) => editingLocation && setEditingLocation({ ...editingLocation, name: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Latitude</label>
                <input
                  type="number"
                  step="0.000001"
                  value={editingLocation?.latitude || ''}
                  onChange={(e) => editingLocation && setEditingLocation({ ...editingLocation, latitude: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Longitude</label>
                <input
                  type="number"
                  step="0.000001"
                  value={editingLocation?.longitude || ''}
                  onChange={(e) => editingLocation && setEditingLocation({ ...editingLocation, longitude: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Weather Station</label>
              <input
                type="text"
                value={editingLocation?.weatherstation || ''}
                onChange={(e) => editingLocation && setEditingLocation({ ...editingLocation, weatherstation: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="e.g., Arvin-Edison"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Weather Station ID</label>
              <input
                type="text"
                value={editingLocation?.weatherstation_id || ''}
                onChange={(e) => editingLocation && setEditingLocation({ ...editingLocation, weatherstation_id: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="e.g., 125"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={saveLocation}
                className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
              >
                <Save className="h-4 w-4" />
                Save
              </button>
              <button
                onClick={cancelEditing}
                className="flex items-center gap-1 px-3 py-1 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-700"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Normal display mode
    return (
      <div 
        className={`p-5 border rounded-lg transition-all ${isDragging ? 'shadow-lg' : ''} ${
          isSelected 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
        } bg-white dark:bg-gray-800`}
        onClick={() => onLocationSelect?.(location)}
      >
        {/* Icons Row - Above Content */}
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center gap-2">
            {/* Drag Handle */}
            <GripVertical className="h-4 w-4 text-gray-400 cursor-grab active:cursor-grabbing" />
            {/* Map Pin */}
            <MapPin className="h-4 w-4 text-gray-500" />
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggleFavorite(location.id);
              }}
              className={`p-1 rounded ${
                isFavorite
                  ? 'text-red-500 hover:text-red-600'
                  : 'text-gray-400 hover:text-red-500'
              }`}
              title="Toggle Favorite"
            >
              <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                startEditing(location);
              }}
              className="p-1 rounded text-gray-400 hover:text-blue-500"
              title="Edit Location"
            >
              <Edit3 className="h-4 w-4" />
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                refreshLocation(location.id);
              }}
              disabled={location.loading}
              className="p-1 rounded text-gray-400 hover:text-green-500"
              title="Refresh Weather Data"
            >
              <RefreshCw className={`h-4 w-4 ${location.loading ? 'animate-spin' : ''}`} />
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteLocation(location);
              }}
              className="p-1 rounded text-gray-400 hover:text-red-500"
              title="Delete Location"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content Area - Below Icons */}
        <div>
          <div className="mb-2">
            <h3 className="font-semibold text-gray-900 dark:text-white" title={location.name}>
              {location.name}
              {isFavorite && <Heart className="inline h-4 w-4 text-red-500 ml-1 fill-current" />}
            </h3>
          </div>
          
          {/* Weather Station Information - Prominent Display */}
          {weatherStationName && weatherStationId && (
            <div className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-md">
              <div className="flex items-center gap-1 min-w-0">
                <span className="truncate flex-1 min-w-0">{weatherStationName}</span>
                <span className="text-blue-600 dark:text-blue-400 font-semibold whitespace-nowrap">CMIS #{weatherStationId}</span>
              </div>
            </div>
          )}
          {/* If weatherstation_id exists but weatherstation doesn't, still show CMIS ID */}
          {weatherStationId && !weatherStationName && (
            <div className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-md">
              <span className="text-blue-600 dark:text-blue-400 font-semibold">CMIS #{weatherStationId}</span>
            </div>
          )}
          
          <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
            {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
          </p>
        </div>

        {location.error && (
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <p className="text-sm text-red-600 dark:text-red-400">{location.error}</p>
          </div>
        )}

        {todayData && (
          <div className="grid grid-cols-2 gap-4 mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
            <div className="flex flex-col">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Precipitation</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {todayData.precipitation.toFixed(2)} in
              </p>
            </div>
            <div className="flex flex-col">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">ET₀</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {(todayData.et0 * 0.0393701).toFixed(3)} inches
              </p>
            </div>
          </div>
        )}

        {location.lastUpdated && (
          <p className="text-xs text-gray-400 mt-3">
            Updated: {new Date(location.lastUpdated).toLocaleTimeString()}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Locations {user ? '' : '(Trial)'}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
          <button
            onClick={refreshAllLocations}
            disabled={globalLoading}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
          >
            <RefreshCw className={`h-4 w-4 ${globalLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Locations List with Drag and Drop */}
      <div className="flex-1 overflow-y-auto">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="locations">
            {(provided, snapshot) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={`p-4 space-y-4 ${snapshot.isDraggingOver ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}
              >
                {sortedLocations.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No locations added yet</p>
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="mt-2 text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Add your first location
                    </button>
                  </div>
                ) : (
                  sortedLocations.map((location, index) => (
                    <Draggable key={location.id} draggableId={location.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <LocationCard 
                            location={location} 
                            index={index}
                            isDragging={snapshot.isDragging}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {/* Footer with utilities */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-2">
        <button
          onClick={() => setShowDefaultLocations(true)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <Plus className="h-4 w-4" />
          Add CIMIS Stations
        </button>
        
        {user && (
          <button
            onClick={handleResetToTrialLocations}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-orange-300 dark:border-orange-600 rounded-md text-sm text-orange-700 dark:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/20"
          >
            <RotateCcw className="h-4 w-4" />
            Reset to Default CIMIS
          </button>
        )}
      </div>

      {/* Add Location Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Add New Location</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Location Name *
                </label>
                <input
                  type="text"
                  value={newLocation.name}
                  onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., North Field"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Latitude *
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={newLocation.latitude}
                    onChange={(e) => setNewLocation({ ...newLocation, latitude: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                    placeholder="36.7783"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Longitude *
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={newLocation.longitude}
                    onChange={(e) => setNewLocation({ ...newLocation, longitude: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                    placeholder="-119.4179"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Weather Station
                </label>
                <input
                  type="text"
                  value={newLocation.weatherstation}
                  onChange={(e) => setNewLocation({ ...newLocation, weatherstation: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., Fresno State"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Weather Station ID
                </label>
                <input
                  type="text"
                  value={newLocation.weatherstation_id}
                  onChange={(e) => setNewLocation({ ...newLocation, weatherstation_id: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., 80"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={handleAddLocation}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
              >
                Add Location
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewLocation({ name: '', latitude: '', longitude: '', weatherstation: '', weatherstation_id: '' });
                }}
                className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Default Locations Modal */}
      {showDefaultLocations && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Add CIMIS Weather Stations
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Select professional agricultural weather stations to add to your account:
            </p>
            
            <div className="overflow-y-auto max-h-96 border border-gray-200 dark:border-gray-600 rounded-md">
              {DEFAULT_CALIFORNIA_LOCATIONS.map((loc) => (
                <label 
                  key={loc.cimisStationId || loc.id}
                  className="flex items-start gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-600 last:border-b-0"
                >
                  <input
                    type="checkbox"
                    checked={loc.cimisStationId ? selectedDefaultLocations.has(loc.cimisStationId) : false}
                    onChange={(e) => {
                      if (!loc.cimisStationId) return;
                      const newSelected = new Set(selectedDefaultLocations);
                      if (e.target.checked) {
                        newSelected.add(loc.cimisStationId);
                      } else {
                        newSelected.delete(loc.cimisStationId);
                      }
                      setSelectedDefaultLocations(newSelected);
                    }}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {loc.region ? loc.region.replace(' Area', '') : loc.name}
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                      {loc.name} - CIMIS #{loc.cimisStationId || 'N/A'}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                    </div>
                  </div>
                </label>
              ))}
            </div>
            
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={handleAddSelectedDefaults}
                disabled={selectedDefaultLocations.size === 0}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Add Selected ({selectedDefaultLocations.size})
              </button>
              <button
                onClick={() => {
                  setShowDefaultLocations(false);
                  setSelectedDefaultLocations(new Set());
                }}
                className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};