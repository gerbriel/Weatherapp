import React from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Droplets, TrendingUp, Calendar, Target, Info } from 'lucide-react';
import { type SoilType } from '../data/soils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface CalculatorVisualizationsProps {
  soilType?: SoilType;
  etcValue: number;
  irrigationRuntime: number;
  systemEfficiency: number;
  cropName?: string;
}

export const CalculatorVisualizations: React.FC<CalculatorVisualizationsProps> = ({
  soilType,
  etcValue,
  irrigationRuntime,
  systemEfficiency,
  cropName = 'Selected Crop'
}) => {
  // Generate 7-day irrigation schedule
  const generateIrrigationSchedule = () => {
    if (!soilType) return [];
    
    const schedule = [];
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    // Calculate irrigation frequency based on soil type
    const infiltrationRate = soilType.characteristics.infiltrationRate;
    let frequency = 1; // daily
    
    if (infiltrationRate > 20) frequency = 1; // daily for sandy soils
    else if (infiltrationRate > 10) frequency = 2; // every 2 days
    else if (infiltrationRate > 5) frequency = 3; // every 3 days
    else frequency = 5; // twice weekly for clay soils
    
    for (let i = 0; i < 7; i++) {
      const shouldIrrigate = i % frequency === 0;
      schedule.push({
        day: days[i],
        runtime: shouldIrrigate ? irrigationRuntime : 0,
        etc: shouldIrrigate ? (etcValue * 0.0393701) : 0 // Convert mm to inches
      });
    }
    
    return schedule;
  };

  const schedule = generateIrrigationSchedule();

  // Soil Water Profile Chart
  const soilProfileData = {
    labels: ['0-12in', '12-24in', '24-36in', '36-48in'],
    datasets: [
      {
        label: 'Field Capacity',
        data: soilType ? [
          soilType.characteristics.fieldCapacity,
          soilType.characteristics.fieldCapacity * 0.9,
          soilType.characteristics.fieldCapacity * 0.8,
          soilType.characteristics.fieldCapacity * 0.7
        ] : [25, 22, 20, 18],
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 2,
      },
      {
        label: 'Wilting Point',
        data: soilType ? [
          soilType.characteristics.wiltingPoint,
          soilType.characteristics.wiltingPoint * 0.9,
          soilType.characteristics.wiltingPoint * 0.8,
          soilType.characteristics.wiltingPoint * 0.7
        ] : [10, 9, 8, 7],
        backgroundColor: 'rgba(239, 68, 68, 0.6)',
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 2,
      },
      {
        label: 'Current Moisture',
        data: soilType ? [
          (soilType.characteristics.fieldCapacity + soilType.characteristics.wiltingPoint) / 2,
          (soilType.characteristics.fieldCapacity + soilType.characteristics.wiltingPoint) / 2 * 0.9,
          (soilType.characteristics.fieldCapacity + soilType.characteristics.wiltingPoint) / 2 * 0.8,
          (soilType.characteristics.fieldCapacity + soilType.characteristics.wiltingPoint) / 2 * 0.7,
        ] : [17, 15, 14, 12],
        backgroundColor: 'rgba(34, 197, 94, 0.6)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 2,
      }
    ],
  };

  // Weekly Irrigation Schedule Chart
  const scheduleData = {
    labels: schedule.map(s => s.day),
    datasets: [
      {
        label: 'Runtime (minutes)',
        data: schedule.map(s => s.runtime),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 2,
        yAxisID: 'y',
      },
      {
        label: 'ETc (inches)',
        data: schedule.map(s => s.etc),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 2,
        yAxisID: 'y1',
      }
    ],
  };

  // Water Balance Pie Chart
  const waterBalanceData = {
    labels: ['Applied Water', 'Evapotranspiration', 'Deep Drainage', 'Runoff'],
    datasets: [
      {
        data: [
          irrigationRuntime * 0.8, // applied
          etcValue, // ETc
          Math.max(0, irrigationRuntime * 0.15 - etcValue * 0.1), // drainage
          irrigationRuntime * 0.05 // runoff
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(59, 130, 246)',
          'rgb(168, 85, 247)',
          'rgb(239, 68, 68)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: 'rgb(156, 163, 175)'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        titleColor: 'rgb(255, 255, 255)',
        bodyColor: 'rgb(156, 163, 175)',
        borderColor: 'rgba(75, 85, 99, 0.5)',
        borderWidth: 1,
      }
    },
    scales: {
      x: {
        ticks: { color: 'rgb(156, 163, 175)' },
        grid: { color: 'rgba(75, 85, 99, 0.3)' }
      },
      y: {
        ticks: { color: 'rgb(156, 163, 175)' },
        grid: { color: 'rgba(75, 85, 99, 0.3)' }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        ticks: { color: 'rgb(156, 163, 175)' },
        grid: { drawOnChartArea: false },
      },
    },
  };

  const soilChartOptions = {
    ...chartOptions,
    scales: {
      x: {
        ticks: { color: 'rgb(156, 163, 175)' },
        grid: { color: 'rgba(75, 85, 99, 0.3)' }
      },
      y: {
        ticks: { color: 'rgb(156, 163, 175)' },
        grid: { color: 'rgba(75, 85, 99, 0.3)' },
        title: {
          display: true,
          text: 'Volumetric Water Content (%)',
          color: 'rgb(156, 163, 175)'
        }
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-xl font-semibold text-white mb-2">Irrigation Analysis Dashboard</h3>
        <p className="text-gray-400">
          Visual insights for {cropName} on {soilType?.name || 'selected soil'}
        </p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-900 rounded-lg">
              <Droplets className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <div className="text-sm text-gray-400">Daily ETc</div>
              <div className="text-xl font-bold text-white">{(etcValue * 0.0393701).toFixed(3)} in</div>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-900 rounded-lg">
              <Calendar className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <div className="text-sm text-gray-400">Runtime</div>
              <div className="text-xl font-bold text-white">{irrigationRuntime} min</div>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-900 rounded-lg">
              <Target className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <div className="text-sm text-gray-400">Efficiency</div>
              <div className="text-xl font-bold text-white">{systemEfficiency}%</div>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-900 rounded-lg">
              <TrendingUp className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <div className="text-sm text-gray-400">Infiltration</div>
              <div className="text-xl font-bold text-white">
                {((soilType?.characteristics.infiltrationRate || 10) * 0.0393701).toFixed(2)} in/h
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Soil Water Profile */}
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 xl:col-span-2">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-amber-900 rounded-lg">
              <Info className="h-4 w-4 text-amber-400" />
            </div>
            <h4 className="text-lg font-semibold text-white">Soil Water Profile</h4>
          </div>
          <div style={{ height: '400px' }}>
            <Bar data={soilProfileData} options={soilChartOptions} />
          </div>
          <div className="mt-4 text-sm text-gray-400">
            Shows water content at different soil depths. Green area indicates optimal irrigation range.
          </div>
        </div>

        {/* Weekly Schedule */}
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 xl:col-span-2">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-green-900 rounded-lg">
              <Calendar className="h-4 w-4 text-green-400" />
            </div>
            <h4 className="text-lg font-semibold text-white">Weekly Irrigation Schedule</h4>
          </div>
          <div style={{ height: '400px' }}>
            <Bar data={scheduleData} options={chartOptions} />
          </div>
          <div className="mt-4 text-sm text-gray-400">
            Optimized schedule based on soil type and crop water requirements.
          </div>
        </div>

        {/* Water Balance */}
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-900 rounded-lg">
              <Droplets className="h-4 w-4 text-blue-400" />
            </div>
            <h4 className="text-lg font-semibold text-white">Water Balance</h4>
          </div>
          <div style={{ height: '300px' }}>
            <Doughnut 
              data={waterBalanceData} 
              options={{
                ...chartOptions,
                scales: undefined,
                plugins: {
                  ...chartOptions.plugins,
                  legend: {
                    position: 'bottom' as const,
                    labels: {
                      color: 'rgb(156, 163, 175)',
                      padding: 20
                    }
                  }
                }
              }} 
            />
          </div>
          <div className="mt-4 text-sm text-gray-400">
            Distribution of applied water showing system efficiency and losses.
          </div>
        </div>

        {/* Soil Characteristics */}
        {soilType && (
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center space-x-3 mb-4">
              <div 
                className="w-6 h-6 rounded-full border-2 border-gray-600"
                style={{ backgroundColor: soilType.color }}
              />
              <h4 className="text-lg font-semibold text-white">{soilType.name} Properties</h4>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-400">Water Holding Capacity</div>
                  <div className="text-lg font-semibold text-white">
                    {soilType.characteristics.waterHoldingCapacity} mm/m
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Available Water</div>
                  <div className="text-lg font-semibold text-white">
                    {soilType.characteristics.availableWaterCapacity} mm/m
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Field Capacity</div>
                  <div className="text-lg font-semibold text-white">
                    {soilType.characteristics.fieldCapacity}%
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Wilting Point</div>
                  <div className="text-lg font-semibold text-white">
                    {soilType.characteristics.wiltingPoint}%
                  </div>
                </div>
              </div>
              
              <div className="p-3 bg-gray-900 rounded border border-gray-600">
                <div className="text-sm text-gray-400 mb-1">Texture</div>
                <div className="text-white">{soilType.texture}</div>
              </div>
              
              <div className="p-3 bg-gray-900 rounded border border-gray-600">
                <div className="text-sm text-gray-400 mb-1">Description</div>
                <div className="text-white text-sm">{soilType.characteristics.description}</div>
              </div>
              
              <div className="p-3 bg-gray-900 rounded border border-gray-600">
                <div className="text-sm text-gray-400 mb-2">Suitable Crops</div>
                <div className="flex flex-wrap gap-2">
                  {soilType.commonCrops.map((crop, index) => (
                    <span key={index} className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                      {crop}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recommendations */}
      {soilType && (
        <div className="bg-gradient-to-r from-blue-900/50 to-green-900/50 p-6 rounded-lg border border-blue-700/50">
          <h4 className="text-lg font-semibold text-white mb-4">Irrigation Recommendations</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-black/20 p-4 rounded">
              <div className="text-blue-400 font-medium mb-2">Frequency</div>
              <div className="text-white">
                {soilType.characteristics.infiltrationRate > 20 ? 'Daily' :
                 soilType.characteristics.infiltrationRate > 10 ? 'Every 2-3 days' :
                 soilType.characteristics.infiltrationRate > 5 ? 'Every 3-5 days' :
                 'Weekly or longer intervals'}
              </div>
            </div>
            <div className="bg-black/20 p-4 rounded">
              <div className="text-green-400 font-medium mb-2">Application Rate</div>
              <div className="text-white">
                Max {Math.min(soilType.characteristics.infiltrationRate * 0.8, 25).toFixed(1)} mm/hour
              </div>
            </div>
            <div className="bg-black/20 p-4 rounded">
              <div className="text-purple-400 font-medium mb-2">Runoff Risk</div>
              <div className="text-white">
                {soilType.characteristics.infiltrationRate > 10 ? 'Low' :
                 soilType.characteristics.infiltrationRate > 5 ? 'Medium' : 'High'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};