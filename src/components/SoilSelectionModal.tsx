import React, { useState } from 'react';
import { X, Droplets, TrendingDown, TrendingUp, Info, Search } from 'lucide-react';
import { SOIL_DATABASE, type SoilType } from '../data/soils';

interface SoilSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSoilId?: string;
  onSoilSelect: (soil: SoilType) => void;
}

export const SoilSelectionModal: React.FC<SoilSelectionModalProps> = ({
  isOpen,
  onClose,
  selectedSoilId,
  onSoilSelect
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  if (!isOpen) return null;

  const filteredSoils = SOIL_DATABASE.filter(soil => {
    const matchesSearch = soil.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         soil.texture.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         soil.characteristics.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || soil.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getDrainageIcon = (drainage: string) => {
    switch (drainage) {
      case 'poor': return <TrendingDown className="w-4 h-4 text-red-400" />;
      case 'moderate': return <TrendingUp className="w-4 h-4 text-yellow-400" />;
      case 'good': return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'excessive': return <TrendingUp className="w-4 h-4 text-blue-400" />;
      default: return <TrendingUp className="w-4 h-4 text-gray-400" />;
    }
  };

  const getDrainageColor = (drainage: string) => {
    switch (drainage) {
      case 'poor': return 'text-red-400';
      case 'moderate': return 'text-yellow-400';
      case 'good': return 'text-green-400';
      case 'excessive': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-amber-900 rounded-lg">
                <Droplets className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Select Soil Type</h2>
                <p className="text-sm text-gray-400">Choose your soil type for accurate irrigation calculations</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search soil types..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-amber-500"
              />
            </div>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Categories</option>
              <option value="clay">Clay Soils</option>
              <option value="loam">Loam Soils</option>
              <option value="sand">Sandy Soils</option>
              <option value="silt">Silt Soils</option>
              <option value="organic">Organic Soils</option>
            </select>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSoils.map((soil) => {
              const isSelected = selectedSoilId === soil.id;
              return (
                <div
                  key={soil.id}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:scale-[1.02] ${
                    isSelected
                      ? 'border-amber-500 bg-amber-900/20 shadow-lg shadow-amber-500/20'
                      : 'border-gray-600 bg-gray-800 hover:border-gray-500 hover:bg-gray-750'
                  }`}
                  onClick={() => onSoilSelect(soil)}
                >
                  {/* Soil Color Bar */}
                  <div 
                    className="w-full h-2 rounded-full mb-3"
                    style={{ backgroundColor: soil.color }}
                  />

                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-white text-sm">{soil.name}</h4>
                    <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-full">
                      {soil.category}
                    </span>
                  </div>

                  <p className="text-xs text-gray-400 mb-3">{soil.texture}</p>

                  {/* Key Characteristics Grid */}
                  <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                    <div className="bg-gray-900 p-2 rounded">
                      <div className="text-gray-500">Water Capacity</div>
                      <div className="text-white font-semibold">
                        {soil.characteristics.availableWaterCapacity}mm/m
                      </div>
                    </div>
                    <div className="bg-gray-900 p-2 rounded">
                      <div className="text-gray-500">Infiltration</div>
                      <div className="text-white font-semibold">
                        {soil.characteristics.infiltrationRate}mm/h
                      </div>
                    </div>
                  </div>

                  {/* Drainage */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-gray-500">Drainage:</span>
                    <div className="flex items-center space-x-1">
                      {getDrainageIcon(soil.characteristics.drainageRate)}
                      <span className={`text-xs font-medium ${getDrainageColor(soil.characteristics.drainageRate)}`}>
                        {soil.characteristics.drainageRate}
                      </span>
                    </div>
                  </div>

                  {/* Irrigation Factor */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">Irrigation Factor:</span>
                    <span className={`text-xs font-semibold ${
                      soil.characteristics.irrigationFactor > 1 
                        ? 'text-orange-400' 
                        : soil.characteristics.irrigationFactor < 0.9 
                        ? 'text-blue-400' 
                        : 'text-green-400'
                    }`}>
                      {soil.characteristics.irrigationFactor}x
                    </span>
                  </div>

                  {/* Common Crops */}
                  <div className="mb-3">
                    <div className="text-xs text-gray-500 mb-1">Common Crops:</div>
                    <div className="flex flex-wrap gap-1">
                      {soil.commonCrops.slice(0, 3).map((crop, index) => (
                        <span key={index} className="text-xs bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded">
                          {crop}
                        </span>
                      ))}
                      {soil.commonCrops.length > 3 && (
                        <span className="text-xs text-gray-500">+{soil.commonCrops.length - 3}</span>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-gray-400 line-clamp-2">
                    {soil.characteristics.description}
                  </p>

                  {isSelected && (
                    <div className="mt-3 p-2 bg-amber-900/50 border border-amber-600 rounded">
                      <div className="flex items-center space-x-2">
                        <Info className="w-3 h-3 text-amber-400 flex-shrink-0" />
                        <span className="text-xs text-amber-200">Selected for calculations</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {filteredSoils.length === 0 && (
            <div className="text-center py-12">
              <Droplets className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No Soil Types Found</h3>
              <p className="text-gray-400">
                Try adjusting your search or filter criteria
              </p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-700 bg-gray-800/50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              {filteredSoils.length} soil types available
            </div>
            <button
              onClick={onClose}
              className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};