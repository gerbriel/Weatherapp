import React, { useState } from 'react';
import { Search, X, Sprout, Filter, Check, Plus } from 'lucide-react';
import { getCropsByCategory, type AvailableCrop } from '../data/crops';

interface CropManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableCrops: AvailableCrop[];
  selectedCrops: string[];
  onCropToggle: (cropId: string) => void;
  onAddCropInstance: (crop: AvailableCrop) => void; // New prop for adding crop instances
  onAddAllCrops: () => void;
  onRemoveAllCrops: () => void;
}

export const CropManagementModal: React.FC<CropManagementModalProps> = ({
  isOpen,
  onClose,
  availableCrops,
  selectedCrops,
  onCropToggle,
  onAddCropInstance,
  onAddAllCrops,
  onRemoveAllCrops
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
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
      <div className="bg-gray-900 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Sprout className="w-6 h-6 text-green-400 mr-3" />
              <div>
                <h2 className="text-xl font-semibold text-white">Crop Management</h2>
                <p className="text-sm text-gray-400">
                  {selectedCount} of {totalCount} crops selected
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

        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
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
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddCropInstance(crop);
                        }}
                        className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-xs"
                        title="Add crop instance with planting date"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onCropToggle(crop.id);
                        }}
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-green-500 border-green-500'
                            : 'border-gray-400 hover:border-gray-300'
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
        <div className="p-6 border-t border-gray-700 bg-gray-800">
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
  );
};