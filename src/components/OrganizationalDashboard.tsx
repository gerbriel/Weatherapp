import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, Droplets, Users, MapPin, DollarSign, AlertTriangle, Sprout, Calculator } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

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
  irrigation_method: 'drip' | 'sprinkler' | 'flood' | 'micro-spray' | 'surface';
  soil_type: string;
  date_planted: string;
  growth_stage: string;
  system_efficiency: number;
  water_allocation: number; // acre-feet per season
  status: 'active' | 'dormant' | 'harvested' | 'preparation';
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface OrganizationalDashboardProps {
  selectedCrops?: string[];
  cropInstances?: CropInstance[];
  calculatorResult?: RuntimeResult | null;
  fieldBlocks?: FieldBlock[];
}

export const OrganizationalDashboard: React.FC<OrganizationalDashboardProps> = ({ 
  selectedCrops = [], 
  cropInstances = [], 
  calculatorResult = null,
  fieldBlocks = []
}) => {
  const { organization } = useAuth();
  const { isDarkMode } = useTheme();
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  // Organization-specific data calculated from field blocks
  const getOrganizationData = useMemo(() => {
    if (!organization || fieldBlocks.length === 0) return null;

    // Calculate dynamic insights from field blocks
    const totalAcres = fieldBlocks.reduce((sum, block) => sum + block.acres, 0);
    const totalBlocks = fieldBlocks.length;
    const waterUsage = fieldBlocks.reduce((sum, block) => sum + block.water_allocation, 0);
    const avgEfficiency = fieldBlocks.reduce((sum, block) => sum + block.system_efficiency, 0) / fieldBlocks.length;
    
    // Group by location for water usage
    const locationMap = new Map<string, { usage: number; efficiency: number; cost: number; count: number }>();
    fieldBlocks.forEach(block => {
      const existing = locationMap.get(block.location_name) || { usage: 0, efficiency: 0, cost: 0, count: 0 };
      existing.usage += block.water_allocation;
      existing.efficiency += block.system_efficiency;
      existing.cost += block.water_allocation * 280; // Estimated cost per acre-foot
      existing.count += 1;
      locationMap.set(block.location_name, existing);
    });

    const waterUsageByLocation = Array.from(locationMap.entries()).map(([name, data]) => ({
      name,
      usage: Math.round(data.usage * 10) / 10,
      efficiency: Math.round(data.efficiency / data.count),
      cost: Math.round(data.cost)
    }));

    // Calculate crop distribution from field blocks
    const cropMap = new Map<string, number>();
    fieldBlocks.forEach(block => {
      const existing = cropMap.get(block.crop_name) || 0;
      cropMap.set(block.crop_name, existing + block.acres);
    });

    const totalCropAcres = Array.from(cropMap.values()).reduce((sum, acres) => sum + acres, 0);
    const cropDistribution = Array.from(cropMap.entries()).map(([name, acres]) => {
      // Get color from organization crop distribution or use default
      const orgCrop = organization.cropDistribution?.find(crop => crop.name === name);
      return {
        name,
        acres,
        value: Math.round((acres / totalCropAcres) * 100),
        color: orgCrop?.color || '#6B7280'
      };
    });

    // Get base data structure for the organization
    const getBaseData = () => {
      switch (organization.id) {
        case 'local-org':
          return {
            activeUsers: 1,
            waterBudget: 180,
            totalCost: totalAcres * 100, // Estimated cost per acre
            cropdiversityIndex: cropDistribution.length * 1.2
          };
        case 'demo-farm-coop':
          return {
            activeUsers: 18,
            waterBudget: totalAcres * 0.4, // Estimated budget
            totalCost: totalAcres * 120,
            cropdiversityIndex: cropDistribution.length * 1.1
          };
        case 'enterprise-ag':
          return {
            activeUsers: 67,
            waterBudget: totalAcres * 0.38,
            totalCost: totalAcres * 140,
            cropdiversityIndex: cropDistribution.length * 1.3
          };
        default:
          return {
            activeUsers: 1,
            waterBudget: totalAcres * 0.5,
            totalCost: totalAcres * 100,
            cropdiversityIndex: cropDistribution.length
          };
      }
    };

    const baseData = getBaseData();

    return {
      insights: {
        totalAcres,
        totalBlocks,
        activeUsers: baseData.activeUsers,
        waterUsage,
        waterBudget: baseData.waterBudget,
        totalCost: baseData.totalCost,
        avgEfficiency,
        cropdiversityIndex: baseData.cropdiversityIndex
      },
      waterUsageByLocation,
      cropDistribution
    };
  }, [organization?.id, fieldBlocks, organization?.cropDistribution]);

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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {organization?.name || 'Organization'} Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {organization?.description || 'Comprehensive insights across all locations and operations'}
          </p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as any)}
          className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="week">Last Week</option>
          <option value="month">Last Month</option>
          <option value="quarter">Last Quarter</option>
          <option value="year">Last Year</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Total Acres</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{insights.totalAcres.toLocaleString()}</p>
              <p className="text-green-500 dark:text-green-400 text-sm flex items-center mt-1">
                <TrendingUp className="h-4 w-4 mr-1" />
                +5.2% vs last month
              </p>
            </div>
            <MapPin className="h-12 w-12 text-blue-500 dark:text-blue-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Water Efficiency</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{insights.avgEfficiency}%</p>
              <p className="text-green-500 dark:text-green-400 text-sm flex items-center mt-1">
                <TrendingUp className="h-4 w-4 mr-1" />
                +2.1% vs last month
              </p>
            </div>
            <Droplets className="h-12 w-12 text-blue-500 dark:text-blue-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Active Users</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{insights.activeUsers}</p>
              <p className="text-yellow-500 dark:text-yellow-400 text-sm flex items-center mt-1">
                <TrendingDown className="h-4 w-4 mr-1" />
                -1 vs last month
              </p>
            </div>
            <Users className="h-12 w-12 text-purple-500 dark:text-purple-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Monthly Cost</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(insights.totalCost)}</p>
              <p className="text-red-500 dark:text-red-400 text-sm flex items-center mt-1">
                <TrendingUp className="h-4 w-4 mr-1" />
                +8.5% vs last month
              </p>
            </div>
            <DollarSign className="h-12 w-12 text-green-500 dark:text-green-400" />
          </div>
        </div>
      </div>

      {/* Current Crop Performance */}
      {(selectedCrops.length > 0 || cropInstances.length > 0 || calculatorResult) && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
            <Sprout className="h-5 w-5 text-green-500 dark:text-green-400" />
            <span>Current Crop Performance</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Active Crops Summary */}
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
                <Sprout className="h-4 w-4 text-green-500 dark:text-green-400" />
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
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">Active Plantings ({cropInstances.length})</h3>
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
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
                <Calculator className="h-4 w-4 text-blue-500 dark:text-blue-400" />
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
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Water Usage vs Budget</h2>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Used: {insights.waterUsage} AF / Budget: {insights.waterBudget} AF 
            ({((insights.waterUsage / insights.waterBudget) * 100).toFixed(1)}%)
          </div>
        </div>
        <div className="mb-4">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
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
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Water Usage by Location</h3>
          <ResponsiveContainer width="100%" height={300} minWidth={300} minHeight={250}>
            <BarChart data={waterUsageByLocation}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#374151" : "#e5e7eb"} />
              <XAxis dataKey="name" stroke={isDarkMode ? "#9CA3AF" : "#6b7280"} />
              <YAxis stroke={isDarkMode ? "#9CA3AF" : "#6b7280"} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: isDarkMode ? '#1F2937' : '#ffffff', 
                  border: isDarkMode ? '1px solid #374151' : '1px solid #e5e7eb',
                  borderRadius: '8px',
                  color: isDarkMode ? '#ffffff' : '#1f2937'
                }}
              />
              <Bar dataKey="usage" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Crop Distribution */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Crop Distribution</h3>
          <ResponsiveContainer width="100%" height={300} minWidth={300} minHeight={250}>
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
                  backgroundColor: isDarkMode ? '#1F2937' : '#ffffff', 
                  border: isDarkMode ? '1px solid #374151' : '1px solid #e5e7eb',
                  borderRadius: '8px',
                  color: isDarkMode ? '#ffffff' : '#1f2937'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Trends */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Monthly Water Usage & Efficiency Trends</h3>
          <ResponsiveContainer width="100%" height={300} minWidth={300} minHeight={250}>
            <AreaChart data={monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#374151" : "#e5e7eb"} />
              <XAxis dataKey="month" stroke={isDarkMode ? "#9CA3AF" : "#6b7280"} />
              <YAxis yAxisId="left" stroke={isDarkMode ? "#9CA3AF" : "#6b7280"} />
              <YAxis yAxisId="right" orientation="right" stroke={isDarkMode ? "#9CA3AF" : "#6b7280"} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: isDarkMode ? '#1F2937' : '#ffffff', 
                  border: isDarkMode ? '1px solid #374151' : '1px solid #e5e7eb',
                  borderRadius: '8px',
                  color: isDarkMode ? '#ffffff' : '#1f2937'
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
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Location Performance</h3>
          <div className="space-y-4">
            {waterUsageByLocation.map((location, index) => (
              <div key={index} className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">{location.name}</h4>
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
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Alerts</h3>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  {getAlertIcon(alert.severity)}
                  <div className="flex-1">
                    <p className="text-gray-900 dark:text-white text-sm">{alert.message}</p>
                    <p className="text-gray-600 dark:text-gray-400 text-xs mt-1">{alert.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm">
            View All Alerts
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Stats</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{insights.totalBlocks}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Active Blocks</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{insights.cropdiversityIndex}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Crop Diversity Index</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {(insights.waterUsage / insights.totalAcres).toFixed(2)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">AF per Acre</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              ${(insights.totalCost / insights.totalAcres).toFixed(0)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Cost per Acre</div>
          </div>
        </div>
      </div>
    </div>
  );
};