import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, Droplets, Users, MapPin, DollarSign, AlertTriangle, Sprout, Calculator } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface OrganizationalInsight {
  totalAcres: number;
  totalBlocks: number;
  activeUsers: number;
  waterUsage: number; // acre-feet
  waterBudget: number; // acre-feet
  totalCost: number;
  avgEfficiency: number;
  cropdiversityIndex: number;
}

interface CropInstance {
  id: string;
  cropId: string;
  plantingDate: string;
  currentStage: number;
  customStageDays?: number;
  fieldName?: string;
  notes?: string;
}

interface RuntimeResult {
  dailyWaterNeed: number;
  runtimeHours: number;
  runtimeMinutes: number;
  weeklyHours: number;
  efficiency: number;
  formula: string;
  etc: number;
}

interface OrganizationalDashboardProps {
  selectedCrops?: string[];
  cropInstances?: CropInstance[];
  calculatorResult?: RuntimeResult | null;
}

export const OrganizationalDashboard: React.FC<OrganizationalDashboardProps> = ({ 
  selectedCrops = [], 
  cropInstances = [], 
  calculatorResult = null 
}) => {
  const { organization } = useAuth();
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  // Organization-specific data based on the current organization
  const getOrganizationData = useMemo(() => {
    if (!organization) return null;

    switch (organization.id) {
      case 'local-org':
        return {
          insights: {
            totalAcres: 450,
            totalBlocks: 8,
            activeUsers: 1,
            waterUsage: 125.5,
            waterBudget: 180,
            totalCost: 35000,
            avgEfficiency: 89.2,
            cropdiversityIndex: 6.8
          },
          waterUsageByLocation: [
            { name: 'North Field', usage: 65, efficiency: 91, cost: 18000 },
            { name: 'South Field', usage: 35, efficiency: 87, cost: 10000 },
            { name: 'East Pasture', usage: 25.5, efficiency: 88, cost: 7000 }
          ],
          cropDistribution: [
            { name: 'Lettuce', acres: 180, value: 40, color: '#10B981' },
            { name: 'Tomatoes', acres: 135, value: 30, color: '#F59E0B' },
            { name: 'Broccoli', acres: 90, value: 20, color: '#8B5CF6' },
            { name: 'Carrots', acres: 45, value: 10, color: '#EF4444' }
          ]
        };
      
      case 'demo-farm-coop':
        return {
          insights: {
            totalAcres: 2500,
            totalBlocks: 45,
            activeUsers: 18,
            waterUsage: 750.5,
            waterBudget: 1000,
            totalCost: 185000,
            avgEfficiency: 87.3,
            cropdiversityIndex: 8.2
          },
          waterUsageByLocation: [
            { name: 'Salinas Valley', usage: 425, efficiency: 92, cost: 120000 },
            { name: 'Fresno County', usage: 280, efficiency: 85, cost: 65000 },
            { name: 'San Joaquin', usage: 45.5, efficiency: 83, cost: 25000 }
          ],
          cropDistribution: [
            { name: 'Lettuce', acres: 750, value: 30, color: '#10B981' },
            { name: 'Broccoli', acres: 625, value: 25, color: '#8B5CF6' },
            { name: 'Almonds', acres: 500, value: 20, color: '#EF4444' },
            { name: 'Grapes', acres: 375, value: 15, color: '#3B82F6' },
            { name: 'Strawberries', acres: 250, value: 10, color: '#F59E0B' }
          ]
        };
      
      case 'enterprise-ag':
        return {
          insights: {
            totalAcres: 8500,
            totalBlocks: 120,
            activeUsers: 67,
            waterUsage: 2850.5,
            waterBudget: 3200,
            totalCost: 645000,
            avgEfficiency: 85.8,
            cropdiversityIndex: 9.4
          },
          waterUsageByLocation: [
            { name: 'Central Operations', usage: 1425, efficiency: 88, cost: 320000 },
            { name: 'Northern Division', usage: 950, efficiency: 84, cost: 215000 },
            { name: 'Southern Division', usage: 475.5, efficiency: 86, cost: 110000 }
          ],
          cropDistribution: [
            { name: 'Corn', acres: 2550, value: 30, color: '#F59E0B' },
            { name: 'Soybeans', acres: 2125, value: 25, color: '#10B981' },
            { name: 'Wheat', acres: 1700, value: 20, color: '#8B5CF6' },
            { name: 'Cotton', acres: 1275, value: 15, color: '#EF4444' },
            { name: 'Tomatoes', acres: 850, value: 10, color: '#3B82F6' }
          ]
        };
      
      default:
        return null;
    }
  }, [organization?.id]);

  const { insights, waterUsageByLocation, cropDistribution } = getOrganizationData || {
    insights: {
      totalAcres: 0,
      totalBlocks: 0,
      activeUsers: 0,
      waterUsage: 0,
      waterBudget: 0,
      totalCost: 0,
      avgEfficiency: 0,
      cropdiversityIndex: 0
    },
    waterUsageByLocation: [],
    cropDistribution: organization?.cropDistribution || []
  };

  const monthlyTrends = [
    { month: 'Jan', waterUsage: 45, cost: 18000, efficiency: 88 },
    { month: 'Feb', waterUsage: 52, cost: 21000, efficiency: 89 },
    { month: 'Mar', waterUsage: 68, cost: 27000, efficiency: 90 },
    { month: 'Apr', waterUsage: 85, cost: 34000, efficiency: 88 },
    { month: 'May', waterUsage: 95, cost: 38000, efficiency: 87 },
    { month: 'Jun', waterUsage: 110, cost: 45000, efficiency: 85 },
    { month: 'Jul', waterUsage: 125, cost: 52000, efficiency: 86 },
    { month: 'Aug', waterUsage: 118, cost: 48000, efficiency: 87 },
    { month: 'Sep', waterUsage: 102, cost: 42000, efficiency: 89 },
    { month: 'Oct', waterUsage: 88, cost: 36000, efficiency: 91 },
    { month: 'Nov', waterUsage: 72, cost: 29000, efficiency: 92 },
    { month: 'Dec', waterUsage: 58, cost: 23000, efficiency: 90 }
  ];

  const alerts = [
    {
      id: 1,
      type: 'warning',
      message: 'Block A-15 water usage 15% above target',
      location: 'Salinas Valley Farm',
      severity: 'medium'
    },
    {
      id: 2,
      type: 'info',
      message: 'Lettuce Block B-7 ready for harvest',
      location: 'Fresno County Field',
      severity: 'low'
    },
    {
      id: 3,
      type: 'critical',
      message: 'Irrigation system failure detected',
      location: 'San Joaquin Valley',
      severity: 'high'
    }
  ];

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <AlertTriangle className="h-4 w-4 text-red-400" />;
      case 'medium': return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
      case 'low': return <AlertTriangle className="h-4 w-4 text-green-400" />;
      default: return <AlertTriangle className="h-4 w-4 text-blue-400" />;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">
            {organization?.name || 'Organization'} Dashboard
          </h1>
          <p className="text-gray-400">
            {organization?.description || 'Comprehensive insights across all locations and operations'}
          </p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as any)}
          className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
        >
          <option value="week">Last Week</option>
          <option value="month">Last Month</option>
          <option value="quarter">Last Quarter</option>
          <option value="year">Last Year</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Acres</p>
              <p className="text-3xl font-bold text-white">{insights.totalAcres.toLocaleString()}</p>
              <p className="text-green-400 text-sm flex items-center mt-1">
                <TrendingUp className="h-4 w-4 mr-1" />
                +5.2% vs last month
              </p>
            </div>
            <MapPin className="h-12 w-12 text-blue-400" />
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Water Efficiency</p>
              <p className="text-3xl font-bold text-white">{insights.avgEfficiency}%</p>
              <p className="text-green-400 text-sm flex items-center mt-1">
                <TrendingUp className="h-4 w-4 mr-1" />
                +2.1% vs last month
              </p>
            </div>
            <Droplets className="h-12 w-12 text-blue-400" />
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Active Users</p>
              <p className="text-3xl font-bold text-white">{insights.activeUsers}</p>
              <p className="text-yellow-400 text-sm flex items-center mt-1">
                <TrendingDown className="h-4 w-4 mr-1" />
                -1 vs last month
              </p>
            </div>
            <Users className="h-12 w-12 text-purple-400" />
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Monthly Cost</p>
              <p className="text-3xl font-bold text-white">{formatCurrency(insights.totalCost)}</p>
              <p className="text-red-400 text-sm flex items-center mt-1">
                <TrendingUp className="h-4 w-4 mr-1" />
                +8.5% vs last month
              </p>
            </div>
            <DollarSign className="h-12 w-12 text-green-400" />
          </div>
        </div>
      </div>

      {/* Current Crop Performance */}
      {(selectedCrops.length > 0 || cropInstances.length > 0 || calculatorResult) && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
            <Sprout className="h-5 w-5 text-green-400" />
            <span>Current Crop Performance</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Active Crops Summary */}
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="font-medium text-white mb-3 flex items-center space-x-2">
                <Sprout className="h-4 w-4 text-green-400" />
                <span>Active Crops ({selectedCrops.length})</span>
              </h3>
              {selectedCrops.length > 0 ? (
                <div className="space-y-2">
                  {selectedCrops.slice(0, 4).map((crop, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-gray-300">{crop}</span>
                      <span className="text-green-400">Active</span>
                    </div>
                  ))}
                  {selectedCrops.length > 4 && (
                    <div className="text-sm text-gray-400">
                      +{selectedCrops.length - 4} more crops
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No crops selected</p>
              )}
            </div>

            {/* Active Plantings */}
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="font-medium text-white mb-3">Active Plantings ({cropInstances.length})</h3>
              {cropInstances.length > 0 ? (
                <div className="space-y-2">
                  {cropInstances.slice(0, 3).map((instance) => (
                    <div key={instance.id} className="text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">{instance.cropId}</span>
                        <span className="text-yellow-400">Stage {instance.currentStage}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Planted: {new Date(instance.plantingDate).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                  {cropInstances.length > 3 && (
                    <div className="text-sm text-gray-400">
                      +{cropInstances.length - 3} more plantings
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No active plantings</p>
              )}
            </div>

            {/* Calculator Results */}
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="font-medium text-white mb-3 flex items-center space-x-2">
                <Calculator className="h-4 w-4 text-blue-400" />
                <span>Current Calculation</span>
              </h3>
              {calculatorResult ? (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Daily Need:</span>
                    <span className="text-blue-400">{calculatorResult.dailyWaterNeed.toFixed(1)} gal</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Runtime:</span>
                    <span className="text-blue-400">{calculatorResult.runtimeHours}h {calculatorResult.runtimeMinutes}m</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Efficiency:</span>
                    <span className="text-green-400">{calculatorResult.efficiency}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Weekly Hours:</span>
                    <span className="text-yellow-400">{calculatorResult.weeklyHours.toFixed(1)}h</span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No calculation results</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Water Usage Overview */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Water Usage vs Budget</h2>
          <div className="text-sm text-gray-400">
            Used: {insights.waterUsage} AF / Budget: {insights.waterBudget} AF 
            ({((insights.waterUsage / insights.waterBudget) * 100).toFixed(1)}%)
          </div>
        </div>
        <div className="mb-4">
          <div className="w-full bg-gray-700 rounded-full h-4">
            <div 
              className={`h-4 rounded-full ${
                (insights.waterUsage / insights.waterBudget) > 0.9 ? 'bg-red-400' :
                (insights.waterUsage / insights.waterBudget) > 0.8 ? 'bg-yellow-400' : 'bg-green-400'
              }`}
              style={{ width: `${Math.min((insights.waterUsage / insights.waterBudget) * 100, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Water Usage by Location */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Water Usage by Location</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={waterUsageByLocation}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="usage" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Crop Distribution */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Crop Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={cropDistribution}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                label={({ name, value }) => `${name}: ${value}%`}
              >
                {cropDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Trends */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-white mb-4">Monthly Water Usage & Efficiency Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9CA3AF" />
              <YAxis yAxisId="left" stroke="#9CA3AF" />
              <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
              />
              <Area yAxisId="left" type="monotone" dataKey="waterUsage" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
              <Line yAxisId="right" type="monotone" dataKey="efficiency" stroke="#10B981" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Location Performance and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Location Performance */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Location Performance</h3>
          <div className="space-y-4">
            {waterUsageByLocation.map((location, index) => (
              <div key={index} className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-white">{location.name}</h4>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    location.efficiency >= 90 ? 'bg-green-100 text-green-800' :
                    location.efficiency >= 85 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {location.efficiency}% efficiency
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Water Usage:</span>
                    <div className="text-white font-medium">{location.usage} AF</div>
                  </div>
                  <div>
                    <span className="text-gray-400">Cost:</span>
                    <div className="text-white font-medium">{formatCurrency(location.cost)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts and Notifications */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Alerts</h3>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  {getAlertIcon(alert.severity)}
                  <div className="flex-1">
                    <p className="text-white text-sm">{alert.message}</p>
                    <p className="text-gray-400 text-xs mt-1">{alert.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 text-blue-400 hover:text-blue-300 text-sm">
            View All Alerts
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Stats</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{insights.totalBlocks}</div>
            <div className="text-sm text-gray-400">Active Blocks</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{insights.cropdiversityIndex}</div>
            <div className="text-sm text-gray-400">Crop Diversity Index</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">
              {(insights.waterUsage / insights.totalAcres).toFixed(2)}
            </div>
            <div className="text-sm text-gray-400">AF per Acre</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">
              ${(insights.totalCost / insights.totalAcres).toFixed(0)}
            </div>
            <div className="text-sm text-gray-400">Cost per Acre</div>
          </div>
        </div>
      </div>
    </div>
  );
};