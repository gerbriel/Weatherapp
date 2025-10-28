import React, { useState } from 'react';
import { Building2, ChevronDown, Settings, Users, MapPin, Sprout, Plus, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

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

export const OrganizationSwitcher: React.FC = () => {
  const { organization, profile, switchOrganization } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<string>(organization?.id || '');

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
    const userRole = profile.role;
    
    // Demo logic for user assignments:
    if (userEmail === 'admin@cvgrowers.com' || userRole === 'org_admin') {
      // Cooperative admin can see both personal and cooperative
      return [allOrganizations[0], allOrganizations[1]];
    } else if (userEmail === 'manager@agritech.com' || userRole === 'manager') {
      // Enterprise manager can see personal and enterprise
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
    
    // Update the auth context with the new organization
    await switchOrganization(orgId);
    console.log('Switched to organization:', orgId);
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
          className="flex items-center space-x-3 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 transition-colors"
        >
          <Building2 className="h-5 w-5 text-blue-400" />
          <div className="text-left min-w-0">
            <div className="font-medium text-white truncate">{currentOrg.name}</div>
            <div className="text-xs text-gray-400">{currentOrg.total_acres} acres • {currentOrg.active_users} users</div>
          </div>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </button>

        {/* Dropdown Menu */}
        {showDropdown && (
          <div className="absolute top-full left-0 mt-2 w-80 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-50">
            <div className="p-3 border-b border-gray-600">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-white">Organizations</h3>
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
              {organizations.map((org) => (
                <button
                  key={org.id}
                  onClick={() => handleOrgSwitch(org.id)}
                  className={`w-full text-left p-3 hover:bg-gray-700 transition-colors ${
                    selectedOrg === org.id ? 'bg-gray-700' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-white truncate">{org.name}</span>
                        {selectedOrg === org.id && (
                          <Check className="h-4 w-4 text-green-400" />
                        )}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {org.total_acres} acres • {org.total_blocks} blocks • {org.active_users} users
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPlanBadgeColor(org.subscription_plan)}`}>
                          {org.subscription_plan}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
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
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
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
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-4">Current Organization</h3>
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-medium text-white">{currentOrg.name}</h4>
                    <p className="text-gray-400 text-sm">{currentOrg.description}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPlanBadgeColor(currentOrg.subscription_plan)}`}>
                    {currentOrg.subscription_plan}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{currentOrg.total_acres}</div>
                    <div className="text-xs text-gray-400">Total Acres</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{currentOrg.total_blocks}</div>
                    <div className="text-xs text-gray-400">Field Blocks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{currentOrg.active_users}</div>
                    <div className="text-xs text-gray-400">Active Users</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{currentOrg.max_users}</div>
                    <div className="text-xs text-gray-400">User Limit</div>
                  </div>
                </div>

                {/* Organization Standards */}
                <div className="border-t border-gray-600 pt-4">
                  <h5 className="font-medium text-white mb-3">Organization Standards</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Default Crops:</span>
                      <div className="text-white mt-1">
                        {currentOrg.standards.default_crops.join(', ')}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400">Irrigation Methods:</span>
                      <div className="text-white mt-1">
                        {currentOrg.standards.default_irrigation_methods.join(', ')}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400">System Efficiency Target:</span>
                      <div className="text-white mt-1">{currentOrg.standards.default_system_efficiency}%</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Water Conservation Target:</span>
                      <div className="text-white mt-1">{currentOrg.standards.water_conservation_target}%</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Cost per Acre-Foot:</span>
                      <div className="text-white mt-1">${currentOrg.standards.cost_per_acre_foot}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Labor Rate:</span>
                      <div className="text-white mt-1">${currentOrg.standards.labor_rate_per_hour}/hour</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="flex items-center space-x-3 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg transition-colors">
                <Users className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Manage Users</div>
                  <div className="text-sm opacity-75">Add, remove, assign roles</div>
                </div>
              </button>
              
              <button className="flex items-center space-x-3 bg-green-600 hover:bg-green-700 text-white p-4 rounded-lg transition-colors">
                <MapPin className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Field Blocks</div>
                  <div className="text-sm opacity-75">Manage field assignments</div>
                </div>
              </button>
              
              <button className="flex items-center space-x-3 bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-lg transition-colors">
                <Sprout className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Standards</div>
                  <div className="text-sm opacity-75">Update org defaults</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};