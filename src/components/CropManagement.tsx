import React, { useState, useEffect } from 'react';
import { Sprout, Search, Calculator, Plus, Trash2, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLocations } from '../contexts/LocationsContext';
import type { LocationWithWeather } from '../types/weather';

interface CropCategory {
  id: string;
  category_name: string;
  description: string;
}

interface CropVariety {
  id: string;
  category_id: string;
  common_name: string;
  scientific_name: string;
  variety_name: string | null;
  strain_name: string | null;
  maturity_days: number;
  planting_season: string;
  description: string | null;
}

interface CropCoefficient {
  id: string;
  variety_id: string;
  growth_stage_id: string;
  kc_value: number;
  stage_duration_days: number;
  notes: string | null;
  source: string;
  stage_name?: string;
}

interface UserCrop {
  id: string;
  location_id: string;
  variety_id: string;
  planting_date: string;
  area_size: number;
  area_unit: string;
  active: boolean;
  notes: string | null;
  variety?: CropVariety;
}

export const CropManagement: React.FC = () => {
  const { locations } = useLocations();
  const [categories, setCategories] = useState<CropCategory[]>([]);
  const [varieties, setVarieties] = useState<CropVariety[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedVariety, setSelectedVariety] = useState<CropVariety | null>(null);
  const [coefficients, setCoefficients] = useState<CropCoefficient[]>([]);
  const [userCrops, setUserCrops] = useState<UserCrop[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationWithWeather | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingCrop, setAddingCrop] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedVariety) {
      loadCoefficients(selectedVariety.id);
    }
  }, [selectedVariety]);

  useEffect(() => {
    loadUserCrops();
  }, []);

  const loadData = async () => {
    try {
      // Load categories
      const { data: categoriesData } = await supabase
        .from('crop_categories')
        .select('*')
        .order('category_name');

      // Load varieties
      const { data: varietiesData } = await supabase
        .from('crop_varieties')
        .select('*')
        .order('common_name, variety_name');

      setCategories(categoriesData || []);
      setVarieties(varietiesData || []);
    } catch (error) {
      console.error('Error loading crop data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCoefficients = async (varietyId: string) => {
    try {
      const { data } = await supabase
        .from('crop_coefficients')
        .select(`
          *,
          growth_stages!inner(stage_name, stage_order)
        `)
        .eq('variety_id', varietyId)
        .order('growth_stages(stage_order)');

      const coeffsWithStage = data?.map(coeff => ({
        ...coeff,
        stage_name: coeff.growth_stages?.stage_name
      })) || [];

      setCoefficients(coeffsWithStage);
    } catch (error) {
      console.error('Error loading coefficients:', error);
    }
  };

  const loadUserCrops = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('user_crops')
        .select(`
          *,
          crop_varieties!inner(*)
        `)
        .eq('user_id', user.id)
        .eq('active', true);

      setUserCrops(data || []);
    } catch (error) {
      console.error('Error loading user crops:', error);
    }
  };

  const addUserCrop = async () => {
    if (!selectedVariety || !selectedLocation) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const plantingDate = new Date().toISOString().split('T')[0];

      const { error } = await supabase
        .from('user_crops')
        .insert({
          user_id: user.id,
          location_id: selectedLocation.id,
          variety_id: selectedVariety.id,
          planting_date: plantingDate,
          area_size: 1.0,
          area_unit: 'acres'
        });

      if (error) throw error;

      loadUserCrops();
      setAddingCrop(false);
    } catch (error) {
      console.error('Error adding crop:', error);
    }
  };

  const removeUserCrop = async (cropId: string) => {
    try {
      const { error } = await supabase
        .from('user_crops')
        .update({ active: false })
        .eq('id', cropId);

      if (error) throw error;

      loadUserCrops();
    } catch (error) {
      console.error('Error removing crop:', error);
    }
  };

  const calculateETc = (et0: number, kcValue: number) => {
    return et0 * kcValue;
  };

  const filteredVarieties = varieties.filter(variety => {
    const matchesSearch = !searchTerm || 
      variety.common_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      variety.scientific_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      variety.variety_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !selectedCategory || variety.category_id === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <Sprout className="h-7 w-7 mr-2 text-green-600 dark:text-green-400" />
              Crop Coefficient Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage crop varieties and calculate crop-specific evapotranspiration (ETc)
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {selectedVariety && locations.length > 0 && (
              <button
                onClick={() => setAddingCrop(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add to Location</span>
              </button>
            )}
          </div>
        </div>

        {/* Search and Filter */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search crops by name, variety, or scientific name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.category_name}
              </option>
            ))}
          </select>

          <select
            value={selectedLocation?.id || ''}
            onChange={(e) => {
              const location = locations.find(l => l.id === e.target.value);
              setSelectedLocation(location || null);
            }}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Select Location for Calculations</option>
            {locations.map(location => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Crop Varieties List */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Crop Varieties ({filteredVarieties.length})
            </h2>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {filteredVarieties.map(variety => (
              <div
                key={variety.id}
                onClick={() => setSelectedVariety(variety)}
                className={`p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                  selectedVariety?.id === variety.id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500' : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {variety.common_name}
                      {variety.variety_name && (
                        <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                          ({variety.variety_name})
                        </span>
                      )}
                    </h3>
                    {variety.scientific_name && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                        {variety.scientific_name}
                      </p>
                    )}
                    <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <span>{variety.maturity_days} days</span>
                      <span>{variety.planting_season}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Crop Coefficients */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <Calculator className="h-5 w-5 mr-2" />
              Crop Coefficients
            </h2>
          </div>
          
          <div className="p-6">
            {selectedVariety ? (
              <>
                <div className="mb-4">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {selectedVariety.common_name}
                    {selectedVariety.variety_name && ` - ${selectedVariety.variety_name}`}
                  </h3>
                  {selectedVariety.scientific_name && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                      {selectedVariety.scientific_name}
                    </p>
                  )}
                </div>

                {coefficients.length > 0 ? (
                  <div className="space-y-3">
                    {coefficients.map(coeff => (
                      <div
                        key={coeff.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {coeff.stage_name}
                            </span>
                            <span className="text-lg font-mono text-blue-600 dark:text-blue-400">
                              Kc = {coeff.kc_value}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mt-1">
                            <span>{coeff.stage_duration_days} days</span>
                            <span>{coeff.source}</span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* ET₀ to ETc Calculator */}
                    {selectedLocation && selectedLocation.weatherData && (
                      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                          <Info className="h-4 w-4 mr-2" />
                          ETc Calculations for {selectedLocation.name}
                        </h4>
                        
                        <div className="grid grid-cols-1 gap-2 text-sm">
                          {coefficients.map(coeff => {
                            const todayEt0 = selectedLocation.weatherData?.daily.et0_fao_evapotranspiration[0] || 0;
                            const et0Inches = todayEt0 * 0.0393701;
                            const etcInches = calculateETc(et0Inches, coeff.kc_value);
                            
                            return (
                              <div key={coeff.id} className="flex justify-between items-center">
                                <span className="text-gray-700 dark:text-gray-300">
                                  {coeff.stage_name}:
                                </span>
                                <div className="font-mono text-right">
                                  <span className="text-gray-600 dark:text-gray-400">
                                    {et0Inches.toFixed(3)}" × {coeff.kc_value} =
                                  </span>
                                  <span className="ml-2 text-green-600 dark:text-green-400 font-medium">
                                    {etcInches.toFixed(3)}" ETc
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                    No coefficient data available for this variety
                  </p>
                )}
              </>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                Select a crop variety to view its coefficient data
              </p>
            )}
          </div>
        </div>
      </div>

      {/* User's Crops */}
      {userCrops.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              My Crops ({userCrops.length})
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Crop
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Planting Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Area
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {userCrops.map(crop => (
                  <tr key={crop.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {crop.variety?.common_name}
                          {crop.variety?.variety_name && ` - ${crop.variety?.variety_name}`}
                        </div>
                        {crop.variety?.scientific_name && (
                          <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                            {crop.variety?.scientific_name}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {new Date(crop.planting_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {crop.area_size} {crop.area_unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => removeUserCrop(crop.id)}
                        className="text-red-600 hover:text-red-900 dark:hover:text-red-400"
                        title="Remove crop"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Crop Modal */}
      {addingCrop && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Add Crop to Location
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Add <strong>{selectedVariety?.common_name}</strong> to your location for tracking.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setAddingCrop(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={addUserCrop}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
              >
                Add Crop
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};