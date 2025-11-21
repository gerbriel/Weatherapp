import React, { useState, useEffect } from 'react';
import { Building2, ChevronDown, Settings, Users, MapPin, Sprout, Plus, Check, Heart, Trash2, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContextSimple';
import { supabase } from '../lib/supabase';
import { ProfileManager } from './ProfileManager';
import { UserManagementPanel } from './UserManagementPanel';

interface OrganizationStandards {
  id: string;
  organization_id: string;
  default_crops: string[];
  default_irrigation_methods: string[];
  default_soil_types: string[];
  default_system_efficiency: number;
  water_conservation_target: number;
  reporting_frequency: 'daily' | 'weekly' | 'monthly';
  cost_per_acre_foot: number;
  labor_rate_per_hour: number;
  created_at: string;
  updated_at: string;
}

interface FieldBlock {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  location_id: string;
  assigned_users: string[];
  crop_id: string;
  crop_name: string;
  acres: number;
  irrigation_method: 'drip' | 'sprinkler' | 'flood' | 'micro-spray' | 'surface';
  soil_type: string;
  date_planted: string;
  growth_stage: string;
  system_efficiency: number;
  water_allocation: number; // acre-feet per season
  status: 'active' | 'dormant' | 'harvested' | 'preparation';
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface ExtendedOrganization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  subscription_plan: 'free' | 'basic' | 'premium' | 'enterprise';
  max_users: number;
  is_active: boolean;
  total_acres: number;
  total_blocks: number;
  active_users: number;
  standards: OrganizationStandards;
  field_blocks: FieldBlock[];
}

interface OrganizationSwitcherProps {
  selectedCropsCount?: number;
}

export const OrganizationSwitcher: React.FC<OrganizationSwitcherProps> = ({ selectedCropsCount }) => {
  const { organization, profile, locations, updateLocation, deleteLocation } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [showProfileManager, setShowProfileManager] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<string>(organization?.id || '');
  const [activeTab, setActiveTab] = useState<'overview' | 'locations' | 'crops' | 'users'>('overview');
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
  const [editingLocationName, setEditingLocationName] = useState('');
  const [realTimeCropCount, setRealTimeCropCount] = useState<number>(0);
  const [cropsList, setCropsList] = useState<any[]>([]);

  // Get organization name from profile company or default to "Personal Account"
  const orgName = profile?.company || 'Personal Account';
  
  // Count locations and crops dynamically
  const locationCount = locations?.length || 0;
  const cropCount: number = realTimeCropCount || selectedCropsCount || 0; // Use real-time count, fallback to prop
  
  // Team members count (exclude superusers)
  const teamMemberCount = profile?.role === 'superuser' ? 0 : 1;

  // Fetch crop count from database
  const fetchCropCount = async () => {
    if (locations.length === 0) {
      setRealTimeCropCount(0);
      setCropsList([]);
      return;
    }

    try {
      const { count, error } = await supabase
        .from('location_crops')
        .select('*', { count: 'exact', head: true })
        .in('location_id', locations.map(loc => loc.id));

      if (error) throw error;
      setRealTimeCropCount(count || 0);
    } catch (error) {
      console.error('Error fetching crop count:', error);
    }
  };

  // Fetch detailed crop list from database
  const fetchCropsList = async () => {
    if (locations.length === 0) {
      setCropsList([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('location_crops')
        .select('*')
        .in('location_id', locations.map(loc => loc.id))
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Add location name to each crop
      const cropsWithLocation = (data || []).map(crop => ({
        ...crop,
        location_name: locations.find(loc => loc.id === crop.location_id)?.name || 'Unknown Location'
      }));
      
      setCropsList(cropsWithLocation);
    } catch (error) {
      console.error('Error fetching crops list:', error);
    }
  };

  // Load crop count when modal opens or locations change
  useEffect(() => {
    if (showOrgModal && locations.length > 0) {
      fetchCropCount();
      fetchCropsList();
    }
  }, [showOrgModal, locations]);

  // Set up real-time subscription for crop count updates
  useEffect(() => {
    if (!showOrgModal || locations.length === 0) return;

    const subscription = supabase
      .channel('org_crops_count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'location_crops'
        },
        () => {
          fetchCropCount();
          fetchCropsList();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [showOrgModal, locations]);

  // Handle location editing
  const handleStartEditLocation = (location: any) => {
    setEditingLocationId(location.id);
    setEditingLocationName(location.name);
  };

  const handleSaveLocation = async (locationId: string) => {
    if (editingLocationName.trim()) {
      await updateLocation(locationId, { name: editingLocationName.trim() });
      setEditingLocationId(null);
      setEditingLocationName('');
    }
  };

  const handleCancelEdit = () => {
    setEditingLocationId(null);
    setEditingLocationName('');
  };

  const handleDeleteLocation = async (locationId: string, locationName: string) => {
    if (window.confirm(`Are you sure you want to delete "${locationName}"?`)) {
      await deleteLocation(locationId);
    }
  };

  // All available organizations - in real app this would come from API
  const [allOrganizations] = useState<ExtendedOrganization[]>([
    {
      id: 'local-org',
      name: 'Personal Account',
      slug: 'personal',
      description: 'Your personal farming operations',
      subscription_plan: 'free',
      max_users: 1,
      is_active: true,
      total_acres: 450,
      total_blocks: 8,
      active_users: 1,
      standards: {
        id: 'std-1',
        organization_id: 'local-org',
        default_crops: ['Lettuce', 'Tomatoes', 'Broccoli'],
        default_irrigation_methods: ['drip', 'micro-spray'],
        default_soil_types: ['Sandy Loam', 'Clay Loam'],
        default_system_efficiency: 90,
        water_conservation_target: 15,
        reporting_frequency: 'weekly',
        cost_per_acre_foot: 800,
        labor_rate_per_hour: 18,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      field_blocks: []
    },
    {
      id: 'demo-farm-coop',
      name: 'Central Valley Growers Cooperative',
      slug: 'cv-growers',
      description: 'Multi-farm cooperative managing 2,500 acres',
      subscription_plan: 'premium',
      max_users: 25,
      is_active: true,
      total_acres: 2500,
      total_blocks: 45,
      active_users: 18,
      standards: {
        id: 'std-2',
        organization_id: 'demo-farm-coop',
        default_crops: ['Almonds', 'Grapes', 'Pistachios', 'Lettuce', 'Broccoli'],
        default_irrigation_methods: ['drip', 'micro-spray', 'sprinkler'],
        default_soil_types: ['Sandy Loam', 'Clay Loam', 'Silt Loam'],
        default_system_efficiency: 85,
        water_conservation_target: 20,
        reporting_frequency: 'daily',
        cost_per_acre_foot: 950,
        labor_rate_per_hour: 22,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      field_blocks: []
    },
    {
      id: 'enterprise-ag',
      name: 'AgriTech Enterprises',
      slug: 'agritech',
      description: 'Large-scale precision agriculture operations',
      subscription_plan: 'enterprise',
      max_users: 100,
      is_active: true,
      total_acres: 8500,
      total_blocks: 120,
      active_users: 67,
      standards: {
        id: 'std-3',
        organization_id: 'enterprise-ag',
        default_crops: ['Corn', 'Soybeans', 'Wheat', 'Cotton', 'Tomatoes'],
        default_irrigation_methods: ['drip', 'sprinkler', 'center-pivot'],
        default_soil_types: ['Clay Loam', 'Silt Loam', 'Sandy Clay Loam'],
        default_system_efficiency: 88,
        water_conservation_target: 25,
        reporting_frequency: 'daily',
        cost_per_acre_foot: 1100,
        labor_rate_per_hour: 25,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      field_blocks: []
    }
  ]);

  // User-organization assignments (in real app this would come from user profile/API)
  const getUserOrganizations = (): ExtendedOrganization[] => {
    if (!profile) return [allOrganizations[0]]; // Default to personal account
    
    // Determine which organizations this user has access to based on their profile
    const userEmail = profile.email;
    const userRole = profile.role as string;
    
    // Demo logic for user assignments:
    if (userEmail === 'admin@cvgrowers.com' || userRole === 'superuser' || userRole === 'admin') {
      // Admins can see both personal and cooperative
      return [allOrganizations[0], allOrganizations[1]];
    } else if (userEmail === 'manager@agritech.com' || userRole === 'user') {
      // Regular users can see personal and enterprise
      return [allOrganizations[0], allOrganizations[2]];
    } else if (userEmail?.includes('cvgrowers.com')) {
      // Cooperative members can see personal and cooperative
      return [allOrganizations[0], allOrganizations[1]];
    } else if (userEmail?.includes('agritech.com')) {
      // Enterprise members can see personal and enterprise
      return [allOrganizations[0], allOrganizations[2]];
    } else {
      // Default users only see personal account
      return [allOrganizations[0]];
    }
  };

  const organizations = getUserOrganizations();
  const currentOrg = organizations.find((org: ExtendedOrganization) => org.id === selectedOrg) || organizations[0];

  const handleOrgSwitch = async (orgId: string) => {
    setSelectedOrg(orgId);
    setShowDropdown(false);
    
    // Organization switching functionality to be implemented
    // await switchOrganization(orgId);
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'free': return 'bg-gray-100 text-gray-800';
      case 'basic': return 'bg-blue-100 text-blue-800';
      case 'premium': return 'bg-purple-100 text-purple-800';
      case 'enterprise': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      {/* Organization Switcher */}
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center space-x-2 lg:space-x-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-2 lg:px-4 py-2 transition-colors min-w-0"
        >
          <Building2 className="h-4 w-4 lg:h-5 lg:w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <div className="text-left min-w-0 flex-1">
            <div className="font-medium text-gray-900 dark:text-white truncate text-sm lg:text-base">{orgName}</div>
          </div>
          <ChevronDown className="h-3 w-3 lg:h-4 lg:w-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
        </button>

        {/* Dropdown Menu */}
        {showDropdown && (
          <div className="absolute top-full left-0 mt-2 w-72 lg:w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl z-50">
            <div className="p-3 border-b border-gray-600">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-white text-sm lg:text-base">Organizations</h3>
                <button
                  onClick={() => {
                    setShowOrgModal(true);
                    setShowDropdown(false);
                  }}
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="max-h-64 overflow-y-auto">
              {/* Show current organization info */}
              <button
                className="w-full text-left p-3 bg-gray-700"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-white truncate">{orgName}</span>
                      <Check className="h-4 w-4 text-green-400" />
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {locationCount} {locationCount === 1 ? 'location' : 'locations'} • {cropCount} {cropCount === 1 ? 'crop' : 'crops'}
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        free
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            </div>

            <div className="p-3 border-t border-gray-600">
              <button
                onClick={() => {
                  setShowOrgModal(true);
                  setShowDropdown(false);
                }}
                className="w-full text-left text-blue-400 hover:text-blue-300 text-sm flex items-center space-x-2"
              >
                <Settings className="h-4 w-4" />
                <span>Manage Organizations</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Organization Management Modal */}
      {showOrgModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Organization Management</h2>
              <button
                onClick={() => setShowOrgModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Current Organization Overview */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-semibold text-white">{orgName}</h3>
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                  free
                </span>
              </div>
              
              {/* Stats Overview */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-700 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-blue-400">{locationCount}</div>
                  <div className="text-sm text-gray-400 mt-1">Locations</div>
                </div>
                <div className="bg-gray-700 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-green-400">{cropCount}</div>
                  <div className="text-sm text-gray-400 mt-1">Crops</div>
                </div>
                <div className="bg-gray-700 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-purple-400">{teamMemberCount}</div>
                  <div className="text-sm text-gray-400 mt-1">Users</div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex space-x-1 mb-6 bg-gray-700 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'overview'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-gray-600'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('locations')}
                  className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'locations'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-gray-600'
                  }`}
                >
                  Locations
                </button>
                <button
                  onClick={() => setActiveTab('crops')}
                  className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'crops'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-gray-600'
                  }`}
                >
                  Crops
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'users'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-gray-600'
                  }`}
                >
                  Users
                </button>
              </div>

              {/* Tab Content */}
              <div className="bg-gray-700 rounded-lg p-4 max-h-96 overflow-y-auto">
                {activeTab === 'overview' && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-white mb-2">Organization Summary</h4>
                      <p className="text-gray-400 text-sm">
                        Managing {locationCount} {locationCount === 1 ? 'location' : 'locations'} with {cropCount} {cropCount === 1 ? 'crop type' : 'crop types'} tracked across your operations.
                      </p>
                    </div>
                    
                    <div className="border-t border-gray-600 pt-4">
                      <h4 className="font-medium text-white mb-3">Quick Stats</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Total Locations:</span>
                          <span className="text-white font-medium">{locationCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Active Crops:</span>
                          <span className="text-white font-medium">{cropCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Team Members:</span>
                          <span className="text-white font-medium">{teamMemberCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Account Type:</span>
                          <span className="text-white font-medium">Free</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'locations' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-white">All Locations ({locationCount})</h4>
                    </div>
                    {locations && locations.length > 0 ? (
                      locations.map((location) => (
                        <div key={location.id} className="bg-gray-600 rounded-lg p-3 hover:bg-gray-550 transition-colors">
                          {editingLocationId === location.id ? (
                            // Edit mode
                            <div className="space-y-3">
                              <div>
                                <label className="block text-xs text-gray-400 mb-1">Location Name</label>
                                <input
                                  type="text"
                                  value={editingLocationName}
                                  onChange={(e) => setEditingLocationName(e.target.value)}
                                  className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-500 focus:border-blue-400 focus:outline-none text-sm"
                                  autoFocus
                                />
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleSaveLocation(location.id)}
                                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            // View mode
                            <div>
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <MapPin className="h-4 w-4 text-blue-400 flex-shrink-0" />
                                    <h5 className="font-medium text-white">{location.name}</h5>
                                    {location.is_favorite && (
                                      <Heart className="h-4 w-4 text-red-400 fill-current flex-shrink-0" />
                                    )}
                                  </div>
                                  <div className="space-y-1 text-sm">
                                    <div className="flex items-center space-x-2 text-gray-300">
                                      <span className="text-gray-400">Coordinates:</span>
                                      <span>{location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</span>
                                    </div>
                                    {location.weatherstation && (
                                      <div className="flex items-center space-x-2 text-gray-300">
                                        <span className="text-gray-400">Weather Station:</span>
                                        <span>{location.weatherstation}</span>
                                      </div>
                                    )}
                                    {location.city && location.state && (
                                      <div className="flex items-center space-x-2 text-gray-300">
                                        <span className="text-gray-400">Location:</span>
                                        <span>{location.city}, {location.state}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-gray-500">
                                <button
                                  onClick={() => handleStartEditLocation(location)}
                                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center justify-center space-x-1"
                                >
                                  <Settings className="h-3.5 w-3.5" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteLocation(location.id, location.name)}
                                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center justify-center space-x-1"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-400 text-center py-8">No locations added yet</p>
                    )}
                  </div>
                )}

                {activeTab === 'crops' && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-white mb-3">Active Crops ({cropCount})</h4>
                    {cropsList.length > 0 ? (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {cropsList.map((crop) => (
                          <div key={crop.id} className="bg-gray-600 rounded-lg p-3 hover:bg-gray-550 transition-colors">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-2 flex-1">
                                <Sprout className="h-4 w-4 text-green-400 mt-1 flex-shrink-0" />
                                <div className="flex-1">
                                  <h5 className="font-medium text-white">{crop.crop_name}</h5>
                                  {crop.crop_variety && (
                                    <p className="text-gray-400 text-xs">Variety: {crop.crop_variety}</p>
                                  )}
                                  <div className="mt-2 space-y-1">
                                    <div className="flex items-center text-xs text-gray-400">
                                      <MapPin className="h-3 w-3 mr-1" />
                                      <span>{crop.location_name}</span>
                                    </div>
                                    <div className="flex items-center text-xs text-gray-400">
                                      <Calendar className="h-3 w-3 mr-1" />
                                      <span>Planted: {new Date(crop.planting_date).toLocaleDateString()}</span>
                                    </div>
                                    {crop.area_acres && (
                                      <div className="text-xs text-gray-400">
                                        {crop.area_acres} acres
                                      </div>
                                    )}
                                  </div>
                                  <div className="mt-2 flex items-center space-x-2">
                                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                                      crop.status === 'active' 
                                        ? 'bg-green-600 text-white' 
                                        : crop.status === 'planned'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-500 text-white'
                                    }`}>
                                      {crop.status}
                                    </span>
                                    {crop.irrigation_method && (
                                      <span className="text-xs text-gray-400">
                                        {crop.irrigation_method}
                                      </span>
                                    )}
                                  </div>
                                  {crop.notes && (
                                    <p className="text-gray-400 text-xs mt-2 italic">{crop.notes}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Sprout className="h-12 w-12 text-gray-500 mx-auto mb-3" />
                        <p className="text-gray-400">No crops added yet</p>
                        <p className="text-gray-500 text-sm mt-1">Add crops to your locations to see them here</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'users' && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-white mb-3">Team Directory ({teamMemberCount})</h4>
                    {profile?.role !== 'superuser' && (
                      <div className="bg-gray-600 rounded-lg p-3">
                        <div className="flex items-start space-x-3">
                          <div className="bg-blue-500 rounded-full h-10 w-10 flex items-center justify-center text-white font-medium">
                            {profile?.full_name?.[0]?.toUpperCase() || profile?.email?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <div className="flex-1">
                            <h5 className="font-medium text-white">{profile?.full_name || 'User'}</h5>
                            <p className="text-gray-400 text-sm">{profile?.email}</p>
                            <div className="mt-2 flex items-center space-x-2">
                              <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded-full">
                                {profile?.role || 'user'}
                              </span>
                              {profile?.company && (
                                <span className="text-gray-400 text-xs">{profile.company}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="bg-gray-600/50 border border-gray-600 border-dashed rounded-lg p-4 text-center">
                      <Users className="h-8 w-8 text-gray-500 mx-auto mb-2" />
                      <p className="text-gray-400 text-sm">Invite team members</p>
                      <p className="text-gray-500 text-xs mt-1">Collaborate with your team (Premium feature)</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-6 space-y-3">
                {/* Profile Management - Available to all users */}
                <button 
                  onClick={() => {
                    setShowProfileManager(true);
                  }}
                  className="w-full flex items-center justify-between bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg transition-colors group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-500 rounded-full h-10 w-10 flex items-center justify-center">
                      <Settings className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Manage Profile</div>
                      <div className="text-sm opacity-75">Update your personal information</div>
                    </div>
                  </div>
                  <ChevronDown className="h-5 w-5 transform -rotate-90 group-hover:translate-x-1 transition-transform" />
                </button>

                {/* Admin/Superuser Controls - Side by side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Admin Panel - For admin role AND superuser (superuser can access admin functions too) */}
                  {(profile?.role === 'admin' || profile?.role === 'superuser') && (
                    <button 
                      onClick={() => {
                        setShowAdminPanel(true);
                      }}
                      className="w-full flex flex-col items-start bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white p-4 rounded-lg transition-colors group"
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <Users className="h-5 w-5" />
                        <span className="font-medium">Admin Panel</span>
                      </div>
                      <p className="text-xs opacity-75 text-left">
                        Manage users, roles & organization
                      </p>
                    </button>
                  )}

                  {/* Super Admin Panel - ONLY for superuser role (admins and regular users cannot see this) */}
                  {profile?.role === 'superuser' && (
                    <button 
                      onClick={() => {
                        alert('Superuser Panel - Full system access: Manage ALL organizations, users & settings');
                      }}
                      className="w-full flex flex-col items-start bg-gradient-to-br from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-700 hover:via-purple-700 hover:to-indigo-700 text-white p-4 rounded-lg transition-colors group relative overflow-hidden"
                    >
                      <div className="absolute top-2 right-2">
                        <span className="px-2 py-0.5 bg-yellow-400 text-purple-900 text-xs rounded-full font-bold">
                          SUPER
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 mb-2">
                        <Settings className="h-5 w-5" />
                        <span className="font-medium">Superuser Panel</span>
                      </div>
                      <p className="text-xs opacity-75 text-left">
                        Full system access & control
                      </p>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Manager Modal */}
      <ProfileManager 
        isOpen={showProfileManager} 
        onClose={() => {
          setShowProfileManager(false);
          setShowOrgModal(false);
        }}
        onBack={() => {
          setShowProfileManager(false);
          setShowOrgModal(true);
        }}
      />

      {/* Admin Panel Modal */}
      <UserManagementPanel 
        isOpen={showAdminPanel} 
        onClose={() => {
          setShowAdminPanel(false);
          setShowOrgModal(false);
        }}
        onBack={() => {
          setShowAdminPanel(false);
          setShowOrgModal(true);
        }}
      />
    </>
  );
};