import React, { useState } from 'react';
import { X, Sprout, Info, MapPin } from 'lucide-react';
import { type AvailableCrop } from '../data/crops';

interface CropInstance {
  id: string;
  cropId: string;
  plantingDate: string;
  currentStage: number; // Index of current stage in crop.stages array
  currentWateringCycle?: number; // Index of current watering cycle for perennials
  locationId?: string;
}



interface AddCropInstanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  crop: AvailableCrop;
  onAddInstance: (instance: Omit<CropInstance, 'id'>) => void;
  selectedLocation?: { id: string; name: string };
  editingInstance?: CropInstance | null; // Instance being edited
  onUpdateInstance?: (instanceId: string, updatedData: Partial<CropInstance>) => void;
}

export const AddCropInstanceModal: React.FC<AddCropInstanceModalProps> = ({
  isOpen,
  onClose,
  crop,
  onAddInstance,
  selectedLocation,
  editingInstance,
  onUpdateInstance
}) => {
  const [currentStage, setCurrentStage] = useState(editingInstance?.currentStage || 0);
  const [currentWateringCycle, setCurrentWateringCycle] = useState(editingInstance?.currentWateringCycle || 0);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Handle creating or updating crop instance
    if (editingInstance && onUpdateInstance) {
      // Update existing instance
      onUpdateInstance(editingInstance.id, {
        plantingDate: new Date().toISOString().split('T')[0], // Use current date
        currentStage,
        currentWateringCycle: crop.isPerennial ? currentWateringCycle : undefined,
        locationId: selectedLocation?.id
      });
    } else {
      // Create new instance
      onAddInstance({
        cropId: crop.id,
        plantingDate: new Date().toISOString().split('T')[0], // Use current date
        currentStage,
        currentWateringCycle: crop.isPerennial ? currentWateringCycle : undefined,
        locationId: selectedLocation?.id
      });
    }

    // Reset form
    setCurrentStage(0);
    setCurrentWateringCycle(0);
    onClose();
  };

  

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
          {/* Location Display */}
          {selectedLocation && (
            <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-blue-300">
                <MapPin className="h-4 w-4" />
                <span className="font-medium">Location: {selectedLocation.name}</span>
              </div>
            </div>
          )}





          {/* Perennial Watering Cycles - Only show for perennial crops */}
          {crop.isPerennial && crop.wateringCycles && (
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





          {/* Monthly Kc Timeline */}
          {crop.monthlyKc && (
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-3">Monthly Kc Timeline</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {crop.monthlyKc.map((monthKc) => {
                  const currentMonth = new Date().getMonth() + 1; // JavaScript months are 0-based
                  const isCurrentMonth = monthKc.month === currentMonth;
                  
                  return (
                    <div
                      key={monthKc.month}
                      className={`p-2 rounded-lg border text-xs ${
                        isCurrentMonth
                          ? 'bg-blue-900/50 border-blue-600 text-blue-200'
                          : 'bg-gray-800 border-gray-700 text-gray-400'
                      }`}
                      title={monthKc.description}
                    >
                      <div className="font-medium text-center mb-1">{monthKc.monthName.slice(0, 3)}</div>
                      <div className="text-center">
                        <div className="font-mono font-bold">Kc: {monthKc.kc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 text-xs text-gray-400">
                <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mr-1"></span>
                Current month
                <span className="inline-block w-2 h-2 bg-gray-600 rounded-full mr-1 ml-3"></span>
                Other months
              </div>
            </div>
          )}
          
          {/* Fallback to Growth Stages if no monthly data available */}
          {!crop.monthlyKc && (
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-3">Growth Stage Timeline</h3>
              <div className="space-y-2">
                {crop.stages.map((stage, index) => {
                  let cumulativeDays = 0;
                  for (let i = 0; i < index; i++) {
                    cumulativeDays += crop.stages[i].duration;
                  }
                  
                  const isCurrentStage = index === currentStage;
                  
                  return (
                    <div
                      key={index}
                      className={`p-2 rounded-lg border text-xs ${
                        isCurrentStage
                          ? 'bg-blue-900/50 border-blue-600 text-blue-200'
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

          {/* Form Actions */}
          <div className="flex items-center space-x-3 pt-4 border-t border-gray-700">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              {editingInstance 
                ? 'Update Crop' 
                : 'Add Crop'
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