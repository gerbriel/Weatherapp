import React, { useState } from 'react';
import { Search, X, Sprout, Filter, Check, Plus } from 'lucide-react';
import { COMPREHENSIVE_CROP_DATABASE, getCropsByCategory, type AvailableCrop } from '../data/crops';

interface AdminCropSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  availableLocations: Array<{ id: string; name: string }>;
  onAddCrops: (crops: AvailableCrop[], locationIds: string[]) => Promise<void>;
}

export const AdminCropSelector: React.FC<AdminCropSelectorProps> = ({
  isOpen,
  onClose,
  availableLocations,
  onAddCrops
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedCrops, setSelectedCrops] = useState<Set<string>>(new Set());
  const [selectedLocations, setSelectedLocations] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const cropsByCategory = getCropsByCategory();
  const categories = ['All', ...Object.keys(cropsByCategory)];

  // Filter crops based on search and category
  const filteredCrops = COMPREHENSIVE_CROP_DATABASE.filter(crop => {
    const matchesSearch = crop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         crop.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         crop.scientificName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || crop.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleToggleCrop = (cropId: string) => {
    const newSelected = new Set(selectedCrops);
    if (newSelected.has(cropId)) {
      newSelected.delete(cropId);
    } else {
      newSelected.add(cropId);
    }
    setSelectedCrops(newSelected);
  };

  const handleToggleLocation = (locationId: string) => {
    const newSelected = new Set(selectedLocations);
    if (newSelected.has(locationId)) {
      newSelected.delete(locationId);
    } else {
      newSelected.add(locationId);
    }
    setSelectedLocations(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedCrops.size === filteredCrops.length) {
      setSelectedCrops(new Set());
    } else {
      setSelectedCrops(new Set(filteredCrops.map(c => c.id)));
    }
  };

  const handleSelectAllLocations = () => {
    if (selectedLocations.size === availableLocations.length) {
      setSelectedLocations(new Set());
    } else {
      setSelectedLocations(new Set(availableLocations.map(l => l.id)));
    }
  };

  const handleClearAll = () => {
    setSelectedCrops(new Set());
  };

  const handleApply = async () => {
    if (selectedCrops.size === 0 || selectedLocations.size === 0) return;

    setLoading(true);
    try {
      const cropsToAdd = COMPREHENSIVE_CROP_DATABASE.filter(c => selectedCrops.has(c.id));
      await onAddCrops(cropsToAdd, Array.from(selectedLocations));
      
      // Reset and close
      setSelectedCrops(new Set());
      setSelectedLocations(new Set());
      setSearchQuery('');
      setSelectedCategory('All');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-green-600 to-emerald-600">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Sprout className="w-7 h-7 text-white mr-3" />
              <div>
                <h2 className="text-xl font-semibold text-white">Quick Crop Selection</h2>
                <p className="text-sm text-green-100">
                  {selectedCrops.size} of {filteredCrops.length} crops active • Click pill to toggle selection
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-1"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Action Buttons Row */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={handleSelectAll}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
            >
              {selectedCrops.size === filteredCrops.length ? 'Clear All' : 'Select All'}
            </button>
            <button
              onClick={handleClearAll}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
            >
              Clear All
            </button>
          </div>

          {/* Search and Filter */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search crops by name, category, or scientific name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border-0 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-white" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-3 bg-white dark:bg-gray-800 border-0 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-white/50 min-w-[150px]"
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {selectedCategory !== 'All' && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{selectedCategory}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {filteredCrops.length} crops available in this category
              </p>
            </div>
          )}

          {/* Crops Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredCrops.map((crop) => {
              const isSelected = selectedCrops.has(crop.id);
              return (
                <div
                  key={crop.id}
                  className={`p-4 rounded-lg border-2 transition-all text-left relative ${
                    isSelected
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20 shadow-lg shadow-green-500/20'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm flex-1 pr-2">{crop.name}</h4>
                    <button
                      onClick={() => handleToggleCrop(crop.id)}
                      className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {isSelected ? (
                        <span className="flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Selected
                        </span>
                      ) : (
                        'Select'
                      )}
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">{crop.category}</p>
                    {crop.scientificName && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 italic">{crop.scientificName}</p>
                    )}
                    <p className="text-xs text-gray-600 dark:text-gray-400">{crop.stages.length} growth stages</p>
                    
                    {/* Kc Range */}
                    <div className="mt-3">
                      <div className="text-xs text-gray-500 mb-1">Kc Range:</div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600 dark:text-gray-400">
                          {Math.min(...crop.stages.map(s => s.kc)).toFixed(2)}
                        </span>
                        <div className="flex-1 mx-2 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full"
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

                    {/* Latest Stage */}
                    <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-900 rounded text-xs">
                      <div className="text-gray-600 dark:text-gray-400 mb-1">Latest Stage:</div>
                      <div className="text-gray-900 dark:text-white font-medium">
                        {crop.stages[crop.stages.length - 1].name}
                      </div>
                      <div className="text-gray-500 text-xs mt-0.5">
                        Kc: {crop.stages[crop.stages.length - 1].kc}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredCrops.length === 0 && (
            <div className="text-center py-16">
              <Sprout className="w-20 h-20 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No crops found</h3>
              <p className="text-gray-600 dark:text-gray-400">Try adjusting your search or category filter</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              {selectedCrops.size} crops selected
            </p>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Apply {selectedCrops.size} selected crop{selectedCrops.size !== 1 ? 's' : ''} to:
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleSelectAllLocations}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedLocations.size === availableLocations.length
                    ? 'bg-green-500 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {selectedLocations.size === availableLocations.length ? '✓ ' : ''}
                Apply to All Locations ({availableLocations.length})
              </button>
              {availableLocations.map(location => (
                <button
                  key={location.id}
                  onClick={() => handleToggleLocation(location.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedLocations.has(location.id)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {selectedLocations.has(location.id) && '✓ '}
                  {location.name}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {filteredCrops.length} of {COMPREHENSIVE_CROP_DATABASE.length} crops
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={selectedCrops.size === 0 || selectedLocations.size === 0 || loading}
                className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? 'Adding...' : `Add to ${selectedLocations.size} Location${selectedLocations.size !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
