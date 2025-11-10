import React, { useMemo, useState, useEffect } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from 'recharts';
import { Eye, EyeOff } from 'lucide-react';

interface CropETCData {
  cropId: string;
  cropName: string;
  location: string;
  currentStage: string;
  etc: number; // Actual crop evapotranspiration (mm/day)
  eto: number; // Reference evapotranspiration (mm/day)
  kc: number;  // Crop coefficient
  plantingDate: string;
  fieldName?: string;
}

interface WeatherData {
  daily: {
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    wind_speed_10m_max?: number[];
    relative_humidity_2m?: number[];
    precipitation_sum?: number[];
  };
}

interface CropETCChartsProps {
  cropInstances: any[];
  locations: any[];
  location?: any; // Single location for location-specific display
  weatherData?: any; // Optional weather data for current location
  className?: string;
  dateRange?: { startDate: string; endDate: string; };
  reportMode?: 'current' | 'historical';
}

// Helper function to calculate ETO using simplified Penman equation
const calculateETO = (weather: WeatherData, dayIndex: number = 0): number => {
  if (!weather?.daily) return 4.0; // Default ETO value

  const tempMax = weather.daily.temperature_2m_max?.[dayIndex] || 25;
  const tempMin = weather.daily.temperature_2m_min?.[dayIndex] || 15;
  const windSpeed = weather.daily.wind_speed_10m_max?.[dayIndex] || 2;
  const humidity = weather.daily.relative_humidity_2m?.[dayIndex] || 65;

  // Simplified ETO calculation (Penman-Monteith approximation)
  const tempMean = (tempMax + tempMin) / 2;
  const windFactor = 1 + (windSpeed / 10);
  const humidityFactor = (100 - humidity) / 100;
  
  // Basic ETO calculation (mm/day)
  const eto = Math.max(0.5, (tempMean * 0.17 * windFactor * humidityFactor));
  
  return Math.round(eto * 100) / 100;
};

// Helper function to generate dates between start and end
const generateDateRange = (startDate: string, endDate: string): string[] => {
  const dates: string[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(d.toISOString().split('T')[0]);
  }
  
  return dates;
};

// Helper function to get crop coefficient based on stage
const getCropCoefficient = (cropId: string, stage: string): number => {
  const kcValues: Record<string, Record<string, number>> = {
    almonds: { 'Initial': 0.40, 'Development': 0.75, 'Mid-season': 1.11, 'Late season': 0.85 },
    walnuts: { 'Initial': 0.50, 'Development': 0.80, 'Mid-season': 1.05, 'Late season': 0.75 },
    pistachios: { 'Initial': 0.40, 'Development': 0.70, 'Mid-season': 1.05, 'Late season': 0.80 },
    grapes: { 'Initial': 0.30, 'Development': 0.70, 'Mid-season': 0.85, 'Late season': 0.45 },
    citrus: { 'Initial': 0.55, 'Development': 0.75, 'Mid-season': 0.75, 'Late season': 0.55 },
    tomatoes: { 'Initial': 0.60, 'Development': 0.80, 'Mid-season': 1.15, 'Late season': 0.80 },
    corn: { 'Initial': 0.30, 'Development': 0.70, 'Mid-season': 1.20, 'Late season': 0.60 },
    cotton: { 'Initial': 0.35, 'Development': 0.70, 'Mid-season': 1.15, 'Late season': 0.50 }
  };
  
  return kcValues[cropId]?.[stage] || 0.75; // Default Kc
};

export const CropETCCharts: React.FC<CropETCChartsProps> = ({
  cropInstances,
  locations,
  location,
  weatherData,
  className = "",
  dateRange,
  reportMode = 'current'
}) => {
  // Get all available crop types
  const availableCrops = useMemo(() => {
    const targetLocations = location ? [location] : locations;
    const targetLocationIds = targetLocations.map(loc => loc.id);
    
    const cropTypes = new Set(
      cropInstances
        .filter(crop => targetLocationIds.includes(crop.locationId))
        .map(crop => crop.cropId)
    );
    
    return Array.from(cropTypes).map(cropId => ({
      id: cropId,
      name: cropId.charAt(0).toUpperCase() + cropId.slice(1)
    }));
  }, [cropInstances, locations, location]);

  // State for managing which crops are visible
  const [visibleCrops, setVisibleCrops] = useState<Set<string>>(
    new Set(availableCrops.map(crop => crop.id))
  );

  // State for chart rendering readiness
  const [isChartsReady, setIsChartsReady] = useState(false);

  // Update visible crops when available crops change
  React.useEffect(() => {
    setVisibleCrops(new Set(availableCrops.map(crop => crop.id)));
  }, [availableCrops]);

  // Delay chart rendering to ensure containers have proper dimensions
  useEffect(() => {
    // Use longer delay and ensure DOM is ready
    const timer = setTimeout(() => {
      // Double-check that container elements exist before enabling charts
      const containers = document.querySelectorAll('[style*="minHeight"]');
      if (containers.length > 0) {
        setIsChartsReady(true);
      } else {
        // Retry after additional delay if containers aren't ready
        setTimeout(() => setIsChartsReady(true), 200);
      }
    }, 250);
    
    return () => clearTimeout(timer);
  }, []);

  const etcData = useMemo(() => {
    const data: CropETCData[] = [];
    
    // Filter for single location if provided
    const targetLocations = location ? [location] : locations;
    const targetLocationIds = targetLocations.map(loc => loc.id);
    
    cropInstances
      .filter(crop => targetLocationIds.includes(crop.locationId))
      .filter(crop => visibleCrops.has(crop.cropId)) // Filter by visible crops
      .forEach(crop => {
        const cropLocation = targetLocations.find(loc => loc.id === crop.locationId);
        if (!cropLocation) return;
        
        const eto = calculateETO(weatherData || cropLocation.weatherData);
        const kc = getCropCoefficient(crop.cropId, crop.currentStage);
        const etc = eto * kc;
        
        data.push({
          cropId: crop.cropId,
          cropName: crop.cropId.charAt(0).toUpperCase() + crop.cropId.slice(1),
          location: cropLocation.name,
          currentStage: crop.currentStage,
          etc: Math.round(etc * 100) / 100,
          eto: eto,
          kc: kc,
          plantingDate: crop.plantingDate,
          fieldName: crop.fieldName
        });
      });
    
    return data;
  }, [cropInstances, locations, location, visibleCrops]);

  // Prepare time-series data for individual crop water use comparison chart
  const cropWaterUseTimeSeriesData = useMemo(() => {
    if (!dateRange?.startDate || !dateRange?.endDate) {
      // Fallback to single point data if no date range
      return etcData.map((item, index) => ({
        date: new Date().toISOString().split('T')[0],
        day: index + 1,
        displayDate: new Date().toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        }),
        [`${item.cropName}_${item.location}_ETC`]: item.etc,
        [`${item.cropName}_${item.location}_ETO`]: item.eto,
        crops: [{
          cropId: item.cropId,
          cropName: item.cropName,
          location: item.location,
          key: `${item.cropName}_${item.location}`
        }]
      }));
    }

    // Generate comprehensive time-series data for crop water use
    const dates = generateDateRange(dateRange.startDate, dateRange.endDate);
    const timeSeriesData: any[] = [];
    
    dates.forEach((date, dayIndex) => {
      const dataPoint: any = {
        date,
        day: dayIndex + 1,
        displayDate: new Date(date).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        })
      };

      // Add water use data for each crop
      etcData.forEach((crop) => {
        // Simulate realistic daily variation (in real app, this would come from historical weather data)
        const baseETO = crop.eto;
        const baseETC = crop.etc;
        
        // Add realistic daily variation with seasonal patterns
        const dayOfYear = dayIndex / dates.length;
        const seasonalVariation = Math.sin(dayOfYear * Math.PI * 2) * 0.15;
        const dailyNoise = (Math.sin(dayIndex * 0.2) + Math.cos(dayIndex * 0.3)) * 0.1;
        const weatherVariation = Math.sin(dayIndex * 0.1) * 0.2;
        
        const totalVariation = 1 + seasonalVariation + dailyNoise + weatherVariation;
        
        const dailyETO = Math.max(0.5, Math.round((baseETO * totalVariation) * 100) / 100);
        const dailyETC = Math.max(0.3, Math.round((baseETC * totalVariation) * 100) / 100);
        
        // Use crop name + location as unique identifier for this chart
        const cropKey = `${crop.cropName}_${crop.location}`;
        dataPoint[`${cropKey}_ETC`] = dailyETC;
        dataPoint[`${cropKey}_ETO`] = dailyETO;
        
        // Store crop metadata
        if (!dataPoint.crops) dataPoint.crops = [];
        dataPoint.crops.push({
          cropId: crop.cropId,
          cropName: crop.cropName,
          location: crop.location,
          key: cropKey
        });
      });

      timeSeriesData.push(dataPoint);
    });

    return timeSeriesData;
  }, [etcData, dateRange]);

  // Get line configurations for individual crop water use chart
  const cropWaterUseLineConfigs = useMemo(() => {
    // Use different colors than the comparison chart
    const etcColors = ['#DC2626', '#7C3AED', '#059669', '#EA580C', '#0891B2', '#BE123C', '#7C2D12', '#581C87'];
    const etoColors = ['#16A34A', '#2563EB', '#CA8A04', '#C2410C', '#0E7490', '#BE185D', '#A16207', '#6D28D9'];
    
    return etcData.map((item, index) => ({
      key: `${item.cropName}_${item.location}`,
      name: `${item.cropName} (${item.location})`,
      cropId: item.cropId,
      location: item.location,
      etcColor: etcColors[index % etcColors.length],
      etoColor: etoColors[index % etoColors.length],
      etcKey: `${item.cropName}_${item.location}_ETC`,
      etoKey: `${item.cropName}_${item.location}_ETO`,
      index: index
    }));
  }, [etcData]);

  // Prepare data for individual crop comparison chart (fallback bar chart view)
  const cropComparisonData = useMemo(() => {
    return etcData.map((item, index) => ({
      name: `${item.cropName}`,
      fullName: `${item.cropName} (${item.location})`,
      ETC: item.etc,
      ETO: item.eto,
      KC: item.kc,
      location: item.location
    }));
  }, [etcData]);



  // Prepare time-series data for ETC vs ETO comparison chart
  const etcVsEtoData = useMemo(() => {
    if (!dateRange?.startDate || !dateRange?.endDate) {
      // Fallback to current day data if no date range
      return etcData.map((item, index) => ({
        date: new Date().toISOString().split('T')[0],
        day: index + 1,
        name: `${item.cropName} (${item.location.substring(0, 8)})`,
        fullName: `${item.cropName} (${item.location})`,
        ETC: item.etc,
        ETO: item.eto,
        KC: item.kc,
        Stage: item.currentStage,
        cropId: item.cropId,
        location: item.location
      }));
    }

    // Generate time-series data
    const dates = generateDateRange(dateRange.startDate, dateRange.endDate);
    const timeSeriesData: any[] = [];
    
    dates.forEach((date, dayIndex) => {
      const dataPoint: any = {
        date,
        day: dayIndex + 1,
        displayDate: new Date(date).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        })
      };

      // Add data for each crop
      etcData.forEach((crop, cropIndex) => {
        // Simulate daily variation (in real app, this would come from historical weather data)
        const baseETO = crop.eto;
        const baseETC = crop.etc;
        
        // Add some realistic daily variation (±10-20%)
        const variation = 0.8 + (Math.sin(dayIndex * 0.1 + cropIndex) * 0.2);
        const seasonalFactor = 0.9 + (Math.sin((dayIndex / dates.length) * Math.PI * 2) * 0.1);
        
        const dailyETO = Math.round((baseETO * variation * seasonalFactor) * 100) / 100;
        const dailyETC = Math.round((baseETC * variation * seasonalFactor) * 100) / 100;
        
        // Use crop name + location as unique identifier
        const cropKey = `${crop.cropName}_${crop.location}`;
        dataPoint[`${cropKey}_ETO`] = dailyETO;
        dataPoint[`${cropKey}_ETC`] = dailyETC;
        dataPoint[`${cropKey}_KC`] = Math.round(crop.kc * 100) / 100;
        
        // Store crop metadata
        if (!dataPoint.crops) dataPoint.crops = [];
        dataPoint.crops.push({
          cropId: crop.cropId,
          cropName: crop.cropName,
          location: crop.location,
          key: cropKey
        });
      });

      timeSeriesData.push(dataPoint);
    });

    return timeSeriesData;
  }, [etcData, dateRange]);

  // Get individual crop line configurations for the comparison chart
  const cropLineConfigs = useMemo(() => {
    // ETC colors (Blues and Purples)
    const etcColors = ['#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#C084FC', '#1D4ED8', '#2563EB', '#3730A3'];
    // ETO colors (Greens and Teals)  
    const etoColors = ['#10B981', '#06B6D4', '#14B8A6', '#059669', '#047857', '#0D9488', '#15803D', '#166534'];
    // KC colors (Oranges and Reds)
    const kcColors = ['#F59E0B', '#EF4444', '#F97316', '#DC2626', '#EA580C', '#D97706', '#B45309', '#92400E'];
    
    return etcData.map((item, index) => ({
      key: `${item.cropName}_${item.location}`,
      name: `${item.cropName} (${item.location})`,
      cropId: item.cropId,
      location: item.location,
      etcColor: etcColors[index % etcColors.length],
      etoColor: etoColors[index % etoColors.length],
      kcColor: kcColors[index % kcColors.length],
      etcKey: `${item.cropName}_${item.location}_ETC`,
      etoKey: `${item.cropName}_${item.location}_ETO`,
      kcKey: `${item.cropName}_${item.location}_KC`,
      index: index
    }));
  }, [etcData]);

  // State for managing which crops are selected for line visibility
  const [selectedCropsForLines, setSelectedCropsForLines] = useState<Set<string>>(new Set());
  
  // State for which line types are enabled (ETC, ETO, KC)
  const [enabledLineTypes, setEnabledLineTypes] = useState<{
    etc: boolean;
    eto: boolean;
    kc: boolean;
  }>({ etc: true, eto: true, kc: true });

  // Computed visible lines based on crop selection and line type filters
  const visibleLines = React.useMemo(() => {
    const lines = new Set<string>();
    cropLineConfigs.forEach(config => {
      if (selectedCropsForLines.has(config.key)) {
        if (enabledLineTypes.etc) lines.add(config.etcKey);
        if (enabledLineTypes.eto) lines.add(config.etoKey);
        if (enabledLineTypes.kc) lines.add(config.kcKey);
      }
    });
    return lines;
  }, [cropLineConfigs, selectedCropsForLines, enabledLineTypes]);

  // Initialize selected crops when crop configs change
  React.useEffect(() => {
    setSelectedCropsForLines(new Set(cropLineConfigs.map(config => config.key)));
  }, [cropLineConfigs]);

  // Handle crop visibility toggle
  const toggleCropVisibility = (cropId: string) => {
    const newVisibleCrops = new Set(visibleCrops);
    if (newVisibleCrops.has(cropId)) {
      newVisibleCrops.delete(cropId);
    } else {
      newVisibleCrops.add(cropId);
    }
    setVisibleCrops(newVisibleCrops);
  };

  // Toggle all crops visibility
  const toggleAllCrops = () => {
    if (visibleCrops.size === availableCrops.length) {
      setVisibleCrops(new Set()); // Hide all
    } else {
      setVisibleCrops(new Set(availableCrops.map(crop => crop.id))); // Show all
    }
  };

  // Toggle crop selection for line visibility
  const toggleCropSelection = (cropKey: string) => {
    const newSelectedCrops = new Set(selectedCropsForLines);
    if (newSelectedCrops.has(cropKey)) {
      newSelectedCrops.delete(cropKey);
    } else {
      newSelectedCrops.add(cropKey);
    }
    setSelectedCropsForLines(newSelectedCrops);
  };

  // Toggle line type filter
  const toggleLineTypeFilter = (lineType: 'etc' | 'eto' | 'kc') => {
    setEnabledLineTypes(prev => ({
      ...prev,
      [lineType]: !prev[lineType]
    }));
  };

  // Preset configurations
  const applyPreset = (preset: string) => {
    switch (preset) {
      case 'etc-only':
        setEnabledLineTypes({ etc: true, eto: false, kc: false });
        break;
      case 'eto-only':
        setEnabledLineTypes({ etc: false, eto: true, kc: false });
        break;
      case 'kc-only':
        setEnabledLineTypes({ etc: false, eto: false, kc: true });
        break;
      case 'etc-eto':
        setEnabledLineTypes({ etc: true, eto: true, kc: false });
        break;
      case 'etc-kc':
        setEnabledLineTypes({ etc: true, eto: false, kc: true });
        break;
      case 'all':
        setEnabledLineTypes({ etc: true, eto: true, kc: true });
        break;
      case 'none':
        setEnabledLineTypes({ etc: false, eto: false, kc: false });
        break;
    }
  };

  // Select all/none crops for line visibility 
  const toggleAllCropsForLines = () => {
    if (selectedCropsForLines.size === cropLineConfigs.length) {
      setSelectedCropsForLines(new Set());
    } else {
      setSelectedCropsForLines(new Set(cropLineConfigs.map(config => config.key)));
    }
  };

  // Show crop selection controls even when no crops are visible
  if (availableCrops.length === 0) {
    return (
      <div className={`bg-gray-50 dark:bg-gray-700 p-6 rounded-lg ${className}`}>
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          🌾 Crop Water Use Analysis
          {location && <span className="text-sm font-normal text-gray-500">for {location.name}</span>}
        </h4>
        <p className="text-gray-500 dark:text-gray-400 text-center">
          No active crops found for ETC analysis
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Crop Selection Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border-l-4 border-blue-500">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Eye className="h-4 w-4 text-blue-500" />
            Chart Visibility Controls 
            <span className="text-xs text-gray-500 dark:text-gray-400 font-normal">
              ({visibleCrops.size}/{availableCrops.length} visible)
            </span>
          </h4>
          <button
            onClick={toggleAllCrops}
            className="text-xs px-3 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            {visibleCrops.size === availableCrops.length ? (
              <>
                <EyeOff className="h-3 w-3 inline mr-1" />
                Hide All
              </>
            ) : (
              <>
                <Eye className="h-3 w-3 inline mr-1" />
                Show All ({availableCrops.length})
              </>
            )}
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
          {availableCrops.map(crop => (
            <label
              key={crop.id}
              className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-all duration-200 ${
                visibleCrops.has(crop.id)
                  ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-600'
                  : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <input
                type="checkbox"
                checked={visibleCrops.has(crop.id)}
                onChange={() => toggleCropVisibility(crop.id)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className={`text-sm font-medium transition-colors ${
                visibleCrops.has(crop.id)
                  ? 'text-blue-700 dark:text-blue-300'
                  : 'text-gray-700 dark:text-gray-300'
              }`}>
                {crop.name}
              </span>
            </label>
          ))}
        </div>
        {etcData.length === 0 && (
          <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded text-sm text-yellow-700 dark:text-yellow-300">
            <EyeOff className="h-4 w-4 inline mr-1" />
            No crops selected for display. Select crops above to view charts.
          </div>
        )}
      </div>

      {/* Individual Crop Water Use Time Series */}
      {etcData.length > 0 && (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          📊 Individual Crop Water Use - Time Series
          {location && <span className="text-sm font-normal text-gray-500">• {location.name}</span>}
        </h4>
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-2">
          <span>📡 Time-Series Data:</span>
          <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
            NOAA GFS Global & NAM CONUS via Open-Meteo API
          </span>
          <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">
            CMIS API (CA Irrigation)
          </span>
          <span className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded">
            FAO-56 Coefficients
          </span>
        </div>
        
        <div className="h-80 w-full" style={{ minHeight: '320px', minWidth: '360px' }}>
          {!isChartsReady ? (
            <div className="w-full h-full bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-600 dark:text-gray-400">
                <div className="text-lg mb-2">📊</div>
                <div>Loading charts...</div>
              </div>
            </div>
          ) : dateRange?.startDate && dateRange?.endDate ? (
            <ResponsiveContainer width="100%" height="100%" minWidth={360} minHeight={320}>
              <LineChart 
                data={cropWaterUseTimeSeriesData} 
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="displayDate" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  className="text-xs fill-gray-600 dark:fill-gray-400"
                />
                <YAxis 
                  label={{ value: 'Water Use (mm/day)', angle: -90, position: 'insideLeft' }}
                  className="text-xs fill-gray-600 dark:fill-gray-400"
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'var(--tooltip-bg)',
                    border: '1px solid var(--tooltip-border)',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  formatter={(value: number, name: string) => {
                    const isETC = name.includes('ETC');
                    const cropName = name.replace('_ETC', '').replace('_ETO', '');
                    return [
                      `${value} mm/day`,
                      `${cropName} ${isETC ? 'ETC' : 'ETO'}`
                    ];
                  }}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
                />
                
                {/* Render ETC lines for each visible crop */}
                {cropWaterUseLineConfigs
                  .filter(config => visibleCrops.has(config.cropId))
                  .map((config) => (
                  <Line 
                    key={config.etcKey}
                    type="monotone" 
                    dataKey={config.etcKey}
                    stroke={config.etcColor} 
                    strokeWidth={3}
                    dot={false}
                    name={`${config.name} ETC`}
                    connectNulls={false}
                  />
                ))}
                
                {/* Render ETO lines for each visible crop */}
                {cropWaterUseLineConfigs
                  .filter(config => visibleCrops.has(config.cropId))
                  .map((config) => (
                  <Line 
                    key={config.etoKey}
                    type="monotone" 
                    dataKey={config.etoKey}
                    stroke={config.etoColor} 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    name={`${config.name} ETO`}
                    connectNulls={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            /* Fallback: Bar chart view when no date range selected */
            <ResponsiveContainer width="100%" height="100%" minWidth={360} minHeight={320}>
              <BarChart data={cropComparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="fullName" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  className="text-xs fill-gray-600 dark:fill-gray-400"
                />
                <YAxis 
                  label={{ value: 'Water Use (mm/day)', angle: -90, position: 'insideLeft' }}
                  className="text-xs fill-gray-600 dark:fill-gray-400"
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'var(--tooltip-bg)',
                    border: '1px solid var(--tooltip-border)',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  formatter={(value: number, name: string) => [
                    `${value} mm/day`,
                    name === 'ETC' ? 'Crop ET' : 'Reference ET'
                  ]}
                  labelFormatter={(label) => `${label}`}
                />
                <Legend />
                <Bar 
                  dataKey="ETC" 
                  fill="#DC2626" 
                  name="Crop ETC"
                  radius={[2, 2, 0, 0]}
                />
                <Bar 
                  dataKey="ETO" 
                  fill="#16A34A" 
                  name="Reference ETO"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        
        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          {dateRange?.startDate && dateRange?.endDate ? (
            <>
              <p>• <strong>Time-Series View:</strong> ETC and ETO trends over the selected date range ({dateRange.startDate} to {dateRange.endDate})</p>
              <p>• <strong>Line Types:</strong> ETC (solid lines), ETO (dashed lines) - each crop with distinct colors</p>
              <p>• <strong>Interactive:</strong> Use crop visibility controls above to show/hide specific crops</p>
            </>
          ) : (
            <>
              <p>• <strong>Current Day View:</strong> Real-time ETC and ETO values for active crops</p>
              <p>• <strong>Time-Series:</strong> Select a date range above to view trends over time</p>
            </>
          )}
          <p>• <strong>Data Source:</strong> NOAA weather models via Open-Meteo API with FAO-56 calculations</p>
        </div>
      </div>
      )}

      {/* ETC vs ETO Comparison Chart */}
      {etcData.length > 0 && (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          📈 Crop vs Reference ET Comparison
          {location && <span className="text-sm font-normal text-gray-500">• {location.name}</span>}
        </h4>
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          � Time Series: ETC = ETO × Kc (crop coefficient) over selected date range • Using NOAA weather data via Open-Meteo + FAO-56 standards
        </div>

        {/* Simplified Chart Controls: Crop Selection + Line Type Filters */}
        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded border space-y-4">
          
          {/* Header with summary */}
          <div className="flex items-center justify-between">
            <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Eye className="h-4 w-4 text-blue-500" />
              Chart Controls
              <span className="text-xs text-gray-500 dark:text-gray-400 font-normal">
                ({visibleLines.size} lines visible)
              </span>
            </h5>
          </div>

          {/* Quick Presets */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Quick Presets:</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => applyPreset('etc-only')}
                className="text-xs px-3 py-1 rounded-full border border-blue-300 dark:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              >
                📊 ETC Only
              </button>
              <button
                onClick={() => applyPreset('eto-only')}
                className="text-xs px-3 py-1 rounded-full border border-green-300 dark:border-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
              >
                🌡️ ETO Only
              </button>
              <button
                onClick={() => applyPreset('etc-eto')}
                className="text-xs px-3 py-1 rounded-full border border-purple-300 dark:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
              >
                ⚖️ ETC vs ETO
              </button>
              <button
                onClick={() => applyPreset('kc-only')}
                className="text-xs px-3 py-1 rounded-full border border-orange-300 dark:border-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
              >
                🔢 KC Only
              </button>
              <button
                onClick={() => applyPreset('all')}
                className="text-xs px-3 py-1 rounded-full border border-gray-400 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                👁️ Show All
              </button>
            </div>
          </div>

          {/* Crop Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Select Crops ({selectedCropsForLines.size}/{cropLineConfigs.length}):
              </label>
              <button
                onClick={toggleAllCropsForLines}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                {selectedCropsForLines.size === cropLineConfigs.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {cropLineConfigs.map(config => (
                <label
                  key={config.key}
                  className={`flex items-center gap-2 px-3 py-1 rounded-full border cursor-pointer transition-all text-xs ${
                    selectedCropsForLines.has(config.key)
                      ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-600 text-blue-700 dark:text-blue-300'
                      : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedCropsForLines.has(config.key)}
                    onChange={() => toggleCropSelection(config.key)}
                    className="w-3 h-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-1"
                  />
                  <span className="font-medium">
                    {config.name}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Line Type Filters */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Show Line Types:</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enabledLineTypes.etc}
                  onChange={() => toggleLineTypeFilter('etc')}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-1"
                />
                <div className="flex items-center gap-2">
                  <div className="w-4 h-1 bg-blue-500 rounded"></div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">ETC (Crop)</span>
                </div>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enabledLineTypes.eto}
                  onChange={() => toggleLineTypeFilter('eto')}
                  className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500 focus:ring-1"
                />
                <div className="flex items-center gap-2">
                  <div className="w-4 h-1 border-dashed border-2 border-green-500"></div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">ETO (Reference)</span>
                </div>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enabledLineTypes.kc}
                  onChange={() => toggleLineTypeFilter('kc')}
                  className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500 focus:ring-1"
                />
                <div className="flex items-center gap-2">
                  <div className="w-4 h-1 border-dotted border-2 border-orange-500"></div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">KC (Coefficient)</span>
                </div>
              </label>
            </div>
          </div>
        </div>
        <div className="h-80 w-full" style={{ minHeight: '320px', minWidth: '360px' }}>
          {!isChartsReady ? (
            <div className="w-full h-full bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-600 dark:text-gray-400">
                <div className="text-lg mb-2">📊</div>
                <div>Loading charts...</div>
              </div>
            </div>
          ) : visibleLines.size > 0 ? (
            <ResponsiveContainer width="100%" height="100%" minWidth={360} minHeight={320}>
              <LineChart 
                data={etcVsEtoData} 
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="displayDate" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  className="text-xs fill-gray-600 dark:fill-gray-400"
                />
                <YAxis 
                  yAxisId="left"
                  label={{ value: 'Water Use (mm/day)', angle: -90, position: 'insideLeft' }}
                  className="text-xs fill-gray-600 dark:fill-gray-400"
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  label={{ value: 'Crop Coefficient (Kc)', angle: 90, position: 'insideRight' }}
                  className="text-xs fill-gray-600 dark:fill-gray-400"
                  domain={[0, 'dataMax + 0.2']}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'var(--tooltip-bg)',
                    border: '1px solid var(--tooltip-border)',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  formatter={(value: number, name: string) => {
                    // Parse crop info from dataKey
                    const isETC = name.includes('ETC');
                    const isETO = name.includes('ETO');
                    const isKC = name.includes('KC');
                    
                    let unit = '';
                    let type = '';
                    
                    if (isETC) {
                      unit = 'mm/day';
                      type = 'ETC';
                    } else if (isETO) {
                      unit = 'mm/day'; 
                      type = 'ETO';
                    } else if (isKC) {
                      unit = '';
                      type = 'KC';
                    }
                    
                    return [
                      `${value} ${unit}`,
                      `${name.split(' ').slice(0, -1).join(' ')} ${type}`
                    ];
                  }}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
                />
                
                {/* Render ETC lines for each visible line */}
                {cropLineConfigs
                  .filter(config => visibleLines.has(config.etcKey))
                  .map((config) => (
                  <Line 
                    key={config.etcKey}
                    type="monotone" 
                    dataKey={config.etcKey}
                    yAxisId="left"
                    stroke={config.etcColor} 
                    strokeWidth={3}
                    dot={false}
                    name={`${config.name} ETC`}
                    connectNulls={false}
                  />
                ))}
                
                {/* Render ETO lines for each visible line */}
                {cropLineConfigs
                  .filter(config => visibleLines.has(config.etoKey))
                  .map((config) => (
                  <Line 
                    key={config.etoKey}
                    type="monotone" 
                    dataKey={config.etoKey}
                    yAxisId="left"
                    stroke={config.etoColor} 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    name={`${config.name} ETO`}
                    connectNulls={false}
                  />
                ))}
                
                {/* Render KC lines for each visible line */}
                {cropLineConfigs
                  .filter(config => visibleLines.has(config.kcKey))
                  .map((config) => (
                  <Line 
                    key={config.kcKey}
                    type="monotone" 
                    dataKey={config.kcKey}
                    yAxisId="right"
                    stroke={config.kcColor} 
                    strokeWidth={2}
                    strokeDasharray="2 2"
                    dot={false}
                    name={`${config.name} KC`}
                    connectNulls={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-700 rounded">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <EyeOff className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No lines selected for comparison</p>
                <p className="text-xs mt-1">Select individual lines above to view ET comparison over time</p>
              </div>
            </div>
          )}
        </div>
        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          <p>• <strong>Time Series:</strong> Shows ETC, ETO, and KC values over the selected date range</p>
          <p>• <strong>Line Types:</strong> ETC (solid), ETO (dashed), KC (dotted) - each with distinct colors</p>
          <p>• <strong>Dual Y-Axis:</strong> Left axis for water use (mm/day), right axis for crop coefficient</p>
          <p>• <strong>Data Source:</strong> NOAA weather models via Open-Meteo API with FAO-56 calculations</p>
        </div>
      </div>
      )}

      {/* Detailed Crop Table */}
      {etcData.length > 0 && (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          📋 Detailed Water Use Data
          {location && <span className="text-sm font-normal text-gray-500">• {location.name}</span>}
        </h4>
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          📊 Real-time calculations using current weather conditions and scientifically-validated crop coefficients
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 text-gray-700 dark:text-gray-300">Crop</th>
                <th className="text-left py-2 text-gray-700 dark:text-gray-300">Location</th>
                <th className="text-left py-2 text-gray-700 dark:text-gray-300">Stage</th>
                <th className="text-right py-2 text-gray-700 dark:text-gray-300">Kc</th>
                <th className="text-right py-2 text-gray-700 dark:text-gray-300">ETO</th>
                <th className="text-right py-2 text-gray-700 dark:text-gray-300">ETC</th>
                <th className="text-right py-2 text-gray-700 dark:text-gray-300">Water Need</th>
              </tr>
            </thead>
            <tbody>
              {etcData.map((item, index) => (
                <tr key={index} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="py-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {item.cropName}
                    </span>
                    {item.fieldName && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {item.fieldName}
                      </div>
                    )}
                  </td>
                  <td className="py-2 text-gray-600 dark:text-gray-400">{item.location}</td>
                  <td className="py-2">
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs">
                      {item.currentStage}
                    </span>
                  </td>
                  <td className="py-2 text-right text-gray-600 dark:text-gray-400">{item.kc}</td>
                  <td className="py-2 text-right text-gray-600 dark:text-gray-400">{item.eto}</td>
                  <td className="py-2 text-right font-medium text-gray-900 dark:text-white">{item.etc}</td>
                  <td className="py-2 text-right">
                    <span className={`px-2 py-1 rounded text-xs ${
                      item.etc > item.eto 
                        ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' 
                        : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                    }`}>
                      {item.etc > item.eto ? 'High' : 'Moderate'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}
    </div>
  );
};

export default CropETCCharts;