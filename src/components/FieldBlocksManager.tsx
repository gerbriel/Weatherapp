import React, { useState, useMemo } from 'react';
import { MapPin, Users, Calendar, Droplets, Sprout, Edit, Trash2, Plus, Filter, Calculator } from 'lucide-react';
import { COMPREHENSIVE_CROP_DATABASE } from '../data/crops';
import { SOIL_DATABASE } from '../data/soils';
import { useAuth } from '../contexts/AuthContext';

export interface FieldBlock {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  location_name: string;
  address?: string; // Physical address for the field block
  assigned_users: string[];
  crop_id: string;
  crop_name: string;
  acres: number;
  irrigation_methods: Array<{
    method: 'drip' | 'sprinkler' | 'flood' | 'micro-spray' | 'surface';
    stage?: string; // e.g., "Initial", "Development", "Mid-season", "Late season"
    startDate?: string;
    endDate?: string;
    notes?: string;
  }>;
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

interface RuntimeResult {
  dailyWaterNeed: number;
  runtimeHours: number;
  runtimeMinutes: number;
  weeklyHours: number;
  efficiency: number;
  formula: string;
  etc: number;
}

interface FieldBlocksManagerProps {
  selectedCrops?: string[];
  calculatorResult?: RuntimeResult | null;
  calculatorInputs?: any;
  fieldBlocks?: FieldBlock[];
  selectedLocation?: any;
  availableLocations?: any[];
  onFieldBlockUpdate?: (updatedBlock: FieldBlock) => void;
}

export const FieldBlocksManager: React.FC<FieldBlocksManagerProps> = ({ 
  selectedCrops = [], 
  calculatorResult = null,
  calculatorInputs = {},
  fieldBlocks: propFieldBlocks = [],
  selectedLocation = null,
  availableLocations = [],
  onFieldBlockUpdate
}) => {
  const { organization } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [editingBlock, setEditingBlock] = useState<FieldBlock | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Organization-specific users
  const getOrganizationUsers = useMemo(() => {
    if (!organization) return [];

    switch (organization.id) {
      case 'local-org':
        return [
          { id: 'user-1', name: 'Personal Account', email: 'you@farm.com', role: 'Owner' }
        ];
      case 'demo-farm-coop':
        return [
          { id: 'user-1', name: 'John Martinez', email: 'john@cvgrowers.com', role: 'Field Manager' },
          { id: 'user-2', name: 'Sarah Chen', email: 'sarah@cvgrowers.com', role: 'Irrigation Specialist' },
          { id: 'user-3', name: 'Mike Thompson', email: 'mike@cvgrowers.com', role: 'Crop Advisor' },
          { id: 'user-4', name: 'Lisa Rodriguez', email: 'lisa@cvgrowers.com', role: 'Farm Worker' },
          { id: 'user-5', name: 'David Park', email: 'david@cvgrowers.com', role: 'Assistant Manager' }
        ];
      case 'enterprise-ag':
        return [
          { id: 'user-1', name: 'Michael Rodriguez', email: 'manager@agritech.com', role: 'Regional Manager' },
          { id: 'user-2', name: 'Emily Johnson', email: 'emily@agritech.com', role: 'Senior Agronomist' },
          { id: 'user-3', name: 'Carlos Mendez', email: 'carlos@agritech.com', role: 'Operations Director' },
          { id: 'user-4', name: 'Jennifer Wu', email: 'jennifer@agritech.com', role: 'Field Supervisor' },
          { id: 'user-5', name: 'Robert Kim', email: 'robert@agritech.com', role: 'Irrigation Engineer' },
          { id: 'user-6', name: 'Amanda Davis', email: 'amanda@agritech.com', role: 'Crop Specialist' }
        ];
      default:
        return [];
    }
  }, [organization?.id]);

  const users = getOrganizationUsers;

  // Organization-specific field blocks
  const getOrganizationFieldBlocks = useMemo(() => {
    if (!organization) return [];

    switch (organization.id) {
      case 'local-org':
        return [
          {
            id: 'block-1',
            organization_id: 'local-org',
            name: 'North Field',
            description: 'Primary growing area',
            location_name: 'Personal Farm',
            assigned_users: ['user-1'],
            crop_id: 'lettuce',
            crop_name: 'Lettuce',
            acres: 15,
            irrigation_methods: [
              { method: 'sprinkler' as const, stage: 'Initial', notes: 'Germination period' },
              { method: 'drip' as const, stage: 'Development', notes: 'Switched to drip for efficiency' }
            ],
            soil_type: 'Sandy Loam',
            date_planted: '2024-10-15',
            growth_stage: 'Vegetative',
            system_efficiency: 92,
            water_allocation: 1.2,
            status: 'active' as const,
            notes: 'High-value organic lettuce',
            created_at: '2024-10-15T08:00:00Z',
            updated_at: '2024-10-20T10:30:00Z'
          },
          {
            id: 'block-2',
            organization_id: 'local-org',
            name: 'South Field',
            description: 'Secondary planting area',
            location_name: 'Personal Farm',
            assigned_users: ['user-1'],
            crop_id: 'tomatoes',
            crop_name: 'Tomatoes',
            acres: 12,
            irrigation_methods: [
              { method: 'drip' as const, stage: 'All stages', notes: 'Consistent drip irrigation throughout growing season' }
            ],
            soil_type: 'Clay Loam',
            date_planted: '2024-09-20',
            growth_stage: 'Fruiting',
            system_efficiency: 88,
            water_allocation: 1.5,
            status: 'active' as const,
            notes: 'Cherry tomatoes for farmer\'s market',
            created_at: '2024-09-20T06:00:00Z',
            updated_at: '2024-10-25T14:15:00Z'
          }
        ];

      case 'demo-farm-coop':
        return [
          {
            id: 'block-1',
            organization_id: 'demo-farm-coop',
            name: 'North Lettuce Block A',
            description: 'Primary lettuce production area',
            location_name: 'Salinas Valley Farm',
            assigned_users: ['user-1', 'user-2'],
            crop_id: 'lettuce',
            crop_name: 'Lettuce',
            acres: 45,
            irrigation_methods: [
              { method: 'drip' as const, stage: 'All stages', notes: 'High-efficiency drip system' }
            ],
            soil_type: 'Sandy Loam',
            date_planted: '2024-10-15',
            growth_stage: 'Vegetative',
            system_efficiency: 92,
            water_allocation: 2.5,
            status: 'active' as const,
            notes: 'High-value organic lettuce rotation',
            created_at: '2024-10-15T08:00:00Z',
            updated_at: '2024-10-20T10:30:00Z'
          },
          {
            id: 'block-2',
            organization_id: 'demo-farm-coop',
            name: 'South Tomato Field',
            description: 'Processing tomatoes for cannery',
            location_name: 'Fresno County Field',
            assigned_users: ['user-1', 'user-3', 'user-4'],
            crop_id: 'tomatoes',
            crop_name: 'Tomatoes',
            acres: 120,
            irrigation_methods: [
              { method: 'drip' as const, stage: 'All stages', notes: 'Precision drip for processing tomatoes' }
            ],
            soil_type: 'Clay Loam',
            date_planted: '2024-09-20',
            growth_stage: 'Fruiting',
            system_efficiency: 88,
            water_allocation: 4.2,
            status: 'active' as const,
            notes: 'Contract with Pacific Cannery - harvest mid November',
            created_at: '2024-09-20T06:00:00Z',
            updated_at: '2024-10-25T14:15:00Z'
          },
          {
            id: 'block-3',
            organization_id: 'demo-farm-coop',
            name: 'West Broccoli Section',
            description: 'Cool season vegetable rotation',
            location_name: 'San Joaquin Valley',
            assigned_users: ['user-2', 'user-5'],
            crop_id: 'broccoli',
            crop_name: 'Broccoli',
            acres: 85,
            irrigation_methods: [
              { method: 'micro-spray' as const, stage: 'All stages', notes: 'Micro-spray for uniform coverage' }
            ],
            soil_type: 'Silt Loam',
            date_planted: '2024-08-30',
            growth_stage: 'Head Formation',
            system_efficiency: 85,
            water_allocation: 3.1,
            status: 'active' as const,
            notes: 'Ready for harvest in 2 weeks',
            created_at: '2024-08-30T07:00:00Z',
            updated_at: '2024-10-22T16:45:00Z'
          }
        ];

      case 'enterprise-ag':
        return [
          {
            id: 'block-1',
            organization_id: 'enterprise-ag',
            name: 'Central Corn Block 1A',
            description: 'Primary corn production - 640 acres',
            location_name: 'Central Operations',
            assigned_users: ['user-1', 'user-2', 'user-4'],
            crop_id: 'corn',
            crop_name: 'Corn',
            acres: 640,
            irrigation_methods: [
              { method: 'sprinkler' as const, stage: 'All stages', notes: 'Center pivot irrigation system' }
            ],
            soil_type: 'Clay Loam',
            date_planted: '2024-05-15',
            growth_stage: 'Grain Filling',
            system_efficiency: 82,
            water_allocation: 28.5,
            status: 'active' as const,
            notes: 'High-yield hybrid variety - expect 185 bu/acre',
            created_at: '2024-05-15T06:00:00Z',
            updated_at: '2024-10-20T11:30:00Z'
          },
          {
            id: 'block-2',
            organization_id: 'enterprise-ag',
            name: 'Northern Soybean Fields',
            description: 'Soybean rotation following corn',
            location_name: 'Northern Division',
            assigned_users: ['user-1', 'user-3', 'user-5'],
            crop_id: 'soybeans',
            crop_name: 'Soybeans',
            acres: 480,
            irrigation_methods: [
              { method: 'sprinkler' as const, stage: 'All stages', notes: 'Overhead sprinkler system' }
            ],
            soil_type: 'Silt Loam',
            date_planted: '2024-06-10',
            growth_stage: 'Pod Filling',
            system_efficiency: 85,
            water_allocation: 18.2,
            status: 'active' as const,
            notes: 'GMO resistant variety - good nodulation observed',
            created_at: '2024-06-10T07:30:00Z',
            updated_at: '2024-10-18T14:20:00Z'
          },
          {
            id: 'block-3',
            organization_id: 'enterprise-ag',
            name: 'South Processing Tomatoes',
            description: 'Contract tomatoes for processing',
            location_name: 'Southern Division',
            assigned_users: ['user-2', 'user-4', 'user-6'],
            crop_id: 'tomatoes',
            crop_name: 'Tomatoes',
            acres: 320,
            irrigation_methods: [
              { method: 'sprinkler' as const, stage: 'Initial', notes: 'Sprinkler for germination' },
              { method: 'drip' as const, stage: 'Development', notes: 'Transitioned to drip for efficiency' }
            ],
            soil_type: 'Sandy Clay Loam',
            date_planted: '2024-04-20',
            growth_stage: 'Harvest',
            system_efficiency: 90,
            water_allocation: 15.8,
            status: 'harvested' as const,
            notes: 'Delivered 42 tons/acre to ConAgra processing plant',
            created_at: '2024-04-20T05:45:00Z',
            updated_at: '2024-10-15T18:00:00Z'
          }
        ];

      default:
        return [];
    }
  }, [organization?.id]);

  // Load field blocks from localStorage or fallback to generated ones
  const getInitialFieldBlocks = () => {
    if (propFieldBlocks.length > 0) return propFieldBlocks;
    
    if (organization?.id) {
      const storageKey = `fieldBlocks_${organization.id}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          console.log('📍 Loaded', parsed.length, 'field blocks from localStorage for', organization.id);
          return parsed;
        } catch (error) {
          console.error('Error parsing saved field blocks:', error);
        }
      }
    }
    
    return getOrganizationFieldBlocks;
  };

  const [localFieldBlocks, setLocalFieldBlocks] = useState<FieldBlock[]>(getInitialFieldBlocks());

  // Update local field blocks when prop or organization changes
  React.useEffect(() => {
    const newFieldBlocks = getInitialFieldBlocks();
    setLocalFieldBlocks(newFieldBlocks);
  }, [organization?.id, propFieldBlocks]);

  const filteredBlocks = localFieldBlocks.filter(block => {
    const matchesStatus = filterStatus === 'all' || block.status === filterStatus;
    const matchesSearch = searchTerm === '' || 
      block.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      block.crop_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      block.location_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Only show field blocks with crops that exist in organization's crop distribution
    const cropAvailable = organization?.cropDistribution?.some(crop => 
      crop.name.toLowerCase() === block.crop_name.toLowerCase()
    ) ?? true; // Show all if no crop distribution defined
    
    return matchesStatus && matchesSearch && cropAvailable;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'dormant': return 'bg-yellow-100 text-yellow-800';
      case 'harvested': return 'bg-blue-100 text-blue-800';
      case 'preparation': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUserNames = (userIds: string[]) => {
    return userIds.map(id => users.find(u => u.id === id)?.name || 'Unknown').join(', ');
  };

  const handleSaveBlock = (blockData: Partial<FieldBlock>) => {
    let updatedBlock: FieldBlock;
    let updatedBlocks: FieldBlock[];
    
    if (editingBlock) {
      // Update existing block
      updatedBlock = { ...editingBlock, ...blockData, updated_at: new Date().toISOString() };
      updatedBlocks = localFieldBlocks.map(block => 
        block.id === editingBlock.id ? updatedBlock : block
      );
      setLocalFieldBlocks(updatedBlocks);
    } else {
      // Create new block
      updatedBlock = {
        id: `block-${Date.now()}`,
        organization_id: organization?.id || 'local-org',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...blockData
      } as FieldBlock;
      updatedBlocks = [...localFieldBlocks, updatedBlock];
      setLocalFieldBlocks(updatedBlocks);
    }

    // Persist to localStorage
    if (organization?.id) {
      const storageKey = `fieldBlocks_${organization.id}`;
      localStorage.setItem(storageKey, JSON.stringify(updatedBlocks));
      console.log('💾 Saved field blocks to localStorage:', updatedBlocks.length, 'blocks');
    }

    // Notify parent component of the update
    if (onFieldBlockUpdate) {
      onFieldBlockUpdate(updatedBlock);
    }

    setShowModal(false);
    setEditingBlock(null);
  };

  const handleDeleteBlock = (blockId: string) => {
    if (confirm('Are you sure you want to delete this field block?')) {
      const updatedBlocks = localFieldBlocks.filter(block => block.id !== blockId);
      setLocalFieldBlocks(updatedBlocks);
      
      // Persist deletion to localStorage
      if (organization?.id) {
        const storageKey = `fieldBlocks_${organization.id}`;
        localStorage.setItem(storageKey, JSON.stringify(updatedBlocks));
        console.log('🗑️ Deleted field block:', blockId, 'Remaining blocks:', updatedBlocks.length);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">
            {organization?.name || 'Organization'} - Field Blocks
          </h2>
          <p className="text-gray-400">
            Manage {organization?.name || 'organization'} field assignments, crops, and irrigation schedules
          </p>
        </div>
        <button
          onClick={() => {
            setEditingBlock(null);
            setShowModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Field Block</span>
        </button>
      </div>

      {/* Quick Assignment from Dashboard/Calculator */}
      {(selectedCrops.length > 0 || calculatorResult) && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
            <Plus className="h-5 w-5 text-green-600 dark:text-green-400" />
            <span>Quick Assignment from Dashboard</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Available Crops for Assignment */}
            {selectedCrops.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Selected Crops ({selectedCrops.length})</h4>
                <div className="space-y-2">
                  {selectedCrops.slice(0, 4).map((crop, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 rounded p-3">
                      <div className="flex items-center space-x-2">
                        <Sprout className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <span className="text-gray-900 dark:text-white text-sm">{crop}</span>
                      </div>
                      <button
                        onClick={() => {
                          // Pre-fill new block form with this crop
                          setEditingBlock(null);
                          setShowModal(true);
                          // You could pre-populate form data here
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs transition-colors"
                      >
                        Assign to Block
                      </button>
                    </div>
                  ))}
                  {selectedCrops.length > 4 && (
                    <div className="text-sm text-gray-400 text-center">
                      +{selectedCrops.length - 4} more crops available
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Calculator Results for Assignment */}
            {calculatorResult && calculatorInputs?.crop && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
                  <Calculator className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span>Calculator Results</span>
                </h4>
                <div className="bg-gray-100 dark:bg-gray-700 rounded p-4 border border-gray-200 dark:border-gray-600">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Crop:</span>
                      <span className="text-gray-900 dark:text-white font-medium">{calculatorInputs.crop}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Daily Need:</span>
                      <span className="text-blue-400">{calculatorResult.dailyWaterNeed.toFixed(1)} gal</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Runtime:</span>
                      <span className="text-blue-400">{calculatorResult.runtimeHours}h {calculatorResult.runtimeMinutes}m</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">System Efficiency:</span>
                      <span className="text-green-400">{calculatorResult.efficiency}%</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      // Pre-fill new block form with calculator data
                      setEditingBlock(null);
                      setShowModal(true);
                      // You could pre-populate form data with calculator results
                    }}
                    className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm transition-colors"
                  >
                    Create Block with These Settings
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="dormant">Dormant</option>
            <option value="harvested">Harvested</option>
            <option value="preparation">Preparation</option>
          </select>
        </div>
        <input
          type="text"
          placeholder="Search blocks, crops, or locations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white text-sm flex-1 max-w-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{localFieldBlocks.length}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Blocks</div>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {localFieldBlocks.reduce((sum: number, block: FieldBlock) => sum + block.acres, 0)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Acres</div>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {localFieldBlocks.filter((block: FieldBlock) => block.status === 'active').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Active Blocks</div>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {localFieldBlocks.reduce((sum: number, block: FieldBlock) => sum + block.water_allocation, 0).toFixed(1)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Water (AF)</div>
        </div>
      </div>

      {/* Field Blocks Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredBlocks.map((block) => (
          <div key={block.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{block.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{block.description}</p>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => {
                    setEditingBlock(block);
                    setShowModal(true);
                  }}
                  className="p-1 text-gray-400 hover:text-blue-400 transition-colors"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteBlock(block.id)}
                  className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(block.status)}`}>
                  {block.status}
                </span>
                <span className="text-sm text-gray-400">{block.acres} acres</span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-300">{block.location_name}</span>
                </div>
                {block.address && (
                  <div className="flex items-center space-x-2 ml-6">
                    <span className="text-gray-400 text-xs">📍 {block.address}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <Sprout className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-300">{block.crop_name} • {block.growth_stage}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Droplets className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-300">
                    {block.irrigation_methods.length > 0 
                      ? block.irrigation_methods.map(m => m.method).join(', ') 
                      : 'Not specified'} • {block.system_efficiency}% eff
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-300 truncate">{getUserNames(block.assigned_users)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-300">Planted {new Date(block.date_planted).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-600">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Water Allocation:</span>
                  <span className="text-white">{block.water_allocation} AF</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Soil Type:</span>
                  <span className="text-white">{block.soil_type}</span>
                </div>
              </div>

              {block.notes && (
                <div className="pt-2 border-t border-gray-600">
                  <p className="text-xs text-gray-400">{block.notes}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Field Block Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {editingBlock ? 'Edit Field Block' : 'Create New Field Block'}
            </h3>
            {!editingBlock && selectedLocation && (
              <div className="mb-4 p-3 bg-blue-900/30 border border-blue-700/50 rounded-lg">
                <p className="text-blue-200 text-sm">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Default location: <span className="font-medium">{selectedLocation.name}</span>
                </p>
              </div>
            )}
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              
              // Process irrigation methods from checkboxes
              const selectedMethods = formData.getAll('irrigation_methods') as string[];
              const irrigationMethods = selectedMethods.map(method => ({
                method: method as 'drip' | 'sprinkler' | 'flood' | 'micro-spray' | 'surface',
                stage: 'All stages',
                notes: `${method.charAt(0).toUpperCase() + method.slice(1)} irrigation`
              }));
              
              const blockData = {
                name: formData.get('name') as string,
                description: formData.get('description') as string,
                location_name: formData.get('location_name') as string,
                crop_name: formData.get('crop_name') as string,
                acres: parseFloat(formData.get('acres') as string) || 0,
                irrigation_methods: irrigationMethods,
                soil_type: formData.get('soil_type') as string,
                date_planted: formData.get('date_planted') as string,
                growth_stage: formData.get('growth_stage') as string,
                system_efficiency: parseFloat(formData.get('system_efficiency') as string) || 90,
                water_allocation: parseFloat(formData.get('water_allocation') as string) || 0,
                status: formData.get('status') as any,
                notes: formData.get('notes') as string,
                assigned_users: ['user-1'] // Simplified for demo
              };
              handleSaveBlock(blockData);
            }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Block Name *</label>
                  <input
                    name="name"
                    type="text"
                    defaultValue={editingBlock?.name || ''}
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Location</label>
                  <select
                    name="location_name"
                    defaultValue={editingBlock?.location_name || selectedLocation?.name || ''}
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {availableLocations && availableLocations.length > 0 ? (
                      availableLocations.map((location: any) => (
                        <option key={location.id} value={location.name}>
                          {location.name}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="Salinas Valley Farm">Salinas Valley Farm</option>
                        <option value="Fresno County Field">Fresno County Field</option>
                      </>
                    )}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Field Address (Optional)</label>
                  <input
                    name="address"
                    type="text"
                    defaultValue={editingBlock?.address || ''}
                    placeholder="Street address, coordinates, or field identifier"
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Crop</label>
                  <select
                    name="crop_name"
                    defaultValue={editingBlock?.crop_name || ''}
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Crop (Optional)</option>
                    {COMPREHENSIVE_CROP_DATABASE.map(crop => (
                      <option key={crop.id} value={crop.name}>{crop.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Acres</label>
                  <input
                    name="acres"
                    type="number"
                    step="0.1"
                    defaultValue={editingBlock?.acres || ''}
                    placeholder="Enter acreage (optional)"
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Irrigation Methods</label>
                  <div className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Select irrigation methods used in this field block:</p>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="irrigation_methods"
                          value="drip"
                          defaultChecked={editingBlock?.irrigation_methods?.some(m => m.method === 'drip') || false}
                          className="text-blue-600 bg-gray-700 border-gray-600 rounded"
                        />
                        <span className="text-gray-900 dark:text-white">Drip</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="irrigation_methods"
                          value="micro-spray"
                          defaultChecked={editingBlock?.irrigation_methods?.some(m => m.method === 'micro-spray') || false}
                          className="text-blue-600 bg-gray-700 border-gray-600 rounded"
                        />
                        <span className="text-gray-900 dark:text-white">Micro-spray</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="irrigation_methods"
                          value="sprinkler"
                          defaultChecked={editingBlock?.irrigation_methods?.some(m => m.method === 'sprinkler') || false}
                          className="text-blue-600 bg-gray-700 border-gray-600 rounded"
                        />
                        <span className="text-gray-900 dark:text-white">Sprinkler</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="irrigation_methods"
                          value="surface"
                          defaultChecked={editingBlock?.irrigation_methods?.some(m => m.method === 'surface') || false}
                          className="text-blue-600 bg-gray-700 border-gray-600 rounded"
                        />
                        <span className="text-gray-900 dark:text-white">Surface/Flood</span>
                      </label>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-500 mt-2">
                      Select multiple methods if the field uses different irrigation at different growth stages
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Soil Type</label>
                  <select
                    name="soil_type"
                    defaultValue={editingBlock?.soil_type || ''}
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Soil Type</option>
                    {SOIL_DATABASE.map(soil => (
                      <option key={soil.id} value={soil.name}>{soil.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date Planted</label>
                  <input
                    name="date_planted"
                    type="date"
                    defaultValue={editingBlock?.date_planted || ''}
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Growth Stage</label>
                  <select
                    name="growth_stage"
                    defaultValue={editingBlock?.growth_stage || ''}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="Germination">Germination</option>
                    <option value="Seedling">Seedling</option>
                    <option value="Vegetative">Vegetative</option>
                    <option value="Flowering">Flowering</option>
                    <option value="Fruiting">Fruiting</option>
                    <option value="Maturity">Maturity</option>
                    <option value="Dormant">Dormant</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">System Efficiency (%)</label>
                  <input
                    name="system_efficiency"
                    type="number"
                    min="50"
                    max="100"
                    defaultValue={editingBlock?.system_efficiency || 90}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Water Allocation (AF)</label>
                  <input
                    name="water_allocation"
                    type="number"
                    step="0.1"
                    defaultValue={editingBlock?.water_allocation || ''}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                  <select
                    name="status"
                    defaultValue={editingBlock?.status || 'active'}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="active">Active</option>
                    <option value="dormant">Dormant</option>
                    <option value="harvested">Harvested</option>
                    <option value="preparation">Preparation</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  name="description"
                  rows={2}
                  defaultValue={editingBlock?.description || ''}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
                <textarea
                  name="notes"
                  rows={2}
                  defaultValue={editingBlock?.notes || ''}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingBlock(null);
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingBlock ? 'Update Block' : 'Create Block'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};