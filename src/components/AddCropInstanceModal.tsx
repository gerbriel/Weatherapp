import React, { useState } from 'react';
import { X, Calendar, Sprout, Info } from 'lucide-react';
import { type AvailableCrop } from '../data/crops';

interface CropInstance {
  id: string;
  cropId: string;
  plantingDate: string;
  currentStage: number;
  customStageDays?: number;
  fieldName?: string;
  notes?: string;
}

interface AddCropInstanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  crop: AvailableCrop;
  onAddInstance: (instance: Omit<CropInstance, 'id'>) => void;
}

export const AddCropInstanceModal: React.FC<AddCropInstanceModalProps> = ({
  isOpen,
  onClose,
  crop,
  onAddInstance
}) => {
  const [plantingDate, setPlantingDate] = useState('');
  const [currentStage, setCurrentStage] = useState(0);
  const [fieldName, setFieldName] = useState('');
  const [notes, setNotes] = useState('');
  const [customStageDays, setCustomStageDays] = useState<number | undefined>();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!plantingDate) {
      alert('Please select a planting date');
      return;
    }

    onAddInstance({
      cropId: crop.id,
      plantingDate,
      currentStage,
      customStageDays,
      fieldName: fieldName || undefined,
      notes: notes || undefined
    });

    // Reset form
    setPlantingDate('');
    setCurrentStage(0);
    setFieldName('');
    setNotes('');
    setCustomStageDays(undefined);
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

          {/* Field Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Field/Area Name (Optional)
            </label>
            <input
              type="text"
              value={fieldName}
              onChange={(e) => setFieldName(e.target.value)}
              placeholder="e.g., North Field, Block A, Greenhouse 1"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Current Growth Stage */}
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
                  <div className="text-sm">
                    <p className="text-white font-medium">{stageInfo.stage.name}</p>
                    <p className="text-gray-400 mt-1">{stageInfo.stage.description}</p>
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

          {/* Custom Stage Duration */}
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

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this planting..."
              rows={3}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Growth Stage Timeline */}
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

          {/* Form Actions */}
          <div className="flex items-center space-x-3 pt-4 border-t border-gray-700">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Add Crop Instance
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