import React, { useState } from 'react';
import { X, Calendar, Sprout, Info, Plus, MapPin } from 'lucide-react';
import { type AvailableCrop } from '../data/crops';

interface CropInstance {
  id: string;
  cropId: string;
  plantingDate: string;
  currentStage: number; // Index of current stage in crop.stages array
  currentWateringCycle?: number; // Index of current watering cycle for perennials
  customStageDays?: number; // Override days in current stage
  fieldName?: string;
  notes?: string;
  locationId?: string;
}

interface FieldBlock {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  location_name: string;
  assigned_users: string[];
  crop_id: string;
  crop_name: string;
  acres: number;
  irrigation_methods: Array<{
    method: 'drip' | 'sprinkler' | 'flood' | 'micro-spray' | 'surface';
    stage?: string;
    startDate?: string;
    endDate?: string;
    notes?: string;
  }>;
  soil_type: string;
  date_planted: string;
  growth_stage: string;
  system_efficiency: number;
  water_allocation: number;
  status: 'active' | 'dormant' | 'harvested' | 'preparation';
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface AddCropInstanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  crop: AvailableCrop;
  onAddInstance: (instance: Omit<CropInstance, 'id'>) => void;
  fieldBlocks?: FieldBlock[];
  selectedLocation?: { id: string; name: string };
  onCreateFieldBlock?: (blockData: Partial<FieldBlock>) => void;
  editingInstance?: CropInstance | null; // Instance being edited
  onUpdateInstance?: (instanceId: string, updatedData: Partial<CropInstance>) => void;
}

export const AddCropInstanceModal: React.FC<AddCropInstanceModalProps> = ({
  isOpen,
  onClose,
  crop,
  onAddInstance,
  fieldBlocks = [],
  selectedLocation,
  onCreateFieldBlock,
  editingInstance,
  onUpdateInstance
}) => {
  const [plantingDate, setPlantingDate] = useState(editingInstance?.plantingDate || '');
  const [currentStage, setCurrentStage] = useState(editingInstance?.currentStage || 0);
  const [currentWateringCycle, setCurrentWateringCycle] = useState(editingInstance?.currentWateringCycle || 0);
  const [notes, setNotes] = useState(editingInstance?.notes || '');
  const [customStageDays, setCustomStageDays] = useState<number | undefined>(editingInstance?.customStageDays);
  const [selectedFieldBlock, setSelectedFieldBlock] = useState<string>('');
  const [blockSelectionMode, setBlockSelectionMode] = useState<'existing' | 'new'>('existing');
  const [newBlockName, setNewBlockName] = useState('');
  const [newBlockDescription, setNewBlockDescription] = useState('');
  
  // Irrigation methods per stage - Map stage index to irrigation method
  const [stageIrrigationMethods, setStageIrrigationMethods] = useState<{[stageIndex: number]: string}>({});
  
  // Quick add mode - defaults to true for new crops, false for editing
  const [isQuickAddMode, setIsQuickAddMode] = useState(!editingInstance);

  // Filter field blocks for the current location
  const locationFieldBlocks = fieldBlocks.filter(
    block => selectedLocation && block.location_name === selectedLocation.name
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!plantingDate) {
      alert('Please select a planting date');
      return;
    }

    // Handle new field block creation
    if (blockSelectionMode === 'new') {
      if (!newBlockName.trim()) {
        alert('Please enter a field block name');
        return;
      }
      
      if (onCreateFieldBlock && selectedLocation) {
        // Create new field block with irrigation methods based on selected stage methods
        const currentStageData = crop.stages[currentStage];
        const irrigationMethods = [];
        
        // Collect all irrigation methods assigned to stages
        const uniqueMethods = new Set();
        Object.entries(stageIrrigationMethods).forEach(([stageIndex, method]) => {
          const stageName = crop.stages[parseInt(stageIndex)]?.name || `Stage ${parseInt(stageIndex) + 1}`;
          if (!uniqueMethods.has(method)) {
            irrigationMethods.push({
              method: method as 'drip' | 'sprinkler' | 'flood' | 'micro-spray' | 'surface',
              stage: stageName,
              notes: `${method.charAt(0).toUpperCase() + method.slice(1)} irrigation for ${stageName}`
            });
            uniqueMethods.add(method);
          }
        });
        
        // If no specific methods assigned, add default based on crop category
        if (irrigationMethods.length === 0) {
          if (crop.category === 'Tree Nuts' || crop.category === 'Tree Fruits') {
            irrigationMethods.push({
              method: 'drip' as const,
              stage: 'All stages',
              notes: 'Drip irrigation recommended for tree crops'
            });
          } else if (crop.category === 'Field Crops') {
            irrigationMethods.push({
              method: 'sprinkler' as const,
              stage: 'All stages', 
              notes: 'Sprinkler irrigation for field crops'
            });
          } else {
            irrigationMethods.push({
              method: 'drip' as const,
              stage: 'All stages',
              notes: 'Drip irrigation for precise watering'
            });
          }
        }

        const newBlock: Partial<FieldBlock> = {
          name: newBlockName.trim(),
          description: newBlockDescription.trim() || `${crop.name} field block - auto-created from ${currentStageData?.name} stage`,
          location_name: selectedLocation.name,
          crop_id: crop.id,
          crop_name: crop.name,
          date_planted: plantingDate,
          status: 'active',
          growth_stage: currentStageData?.name || 'Unknown',
          irrigation_methods: irrigationMethods,
          system_efficiency: 90, // Default efficiency
          acres: 0, // User can update later
          soil_type: 'Loam', // Default soil type
          water_allocation: 0 // User can update later
        };
        onCreateFieldBlock(newBlock);
      }
    }

    // Get the field block name for the crop instance
    let finalFieldName = '';
    if (blockSelectionMode === 'existing' && selectedFieldBlock) {
      const block = locationFieldBlocks.find(b => b.id === selectedFieldBlock);
      finalFieldName = block?.name || '';
    } else if (blockSelectionMode === 'new') {
      finalFieldName = newBlockName.trim();
    }

    // Handle creating or updating crop instance
    if (editingInstance && onUpdateInstance) {
      // Update existing instance
      onUpdateInstance(editingInstance.id, {
        plantingDate,
        currentStage,
        currentWateringCycle: crop.isPerennial ? currentWateringCycle : undefined,
        customStageDays,
        fieldName: finalFieldName || undefined,
        notes: notes || undefined,
        locationId: selectedLocation?.id
      });
    } else {
      // Create new instance
      onAddInstance({
        cropId: crop.id,
        plantingDate,
        currentStage,
        currentWateringCycle: crop.isPerennial ? currentWateringCycle : undefined,
        customStageDays,
        fieldName: finalFieldName || undefined,
        notes: notes || undefined,
        locationId: selectedLocation?.id
      });
    }

    // Reset form
    setPlantingDate('');
    setCurrentStage(0);
    setCurrentWateringCycle(0);
    setNotes('');
    setCustomStageDays(undefined);
    setSelectedFieldBlock('');
    setBlockSelectionMode('existing');
    setNewBlockName('');
    setNewBlockDescription('');
    onClose();
  };

  const getDaysSincePlanting = () => {
    if (!plantingDate) return 0;
    const planting = new Date(plantingDate);
    const today = new Date();
    const diffTime = today.getTime() - planting.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const getCurrentStageInfo = () => {
    if (currentStage >= crop.stages.length) return null;
    
    const stage = crop.stages[currentStage];
    const daysSincePlanting = getDaysSincePlanting();
    
    // Calculate when this stage should have started
    let cumulativeDays = 0;
    for (let i = 0; i < currentStage; i++) {
      cumulativeDays += crop.stages[i].duration;
    }
    
    const daysIntoStage = daysSincePlanting - cumulativeDays;
    const stageDuration = customStageDays ?? stage.duration;
    const daysRemaining = Math.max(0, stageDuration - daysIntoStage);
    
    return {
      stage,
      daysIntoStage: Math.max(0, daysIntoStage),
      daysRemaining,
      isOverdue: daysIntoStage > stageDuration
    };
  };

  const stageInfo = getCurrentStageInfo();
  const daysSincePlanting = getDaysSincePlanting();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-900 rounded-lg">
                <Sprout className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Add {crop.name} Instance</h2>
                <p className="text-sm text-gray-400">
                  {crop.scientificName && <span className="italic">{crop.scientificName}</span>}
                  {crop.scientificName && ' • '}{crop.category}
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
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Planting Date */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Planting Date *
            </label>
            <input
              type="date"
              value={plantingDate}
              onChange={(e) => setPlantingDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            {plantingDate && (
              <p className="text-xs text-gray-400 mt-1">
                {daysSincePlanting} days since planting
              </p>
            )}
          </div>

          {/* Location Display */}
          {selectedLocation && (
            <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-blue-300">
                <MapPin className="h-4 w-4" />
                <span className="font-medium">Location: {selectedLocation.name}</span>
              </div>
            </div>
          )}

          {/* Quick Add Toggle - Only show for new crops */}
          {!editingInstance && (
            <div className="flex items-center justify-between bg-gray-800 rounded-lg p-3">
              <div>
                <p className="text-white font-medium">Add Mode</p>
                <p className="text-gray-400 text-sm">
                  {isQuickAddMode ? 'Quick add with minimal details' : 'Detailed configuration'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickAddMode(!isQuickAddMode)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  isQuickAddMode 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {isQuickAddMode ? 'Quick Add' : 'Detailed'}
              </button>
            </div>
          )}

          {/* Field Block Selection - Show in both modes but simplified in quick mode */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Field Block Assignment {!isQuickAddMode && '(Optional)'}
            </label>
            
            {(!isQuickAddMode || editingInstance) && (
              <div className="flex space-x-4 mb-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="blockMode"
                    value="existing"
                    checked={blockSelectionMode === 'existing'}
                    onChange={(e) => setBlockSelectionMode(e.target.value as 'existing' | 'new')}
                    className="text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-gray-300">Use Existing Block</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="blockMode"
                    value="new"
                    checked={blockSelectionMode === 'new'}
                    onChange={(e) => setBlockSelectionMode(e.target.value as 'existing' | 'new')}
                    className="text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-gray-300">Create New Block</span>
                </label>
              </div>
            )}

            {/* Existing Block Selection */}
            {blockSelectionMode === 'existing' && (
              <div>
                {locationFieldBlocks.length > 0 ? (
                  <select
                    value={selectedFieldBlock}
                    onChange={(e) => setSelectedFieldBlock(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a field block</option>
                    {locationFieldBlocks.map((block) => (
                      <option key={block.id} value={block.id}>
                        {block.name} {block.description && `- ${block.description}`}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-3">
                    <p className="text-yellow-300 text-sm">
                      No field blocks found for this location. Create a new block below.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* New Block Creation */}
            {blockSelectionMode === 'new' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Block Name *</label>
                  <input
                    type="text"
                    value={newBlockName}
                    onChange={(e) => setNewBlockName(e.target.value)}
                    placeholder="e.g., North Field A, Greenhouse 1"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                {(!isQuickAddMode || editingInstance) && (
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Description (optional)</label>
                    <input
                      type="text"
                      value={newBlockDescription}
                      onChange={(e) => setNewBlockDescription(e.target.value)}
                      placeholder="Brief description of this field block"
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
                <div className="bg-green-900/30 border border-green-700 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <Plus className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <p className="text-green-300 text-sm">
                      A new field block will be created with this crop assignment. You can manage field block details in the Field Blocks section.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Current Growth Stage - Simplified in quick mode */}
          {(!isQuickAddMode || editingInstance) && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Current Growth Stage
              </label>
              <select
                value={currentStage}
                onChange={(e) => setCurrentStage(parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {crop.stages.map((stage, index) => (
                  <option key={index} value={index}>
                    {stage.name} (Kc: {stage.kc}, {stage.duration} days)
                  </option>
                ))}
              </select>
              
              {stageInfo && (
                <div className="mt-3 p-3 bg-gray-800 rounded-lg border border-gray-700">
                  <div className="flex items-start space-x-2">
                    <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm w-full">
                      <p className="text-white font-medium">{stageInfo.stage.name}</p>
                      <p className="text-gray-400 mt-1">{stageInfo.stage.description}</p>
                      
                      {/* Irrigation Method Selection for Current Stage */}
                      <div className="mt-3 p-2 bg-gray-900 rounded border border-gray-600">
                        <label className="block text-xs font-medium text-gray-300 mb-2">
                          Irrigation Method for {stageInfo.stage.name} Stage
                        </label>
                        <select
                          value={stageIrrigationMethods[currentStage] || 'drip'}
                          onChange={(e) => setStageIrrigationMethods(prev => ({
                            ...prev,
                            [currentStage]: e.target.value
                          }))}
                          className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-xs focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="drip">Drip Irrigation</option>
                          <option value="sprinkler">Sprinkler System</option>
                          <option value="micro-spray">Micro-spray</option>
                          <option value="surface">Surface/Flood</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          This method will be used during the {stageInfo.stage.name} growth stage
                        </p>
                      </div>
                      
                      <div className="mt-2 grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-gray-500">Days into stage:</span>
                          <span className={`ml-2 font-mono ${stageInfo.isOverdue ? 'text-orange-400' : 'text-green-400'}`}>
                            {stageInfo.daysIntoStage}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Days remaining:</span>
                          <span className={`ml-2 font-mono ${stageInfo.isOverdue ? 'text-red-400' : 'text-blue-400'}`}>
                            {stageInfo.isOverdue ? 'Overdue' : stageInfo.daysRemaining}
                          </span>
                        </div>
                      </div>
                      {stageInfo.isOverdue && (
                        <p className="text-orange-400 text-xs mt-2">
                          ⚠️ This stage is overdue. Consider advancing to the next stage.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Irrigation Methods Summary - Show assigned methods for all stages */}
          {!isQuickAddMode && Object.keys(stageIrrigationMethods).length > 0 && (
            <div className="p-3 bg-gray-800 rounded-lg border border-gray-700">
              <h4 className="text-sm font-medium text-white mb-2">Irrigation Methods by Stage</h4>
              <div className="space-y-2">
                {crop.stages.map((stage, index) => {
                  const method = stageIrrigationMethods[index];
                  if (!method) return null;
                  return (
                    <div key={index} className="flex items-center justify-between text-xs">
                      <span className="text-gray-300">{stage.name}</span>
                      <span className="text-blue-400 capitalize">{method.replace('-', ' ')}</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                These irrigation methods will be applied to field blocks created from this crop instance.
              </p>
            </div>
          )}

          {/* Perennial Watering Cycles - Only show for perennial crops and not in quick mode */}
          {crop.isPerennial && crop.wateringCycles && (!isQuickAddMode || editingInstance) && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Current Watering Cycle (Seasonal)
              </label>
              <select
                value={currentWateringCycle || 0}
                onChange={(e) => setCurrentWateringCycle(parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
              >
                {crop.wateringCycles.map((cycle, index) => (
                  <option key={index} value={index}>
                    {cycle.name} ({cycle.season}) - Kc: {cycle.kc}
                  </option>
                ))}
              </select>
              
              {crop.wateringCycles[currentWateringCycle || 0] && (
                <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-3">
                  <div className="flex items-start space-x-3">
                    <div className="p-1 bg-blue-900 rounded">
                      <Info className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-blue-300 font-medium text-sm">
                        {crop.wateringCycles[currentWateringCycle || 0].name} - {crop.wateringCycles[currentWateringCycle || 0].season.charAt(0).toUpperCase() + crop.wateringCycles[currentWateringCycle || 0].season.slice(1)}
                      </p>
                      <p className="text-blue-200 text-xs mt-1">
                        {crop.wateringCycles[currentWateringCycle || 0].description}
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-blue-300">
                        <span>Kc: {crop.wateringCycles[currentWateringCycle || 0].kc}</span>
                        <span>Duration: {crop.wateringCycles[currentWateringCycle || 0].duration} days</span>
                        {crop.wateringCycles[currentWateringCycle || 0].repeatsAnnually && (
                          <span className="text-green-400">🔄 Annual</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Custom Stage Duration - Hide in quick mode */}
          {(!isQuickAddMode || editingInstance) && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Custom Stage Duration (Optional)
              </label>
              <input
                type="number"
                value={customStageDays || ''}
                onChange={(e) => setCustomStageDays(e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder={`Default: ${crop.stages[currentStage]?.duration || 0} days`}
                min="1"
                max="365"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-400 mt-1">
                Override the default duration for this specific planting
              </p>
            </div>
          )}

          {/* Notes - Always show but smaller in quick mode */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this planting..."
              rows={isQuickAddMode && !editingInstance ? 2 : 3}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Growth Stage Timeline - Hide in quick mode */}
          {(!isQuickAddMode || editingInstance) && (
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-3">Growth Stage Timeline</h3>
              <div className="space-y-2">
                {crop.stages.map((stage, index) => {
                  let cumulativeDays = 0;
                  for (let i = 0; i < index; i++) {
                    cumulativeDays += crop.stages[i].duration;
                  }
                  
                  const isCurrentStage = index === currentStage;
                  const isPastStage = daysSincePlanting > cumulativeDays + stage.duration;
                  
                  return (
                    <div
                      key={index}
                      className={`p-2 rounded-lg border text-xs ${
                        isCurrentStage
                          ? 'bg-blue-900/50 border-blue-600 text-blue-200'
                          : isPastStage
                          ? 'bg-green-900/30 border-green-700 text-green-200'
                          : 'bg-gray-800 border-gray-700 text-gray-400'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{stage.name}</span>
                        <span className="font-mono">
                          Days {cumulativeDays + 1}-{cumulativeDays + stage.duration}
                        </span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span>Kc: {stage.kc}</span>
                        <span>{stage.duration} days</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Add Tips */}
          {isQuickAddMode && !editingInstance && (
            <div className="bg-green-900/20 border border-green-700 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <Info className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-green-300 text-sm font-medium">Quick Add Mode</p>
                  <p className="text-green-200 text-xs mt-1">
                    Crop added with basic settings. You can edit it later to add detailed information like growth stages, watering cycles, and custom durations.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center space-x-3 pt-4 border-t border-gray-700">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              {editingInstance 
                ? 'Update Crop' 
                : isQuickAddMode 
                  ? 'Quick Add Crop' 
                  : 'Add Crop Instance'
              }
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};