import React, { useState, useMemo } from 'react';
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
import { useAuth } from '../contexts/AuthContextSimple';
import { DEFAULT_CALIFORNIA_LOCATIONS } from '../constants/defaultLocations';
import { LocationAddModal } from './LocationAddModal';
import type { LocationWithWeather } from '../types/weather';

interface EnhancedLocationsListProps {
  onLocationSelect?: (location: LocationWithWeather) => void;
  selectedLocationId?: string;
  locationsWithWeather?: any[]; // Optional prop to pass locations with pre-fetched weather data
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
  selectedLocationId,
  locationsWithWeather
}) => {
  const { 
    user, 
    locations: authLocations, 
    addLocation: authAddLocation,
    updateLocation: authUpdateLocation,
    deleteLocation: authDeleteLocation,
    toggleLocationFavorite: authToggleFavorite,
    reorderLocations: authReorderLocations,
    resetToTrialLocations: authResetToTrialLocations,
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

  // Always use LocationsContext as the single source of truth
  const baseLocations = trialLocations;
  
  // Deduplicate and merge weather data
  const locations = React.useMemo(() => {
    const seen = new Set<string>();
    
    // Build a map keyed by both ID and station ID for reliable matching
    const weatherDataById = new Map();
    const weatherDataByStationId = new Map();
    if (locationsWithWeather) {
      locationsWithWeather.forEach(loc => {
        if (loc.weatherData) {
          weatherDataById.set(loc.id, loc.weatherData);
          const stationId = loc.weatherstationID || loc.weatherstation_id;
          if (stationId) weatherDataByStationId.set(stationId, loc.weatherData);
        }
      });
    }
    
    return baseLocations.filter(loc => {
      if (seen.has(loc.id)) return false;
      seen.add(loc.id);
      return true;
    }).map(loc => {
      const stationId = (loc as any).weatherstationID || (loc as any).weatherstation_id;
      const weatherData = weatherDataById.get(loc.id) || (stationId ? weatherDataByStationId.get(stationId) : undefined);
      return weatherData ? { ...loc, weatherData } : loc;
    });
  }, [baseLocations, locationsWithWeather]);
  
  // State management
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDefaultLocations, setShowDefaultLocations] = useState(false);
  const [selectedDefaultLocations, setSelectedDefaultLocations] = useState<Set<string>>(new Set());
  const [editingLocation, setEditingLocation] = useState<EditingLocation | null>(null);

  // ── Custom default CIMIS station list ────────────────────────────────────
  // Persisted in localStorage so it survives page reloads.
  // Seeded from the 10 hardcoded defaults on first use.
  const CUSTOM_DEFAULTS_KEY = 'customDefaultCimisIds';
  const HARDCODED_DEFAULT_IDS = ['125', '80', '71', '250', '77', '214', '202', '258', '2', '273'];

  const [customDefaultIds, setCustomDefaultIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(CUSTOM_DEFAULTS_KEY);
      if (stored) return new Set(JSON.parse(stored));
    } catch {}
    // Seed from hardcoded list on first use
    localStorage.setItem(CUSTOM_DEFAULTS_KEY, JSON.stringify(HARDCODED_DEFAULT_IDS));
    return new Set(HARDCODED_DEFAULT_IDS);
  });

  const handleToggleDefault = (cimisStationId: string) => {
    setCustomDefaultIds(prev => {
      const next = new Set(prev);
      next.has(cimisStationId) ? next.delete(cimisStationId) : next.add(cimisStationId);
      localStorage.setItem(CUSTOM_DEFAULTS_KEY, JSON.stringify(Array.from(next)));
      return next;
    });
  };
  // ─────────────────────────────────────────────────────────────────────────
  const [newLocation, setNewLocation] = useState({
    name: '',
    latitude: '',
    longitude: '',
    weatherstation: '',
    weatherstation_id: ''
  });

  // Sort locations: favorites first, then by sort order
  const sortedLocations = [...locations].sort((a, b) => {
    const aFavorite = (a as any).isFavorite || (a as any).is_favorite || false;
    const bFavorite = (b as any).isFavorite || (b as any).is_favorite || false;
    if (aFavorite !== bFavorite) return aFavorite ? -1 : 1;
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
    trialReorderLocations(locationIds);
  };

  // Handle favorite toggle
  const handleToggleFavorite = async (id: string) => {
    trialToggleFavorite(id);
  };

  // Handle location deletion with confirmation
  const handleDeleteLocation = async (location: any) => {
    if (window.confirm(`Are you sure you want to delete "${location.name}"?`)) {
      trialRemoveLocation(location.id);
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

    trialUpdateLocation(editingLocation.id, {
      name: updates.name,
      latitude: updates.latitude,
      longitude: updates.longitude,
      weatherstation: updates.weatherstation,
      weatherstationID: updates.weatherstation_id
    } as any);

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

    trialAddLocation({
      name: locationData.name,
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      weatherstation: locationData.weatherstation,
      weatherstationID: locationData.weatherstation_id,
      sortOrder: locationData.sort_order
    });

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
        sort_order: locations.length,
      };

      trialAddLocation({
        name: locationData.name,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        weatherstation: locationData.weatherstation,
        weatherstationID: locationData.weatherstation_id,
        sortOrder: locationData.sort_order
      });
    });

    setSelectedDefaultLocations(new Set());
    setShowDefaultLocations(false);
    alert(`Added ${newLocations.length} new location${newLocations.length !== 1 ? 's' : ''}!`);
  };

  const handleResetToTrialLocations = async () => {
    const stationCount = customDefaultIds.size;
    const confirmMessage = `This will replace all your current locations with your ${stationCount} favourited CIMIS station${stationCount !== 1 ? 's' : ''}. Are you sure?\n\n(Tip: heart stations in the Add Location picker to customise this list.)`;
    if (window.confirm(confirmMessage)) {
      try {
        const customDefaults = DEFAULT_CALIFORNIA_LOCATIONS.filter(
          loc => loc.cimisStationId && customDefaultIds.has(loc.cimisStationId)
        );
        // Replace localStorage with the custom defaults and reload
        const newLocations = customDefaults.map((loc, index) => ({
          id: `trial-${loc.id}`,
          name: loc.name,
          latitude: loc.latitude,
          longitude: loc.longitude,
          weatherstation: loc.weatherstation || loc.name,
          weatherstationID: loc.cimisStationId,
          isFavorite: false,
          sortOrder: index,
          loading: false
        }));
        localStorage.setItem('weatherLocations', JSON.stringify(newLocations));
        alert(`✅ Successfully reset to ${stationCount} default CIMIS station${stationCount !== 1 ? 's' : ''}!`);
        window.location.reload();
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
    dragHandleProps?: any;
  }> = ({ location, index, isDragging, dragHandleProps }) => {
    const isSelected = selectedLocationId === location.id;
    const isFavorite = location.isFavorite || (location as any).is_favorite || false;
    const isEditing = editingLocation?.id === location.id;
    const locationStationId = location.weatherstation_id || location.weatherstationID || '';
    const isInDefaultList = !!locationStationId && customDefaultIds.has(locationStationId);

    // Get today's weather data
    // Since forecast API is configured with past_days=0, index 0 is always today
    const todayData = (() => {
      if (!location.weatherData?.daily?.time || !location.weatherData?.daily?.time[0]) return null;
      
      return {
        precipitation: location.weatherData.daily.precipitation_sum?.[0] || 0,
        et0: location.weatherData.daily.et0_fao_evapotranspiration?.[0] || 0,
        et0Sum: location.weatherData.daily.et0_fao_evapotranspiration_sum?.[0] || 0,
      };
    })();

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
            {/* Drag Handle - Only this element can be used to drag */}
            <div {...dragHandleProps}>
              <GripVertical className="h-4 w-4 text-gray-400 cursor-grab active:cursor-grabbing" />
            </div>
            {/* Map Pin */}
            <MapPin className="h-4 w-4 text-gray-500" />
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (locationStationId) {
                  handleToggleDefault(locationStationId);
                }
              }}
              className={`p-1 rounded transition-colors ${
                isInDefaultList
                  ? 'text-red-500 hover:text-red-400'
                  : 'text-gray-400 hover:text-red-400'
              }`}
              title={isInDefaultList ? 'Remove from default reset list' : 'Add to default reset list'}
            >
              <Heart className={`h-4 w-4 ${isInDefaultList ? 'fill-current' : ''}`} />
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
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">ET₀ (Daily)</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {todayData.et0.toFixed(3)} in
              </p>
            </div>
            <div className="flex flex-col col-span-2">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">ET₀ Sum (Cumulative)</p>
              <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                {todayData.et0Sum.toFixed(3)} in
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

      {/* Utility Buttons */}
      <div className="px-6 pb-4 space-y-2">
        <button
          onClick={handleResetToTrialLocations}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-orange-300 dark:border-orange-600 rounded-md text-sm text-orange-700 dark:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/20"
        >
          <RotateCcw className="h-4 w-4" />
          Reset to Default CIMIS
        </button>
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
                        >
                          <LocationCard 
                            location={location} 
                            index={index}
                            isDragging={snapshot.isDragging}
                            dragHandleProps={provided.dragHandleProps}
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
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        {/* Footer content removed - buttons moved to header */}
      </div>

      {/* Add Location Modal — includes single-station picker, bulk add, and manual entry */}
      <LocationAddModal
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        defaultStationIds={customDefaultIds}
        onToggleDefault={handleToggleDefault}
        onBulkAdd={(stations) => {
          const existingNames = locations.map(loc => loc.name.toLowerCase());
          const toAdd = stations.filter(loc =>
            loc.region && !existingNames.includes(loc.region.replace(' Area', '').toLowerCase())
          );
          toAdd.forEach(loc => {
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
            trialAddLocation({
              name: locationData.name,
              latitude: locationData.latitude,
              longitude: locationData.longitude,
              weatherstation: locationData.weatherstation,
              weatherstationID: locationData.weatherstation_id,
              sortOrder: locationData.sort_order
            });
          });
          if (toAdd.length > 0) {
            alert(`Added ${toAdd.length} new location${toAdd.length !== 1 ? 's' : ''}!`);
          } else {
            alert('All selected locations are already added!');
          }
        }}
        existingLocationNames={locations.map(loc => loc.name)}
      />
    </div>
  );
};