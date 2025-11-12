import React, { useState } from 'react';
import { Search, X, Sprout, Filter, Check, Plus } from 'lucide-react';
import { getCropsByCategory, type AvailableCrop, COMPREHENSIVE_CROP_DATABASE } from '../data/crops';
import { useAuth } from '../contexts/AuthContext';

interface CropManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableCrops: AvailableCrop[];
  selectedCrops: string[];
  onCropToggle: (cropId: string) => void;
  onAddAllCrops: () => void;
  onRemoveAllCrops: () => void;
  locations?: any[];
  onApplyToLocation?: (locationId: string, cropIds: string[]) => void;
  onApplyToAllLocations?: (cropIds: string[]) => void;
}

export const CropManagementModal: React.FC<CropManagementModalProps> = ({
  isOpen,
  onClose,
  availableCrops,
  selectedCrops,
  onCropToggle,
  onAddAllCrops,
  onRemoveAllCrops,
  locations = [],
  onApplyToLocation,
  onApplyToAllLocations
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showNewCropModal, setShowNewCropModal] = useState(false);
  const [showCropBrowserModal, setShowCropBrowserModal] = useState(false);
  const [cropBrowserSearch, setCropBrowserSearch] = useState('');
  const [cropBrowserCategory, setCropBrowserCategory] = useState<string>('All');
  const [selectedExistingCrop, setSelectedExistingCrop] = useState<AvailableCrop | null>(null);
  const [newCropData, setNewCropData] = useState({
    name: '',
    acres: 0,
    color: '#10B981'
  });
  
  const { addOrganizationCrop, organization } = useAuth();
  
  const handleAddNewCrop = async () => {
    if (!newCropData.name.trim()) return;
    
    try {
      await addOrganizationCrop({
        name: newCropData.name.trim(),
        acres: newCropData.acres,
        value: Math.round((newCropData.acres / (newCropData.acres + 100)) * 100), // Calculate percentage
        color: newCropData.color
      });
      
      // Reset form
      setNewCropData({ name: '', acres: 0, color: '#10B981' });
      setShowNewCropModal(false);
      
      // Trigger a refresh of available crops
      window.location.reload(); // Simple refresh - in production would use proper state management
    } catch (error) {
      console.error('Error adding new crop:', error);
    }
  };

  const handleAddExistingCrop = async () => {
    if (!selectedExistingCrop) return;
    
    try {
      await addOrganizationCrop({
        name: selectedExistingCrop.name,
        acres: newCropData.acres || 10, // Default acres if not specified
        value: Math.round((newCropData.acres || 10) / ((newCropData.acres || 10) + 100) * 100),
        color: newCropData.color
      });
      
      // Reset form
      setSelectedExistingCrop(null);
      setNewCropData({ name: '', acres: 0, color: '#10B981' });
      setShowCropBrowserModal(false);
      
      // Trigger a refresh
      window.location.reload();
    } catch (error) {
      console.error('Error adding existing crop:', error);
    }
  };

  // Get crops not already in organization
  const getAvailableCropsToAdd = () => {
    const orgCropNames = organization?.cropDistribution?.map(crop => crop.name.toLowerCase()) || [];
    return COMPREHENSIVE_CROP_DATABASE.filter(crop => 
      !orgCropNames.includes(crop.name.toLowerCase())
    );
  };

  // Filter crops for browser
  const filteredBrowserCrops = getAvailableCropsToAdd().filter(crop => {
    const matchesSearch = crop.name.toLowerCase().includes(cropBrowserSearch.toLowerCase()) ||
                         crop.category.toLowerCase().includes(cropBrowserSearch.toLowerCase());
    const matchesCategory = cropBrowserCategory === 'All' || crop.category === cropBrowserCategory;
    return matchesSearch && matchesCategory;
  });
  
  if (!isOpen) return null;

  const cropsByCategory = getCropsByCategory();
  const categories = ['All', ...Object.keys(cropsByCategory)];

  // Filter crops based on search and category
  const filteredCrops = availableCrops.filter(crop => {
    const matchesSearch = crop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         crop.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || crop.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const selectedCount = selectedCrops.length;
  const totalCount = availableCrops.length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Sprout className="w-6 h-6 text-green-400 mr-3" />
              <div>
                <h2 className="text-xl font-semibold text-white">Quick Crop Selection</h2>
                <p className="text-sm text-gray-400">
                  {selectedCount} of {totalCount} crops active • Click pill to toggle selection
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Search and Controls */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search crops..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowCropBrowserModal(true)}
                className="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors whitespace-nowrap flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                Browse Existing
              </button>
              <button
                onClick={() => setShowNewCropModal(true)}
                className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors whitespace-nowrap flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Custom
              </button>
              <button
                onClick={onAddAllCrops}
                className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors whitespace-nowrap"
              >
                Select All
              </button>
              <button
                onClick={onRemoveAllCrops}
                className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors whitespace-nowrap"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1 min-h-0">
          {/* Quick Add Info */}
          <div className="mb-6 p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="p-1 bg-blue-900 rounded">
                <Sprout className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <h3 className="text-blue-300 font-medium text-sm">Quick Selection Mode</h3>
                <p className="text-blue-200 text-xs mt-1">
                  Toggle pills to select crops, then apply to specific locations or all locations at once.
                </p>
              </div>
            </div>
          </div>

          {/* Category Statistics */}
          {selectedCategory !== 'All' && (
            <div className="mb-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-2">{selectedCategory}</h3>
              <p className="text-sm text-gray-400">
                {cropsByCategory[selectedCategory]?.length || 0} crops available in this category
              </p>
            </div>
          )}

          {/* Crops Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredCrops.map((crop) => {
              const isSelected = selectedCrops.includes(crop.id);
              return (
                <div
                  key={crop.id}
                  className={`p-4 rounded-lg border-2 transition-all hover:scale-[1.02] ${
                    isSelected
                      ? 'border-green-500 bg-green-900/20 shadow-lg shadow-green-500/20'
                      : 'border-gray-600 bg-gray-800 hover:border-gray-500 hover:bg-gray-750'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-white text-sm">{crop.name}</h4>
                    <div className="flex items-center space-x-2">
                      {/* Pill-shaped Toggle */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onCropToggle(crop.id);
                        }}
                        className={`w-8 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-green-500 border-green-500 shadow-lg shadow-green-500/30'
                            : 'border-gray-400 hover:border-gray-300 hover:bg-gray-700'
                        }`}
                        title={isSelected ? "Remove from selection" : "Add to selection"}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </button>
                      

                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-xs text-blue-400 font-medium">{crop.category}</p>
                    {crop.scientificName && (
                      <p className="text-xs text-gray-500 italic">{crop.scientificName}</p>
                    )}
                    <p className="text-xs text-gray-400">{crop.stages.length} growth stages</p>
                    
                    {/* Stage Preview */}
                    <div className="mt-3">
                      <div className="text-xs text-gray-500 mb-1">Kc Range:</div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">
                          {Math.min(...crop.stages.map(s => s.kc)).toFixed(2)}
                        </span>
                        <div className="flex-1 mx-2 h-1 bg-gray-700 rounded">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded"
                            style={{ 
                              width: `${(Math.max(...crop.stages.map(s => s.kc)) / 1.5) * 100}%` 
                            }}
                          />
                        </div>
                        <span className="text-gray-400">
                          {Math.max(...crop.stages.map(s => s.kc)).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Most recent stage info */}
                    <div className="mt-2 p-2 bg-gray-900 rounded text-xs">
                      <div className="text-gray-400 mb-1">Latest Stage:</div>
                      <div className="text-white font-medium">
                        {crop.stages[crop.stages.length - 1].name}
                      </div>
                      <div className="text-gray-500 text-xs">
                        Kc: {crop.stages[crop.stages.length - 1].kc}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredCrops.length === 0 && (
            <div className="text-center py-12">
              <Sprout className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No crops found</h3>
              <p className="text-gray-400">Try adjusting your search or category filter</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 bg-gray-800 flex-shrink-0">
          <div className="space-y-4">
            {/* Apply to Locations Section */}
            {selectedCrops.length > 0 && locations.length > 1 && (
              <div className="p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
                <h4 className="text-sm font-medium text-blue-300 mb-3">
                  Apply {selectedCrops.length} selected crop{selectedCrops.length !== 1 ? 's' : ''} to:
                </h4>
                
                {/* All Locations Button */}
                {onApplyToAllLocations && (
                  <div className="mb-3">
                    <button
                      onClick={() => onApplyToAllLocations(selectedCrops)}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors font-medium"
                    >
                      Apply to All Locations ({locations.length})
                    </button>
                  </div>
                )}

                {/* Individual Location Selection */}
                <div className="space-y-2">
                  <div className="text-xs text-blue-300 font-medium">Or select specific locations:</div>
                  <div className="max-h-32 overflow-y-auto border border-blue-600 rounded-md">
                    {locations.map(location => (
                      <button
                        key={location.id}
                        onClick={() => onApplyToLocation && onApplyToLocation(location.id, selectedCrops)}
                        className="w-full text-left px-3 py-2 text-white text-sm hover:bg-blue-800/50 transition-colors border-b border-blue-700/50 last:border-b-0"
                        title={`Apply crops to ${location.name}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="truncate flex-1 mr-2">{location.name}</span>
                          <span className="text-xs text-blue-300 flex-shrink-0">Apply</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Showing {filteredCrops.length} of {totalCount} crops
              </div>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* New Crop Creation Modal */}
      {showNewCropModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60 p-4">
          <div className="bg-gray-900 rounded-lg w-full max-w-md">
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-white">Add New Crop</h3>
                <button
                  onClick={() => setShowNewCropModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Crop Name
                </label>
                <input
                  type="text"
                  value={newCropData.name}
                  onChange={(e) => setNewCropData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter crop name..."
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Acres
                </label>
                <input
                  type="number"
                  value={newCropData.acres}
                  onChange={(e) => setNewCropData(prev => ({ ...prev, acres: Number(e.target.value) }))}
                  placeholder="Enter acres..."
                  min="0"
                  step="0.1"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Color
                </label>
                <div className="flex gap-2">
                  {['#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#3B82F6', '#6B7280'].map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewCropData(prev => ({ ...prev, color }))}
                      className={`w-8 h-8 rounded-full border-2 ${
                        newCropData.color === color ? 'border-white' : 'border-gray-600'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-700">
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowNewCropModal(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddNewCrop}
                  disabled={!newCropData.name.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  Add Crop
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Crop Browser Modal */}
      {showCropBrowserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60 p-4">
          <div className="bg-gray-900 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-white">Browse Existing Crops</h3>
                <button
                  onClick={() => setShowCropBrowserModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <p className="text-gray-400 mt-2">
                Select from {getAvailableCropsToAdd().length} available crops not yet in your organization
              </p>
            </div>
            
            {/* Search and Filter */}
            <div className="p-6 border-b border-gray-700">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search available crops..."
                    value={cropBrowserSearch}
                    onChange={(e) => setCropBrowserSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  />
                </div>
                
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    value={cropBrowserCategory}
                    onChange={(e) => setCropBrowserCategory(e.target.value)}
                    className="pl-10 pr-8 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 appearance-none"
                  >
                    {['All', ...Object.keys(getCropsByCategory())].map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            {/* Available Crops Grid */}
            <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 350px)' }}>
              {filteredBrowserCrops.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredBrowserCrops.map((crop) => (
                    <div
                      key={crop.id}
                      onClick={() => setSelectedExistingCrop(crop)}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedExistingCrop?.id === crop.id
                          ? 'border-purple-500 bg-purple-900/20'
                          : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-white">{crop.name}</h4>
                          <p className="text-sm text-gray-400">{crop.category}</p>
                          <div className="mt-2">
                            <span className="text-xs bg-gray-700 px-2 py-1 rounded">
                              {crop.stages.length} growth stages
                            </span>
                          </div>
                        </div>
                        {selectedExistingCrop?.id === crop.id && (
                          <Check className="w-5 h-5 text-purple-400 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Sprout className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-400 mb-2">No crops found</h3>
                  <p className="text-gray-500">
                    {getAvailableCropsToAdd().length === 0 
                      ? "All available crops are already in your organization"
                      : "Try adjusting your search or category filter"
                    }
                  </p>
                </div>
              )}
            </div>

            {/* Selected Crop Configuration */}
            {selectedExistingCrop && (
              <div className="p-6 border-t border-gray-700 bg-gray-800">
                <h4 className="text-lg font-semibold text-white mb-4">
                  Configure {selectedExistingCrop.name}
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Acres
                    </label>
                    <input
                      type="number"
                      value={newCropData.acres}
                      onChange={(e) => setNewCropData(prev => ({ ...prev, acres: Number(e.target.value) }))}
                      placeholder="Enter acres..."
                      min="0"
                      step="0.1"
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Display Color
                    </label>
                    <div className="flex gap-2">
                      {['#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#3B82F6', '#6B7280'].map((color) => (
                        <button
                          key={color}
                          onClick={() => setNewCropData(prev => ({ ...prev, color }))}
                          className={`w-8 h-8 rounded-full border-2 ${
                            newCropData.color === color ? 'border-white' : 'border-gray-600'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Footer */}
            <div className="p-6 border-t border-gray-700">
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowCropBrowserModal(false);
                    setSelectedExistingCrop(null);
                    setNewCropData({ name: '', acres: 0, color: '#10B981' });
                  }}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddExistingCrop}
                  disabled={!selectedExistingCrop || newCropData.acres <= 0}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  Add {selectedExistingCrop?.name || 'Crop'} to Organization
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};