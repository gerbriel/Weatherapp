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
  onClearAllLocations?: () => void;
  appliedLocations?: Set<string>;
  isApplyingToAll?: boolean;
  totalCropInstances?: number;
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
  onApplyToAllLocations,
  onClearAllLocations,
  appliedLocations = new Set(),
  isApplyingToAll = false,
  totalCropInstances = 0
}) => {
  // Deduplicate locations to fix count issue
  const uniqueLocations = locations.filter((location, index, self) => 
    index === self.findIndex((loc) => loc.id === location.id)
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showNewCropModal, setShowNewCropModal] = useState(false);
  const [showCropBrowserModal, setShowCropBrowserModal] = useState(false);
  const [cropBrowserSearch, setCropBrowserSearch] = useState('');
  const [cropBrowserCategory, setCropBrowserCategory] = useState<string>('All');
  const [selectedExistingCrop, setSelectedExistingCrop] = useState<AvailableCrop | null>(null);
  const [newCropData, setNewCropData] = useState({
    name: '',
    category: 'Other',
    scientificName: '',
    color: '#10B981',
    plantingType: 'annual' as 'annual' | 'perennial',
    monthlyKc: [] as Array<{month: number, monthName: string, kc: number}>,
    useMonthlyKc: false
  });
  
  const { addOrganizationCrop, organization } = useAuth();
  
  const handleAddNewCrop = async () => {
    if (!newCropData.name.trim()) return;
    
    try {
      await addOrganizationCrop({
        name: newCropData.name.trim(),
        acres: 10, // Default acres for new custom crops
        value: 50, // Default percentage value
        color: newCropData.color
      });
      
      // Reset form
      setNewCropData({ 
        name: '', 
        category: 'Other',
        scientificName: '',
        color: '#10B981',
        plantingType: 'annual',
        monthlyKc: [],
        useMonthlyKc: false
      });
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
        acres: 10, // Default acres
        value: 50, // Default percentage value
        color: newCropData.color
      });
      
      // Reset form
      setSelectedExistingCrop(null);
      setNewCropData({ 
        name: '', 
        category: 'Other',
        scientificName: '',
        color: '#10B981',
        plantingType: 'annual',
        monthlyKc: [],
        useMonthlyKc: false
      });
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
      <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Sprout className="w-6 h-6 text-green-600 dark:text-green-400 mr-3" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Quick Crop Selection</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
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
          <div className="space-y-3">
            {/* Search and Filter Row */}
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search crops..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 min-w-[150px]"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Action Buttons Row */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowNewCropModal(true)}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors whitespace-nowrap flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Custom Crop
              </button>
              <button
                onClick={onAddAllCrops}
                className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors whitespace-nowrap text-sm"
              >
                Select All
              </button>
              <button
                onClick={onRemoveAllCrops}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors whitespace-nowrap text-sm"
              >
                Clear All
              </button>
              {onClearAllLocations && totalCropInstances > 0 && (
                <button
                  onClick={onClearAllLocations}
                  className="px-4 py-2.5 bg-red-700 hover:bg-red-800 text-white rounded-lg transition-colors whitespace-nowrap flex items-center gap-2 text-sm"
                  title="Clear all crops from all locations"
                >
                  <X className="w-4 h-4" />
                  Clear All Locations
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1 min-h-0">
          {/* Category Statistics */}
          {selectedCategory !== 'All' && (
            <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{selectedCategory}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
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
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20 shadow-lg shadow-green-500/20'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-750'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm flex-1">{crop.name}</h4>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Pill-shaped Toggle - Made more prominent */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onCropToggle(crop.id);
                        }}
                        className={`px-3 py-1.5 rounded-full font-medium text-xs transition-all flex items-center gap-1.5 whitespace-nowrap ${
                          isSelected
                            ? 'bg-green-500 border-2 border-green-600 text-white shadow-lg shadow-green-500/40 hover:bg-green-600'
                            : 'bg-gray-100 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                        title={isSelected ? "Click to deselect" : "Click to select"}
                      >
                        <span>{isSelected ? 'Selected' : 'Select'}</span>
                        {isSelected && <Check className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">{crop.category}</p>
                    {crop.scientificName && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 italic">{crop.scientificName}</p>
                    )}
                    <p className="text-xs text-gray-600 dark:text-gray-400">{crop.stages.length} growth stages</p>
                    
                    {/* Stage Preview */}
                    <div className="mt-3">
                      <div className="text-xs text-gray-500 mb-1">Kc Range:</div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600 dark:text-gray-400">
                          {Math.min(...crop.stages.map(s => s.kc)).toFixed(2)}
                        </span>
                        <div className="flex-1 mx-2 h-1 bg-gray-200 dark:bg-gray-700 rounded">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded"
                            style={{ 
                              width: `${(Math.max(...crop.stages.map(s => s.kc)) / 1.5) * 100}%` 
                            }}
                          />
                        </div>
                        <span className="text-gray-600 dark:text-gray-400">
                          {Math.max(...crop.stages.map(s => s.kc)).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Most recent stage info */}
                    <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-900 rounded text-xs">
                      <div className="text-gray-600 dark:text-gray-400 mb-1">Latest Stage:</div>
                      <div className="text-gray-900 dark:text-white font-medium">
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
              <Sprout className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No crops found</h3>
              <p className="text-gray-600 dark:text-gray-400">Try adjusting your search or category filter</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex-shrink-0">
          <div className="space-y-4">
            {/* Selection Status - Always visible */}
            <div className={`p-3 rounded-lg border ${
              selectedCrops.length > 0 
                ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700' 
                : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {selectedCrops.length > 0 
                    ? `${selectedCrops.length} crop${selectedCrops.length !== 1 ? 's' : ''} selected` 
                    : 'Click "Select" on crops above to get started'}
                </span>
                {selectedCrops.length > 0 && uniqueLocations.length > 0 && (
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Ready to apply to locations below ↓
                  </span>
                )}
              </div>
            </div>

            {/* Apply to Locations Section */}
            {selectedCrops.length > 0 && uniqueLocations.length > 0 && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded-lg">
                <h4 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-3">
                  Apply {selectedCrops.length} selected crop{selectedCrops.length !== 1 ? 's' : ''} to:
                </h4>
                
                {/* All Locations Button */}
                {onApplyToAllLocations && (
                  <div className="mb-3">
                    <button
                      onClick={() => onApplyToAllLocations(selectedCrops)}
                      disabled={isApplyingToAll}
                      className={`px-4 py-2 text-white text-sm rounded-lg transition-all duration-300 font-medium flex items-center gap-2 transform ${
                        isApplyingToAll 
                          ? 'bg-gradient-to-r from-green-600 to-emerald-600 cursor-not-allowed scale-105 shadow-lg' 
                          : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 hover:scale-105 hover:shadow-lg'
                      }`}
                    >
                      {isApplyingToAll && (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-1"></div>
                          <div className="flex space-x-1">
                            <div className="w-1 h-1 bg-white rounded-full animate-bounce"></div>
                            <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      )}
                      <span>{isApplyingToAll ? 'Applying to All Locations...' : `Apply to All Locations (${uniqueLocations.length})`}</span>
                    </button>
                  </div>
                )}

                {/* Individual Location Selection */}
                <div className="space-y-1.5">
                  <div className="text-xs text-blue-300 font-medium">Or select specific locations:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {uniqueLocations.map(location => {
                      const isApplied = appliedLocations.has(location.id);
                      return (
                        <button
                          key={location.id}
                          onClick={() => onApplyToLocation && onApplyToLocation(location.id, selectedCrops)}
                          className={`px-2.5 py-1 text-xs rounded-full transition-all duration-300 ${
                            isApplied 
                              ? 'bg-green-500/60 text-white font-medium shadow-md' 
                              : 'bg-blue-700/40 text-blue-100 hover:bg-blue-600/50'
                          }`}
                          title={`Apply crops to ${location.name}`}
                        >
                          <div className="flex items-center gap-1">
                            <span>{location.name}</span>
                            {isApplied && (
                              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        </button>
                      );
                    })}
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
          <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Add Custom Crop</h3>
                <button
                  onClick={() => setShowNewCropModal(false)}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Crop Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Crop Name <span className="text-red-600 dark:text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={newCropData.name}
                  onChange={(e) => setNewCropData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Heirloom Tomatoes"
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>
              
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={newCropData.category}
                  onChange={(e) => setNewCropData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Vegetables">Vegetables</option>
                  <option value="Tree Fruits">Tree Fruits</option>
                  <option value="Tree Nuts">Tree Nuts</option>
                  <option value="Grapes">Grapes</option>
                  <option value="Berries">Berries</option>
                  <option value="Field Crops">Field Crops</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Scientific Name (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Scientific Name <span className="text-gray-500 text-xs">(optional)</span>
                </label>
                <input
                  type="text"
                  value={newCropData.scientificName}
                  onChange={(e) => setNewCropData(prev => ({ ...prev, scientificName: e.target.value }))}
                  placeholder="e.g., Solanum lycopersicum"
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Planting Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Planting Type
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      value="annual"
                      checked={newCropData.plantingType === 'annual'}
                      onChange={(e) => setNewCropData(prev => ({ ...prev, plantingType: e.target.value as 'annual' | 'perennial' }))}
                      className="mr-2"
                    />
                    <span className="text-white">Annual (planted yearly)</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      value="perennial"
                      checked={newCropData.plantingType === 'perennial'}
                      onChange={(e) => setNewCropData(prev => ({ ...prev, plantingType: e.target.value as 'annual' | 'perennial' }))}
                      className="mr-2"
                    />
                    <span className="text-white">Perennial (multi-year)</span>
                  </label>
                </div>
              </div>
              
              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Display Color
                </label>
                <div className="flex gap-2">
                  {['#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#3B82F6', '#6B7280'].map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewCropData(prev => ({ ...prev, color }))}
                      className={`w-10 h-10 rounded-full border-2 transition-all ${
                        newCropData.color === color ? 'border-white scale-110' : 'border-gray-600 hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Monthly Kc Values Toggle */}
              <div className="border-t border-gray-700 pt-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newCropData.useMonthlyKc}
                    onChange={(e) => setNewCropData(prev => ({ 
                      ...prev, 
                      useMonthlyKc: e.target.checked,
                      monthlyKc: e.target.checked ? [
                        {month: 1, monthName: "January", kc: 0.5},
                        {month: 2, monthName: "February", kc: 0.5},
                        {month: 3, monthName: "March", kc: 0.6},
                        {month: 4, monthName: "April", kc: 0.7},
                        {month: 5, monthName: "May", kc: 0.8},
                        {month: 6, monthName: "June", kc: 0.9},
                        {month: 7, monthName: "July", kc: 1.0},
                        {month: 8, monthName: "August", kc: 1.0},
                        {month: 9, monthName: "September", kc: 0.9},
                        {month: 10, monthName: "October", kc: 0.7},
                        {month: 11, monthName: "November", kc: 0.6},
                        {month: 12, monthName: "December", kc: 0.5}
                      ] : []
                    }))}
                    className="mr-3"
                  />
                  <div>
                    <span className="text-gray-900 dark:text-white font-medium">Add Monthly Kc Values</span>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Set target crop coefficients for each month (advanced)</p>
                  </div>
                </label>

                {/* Monthly Kc Input Grid */}
                {newCropData.useMonthlyKc && (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3 p-4 bg-gray-100 dark:bg-gray-800/50 rounded-lg">
                    {newCropData.monthlyKc.map((monthData, index) => (
                      <div key={monthData.month} className="flex items-center gap-2">
                        <label className="text-xs text-gray-600 dark:text-gray-400 w-16">{monthData.monthName.substring(0, 3)}:</label>
                        <input
                          type="number"
                          value={monthData.kc}
                          onChange={(e) => {
                            const updatedMonthly = [...newCropData.monthlyKc];
                            updatedMonthly[index] = { ...updatedMonthly[index], kc: parseFloat(e.target.value) || 0 };
                            setNewCropData(prev => ({ ...prev, monthlyKc: updatedMonthly }));
                          }}
                          step="0.01"
                          min="0"
                          max="2"
                          className="w-20 px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white text-sm focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowNewCropModal(false)}
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddNewCrop}
                  disabled={!newCropData.name.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
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
          <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Browse Existing Crops</h3>
                <button
                  onClick={() => setShowCropBrowserModal(false)}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
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
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  />
                </div>
                
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    value={cropBrowserCategory}
                    onChange={(e) => setCropBrowserCategory(e.target.value)}
                    className="pl-10 pr-8 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 appearance-none"
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
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                          : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white">{crop.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{crop.category}</p>
                          <div className="mt-2">
                            <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                              {crop.stages.length} growth stages
                            </span>
                          </div>
                        </div>
                        {selectedExistingCrop?.id === crop.id && (
                          <Check className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Sprout className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">No crops found</h3>
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
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Configure {selectedExistingCrop.name}
                </h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Display Color
                  </label>
                  <div className="flex gap-2">
                    {['#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#3B82F6', '#6B7280'].map((color) => (
                      <button
                        key={color}
                        onClick={() => setNewCropData(prev => ({ ...prev, color }))}
                        className={`w-10 h-10 rounded-full border-2 transition-all ${
                          newCropData.color === color ? 'border-white scale-110' : 'border-gray-600 hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
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
                    setNewCropData({ 
                      name: '', 
                      category: 'Other',
                      scientificName: '',
                      color: '#10B981',
                      plantingType: 'annual',
                      monthlyKc: [],
                      useMonthlyKc: false
                    });
                  }}
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddExistingCrop}
                  disabled={!selectedExistingCrop}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
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