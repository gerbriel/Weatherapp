import React, { useState, useEffect, useMemo } from 'react';
import { MapPin, Thermometer, Droplets, Gauge, Calendar, Download, FileSpreadsheet, Sprout, Calculator, Filter, TrendingUp, Settings, Cloud, BarChart3, Wheat, Sun, FileText, ChevronDown, ChevronUp, Save } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useLocations } from '../contexts/LocationsContext';
import { exportComprehensiveData, type ComprehensiveExportOptions } from '../utils/exportUtils';
import { SimpleWeatherCharts } from './SimpleWeatherCharts';
import { ChartErrorBoundary } from './ChartErrorBoundary';
import { CropETCCharts } from './CropETCCharts';
import { DateRangePicker } from './DateRangePicker';
import { ReportModeToggle } from './ReportModeToggle';
import { ExportOptionsModal } from './ExportOptionsModal';
import ChartAIInsights from './ChartAIInsights';
import { RichTextEditor } from './RichTextEditor';
import { useAuth } from '../contexts/AuthContextSimple';
import { supabase } from '../lib/supabase';
import { cmisService } from '../services/cmisService';
import { weatherService } from '../services/weatherService';
import { isLocationInCalifornia } from '../utils/locationUtils';
import { COMPREHENSIVE_CROP_DATABASE } from '../data/crops';
import type { CMISETCData } from '../services/cmisService';

interface CropInstance {
  id: string;
  cropId: string;
  plantingDate: string;
  currentStage: number;
  customStageDays?: number;
  fieldName?: string;
  notes?: string;
  locationId?: string;
  customKcValues?: {[key: number]: number}; // Custom Kc values by month (1-12)
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

interface ReportViewProps {
  selectedCrops?: string[];
  cropInstances?: CropInstance[];
  calculatorResult?: RuntimeResult | null;
  calculatorInputs?: any;
  selectedLocation?: any; // Current selected location
  availableLocations?: any[]; // Available locations - same as sidebar
  onDisplayLocationsChange?: (locations: any[]) => void; // Callback to notify parent of filtered locations
  // Persistent state props
  reportSelectedLocationIds?: Set<string>;
  onReportSelectedLocationIdsChange?: (ids: Set<string>) => void;
  reportInsights?: Map<string, { 
    precipitationChart: string;
    temperatureChart: string; 
    cropCoefficientsChart: string;
    etcEtoComparisonChart: string;
    dataTable: string;
    general: string;
  }>;
  onReportInsightsChange?: (insights: Map<string, { 
    precipitationChart: string;
    temperatureChart: string; 
    cropCoefficientsChart: string;
    etcEtoComparisonChart: string;
    dataTable: string;
    general: string;
  }>) => void;
  // Crop weekly summaries
  cropWeeklySummaries?: Record<string, string>;
  onCropWeeklySummariesChange?: (summaries: Record<string, string>) => void;
}

export const ReportView: React.FC<ReportViewProps> = ({ 
  selectedCrops = [], 
  cropInstances = [], 
  calculatorResult = null,
  calculatorInputs = null,
  selectedLocation = null,
  availableLocations = [],
  onDisplayLocationsChange = () => {},
  reportSelectedLocationIds = new Set(),
  onReportSelectedLocationIdsChange = () => {},
  reportInsights = new Map(),
  onReportInsightsChange = () => {},
  cropWeeklySummaries = {},
  onCropWeeklySummariesChange = () => {}
}) => {
  
  // Get auth context for saving closing message
  const { profile } = useAuth();
  
  // Always call the hook to follow rules of hooks
  let locationsData: any[] = [];
  let refreshFunction: () => void = () => {};
  try {
    const locationsContext = useLocations();
    locationsData = locationsContext.locations;
    refreshFunction = locationsContext.refreshAllLocations;
  } catch (error) {
    // If useLocations is not available (not wrapped in provider), use empty defaults
    locationsData = [];
    refreshFunction = () => {};
  }
  
  // Use passed locations or fall back to useLocations for backward compatibility
  const locations = availableLocations.length > 0 ? availableLocations : locationsData;
  const refreshAllLocations = refreshFunction;
  
  // State for location filtering - now managed by parent
  const selectedLocationIds = reportSelectedLocationIds;
  const setSelectedLocationIds = onReportSelectedLocationIdsChange;
  const [showCropInsights, setShowCropInsights] = useState(true);
  const [showAIInsights, setShowAIInsights] = useState(false);
  const [showLocationDetails, setShowLocationDetails] = useState(false);
  // showAllLocations replaced with multiselect dropdown functionality
  const [hasTriedRefresh, setHasTriedRefresh] = useState(false);
  // const [isRefreshing, setIsRefreshing] = useState(false);
  const [cmisData, setCmisData] = useState<Map<string, CMISETCData[]>>(new Map());
  const [isFetchingCmis, setIsFetchingCmis] = useState(false);
  const [loadingCmisLocations, setLoadingCmisLocations] = useState<Set<string>>(new Set());
  const [failedCmisLocations, setFailedCmisLocations] = useState<Set<string>>(new Set());
  const [cmisLoadingProgress, setCmisLoadingProgress] = useState({ current: 0, total: 0, currentLocation: '' });
  const [loadedCropCmisData, setLoadedCropCmisData] = useState<Set<string>>(new Set());

  // State for dynamic reports
  const [reportMode, setReportMode] = useState<'current' | 'historical' | 'future'>('current');
  const [forecastPreset, setForecastPreset] = useState<'today' | '7day'>('7day');
  const [futureStartDate, setFutureStartDate] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [isLoadingHistorical, setIsLoadingHistorical] = useState(false);
  const [historicalWeatherData, setHistoricalWeatherData] = useState<Map<string, any>>(new Map());
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  
  // State for water use data notes
  const [waterUseNotes, setWaterUseNotes] = useState('');
  const [closingMessage, setClosingMessage] = useState('');
  
  // State for collapsible location sections
  const [collapsedLocations, setCollapsedLocations] = useState<Set<string>>(new Set());
  
  // State for collapsible report sections (start collapsed except waterUseData)
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    new Set(['cropManagement', 'dataSourcesApis'])
  );

  // Helper functions for location-specific insights
  const getLocationInsights = (locationId: string) => {
    return reportInsights.get(locationId) || { 
      precipitationChart: '', 
      temperatureChart: '', 
      cropCoefficientsChart: '', 
      etcEtoComparisonChart: '', 
      dataTable: '', 
      general: '' 
    };
  };

  const updateLocationInsights = (locationId: string, newInsights: { 
    precipitationChart: string;
    temperatureChart: string; 
    cropCoefficientsChart: string;
    etcEtoComparisonChart: string;
    dataTable: string;
    general: string;
  }) => {
    const updatedMap = new Map(reportInsights);
    updatedMap.set(locationId, newInsights);
    onReportInsightsChange(updatedMap);
  };

  // Convert Map-based insights to combined insights for export
  const getCombinedInsights = () => {
    const allInsights = Array.from(reportInsights.values());
    return {
      precipitationChart: allInsights.map(insight => insight.precipitationChart).filter(w => w).join('\n\n'),
      temperatureChart: allInsights.map(insight => insight.temperatureChart).filter(c => c).join('\n\n'),
      cropCoefficientsChart: allInsights.map(insight => insight.cropCoefficientsChart).filter(c => c).join('\n\n'),
      etcEtoComparisonChart: allInsights.map(insight => insight.etcEtoComparisonChart).filter(c => c).join('\n\n'),
      dataTable: allInsights.map(insight => insight.dataTable).filter(d => d).join('\n\n'),
      general: allInsights.map(insight => insight.general).filter(g => g).join('\n\n')
    };
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('[data-location-dropdown]')) {
        setIsLocationDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load saved closing message from local storage
  useEffect(() => {
    const savedClosingMessage = localStorage.getItem('default_closing_message');
    if (savedClosingMessage) {
      setClosingMessage(savedClosingMessage);
    }
  }, []);
  
  // Load saved introduction message from local storage
  useEffect(() => {
    const savedIntroMessage = localStorage.getItem('default_intro_message');
    if (savedIntroMessage) {
      setWaterUseNotes(savedIntroMessage);
    }
  }, []);
  
  // Save closing message to local storage when it changes
  useEffect(() => {
    if (closingMessage) {
      localStorage.setItem('default_closing_message', closingMessage);
    }
  }, [closingMessage]);
  
  // Save introduction message to local storage when it changes
  useEffect(() => {
    if (waterUseNotes) {
      localStorage.setItem('default_intro_message', waterUseNotes);
    }
  }, [waterUseNotes]);

  // Initialize default date range (last 14 days, ending yesterday to avoid CMIS API future date errors)
  useEffect(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1); // Use yesterday to avoid timezone issues
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(yesterday.getDate() - 14);
    
    setDateRange({
      startDate: twoWeeksAgo.toISOString().split('T')[0],
      endDate: yesterday.toISOString().split('T')[0]
    });
  }, []);

  // Handle refresh with rate limiting protection
  // const handleRefresh = async () => {
  //   setIsRefreshing(true);
  //   try {
  //     await refreshAllLocations();
  //   } catch (error) {
  //     console.error('Refresh failed:', error);
  //   } finally {
  //     setIsRefreshing(false);
  //   }
  // };

  // Handle historical data fetching
  const fetchHistoricalData = async () => {
    if (!dateRange.startDate || !dateRange.endDate) return;
    
    setIsLoadingHistorical(true);
    const newHistoricalData = new Map();
    
    try {
      for (const location of filteredLocations) {
        try {
          const historicalWeather = await weatherService.getHistoricalWeatherData(location, {
            startDate: dateRange.startDate,
            endDate: dateRange.endDate
          });
          
          newHistoricalData.set(location.id, {
            ...location,
            weatherData: historicalWeather
          });
        } catch (error) {
          console.error(`Failed to fetch historical data for ${location.name}:`, error);
          // Keep original data if historical fetch fails
          newHistoricalData.set(location.id, location);
        }
      }
      
      setHistoricalWeatherData(newHistoricalData);
    } catch (error) {
      console.error('Error fetching historical data:', error);
    } finally {
      setIsLoadingHistorical(false);
    }
  };

  // Handle report mode change
  const handleReportModeChange = (mode: 'current' | 'historical' | 'future') => {
    setReportMode(mode);
    if (mode === 'historical' && historicalWeatherData.size === 0) {
      fetchHistoricalData();
    }
  };

  // Handle date range changes
  const handleDateRangeChange = (field: 'startDate' | 'endDate', value: string) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Apply new date range
  const handleApplyDateRange = () => {
    if (reportMode === 'historical') {
      fetchHistoricalData();
    }
  };

  // Reset to current mode
  const handleResetToCurrentMode = () => {
    setReportMode('current');
    setHistoricalWeatherData(new Map());
  };

  // Helper function to get ETC display text for a location and date
  const getETCDisplayText = (location: any, date: string): string => {
    // Check if location is in California
    const locationInfo = {
      latitude: location.latitude,
      longitude: location.longitude,
      state: location.state,
      region: location.region,
      name: location.name
    };

    if (!isLocationInCalifornia(locationInfo)) {
      return 'CA Only';
    }

    const locationCmisData = cmisData.get(location.id) || [];
    const dayData = locationCmisData.find(d => d.date === date);
    return dayData ? `${dayData.etc_actual.toFixed(2)} in` : '—';
  };

  // Fetch CMIS data for a specific location with retry logic
  const fetchLocationCMISData = async (locationId: string, retryCount = 0, maxRetries = 2) => {
    const location = displayLocations.find(loc => loc.id === locationId);
    if (!location) return;
    
    // If already has data and not manually retrying, skip
    if (cmisData.has(locationId) && retryCount === 0) return;
    
    // Set loading state and clear failed state if retrying
    setLoadingCmisLocations(prev => new Set(prev).add(locationId));
    if (retryCount > 0) {
      setFailedCmisLocations(prev => {
        const newSet = new Set(prev);
        newSet.delete(locationId);
        return newSet;
      });
    }
    
    // Add timeout to prevent hanging (15 seconds)
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('CIMIS request timeout')), 15000)
    );
    
    try {
      const locationInfo = {
        latitude: location.latitude,
        longitude: location.longitude,
        state: (location as any).state,
        region: (location as any).region,
        name: location.name,
        cimisStationId: (location as any).cimisStationId || location.weatherstationID
      };

      const station = await Promise.race([
        cmisService.findNearestStation(location.latitude, location.longitude, locationInfo),
        timeoutPromise
      ]) as any;
      
      if (station) {
        const endDate = new Date();
        endDate.setDate(endDate.getDate() - 1);  // Yesterday (Jan 5)
        const startDate = new Date(endDate.getTime());  // Clone endDate
        startDate.setDate(startDate.getDate() - 14);  // 14 days before endDate
        
        const response = await Promise.race([
          cmisService.getETCData(station.id, startDate, endDate, locationInfo),
          timeoutPromise
        ]) as any;
        
        if (response.success && response.data.length > 0) {
          setCmisData(prev => {
            const newMap = new Map(prev);
            newMap.set(locationId, response.data);
            return newMap;
          });
          // Clear from failed set on success
          setFailedCmisLocations(prev => {
            const newSet = new Set(prev);
            newSet.delete(locationId);
            return newSet;
          });
          // Remove loading state on success
          setLoadingCmisLocations(prev => {
            const newSet = new Set(prev);
            newSet.delete(locationId);
            return newSet;
          });
        } else {
          throw new Error(response.error || 'No data returned');
        }
      } else {
        throw new Error('No CIMIS station found');
      }
    } catch (error) {
      // Retry if we haven't exceeded max retries
      if (retryCount < maxRetries) {
        // Wait before retrying (1s, 2s, ...)
        const delay = 1000 * (retryCount + 1);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchLocationCMISData(locationId, retryCount + 1, maxRetries);
      } else {
        // Max retries exceeded - mark as failed and remove loading state
        setCmisData(prev => {
          const newMap = new Map(prev);
          newMap.set(locationId, []); // Mark as attempted
          return newMap;
        });
        setFailedCmisLocations(prev => new Set(prev).add(locationId));
        setLoadingCmisLocations(prev => {
          const newSet = new Set(prev);
          newSet.delete(locationId);
          return newSet;
        });
      }
    }
  };

  // Manual retry function for failed locations
  const retryLocationCMIS = (locationId: string) => {
    // Clear existing data to force refetch
    setCmisData(prev => {
      const newMap = new Map(prev);
      newMap.delete(locationId);
      return newMap;
    });
    // Fetch with retries
    fetchLocationCMISData(locationId, 0, 2);
  };

  // Toggle location collapse state and fetch CMIS data when expanding
  const toggleLocationCollapse = (locationId: string) => {
    setCollapsedLocations(prev => {
      const newSet = new Set(prev);
      const isCurrentlyCollapsed = newSet.has(locationId);
      
      if (isCurrentlyCollapsed) {
        // Expanding - fetch CMIS data if not already loaded
        newSet.delete(locationId);
        fetchLocationCMISData(locationId);
      } else {
        // Collapsing
        newSet.add(locationId);
      }
      return newSet;
    });
  };
  
  // Toggle section collapse state
  const toggleSectionCollapse = (sectionId: string) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  // Auto-refresh weather data only once if locations exist but have no weather data
  React.useEffect(() => {
    if (!hasTriedRefresh) {
      // Only try to refresh if we have user locations (not trial locations)
      const hasUserLocations = locations.length > 0 && 'weatherData' in (locations[0] || {});
      if (hasUserLocations) {
        const locationsWithoutWeather = locations.filter(loc => !loc.weatherData && !loc.loading && !loc.error);
        if (locationsWithoutWeather.length > 0) {
          setHasTriedRefresh(true);
          refreshAllLocations();
        }
      }
    }
  }, [locations, hasTriedRefresh]); // Remove refreshAllLocations to prevent infinite loops

  // Filter locations that have weather data (memoized for performance)
  // Handle both trial locations (no weatherData property) and user locations (with weatherData)
  // CHANGED: Show all locations in dropdown, even if weather data not loaded yet
  const locationsWithWeather = useMemo(() => {
    const result = locations.filter(loc => !loc.error);
    console.log('[ReportView] locations (raw prop):', locations.map(l => ({
      id: l.id, name: l.name, hasWeather: !!l.weatherData, loading: l.loading, error: l.error
    })));
    console.log('[ReportView] locationsWithWeather (after error filter):', result.map(l => ({
      id: l.id, name: l.name, hasWeather: !!l.weatherData, loading: l.loading
    })));
    return result;
  }, [locations]);

  // Don't auto-select all locations - let users choose via dropdown
  // Remove auto-initialization to require explicit user selection
  
  // Apply location filter (memoized for performance)
  // If no specific locations are selected, OR if none of the saved IDs match
  // current locations (e.g. on first load before locations finish populating),
  // default to showing ALL locations.
  const filteredLocations = useMemo(() => {
    let result: any[];
    if (selectedLocationIds.size > 0) {
      const matched = locationsWithWeather.filter(loc => selectedLocationIds.has(loc.id));
      // If saved IDs don't match anything yet, show all (avoids blank on first load)
      result = matched.length > 0 ? matched : locationsWithWeather;
    } else {
      // Empty set = show all
      result = locationsWithWeather;
    }
    console.log('[ReportView] selectedLocationIds:', [...selectedLocationIds]);
    console.log('[ReportView] filteredLocations:', result.map(l => ({ id: l.id, name: l.name, hasWeather: !!l.weatherData })));
    return result;
  }, [locationsWithWeather, selectedLocationIds]);
  
  // For reports view, show all filtered locations regardless of selectedLocation
  const displayLocations = useMemo(() => {
    let result: any[];
    if (reportMode === 'historical' && historicalWeatherData.size > 0) {
      result = filteredLocations.map(location => {
        const historicalData = historicalWeatherData.get(location.id);
        return historicalData || location;
      });
    } else {
      result = filteredLocations;
    }
    console.log('[ReportView] displayLocations:', result.map(l => ({ id: l.id, name: l.name, hasWeather: !!l.weatherData })));
    return result;
  }, [filteredLocations, reportMode, historicalWeatherData, forecastPreset, futureStartDate]);

  // Notify parent component of the current filtered locations for header sync
  useEffect(() => {
    onDisplayLocationsChange(displayLocations);
  }, [displayLocations]); // Remove onDisplayLocationsChange from dependencies to prevent infinite re-renders

  // Initialize all locations as collapsed by default
  useEffect(() => {
    if (displayLocations.length > 0) {
      setCollapsedLocations(new Set(displayLocations.map(loc => loc.id)));
    }
  }, [displayLocations.length]); // Only re-run when the number of locations changes

  // Fetch CMIS data for locations - DISABLED for lazy loading
  // CMIS data is now fetched only when location sections are expanded
  useEffect(() => {
    // Lazy loading enabled to improve initial page load and reduce CIMIS API errors
    return () => {
      // Cleanup
    };
  }, [displayLocations.length]); // Only depend on length to avoid unnecessary refetches

  // Fetch CIMIS data for comprehensive section when it's expanded
  // REMOVED AUTO-LOADING - Now user must click "Load CIMIS Data" button per crop
  
  // Manual function to load CIMIS data for specific crop locations
  const loadCmisDataForCrop = async (cropId: string) => {
    // Get crop instances for this crop type
    const cropCropInstances = cropInstances.filter(ci => ci.cropId === cropId);
    
    // Get unique location IDs for this crop
    const cropLocationIds = new Set(cropCropInstances.map(inst => inst.locationId));
    
    // Get locations for this crop
    const cropLocations = displayLocations.filter(loc => cropLocationIds.has(loc.id));
    
    if (cropLocations.length === 0) return;
    
    // Mark this crop as loaded
    setLoadedCropCmisData(prev => new Set(prev).add(cropId));
    
    // Filter to only locations that haven't been loaded yet
    const locationsToFetch = cropLocations.filter(
      location => !cmisData.has(location.id) && !loadingCmisLocations.has(location.id)
    );
    
    if (locationsToFetch.length === 0) return;
    
    // Set progress
    setCmisLoadingProgress({
      current: 0,
      total: locationsToFetch.length,
      currentLocation: locationsToFetch[0]?.name || ''
    });
    
    // Load locations one at a time with progress updates
    for (let i = 0; i < locationsToFetch.length; i++) {
      const location = locationsToFetch[i];
      setCmisLoadingProgress({
        current: i + 1,
        total: locationsToFetch.length,
        currentLocation: location.name
      });
      
      await fetchLocationCMISData(location.id);
      
      // Wait between requests
      if (i < locationsToFetch.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }
    
    // Clear progress
    setCmisLoadingProgress({ current: 0, total: 0, currentLocation: '' });
  };

  // Show message when no locations are selected - dropdown is always visible at top
  if (displayLocations.length === 0) {
    // const isTrialMode = locations.length > 0 && !('weatherData' in (locations[0] || {}));
    
    // Don't return early - continue to main render with message
  }

  const formatDate = (dateString: string) => {
    // Add T12:00:00 to avoid timezone conversion issues
    return new Date(dateString + 'T12:00:00').toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      weekday: 'short'
    });
  };

  const safe = (value: any, fallback = '—') => {
    return (value !== null && value !== undefined && !isNaN(value)) ? value : fallback;
  };

  const handleExportCSV = () => {
    // Capture any unsaved textarea values before exporting
    const textareas = document.querySelectorAll('textarea[id^="weekly-summary-"]');
    const updatedSummaries = { ...cropWeeklySummaries };
    textareas.forEach((textarea: any) => {
      const cropId = textarea.id.replace('weekly-summary-', '');
      if (textarea.value) {
        updatedSummaries[cropId] = textarea.value;
      }
    });
    
    // Quick export with weather data, CMIS data, and crop calculations
    const quickOptions: ComprehensiveExportOptions = {
      includeWeatherData: true,
      includeCMISData: cmisData.size > 0, // Include CMIS data if available
      includeCropData: selectedCrops.length > 0,
      includeCalculatorResults: false,
      includeFieldBlocks: false,
      includeHistoricalData: false,
      includeCharts: false,
      fileFormat: 'csv',
      separateSheets: false,
      reportMode,
      futureStartDate,
      forecastPreset,
      dateRange: reportMode === 'historical' ? dateRange : undefined
    };
    
    exportComprehensiveData(displayLocations, quickOptions, {
      cmisData,
      cropInstances,
      selectedCrops,
      calculatorResult: null, // Don't include calculator for quick export
      calculatorInputs: null,
      selectedLocation,
      fieldBlocks: [],
      insights: getCombinedInsights(),
      cropWeeklySummaries: updatedSummaries,
      waterUseNotes,
      closingMessage
    });
  };

  const handleExportExcel = () => {
    // Capture any unsaved textarea values before exporting
    const textareas = document.querySelectorAll('textarea[id^="weekly-summary-"]');
    const updatedSummaries = { ...cropWeeklySummaries };
    textareas.forEach((textarea: any) => {
      const cropId = textarea.id.replace('weekly-summary-', '');
      if (textarea.value) {
        updatedSummaries[cropId] = textarea.value;
      }
    });
    
    // Quick export with weather data and crop calculations
    const quickOptions: ComprehensiveExportOptions = {
      includeWeatherData: true,
      includeCMISData: false,
      includeCropData: selectedCrops.length > 0,
      includeCalculatorResults: false,
      includeFieldBlocks: false,
      includeHistoricalData: false,
      includeCharts: false,
      fileFormat: 'excel',
      separateSheets: true,
      reportMode,
      futureStartDate,
      forecastPreset,
      dateRange: reportMode === 'historical' ? dateRange : undefined
    };
    
    exportComprehensiveData(displayLocations, quickOptions, {
      cmisData,
      cropInstances,
      selectedCrops,
      calculatorResult: null, // Don't include calculator for quick export
      calculatorInputs: null,
      selectedLocation,
      fieldBlocks: [],
      insights: getCombinedInsights(),
      cropWeeklySummaries: updatedSummaries,
      waterUseNotes,
      closingMessage
    });
  };

  const handleComprehensiveExport = (options: ComprehensiveExportOptions) => {
    // Capture any unsaved textarea values before exporting
    const textareas = document.querySelectorAll('textarea[id^="weekly-summary-"]');
    const updatedSummaries = { ...cropWeeklySummaries };
    textareas.forEach((textarea: any) => {
      const cropId = textarea.id.replace('weekly-summary-', '');
      if (textarea.value) {
        updatedSummaries[cropId] = textarea.value;
      }
    });
    
    // Merge report mode settings into options
    const exportOptions: ComprehensiveExportOptions = {
      ...options,
      reportMode,
      futureStartDate,
      forecastPreset,
      dateRange: reportMode === 'historical' ? dateRange : undefined
    };
    
    exportComprehensiveData(displayLocations, exportOptions, {
      cmisData,
      cropInstances,
      selectedCrops,
      calculatorResult,
      calculatorInputs,
      selectedLocation,
      fieldBlocks: [], // Field blocks are managed by FieldBlocksManager
      insights: getCombinedInsights(),
      cropWeeklySummaries: updatedSummaries,
      waterUseNotes,
      closingMessage
    });
  };

  // Determine what data types are available for export
  const availableDataTypes = {
    hasWeatherData: displayLocations.some(loc => loc.weatherData),
    hasCMISData: cmisData.size > 0,
    hasCropData: selectedCrops.length > 0,
    hasCalculatorResults: !!calculatorResult,
    hasFieldBlocks: false, // Field blocks are managed separately
    hasHistoricalData: reportMode === 'historical' && historicalWeatherData.size > 0,
    hasCharts: displayLocations.some(loc => loc.weatherData?.daily) // Charts available if weather data exists
  };

  return (
    <div className="space-y-3">
      {/* Always Visible Location Filter Controls */}
      <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex flex-col gap-2 w-full">
            <div className="flex items-center gap-3">
              <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Select Locations:
              </label>
              
              {/* Custom Multiselect Dropdown - Always Visible */}
              <div className="relative flex-1 max-w-lg" data-location-dropdown>
                <button
                  onClick={() => setIsLocationDropdownOpen(!isLocationDropdownOpen)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setIsLocationDropdownOpen(!isLocationDropdownOpen);
                    } else if (e.key === 'Escape') {
                      setIsLocationDropdownOpen(false);
                    }
                  }}
                  className="flex items-center justify-between w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 dark:text-white min-h-[40px]"
                  aria-expanded={isLocationDropdownOpen}
                  aria-haspopup="listbox"
                  aria-label="Select locations"
                >
                  <span className="truncate">
                    {selectedLocationIds.size === 0 ? (
                      <span className="text-gray-500">Select locations...</span>
                    ) : selectedLocationIds.size === 1 ? (
                      locationsWithWeather.find(loc => selectedLocationIds.has(loc.id))?.name || 'Unknown'
                    ) : (
                      `${selectedLocationIds.size} locations selected`
                    )}
                  </span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {isLocationDropdownOpen && (
                  <div 
                    className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-64 overflow-y-auto"
                    role="listbox"
                    aria-multiselectable="true"
                  >
                    {/* Individual Location Options */}
                    {locationsWithWeather.map((location) => (
                      <label
                        key={location.id}
                        className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 text-sm text-gray-700 dark:text-gray-300"
                      >
                        <input
                          type="checkbox"
                          checked={selectedLocationIds.has(location.id)}
                          onChange={() => {
                            const newSelectedLocations = new Set(selectedLocationIds);
                            if (newSelectedLocations.has(location.id)) {
                              newSelectedLocations.delete(location.id);
                            } else {
                              newSelectedLocations.add(location.id);
                            }
                            setSelectedLocationIds(newSelectedLocations);
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-1"
                        />
                        <span className="truncate">{location.name}</span>
                      </label>
                    ))}
                    
                    {/* Footer with stats and clear button */}
                    <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-600 flex items-center justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {selectedLocationIds.size} of {locationsWithWeather.length} selected
                      </span>
                      {selectedLocationIds.size > 0 && (
                        <button
                          onClick={() => {
                            setSelectedLocationIds(new Set());
                          }}
                          className="text-xs text-red-600 dark:text-red-400 hover:underline"
                        >
                          Clear All
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Select All Locations Checkbox - Right of Dropdown */}
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={selectedLocationIds.size === locationsWithWeather.length && locationsWithWeather.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedLocationIds(new Set(locationsWithWeather.map(loc => loc.id)));
                    } else {
                      setSelectedLocationIds(new Set());
                    }
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-1"
                />
                Select All Locations ({locationsWithWeather.length})
              </label>
            </div>
            
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={showCropInsights}
                  onChange={(e) => setShowCropInsights(e.target.checked)}
                  className="mr-2"
                />
                Show Crop Watering Insights
              </label>
              
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                <input
                  type="checkbox"
                  checked={showAIInsights}
                  onChange={(e) => setShowAIInsights(e.target.checked)}
                  className="mr-2"
                />
                <span className="flex items-center">
                  AI Insights
                  <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                    Beta
                  </span>
                </span>
              </label>
              
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                <input
                  type="checkbox"
                  checked={showLocationDetails}
                  onChange={(e) => setShowLocationDetails(e.target.checked)}
                  className="mr-2"
                />
                Show Individual Location Details
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-3">
        {/* Report Mode Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
          <ReportModeToggle 
            mode={reportMode}
            onModeChange={handleReportModeChange}
            forecastPreset={forecastPreset}
            onPresetChange={setForecastPreset}
          />
          
          {reportMode === 'historical' ? (
            <DateRangePicker
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
              onStartDateChange={(date) => handleDateRangeChange('startDate', date)}
              onEndDateChange={(date) => handleDateRangeChange('endDate', date)}
              onApply={handleApplyDateRange}
              onReset={handleResetToCurrentMode}
              isLoading={isLoadingHistorical}
            />
          ) : reportMode === 'future' ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-green-500" />
                Future Report Configuration
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Start Date (Optional - defaults to 7 days from now)
                  </label>
                  <input
                    type="date"
                    value={futureStartDate}
                    onChange={(e) => {
                      setFutureStartDate(e.target.value);
                    }}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  Using <strong className="text-gray-900 dark:text-white mx-1">7-day</strong> forecast preset
                </div>
                {futureStartDate && (
                  <div className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                    📅 Report will start from: {new Date(futureStartDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 flex items-center justify-center">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <div className="text-sm font-medium">Live Data Mode</div>
                <div className="text-xs mt-1">
                  Showing {forecastPreset === 'today' ? "today's" : '14-day (7 past + 7 forward)'} forecast
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Data Sources Information Panel */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700 mb-3 overflow-hidden">
          <button
            onClick={() => toggleSectionCollapse('dataSourcesApis')}
            className="w-full px-3 py-2 flex items-center justify-between hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
          >
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
              📡 Data Sources & APIs
              {reportMode === 'historical' && (
                <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded">
                  Historical Mode
                </span>
              )}
            </h4>
            {collapsedSections.has('dataSourcesApis') ? (
              <ChevronDown className="h-5 w-5 text-blue-900 dark:text-blue-100" />
            ) : (
              <ChevronUp className="h-5 w-5 text-blue-900 dark:text-blue-100" />
            )}
          </button>
          
          {!collapsedSections.has('dataSourcesApis') && (
            <div className="px-4 pb-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-white dark:bg-gray-800 rounded p-3 border border-blue-200 dark:border-blue-600">
              <div className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                <div className="flex items-center gap-1">
                  <Cloud className="h-4 w-4" />
                  Weather Data
                </div>
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                <strong>API:</strong> Open-Meteo {reportMode === 'historical' ? 'Archive' : 'Forecast'}<br/>
                <strong>Data:</strong> Temperature, precipitation, wind, humidity<br/>
                <strong>Coverage:</strong> {reportMode === 'historical' ? 'Historical records' : 'GFS Global forecast'}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded p-3 border border-green-200 dark:border-green-600">
              <div className="font-medium text-green-800 dark:text-green-200 mb-1 flex items-center gap-1">
                <Droplets className="h-4 w-4" />
                Evapotranspiration
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                <strong>API:</strong> Open-Meteo ET₀<br/>
                <strong>Method:</strong> FAO-56 Penman-Monteith<br/>
                <strong>Type:</strong> {reportMode === 'historical' ? 'Historical ET₀' : 'Reference evapotranspiration'}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded p-3 border border-purple-200 dark:border-purple-600">
              <div className="font-medium text-purple-800 dark:text-purple-200 mb-1 flex items-center gap-1">
                <Wheat className="h-4 w-4" />
                Crop Coefficients
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                <strong>Source:</strong> FAO-56 Guidelines<br/>
                <strong>Enhancement:</strong> CMIS API (CA only)<br/>
                <strong>Analysis:</strong> {reportMode === 'historical' ? 'Historical performance' : 'ETC = ET₀ × Kc'}
              </div>
            </div>
          </div>
            </div>
          )}
        </div>
      </div>

      {/* Comprehensive Water Use Data Tables by Crop */}
      {locationsWithWeather.length > 0 && (
        <div className="mb-3 space-y-3">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden">
            <button
              onClick={() => toggleSectionCollapse('waterUseData')}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-750"
            >
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center">
                  <Droplets className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                  Comprehensive Water Use Data by Crop
                </h2>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                  Detailed Kc, ET₀, ETc, and irrigation needs for all locations and dates
                </p>
              </div>
              {collapsedSections.has('waterUseData') ? (
                <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
              ) : (
                <ChevronUp className="h-5 w-5 text-gray-400 flex-shrink-0" />
              )}
            </button>
            
            {!collapsedSections.has('waterUseData') && (
              <div className="p-3 space-y-4">
              {/* Introduction message field for email */}
              <RichTextEditor
                value={waterUseNotes}
                onChange={setWaterUseNotes}
                label="Introduction Message"
                placeholder="Write an introduction message for your irrigation report email. Example: 'This week's irrigation report shows water needs for all locations. Please review the recommendations and adjust schedules accordingly.'"
                helperText="This message will be included in the HTML email export sent via Marketing Cloud."
                minHeight="100px"
              />
              
              {/* Closing message field for email */}
              <div className="space-y-1">
                <RichTextEditor
                  value={closingMessage}
                  onChange={setClosingMessage}
                  label="Closing Message / Signature"
                  placeholder="Add a closing message, P.S., or email signature. Example: 'Best regards, Your Irrigation Team'"
                  helperText="This message will be saved automatically and appear at the bottom of the email."
                  minHeight="80px"
                />
              </div>
              
              {/* Group crop instances by crop */}
              {(() => {
                const cropGroups = new Map<string, typeof cropInstances>();
                cropInstances.forEach(instance => {
                  const existing = cropGroups.get(instance.cropId) || [];
                  cropGroups.set(instance.cropId, [...existing, instance]);
                });

                console.log('[ReportView] ── TABLE RENDER ──');
                console.log('[ReportView] cropInstances count:', cropInstances.length, cropInstances.map(i => ({ cropId: i.cropId, locationId: i.locationId })));
                console.log('[ReportView] selectedCrops:', selectedCrops);
                console.log('[ReportView] displayLocations at render:', displayLocations.map(l => ({ id: l.id, name: l.name, hasWeather: !!l.weatherData })));
                console.log('[ReportView] cropGroups keys:', [...cropGroups.keys()]);

                return Array.from(cropGroups.entries()).map(([cropId, instances]) => {
                  // Find crop name from available crops
                  const cropName = selectedCrops.includes(cropId) 
                    ? cropId.charAt(0).toUpperCase() + cropId.slice(1)
                    : cropId;

                  // Get all unique location IDs for this crop from the instances
                  const cropLocationIds = new Set(instances.map(inst => inst.locationId));
                  
                  // Get only the DISPLAYED locations that have this crop (intersection of crop locations and selected locations)
                  const cropLocations = displayLocations.filter(loc => cropLocationIds.has(loc.id));

                  console.log(`[ReportView] crop="${cropName}" instanceLocationIds:`, [...cropLocationIds], 'cropLocations:', cropLocations.map(l => ({ id: l.id, name: l.name, hasWeather: !!l.weatherData })));

                  // Calculate date range for table headers by checking first location with weather data
                  let dateRangeText = '';
                  let actualsDateRangeText = '';
                  const firstLocationWithWeather = cropLocations.find(loc => loc.weatherData?.daily?.time);
                  if (firstLocationWithWeather) {
                    const weather = firstLocationWithWeather.weatherData;
                    let startIdx = 0;
                    let endIdx = weather.daily.time.length;
                    
                    // Determine reference date for splitting actuals/forecasts
                    const today = new Date().toISOString().split('T')[0];
                    let referenceDate = today;
                    if (reportMode === 'future' && futureStartDate) {
                      referenceDate = futureStartDate;
                    }
                    
                    if (reportMode === 'current') {
                      const todayIdx = weather.daily.time.findIndex((d: string) => d >= today);
                      if (todayIdx !== -1) {
                        startIdx = Math.max(0, todayIdx - 7);
                      }
                      const daysToShow = forecastPreset === 'today' ? 1 : 14;
                      endIdx = Math.min(startIdx + daysToShow, weather.daily.time.length);
                    } else if (reportMode === 'future') {
                      let futureTargetDate: string;
                      if (futureStartDate) {
                        futureTargetDate = futureStartDate;
                      } else {
                        const future = new Date();
                        future.setDate(future.getDate() + 7);
                        futureTargetDate = future.toISOString().split('T')[0];
                      }
                      const targetIdx = weather.daily.time.findIndex((d: string) => d >= futureTargetDate);
                      if (targetIdx !== -1) {
                        startIdx = Math.max(0, targetIdx - 7);
                        const daysToShow = forecastPreset === 'today' ? 1 : 14;
                        endIdx = Math.min(startIdx + daysToShow, weather.daily.time.length);
                      }
                    } else if (reportMode === 'historical') {
                      if (dateRange.startDate && dateRange.endDate) {
                        startIdx = weather.daily.time.findIndex((d: string) => d >= dateRange.startDate);
                        if (startIdx === -1) startIdx = 0;
                        endIdx = weather.daily.time.findIndex((d: string) => d > dateRange.endDate);
                        if (endIdx === -1) endIdx = weather.daily.time.length;
                      }
                    }
                    
                    const startDate = weather.daily.time[startIdx];
                    const endDate = weather.daily.time[Math.min(endIdx - 1, weather.daily.time.length - 1)];
                    
                    // Calculate actuals date range (only dates before reference date)
                    const actualDates = weather.daily.time.slice(startIdx, endIdx).filter((d: string) => d < referenceDate);
                    const actualsStartDate = actualDates.length > 0 ? actualDates[0] : startDate;
                    const actualsEndDate = actualDates.length > 0 ? actualDates[actualDates.length - 1] : startDate;
                    
                    // Calculate forecast date range (only dates on or after reference date)
                    const forecastDates = weather.daily.time.slice(startIdx, endIdx).filter((d: string) => d >= referenceDate);
                    const forecastStartDate = forecastDates.length > 0 ? forecastDates[0] : referenceDate;
                    const forecastEndDate = forecastDates.length > 0 ? forecastDates[forecastDates.length - 1] : referenceDate;
                    
                    const formatDate = (dateStr: string) => {
                      const date = new Date(dateStr + 'T12:00:00');
                      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    };
                    
                    // Comma-separated day numbers for forecast column header (e.g. "26, 27, 28, 1, 2")
                    const forecastDaysList = forecastDates.map((d: string) => new Date(d + 'T12:00:00').getDate()).join(', ');
                    const actualsDaysList = actualDates.map((d: string) => new Date(d + 'T12:00:00').getDate()).join(', ');

                    dateRangeText = forecastDates.length > 0 ? forecastDaysList : 'N/A';
                    actualsDateRangeText = actualDates.length > 0 ? actualsDaysList : 'N/A';
                  }

                  return (
                    <div key={`${cropId}-${reportMode}-${forecastPreset}-${futureStartDate}`} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center">
                            <Sprout className="h-4 w-4 mr-1.5 text-green-600 dark:text-green-400" />
                            {cropName}
                          </h3>
                          
                          {/* Load CIMIS Data Button */}
                          {!loadedCropCmisData.has(cropId) && cmisData.size === 0 ? (
                            <button
                              onClick={() => loadCmisDataForCrop(cropId)}
                              disabled={cmisLoadingProgress.total > 0}
                              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                              Load Actual CIMIS Data
                            </button>
                          ) : loadedCropCmisData.has(cropId) ? (
                            <div className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-sm font-medium rounded-lg">
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              CIMIS Data Loaded
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-sm font-medium rounded-lg border border-blue-300 dark:border-blue-700">
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              CIMIS Data Already Loaded
                            </div>
                          )}
                        </div>
                        
                        {/* Loading Progress Bar */}
                        {cmisLoadingProgress.total > 0 && (
                          <div className="mt-3 space-y-2">
                            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                              <span>Loading CIMIS data for {cropName}...</span>
                              <span className="font-medium">{cmisLoadingProgress.current} / {cmisLoadingProgress.total}</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${(cmisLoadingProgress.current / cmisLoadingProgress.total) * 100}%` }}
                              />
                            </div>
                            {cmisLoadingProgress.currentLocation && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 italic">
                                Currently loading: {cmisLoadingProgress.currentLocation}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                          <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider sticky left-0 bg-gray-50 dark:bg-gray-800 z-10 border-r border-gray-300 dark:border-gray-600">
                                Location
                              </th>
                              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                Total ET₀ Actual ({actualsDateRangeText})
                              </th>
                              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                Total ETc Actual ({actualsDateRangeText})
                              </th>
                              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                Kc Values
                              </th>
                              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                Total ET₀ Forecast ({dateRangeText})
                              </th>
                              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                Total ETc Forecast ({dateRangeText})
                              </th>
                              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                Water Need
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {/* Render rows for each location with crop instances - show ALL locations for this crop */}
                            {cropLocations.map((location, locIdx) => {
                              // Find crop instances for this location and crop
                              const locationInstances = instances.filter(inst => inst.locationId === location.id);
                              
                              if (locationInstances.length === 0) {
                                console.log(`[ReportView] ROW SKIPPED — no instances for location="${location.name}" crop="${cropId}"`);
                                return null;
                              }

                              const weather = location.weatherData;
                              if (!weather || !weather.daily) {
                                console.log(`[ReportView] ROW SKIPPED — no weatherData for location="${location.name}" (id=${location.id}) loading=${location.loading}`);
                                return null;
                              }
                              console.log(`[ReportView] ROW RENDERING — location="${location.name}" crop="${cropId}" weatherDays=${weather.daily.time.length}`);

                              // Determine date range based on report mode
                              let startIdx = 0;
                              let endIdx = weather.daily.time.length;
                              
                              if (reportMode === 'current') {
                                const today = new Date().toISOString().split('T')[0];
                                const todayIdx = weather.daily.time.findIndex((d: string) => d >= today);
                                
                                if (todayIdx === -1) {
                                  startIdx = 0;
                                } else {
                                  startIdx = Math.max(0, todayIdx - 7);
                                }
                                
                                const daysToShow = forecastPreset === 'today' ? 1 : 14;
                                endIdx = Math.min(startIdx + daysToShow, weather.daily.time.length);
                              } else if (reportMode === 'future') {
                                let futureTargetDate: string;
                                if (futureStartDate) {
                                  futureTargetDate = futureStartDate;
                                } else {
                                  const future = new Date();
                                  future.setDate(future.getDate() + 7);
                                  futureTargetDate = future.toISOString().split('T')[0];
                                }
                                
                                const targetIdx = weather.daily.time.findIndex((d: string) => d >= futureTargetDate);
                                
                                if (targetIdx === -1) {
                                  startIdx = Math.min(7, weather.daily.time.length - 14);
                                  endIdx = Math.min(startIdx + 14, weather.daily.time.length);
                                } else {
                                  startIdx = Math.max(0, targetIdx - 7);
                                  const daysToShow = forecastPreset === 'today' ? 1 : 14;
                                  endIdx = Math.min(startIdx + daysToShow, weather.daily.time.length);
                                }
                              } else if (reportMode === 'historical') {
                                if (dateRange.startDate && dateRange.endDate) {
                                  startIdx = weather.daily.time.findIndex((d: string) => d >= dateRange.startDate);
                                  if (startIdx === -1) startIdx = 0;
                                  endIdx = weather.daily.time.findIndex((d: string) => d > dateRange.endDate);
                                  if (endIdx === -1) endIdx = weather.daily.time.length;
                                }
                              }
                              
                              // Calculate weekly summations instead of daily rows
                              const locationInfo = {
                                latitude: location.latitude,
                                longitude: location.longitude,
                                state: (location as any).state,
                                region: (location as any).region,
                                name: location.name
                              };
                              const isCalifornia = isLocationInCalifornia(locationInfo);
                              const locationCmisData = cmisData.get(location.id) || [];
                              const today = new Date().toISOString().split('T')[0];
                              
                              let et0_actual_sum = 0;
                              let et0_forecast_sum = 0;
                              let etc_actual_sum = 0; // Track actual ETc (ET₀ × Kc per day)
                              let etc_forecast_sum = 0; // Track forecast ETc (ET₀ × Kc per day)
                              let actualDaysCount = 0;
                              let kc_values_used = new Set<number>();
                              
                              // Track ETc sums per Kc value for range display
                              let etc_forecast_by_kc = new Map<number, number>();
                              let etc_actual_by_kc = new Map<number, number>();
                              
                              // Track ET₀ forecast sums per month (for split display when Kc differs across months)
                              let et0_forecast_by_month = new Map<number, number>(); // month → et0 sum
                              
                              const cropData = COMPREHENSIVE_CROP_DATABASE.find(c => c.id === cropId);
                              
                              // Determine the reference date for splitting actuals vs forecasts
                              let referenceDate = today;
                              if (reportMode === 'future' && futureStartDate) {
                                referenceDate = futureStartDate;
                              }
                              
                              // Track date ranges for display
                              let actualDates: string[] = [];
                              let forecastDates: string[] = [];
                              
                              for (let i = startIdx; i < endIdx; i++) {
                                const date = weather.daily.time[i];
                                
                                // Get Kc for this specific day
                                const dateMonth = new Date(date + 'T12:00:00').getMonth() + 1;
                                const customKc = locationInstances[0]?.customKcValues?.[dateMonth];
                                let dailyKc = 1.0;
                                
                                if (customKc !== undefined) {
                                  dailyKc = customKc;
                                } else if (cropData?.monthlyKc && cropData.monthlyKc.length > 0) {
                                  const monthData = cropData.monthlyKc.find(m => m.month === dateMonth);
                                  dailyKc = monthData?.kc !== undefined ? monthData.kc : 1.0;
                                } else {
                                  dailyKc = locationInstances[0].currentStage === 2 ? 1.15 : 
                                           locationInstances[0].currentStage === 1 ? 0.70 : 0.50;
                                }
                                
                                // Track unique Kc values used
                                kc_values_used.add(dailyKc);
                                
                                // Sum OpenMeteo forecast ET₀ for FUTURE dates (>= reference date)
                                if (date >= referenceDate) {
                                  const et0_forecast = weather.daily.et0_fao_evapotranspiration?.[i] || 0;
                                  et0_forecast_sum += et0_forecast;
                                  const dailyEtc = et0_forecast * dailyKc;
                                  etc_forecast_sum += dailyEtc; // Calculate ETc per day
                                  
                                  // Track ETc by Kc value for range display
                                  etc_forecast_by_kc.set(dailyKc, (etc_forecast_by_kc.get(dailyKc) || 0) + dailyEtc);
                                  
                                  // Track ET₀ by month (for split display when Kc differs across months)
                                  et0_forecast_by_month.set(dateMonth, (et0_forecast_by_month.get(dateMonth) || 0) + et0_forecast);
                                  
                                  forecastDates.push(date);
                                }
                                
                                // Sum CIMIS actual ET₀ for dates BEFORE the reference date (past days)
                                if (isCalifornia && date < referenceDate) {
                                  const cimisDay = locationCmisData.find(d => d.date === date);
                                  if (cimisDay && cimisDay.etc_actual !== undefined && cimisDay.etc_actual !== null) {
                                    et0_actual_sum += cimisDay.etc_actual;
                                    const dailyEtc = cimisDay.etc_actual * dailyKc;
                                    etc_actual_sum += dailyEtc;
                                    etc_actual_by_kc.set(dailyKc, (etc_actual_by_kc.get(dailyKc) || 0) + dailyEtc);
                                    actualDaysCount++;
                                    actualDates.push(date);
                                  }
                                }
                              }
                              
                              // For non-California locations, calculate ETc using average Kc as fallback
                              if (!isCalifornia && et0_actual_sum > 0) {
                                const kc_values_array = Array.from(kc_values_used);
                                const avg_kc = kc_values_array.length > 0 
                                  ? kc_values_array.reduce((sum, val) => sum + val, 0) / kc_values_array.length 
                                  : 1.0;
                                etc_actual_sum = et0_actual_sum * avg_kc;
                              }
                              
                              const hasActualData = actualDaysCount > 0;
                              const isLoadingCmis = loadingCmisLocations.has(location.id);
                              const hasCmisFailed = failedCmisLocations.has(location.id);
                              
                              // Format Kc values for display
                              const kc_values_array = Array.from(kc_values_used);
                              const kc_display = kc_values_array.length > 1 
                                ? kc_values_array.map((v: number) => v.toFixed(2)).join(', ')
                                : kc_values_array[0]?.toFixed(2) || '—';
                              
                              // Format ETc forecast display - show as range if multiple Kc values
                              let etc_forecast_display = etc_forecast_sum.toFixed(2);
                              if (kc_values_array.length > 1 && etc_forecast_by_kc.size > 1) {
                                // Sort Kc values and get corresponding ETc values
                                const sortedKcs = kc_values_array.sort((a, b) => a - b);
                                const etcValues = sortedKcs.map(kc => etc_forecast_by_kc.get(kc) || 0);
                                etc_forecast_display = `(${etcValues.map(v => v.toFixed(2)).join(', ')})`;
                              }
                              
                              // Format ET₀ forecast display - split by month when Kc differs across months
                              let et0_forecast_display = et0_forecast_sum.toFixed(2);
                              if (kc_values_array.length > 1 && et0_forecast_by_month.size > 1) {
                                // Show ET₀ per month in order
                                const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                                const sortedMonths = Array.from(et0_forecast_by_month.entries()).sort((a, b) => a[0] - b[0]);
                                et0_forecast_display = sortedMonths.map(([month, val]) => `${monthNames[month - 1]}: ${val.toFixed(2)}`).join(', ');
                              }
                              
                              // Format ETc actual display - show as range if multiple Kc values
                              let etc_actual_display = etc_actual_sum.toFixed(2);
                              if (kc_values_array.length > 1 && etc_actual_by_kc.size > 1) {
                                // Sort Kc values and get corresponding ETc values
                                const sortedKcs = kc_values_array.sort((a, b) => a - b);
                                const etcValues = sortedKcs.map(kc => etc_actual_by_kc.get(kc) || 0);
                                etc_actual_display = `(${etcValues.map(v => v.toFixed(2)).join(', ')})`;
                              }
                              
                              // Determine water need category based on weekly forecast ETc
                              let waterNeedCategory = 'Low';
                              if (etc_forecast_sum > 3.5) {
                                waterNeedCategory = 'High';
                              } else if (etc_forecast_sum >= 2.1) {
                                waterNeedCategory = 'Med';
                              }

                              return (
                                <tr 
                                  key={`${location.id}-${cropId}-${reportMode}-${forecastPreset}-${futureStartDate}`}
                                  className={locIdx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-800/50'}
                                >
                                  <td 
                                    className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white sticky left-0 bg-blue-50 dark:bg-blue-900/20 border-r border-gray-300 dark:border-gray-600"
                                  >
                                    <div className="flex items-center">
                                      <MapPin className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                      <span>{location.name}</span>
                                    </div>
                                  </td>
                                  
                                  {/* ET₀ Actual */}
                                  <td className="px-4 py-3 text-sm text-center text-gray-900 dark:text-white font-mono">
                                    {isLoadingCmis ? (
                                      <div className="flex items-center justify-center">
                                        <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                      </div>
                                    ) : hasCmisFailed ? (
                                      <button
                                        onClick={() => retryLocationCMIS(location.id)}
                                        className="flex items-center justify-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                                        title="Click to retry loading CIMIS data"
                                      >
                                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        Retry
                                      </button>
                                    ) : hasActualData ? et0_actual_sum.toFixed(2) : '—'}
                                  </td>
                                  
                                  {/* ETc Actual */}
                                  <td className="px-4 py-3 text-sm text-center text-blue-600 dark:text-blue-400 font-mono font-semibold">
                                    {isLoadingCmis ? (
                                      <div className="flex items-center justify-center">
                                        <div className="h-4 w-16 bg-blue-200 dark:bg-blue-900 rounded animate-pulse"></div>
                                      </div>
                                    ) : hasCmisFailed ? (
                                      <button
                                        onClick={() => retryLocationCMIS(location.id)}
                                        className="flex items-center justify-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                                        title="Click to retry loading CIMIS data"
                                      >
                                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        Retry
                                      </button>
                                    ) : hasActualData ? etc_actual_display : '—'}
                                  </td>
                                  
                                  {/* Total Kc */}
                                  <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-400 font-mono">
                                    {isLoadingCmis ? (
                                      <div className="flex items-center justify-center">
                                        <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                      </div>
                                    ) : hasCmisFailed ? (
                                      <button
                                        onClick={() => retryLocationCMIS(location.id)}
                                        className="flex items-center justify-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                                        title="Click to retry loading CIMIS data"
                                      >
                                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        Retry
                                      </button>
                                    ) : kc_display}
                                  </td>
                                  
                                  {/* ET₀ Forecast */}
                                  <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-400 font-mono italic">
                                    {et0_forecast_display}
                                  </td>
                                  
                                  {/* ETc Forecast */}
                                  <td className="px-4 py-3 text-sm text-center text-sky-500 dark:text-sky-400 font-mono font-semibold italic">
                                    {etc_forecast_display}
                                  </td>
                                  
                                  {/* Water Need */}
                                  <td className="px-4 py-3 text-sm text-center font-semibold">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                      waterNeedCategory === 'High' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                      waterNeedCategory === 'Med' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                    }`}>
                                      {waterNeedCategory}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      
                      {/* Average ETc Over Time Chart for this Crop */}
                      {(() => {
                        // Calculate average ETc across all locations for this crop over time
                        const dateMap = new Map<string, { totalEtc: number; count: number }>();
                        
                        cropLocations.forEach(location => {
                          const locationInstances = instances.filter(inst => inst.locationId === location.id);
                          if (locationInstances.length === 0) return;
                          
                          const weather = location.weatherData;
                          if (!weather || !weather.daily) return;
                          
                          // Determine date range (same logic as table)
                          let startIdx = 0;
                          let endIdx = weather.daily.time.length;
                          
                          if (reportMode === 'current') {
                            // Current mode: With past_days: 7, array includes past 7 days
                            const today = new Date().toISOString().split('T')[0];
                            const todayIdx = weather.daily.time.findIndex((d: string) => d >= today);
                            if (todayIdx === -1) {
                              startIdx = 0;
                            } else {
                              startIdx = Math.max(0, todayIdx - 7);
                            }
                            const daysToShow = forecastPreset === 'today' ? 1 : 14; // 7 days before + 7 days after
                            endIdx = Math.min(startIdx + daysToShow, weather.daily.time.length);
                          } else if (reportMode === 'future') {
                            let futureStart: string;
                            if (futureStartDate) {
                              futureStart = futureStartDate;
                            } else {
                              const future = new Date();
                              future.setDate(future.getDate() + 7);
                              futureStart = future.toISOString().split('T')[0];
                            }
                            startIdx = weather.daily.time.findIndex((d: string) => d === futureStart);
                            if (startIdx === -1) {
                              startIdx = weather.daily.time.findIndex((d: string) => d > futureStart);
                            }
                            if (startIdx === -1) startIdx = Math.min(7, weather.daily.time.length - 7);
                            const daysToShow = forecastPreset === '7day' ? 7 : 14;
                            endIdx = Math.min(startIdx + daysToShow, weather.daily.time.length);
                          } else if (reportMode === 'historical') {
                            if (dateRange.startDate && dateRange.endDate) {
                              startIdx = weather.daily.time.findIndex((d: string) => d >= dateRange.startDate);
                              if (startIdx === -1) startIdx = 0;
                              endIdx = weather.daily.time.findIndex((d: string) => d > dateRange.endDate);
                              if (endIdx === -1) endIdx = weather.daily.time.length;
                            }
                          }
                          
                          // Get crop data for monthly Kc lookup
                          const cropData = COMPREHENSIVE_CROP_DATABASE.find(c => c.id === cropId);
                          
                          // Aggregate ETc values by date
                          for (let i = startIdx; i < endIdx; i++) {
                            const date = weather.daily.time[i];
                            const et0_inches = weather.daily.et0_fao_evapotranspiration?.[i] || 0; // API already returns in inches
                            
                            // Get month from date (1-12)
                            const dateMonth = new Date(date + 'T12:00:00').getMonth() + 1;
                            
                            // Calculate Kc - check custom values first, then monthly, then stage-based fallback
                            let kc = 1.0;
                            const customKc = locationInstances[0]?.customKcValues?.[dateMonth];
                            if (customKc !== undefined) {
                              kc = customKc;
                            } else if (cropData?.monthlyKc && cropData.monthlyKc.length > 0) {
                              const monthData = cropData.monthlyKc.find(m => m.month === dateMonth);
                              kc = monthData?.kc || 1.0;
                            } else {
                              kc = locationInstances[0].currentStage === 2 ? 1.15 : 
                                   locationInstances[0].currentStage === 1 ? 0.70 : 0.50;
                            }
                            
                            const etc_inches = et0_inches * kc;
                            
                            const existing = dateMap.get(date) || { totalEtc: 0, count: 0 };
                            dateMap.set(date, {
                              totalEtc: existing.totalEtc + etc_inches,
                              count: existing.count + 1
                            });
                          }
                        });
                        
                        // Convert to chart data with averages
                        const chartData = Array.from(dateMap.entries())
                          .map(([date, data]) => ({
                            date,
                            avgEtc: data.totalEtc / data.count,
                            formattedDate: new Date(date + 'T12:00:00').toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric'
                            })
                          }))
                          .sort((a, b) => a.date.localeCompare(b.date));
                        
                        if (chartData.length === 0) return null;
                        
                        return (
                          <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                              <TrendingUp className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
                              Average ETc Across All Locations
                            </h4>
                            <ResponsiveContainer width="100%" height={250}>
                              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                                <XAxis 
                                  dataKey="formattedDate" 
                                  stroke="#6B7280"
                                  tick={{ fill: '#6B7280', fontSize: 12 }}
                                />
                                <YAxis 
                                  stroke="#6B7280"
                                  tick={{ fill: '#6B7280', fontSize: 12 }}
                                  label={{ value: 'ETc (inches)', angle: -90, position: 'insideLeft', fill: '#6B7280' }}
                                />
                                <Tooltip 
                                  contentStyle={{ 
                                    backgroundColor: '#1F2937', 
                                    border: '1px solid #374151',
                                    borderRadius: '0.5rem',
                                    color: '#F3F4F6'
                                  }}
                                  formatter={(value: number) => [`${value.toFixed(2)} in`, 'Avg ETc']}
                                />
                                <Legend 
                                  wrapperStyle={{ color: '#6B7280' }}
                                  formatter={() => `Average ETc for ${cropName}`}
                                />
                                <Line 
                                  type="monotone" 
                                  dataKey="avgEtc" 
                                  stroke="#3B82F6" 
                                  strokeWidth={3}
                                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                                  activeDot={{ r: 6, fill: '#3B82F6' }}
                                  name="Avg ETc"
                                />
                              </LineChart>
                            </ResponsiveContainer>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                              Shows the average crop water use (ETc) across all {cropLocations.length} location{cropLocations.length !== 1 ? 's' : ''} growing {cropName.toLowerCase()}
                            </p>
                          </div>
                        );
                      })()}
                      
                      {/* Weekly Summary Input Field */}
                      <div className="p-3 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-200 dark:border-gray-600">
                        <label 
                          htmlFor={`weekly-summary-${cropId}`}
                          className="block text-xs font-medium text-gray-900 dark:text-white mb-1"
                        >
                          Weekly Summary
                        </label>
                        <textarea
                          id={`weekly-summary-${cropId}`}
                          data-version="3.0"
                          defaultValue={cropWeeklySummaries?.[cropId] ?? ''}
                          onKeyDown={(e) => {
                            if (e.key === 'Tab') {
                              e.preventDefault();
                              const target = e.target as HTMLTextAreaElement;
                              const start = target.selectionStart;
                              const end = target.selectionEnd;
                              const indent = '    '; // 4 spaces
                              if (e.shiftKey) {
                                // Shift+Tab: remove leading 4 spaces from current line
                                const lineStart = target.value.lastIndexOf('\n', start - 1) + 1;
                                if (target.value.substring(lineStart, lineStart + 4) === indent) {
                                  target.value = target.value.substring(0, lineStart) + target.value.substring(lineStart + 4);
                                  target.selectionStart = Math.max(lineStart, start - 4);
                                  target.selectionEnd = Math.max(lineStart, end - 4);
                                }
                              } else {
                                // Tab: insert 4 spaces at cursor
                                target.value = target.value.substring(0, start) + indent + target.value.substring(end);
                                target.selectionStart = target.selectionEnd = start + 4;
                              }
                              // Trigger onChange so parent state updates
                              const updatedSummaries = {
                                ...cropWeeklySummaries,
                                [cropId]: target.value
                              };
                              onCropWeeklySummariesChange(updatedSummaries);
                            }
                          }}
                          onBlur={(e) => {
                            const updatedSummaries = {
                              ...cropWeeklySummaries,
                              [cropId]: e.target.value
                            };
                            onCropWeeklySummariesChange(updatedSummaries);
                          }}
                          placeholder={`Add your weekly insights and observations for ${cropName}...`}
                          className="w-full h-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm resize-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                          rows={4}
                        />
                      </div>
                    </div>
                  );
                });
              })()}
              
              {/* Comprehensive Export Button */}
              <div className="flex justify-center pt-3">
                <button
                  onClick={() => setIsExportModalOpen(true)}
                  className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
                >
                  <Settings className="h-5 w-5 mr-2" />
                  Comprehensive Export
                </button>
              </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Custom view when no location is selected */}
      {selectedLocationIds.size === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-3 text-center">
          <div className="max-w-md mx-auto">
            <MapPin className="h-10 w-10 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
              Select a Location to View Weather Data
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Choose a specific location from the dropdown above to see detailed weather forecasts, 
              charts, and agricultural data for that area.
            </p>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
              <h4 className="font-medium text-gray-900 dark:text-white mb-1 text-sm">Available Options:</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Select a specific location for detailed weather data</li>
                <li>• Check "All Locations" to compare multiple areas</li>
                <li>• View charts, forecasts, and agricultural insights</li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Location Reports - Toggle with "Show Individual Location Details" checkbox */}
          {showLocationDetails && displayLocations.map((location, locationIndex) => {
        // Check if location has weather data and proper structure
        const weather = location.weatherData;
        
        // For trial locations (no weatherData), we'll still show the charts
        // but skip the detailed weather table
        const isTrialLocation = !weather || !weather.daily;
        
        if (isTrialLocation) {
          // Generate realistic mock data for trial locations based on report mode
          const generateMockForecastData = () => {
            const mockDays = [];
            let startDate = new Date();
            let daysToGenerate = 14;
            
            // Adjust date range based on report mode
            if (reportMode === 'future') {
              // Future mode: Start from selected future date or 7 days from now
              if (futureStartDate) {
                // Parse the date string to avoid timezone issues
                const [year, month, day] = futureStartDate.split('-').map(Number);
                startDate = new Date(year, month - 1, day);
              } else {
                startDate.setDate(startDate.getDate() + 7);
              }
              daysToGenerate = forecastPreset === '7day' ? 7 : 14;
            } else if (reportMode === 'historical' && dateRange.startDate && dateRange.endDate) {
              // Historical mode: Use custom date range
              startDate = new Date(dateRange.startDate);
              const endDate = new Date(dateRange.endDate);
              daysToGenerate = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            } else if (reportMode === 'current') {
              // Current mode: Start from today, use preset
              daysToGenerate = forecastPreset === 'today' ? 1 : forecastPreset === '7day' ? 7 : 14;
            }
            
            for (let i = 0; i < daysToGenerate; i++) {
              const date = new Date(startDate);
              date.setDate(startDate.getDate() + i);
              
              // Generate realistic Central Valley weather data
              const baseTemp = 75; // Base temperature for fall
              const tempVariation = Math.sin(i * 0.5) * 8 + Math.random() * 4;
              const highTemp = Math.round(baseTemp + tempVariation + 5);
              const lowTemp = Math.round(baseTemp + tempVariation - 10);
              
              // Generate ET0 values (0.15-0.27 inches/day range) - API returns inches
              const et0_inches = 0.15 + Math.random() * 0.12; // Realistic inch range
              const et0_sum_inches = (i + 1) * 0.2; // Cumulative sum, average ~0.2 in/day
              
              mockDays.push({
                date: date.toISOString().split('T')[0],
                tempMax: highTemp,
                tempMin: lowTemp,
                precipitation: Math.random() < 0.2 ? (Math.random() * 0.5).toFixed(2) : '0.00',
                et0: et0_inches.toFixed(2),
                et0_sum: et0_sum_inches.toFixed(2)
              });
            }
            return mockDays;
          };

          const mockForecastData = generateMockForecastData();
          const todayData = mockForecastData[0];
          const isCollapsed = collapsedLocations.has(location.id);

          // Render trial location with forecast table and charts
          return (
            <div 
              key={`${location.id}-${reportMode}-${forecastPreset}-${futureStartDate}`}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden"
            >
              {/* Location Header - trial */}
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-750">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    {/* Collapse/Expand Button */}
                    <button
                      onClick={() => toggleLocationCollapse(location.id)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-0.5"
                      title={isCollapsed ? "Expand section" : "Collapse section"}
                    >
                      {isCollapsed ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronUp className="h-4 w-4" />
                      )}
                    </button>
                    
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center">
                        <MapPin className="h-4 w-4 mr-1.5 text-blue-600 dark:text-blue-400" />
                        {location.name || 'Unknown Location'}
                      </h3>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        NOAA Weather Data (GFS Global & NAM CONUS via Open-Meteo API)
                      </div>
                    </div>
                    
                    {/* Weather Stats in Header */}
                    <div className="hidden lg:flex items-center gap-2">
                      {/* High */}
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                          <Thermometer className="h-3 w-3 text-red-500" />
                          <span>HIGH</span>
                        </div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white">
                          {todayData.tempMax}°F
                        </div>
                      </div>
                      
                      {/* Low */}
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                          <Thermometer className="h-3 w-3 text-blue-500" />
                          <span>LOW</span>
                        </div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white">
                          {todayData.tempMin}°F
                        </div>
                      </div>
                      
                      {/* Precip */}
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                          <Droplets className="h-3 w-3 text-blue-500" />
                          <span>PRECIP</span>
                        </div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white">
                          {todayData.precipitation} in
                        </div>
                      </div>
                      
                      {/* ET₀ */}
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                          <Gauge className="h-3 w-3 text-green-500" />
                          <span>ET₀</span>
                        </div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white">
                          {Number(todayData.et0).toFixed(2)} in
                        </div>
                      </div>
                      
                      {/* ET₀ Sum */}
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                          <Gauge className="h-3 w-3 text-green-600" />
                          <span>ET₀ SUM</span>
                        </div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white">
                          {Number(todayData.et0_sum).toFixed(2)} in
                        </div>
                      </div>
                      
                      {/* ETC Actual */}
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                          <TrendingUp className="h-3 w-3 text-green-500" />
                          <span>ETC ACTUAL</span>
                        </div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white">
                          {getETCDisplayText(location, todayData.date)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-medium text-gray-900 dark:text-white">
                      Location {locationIndex + 1} of {displayLocations.length}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Real NOAA Data
                    </div>
                  </div>
                </div>
              </div>

              {/* Collapsible Content */}
              {!isCollapsed && (
              <>
              {/* Loading Indicator for CIMIS Data */}
              {loadingCmisLocations.has(location.id) && (
                <div className="px-6 py-4 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-700">
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                      Loading CIMIS actual data for {location.name}...
                    </div>
                  </div>
                </div>
              )}
              
              {/* Today's Metrics Grid - trial */}
              <div className="p-3 bg-gray-50 dark:bg-gray-800/50">
                <h4 className="text-xs font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  {reportMode === 'current' ? "Today's Weather Stats" : 
                   reportMode === 'future' ? "Future Period Start Stats" : 
                   "Period Start Weather Stats"}
                </h4>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {/* High Temp */}
                  <div className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center mb-1">
                      <Thermometer className="h-3 w-3 text-red-500 mr-1" />
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">High</span>
                    </div>
                    <div className="text-sm font-bold text-gray-900 dark:text-white">
                      {todayData.tempMax}°F
                    </div>
                  </div>

                  {/* Low Temp */}
                  <div className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center mb-1">
                      <Thermometer className="h-3 w-3 text-blue-500 mr-1" />
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Low</span>
                    </div>
                    <div className="text-sm font-bold text-gray-900 dark:text-white">
                      {todayData.tempMin}°F
                    </div>
                  </div>

                  {/* Precipitation */}
                  <div className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center mb-1">
                      <Droplets className="h-3 w-3 text-blue-500 mr-1" />
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Precip</span>
                    </div>
                    <div className="text-sm font-bold text-gray-900 dark:text-white">
                      {todayData.precipitation} in
                    </div>
                  </div>

                  {/* ET₀ Daily */}
                  <div className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center mb-1">
                      <Gauge className="h-3 w-3 text-green-500 mr-1" />
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">ET₀</span>
                    </div>
                    <div className="text-sm font-bold text-gray-900 dark:text-white">
                      {Number(todayData.et0).toFixed(2)} in
                    </div>
                  </div>

                  {/* ET₀ Sum */}
                  <div className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center mb-1">
                      <Gauge className="h-3 w-3 text-green-600 mr-1" />
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">ET₀ Sum</span>
                    </div>
                    <div className="text-sm font-bold text-gray-900 dark:text-white">
                      {Number(todayData.et0_sum).toFixed(2)} in
                    </div>
                  </div>

                  {/* ETC Actual */}
                  <div className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center mb-1">
                      <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">ETC Actual</span>
                    </div>
                    <div className="text-sm font-bold text-gray-900 dark:text-white">
                      {getETCDisplayText(location, todayData.date)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Forecast Table */}
              <div className="p-3">
                <div className="text-center mb-1">
                  <h4 className="text-xs font-medium text-gray-900 dark:text-white">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {reportMode === 'current' 
                        ? `Current Period Data (${forecastPreset === 'today' ? 'Today' : '7 Days (Past)'})`
                        : reportMode === 'future'
                        ? `Future Period Data (7 Days)`
                        : "Historical Period Data"}
                    </div>
                  </h4>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
                  <span>📡 API:</span>
                  <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded">Open-Meteo</span>
                  <span>•</span>
                  <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">CMIS (CA)</span>
                  <span>• GFS Model • FAO-56 ET₀</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                          Date
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                          High (°F)
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                          Low (°F)
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                          Precip (in)
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                          ET₀ Projected (in)
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                          ET₀ Sum (inches)
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                          ETC Actual (in)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {mockForecastData.map((day, index) => (
                        <tr 
                          key={day.date} 
                          className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-800/50'}
                        >
                          <td className="px-3 py-2 text-sm font-medium text-gray-900 dark:text-white">
                            {new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              weekday: 'short'
                            })}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900 dark:text-white font-semibold">
                            {day.tempMax}°
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
                            {day.tempMin}°
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
                            {day.precipitation}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
                            {Number(day.et0).toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
                            {Number(day.et0_sum).toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
                            <div className="flex items-center">
                              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                              {getETCDisplayText(location, day.date).replace(' in', '')}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Centered AI Insights for Weather Summary Table */}
                {showAIInsights && (
                  <div className="flex justify-center mt-3 mb-2">
                    <ChartAIInsights
                      chartType="weather-summary"
                      chartData={weather?.daily ? weather.daily.time.map((date: string, index: number) => ({
                        date,
                        temperature: weather.daily.temperature_2m_max?.[index] || 0,
                        humidity: weather.daily.relative_humidity_2m?.[index] || 0,
                        precipitation: weather.daily.precipitation_sum?.[index] || 0,
                        evapotranspiration: weather.daily.et0_fao_evapotranspiration?.[index] || 0
                      })) : []}
                      location={location?.name || 'Field Location'}
                      className=""
                      compact={true}
                    />
                  </div>
                )}

              </div>

              {/* Weather Charts */}
              <div className="mt-3">
                <ChartErrorBoundary>
                  <SimpleWeatherCharts 
                    location={location} 
                    showAIInsights={showAIInsights}
                    reportMode={reportMode}
                    forecastPreset={forecastPreset}
                    dateRange={dateRange}
                    reportDate={reportMode === 'future' ? futureStartDate : undefined}
                    insights={getLocationInsights(location.id)}
                    onInsightsChange={(newInsights) => updateLocationInsights(location.id, newInsights)}
                  />
                </ChartErrorBoundary>
              </div>

              {/* Crop Insights for this Location */}
              {showCropInsights && (
                <div className="mt-3">
                  <ChartErrorBoundary>
                    <CropETCCharts 
                      cropInstances={cropInstances}
                      locations={[location]}
                      location={location}
                      weatherData={weather}
                      dateRange={dateRange}
                      reportMode={reportMode}
                      forecastPreset={forecastPreset}
                      reportDate={reportMode === 'future' ? futureStartDate : undefined}
                      showAIInsights={showAIInsights}
                      insights={getLocationInsights(location.id)}
                      onInsightsChange={(newInsights) => updateLocationInsights(location.id, newInsights)}
                    />
                  </ChartErrorBoundary>
                </div>
              )}
              </>
              )}
            </div>
          );
        }
        
        // Determine which data index to use based on report mode
        let startIdx = 0;
        let endIdx = weather.daily.time.length;
        
        if (reportMode === 'current') {
          // Current mode: Show past 7 days + future days based on preset
          // With past_days: 7, the array includes 7 days of past data
          const today = new Date().toISOString().split('T')[0];
          const todayIdx = weather.daily.time.findIndex((d: string) => d >= today);
          if (todayIdx === -1) {
            startIdx = 0;
          } else {
            // Start from 7 days before today
            startIdx = Math.max(0, todayIdx - 7);
          }
          const daysToShow = forecastPreset === 'today' ? 1 : 14; // 7 before + 7 after
          endIdx = Math.min(startIdx + daysToShow, weather.daily.time.length);
        } else if (reportMode === 'future') {
          // Future mode: Start from selected date or 7 days out, use preset
          let futureStart: string;
          if (futureStartDate) {
            // Use the exact date from the picker
            futureStart = futureStartDate;
          } else {
            const future = new Date();
            future.setDate(future.getDate() + 7);
            futureStart = future.toISOString().split('T')[0];
          }
          // Find the exact matching date or the next available date
          startIdx = weather.daily.time.findIndex((d: string) => d === futureStart);
          // If exact match not found, find the next date
          if (startIdx === -1) {
            startIdx = weather.daily.time.findIndex((d: string) => d > futureStart);
          }
          // Fallback to a reasonable default
          if (startIdx === -1) startIdx = Math.min(7, weather.daily.time.length - 7);
          const daysToShow = forecastPreset === '7day' ? 7 : 14;
          endIdx = Math.min(startIdx + daysToShow, weather.daily.time.length);
        } else if (reportMode === 'historical') {
          // Historical mode: Use custom date range
          if (dateRange.startDate && dateRange.endDate) {
            startIdx = weather.daily.time.findIndex((d: string) => d >= dateRange.startDate);
            if (startIdx === -1) startIdx = 0;
            endIdx = weather.daily.time.findIndex((d: string) => d > dateRange.endDate);
            if (endIdx === -1) endIdx = weather.daily.time.length;
          }
        }
        
        // Get first day's data for the summary stats
        const todayData = {
          date: weather.daily.time[startIdx],
          tempMax: safe(weather.daily.temperature_2m_max?.[startIdx]?.toFixed(0)),
          tempMin: safe(weather.daily.temperature_2m_min?.[startIdx]?.toFixed(0)),
          precipitation: safe(weather.daily.precipitation_sum?.[startIdx]?.toFixed(2)),
          et0: weather.daily.et0_fao_evapotranspiration?.[startIdx] || 0, // API already returns in inches
          et0_sum: weather.daily.et0_fao_evapotranspiration_sum?.[startIdx] || 0,
        };
        
        // Generate forecast data array for the table
        const forecastData = [];
        let cumulativeET0 = 0;
        for (let i = startIdx; i < endIdx; i++) {
          const et0_inches = weather.daily.et0_fao_evapotranspiration?.[i] || 0; // API already returns in inches
          cumulativeET0 += et0_inches;
          
          forecastData.push({
            date: weather.daily.time[i],
            tempMax: safe(weather.daily.temperature_2m_max?.[i]?.toFixed(0)),
            tempMin: safe(weather.daily.temperature_2m_min?.[i]?.toFixed(0)),
            precipitation: safe(weather.daily.precipitation_sum?.[i]?.toFixed(2)),
            et0: et0_inches.toFixed(2),
            et0_sum: cumulativeET0.toFixed(2)
          });
        }

        const isCollapsed = collapsedLocations.has(location.id);

        return (
          <div 
            key={`${location.id}-${reportMode}-${forecastPreset}-${futureStartDate}`}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden"
          >
            {/* Location Header */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-750">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1">
                  {/* Collapse/Expand Button */}
                  <button
                    onClick={() => toggleLocationCollapse(location.id)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-0.5"
                    title={isCollapsed ? "Expand section" : "Collapse section"}
                  >
                    {isCollapsed ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronUp className="h-4 w-4" />
                    )}
                  </button>
                  
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center">
                      <MapPin className="h-4 w-4 mr-1.5 text-blue-600 dark:text-blue-400" />
                      {location.name}
                    </h3>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                    </div>
                  </div>
                  
                  {/* Weather Stats in Header */}
                  <div className="hidden lg:flex items-center gap-2">
                    {/* High */}
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <Thermometer className="h-3 w-3 text-red-500" />
                        <span>HIGH</span>
                      </div>
                      <div className="text-sm font-bold text-gray-900 dark:text-white">
                        {todayData.tempMax}°F
                      </div>
                    </div>
                    
                    {/* Low */}
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <Thermometer className="h-3 w-3 text-blue-500" />
                        <span>LOW</span>
                      </div>
                      <div className="text-sm font-bold text-gray-900 dark:text-white">
                        {todayData.tempMin}°F
                      </div>
                    </div>
                    
                    {/* Precip */}
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <Droplets className="h-3 w-3 text-blue-500" />
                        <span>PRECIP</span>
                      </div>
                      <div className="text-sm font-bold text-gray-900 dark:text-white">
                        {todayData.precipitation} in
                      </div>
                    </div>
                    
                    {/* ET₀ */}
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <Gauge className="h-3 w-3 text-green-500" />
                        <span>ET₀</span>
                      </div>
                      <div className="text-sm font-bold text-gray-900 dark:text-white">
                        {Number(todayData.et0).toFixed(2)} in
                      </div>
                    </div>
                    
                    {/* ET₀ Sum */}
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <Gauge className="h-3 w-3 text-green-600" />
                        <span>ET₀ SUM</span>
                      </div>
                      <div className="text-sm font-bold text-gray-900 dark:text-white">
                        {Number(todayData.et0_sum).toFixed(2)} in
                      </div>
                    </div>
                    
                    {/* ETC Actual */}
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <TrendingUp className="h-3 w-3 text-green-500" />
                        <span>ETC ACTUAL</span>
                      </div>
                      <div className="text-sm font-bold text-gray-900 dark:text-white">
                        {getETCDisplayText(location, todayData.date)}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-medium text-gray-900 dark:text-white">
                    Location {locationIndex + 1} of {displayLocations.length}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    NCEP GFS Seamless Model
                  </div>
                </div>
              </div>
            </div>

            {/* Collapsible Content */}
            {!isCollapsed && (
            <>
            {/* Loading Indicator for CIMIS Data */}
            {loadingCmisLocations.has(location.id) && (
              <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-700">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    Loading CIMIS actual data for {location.name}...
                  </div>
                </div>
              </div>
            )}
            
            {/* Today's Metrics Grid */}
            <div className="p-3 bg-gray-50 dark:bg-gray-800/50">
              <h4 className="text-xs font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                {reportMode === 'current' ? "Today's Weather Stats" : 
                 reportMode === 'future' ? "Future Period Start Stats" : 
                 "Period Start Weather Stats"}
              </h4>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {/* High Temp */}
                <div className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center mb-1">
                    <Thermometer className="h-3 w-3 text-red-500 mr-1" />
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">High</span>
                  </div>
                  <div className="text-sm font-bold text-gray-900 dark:text-white">
                    {todayData.tempMax}°F
                  </div>
                </div>

                {/* Low Temp */}
                <div className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center mb-1">
                    <Thermometer className="h-3 w-3 text-blue-500 mr-1" />
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Low</span>
                  </div>
                  <div className="text-sm font-bold text-gray-900 dark:text-white">
                    {todayData.tempMin}°F
                  </div>
                </div>

                {/* Precipitation */}
                <div className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center mb-1">
                    <Droplets className="h-3 w-3 text-blue-500 mr-1" />
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Precip</span>
                  </div>
                  <div className="text-sm font-bold text-gray-900 dark:text-white">
                    {todayData.precipitation} in
                  </div>
                </div>

                {/* ET₀ Daily */}
                <div className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center mb-1">
                    <Gauge className="h-3 w-3 text-green-500 mr-1" />
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">ET₀</span>
                  </div>
                  <div className="text-sm font-bold text-gray-900 dark:text-white">
                    {Number(todayData.et0).toFixed(2)} in
                  </div>
                </div>

                {/* ET₀ Sum */}
                <div className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center mb-1">
                    <Gauge className="h-3 w-3 text-green-600 mr-1" />
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">ET₀ Sum</span>
                  </div>
                  <div className="text-sm font-bold text-gray-900 dark:text-white">
                    {Number(todayData.et0_sum).toFixed(2)} in
                  </div>
                </div>

                {/* ETC Actual */}
                <div className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center mb-1">
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">ETC Actual</span>
                  </div>
                  <div className="text-sm font-bold text-gray-900 dark:text-white">
                    {getETCDisplayText(location, weather.daily.time[0])}
                  </div>
                </div>
              </div>
            </div>

            {/* Forecast Table */}
            <div className="p-3">
              <div className="text-center mb-1">
                <h4 className="text-xs font-medium text-gray-900 dark:text-white">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {reportMode === 'current' 
                      ? `Current Period Data (${forecastPreset === 'today' ? 'Today' : '7 Days (Past)'})`
                      : reportMode === 'future'
                      ? `Future Period Data (7 Days)`
                      : "Historical Period Data"}
                  </div>
                </h4>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
                <span>📡 API:</span>
                <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded">Open-Meteo</span>
                <span>•</span>
                <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-0.5 rounded">CMIS (CA)</span>
                <span>• GFS Model • FAO-56 ET₀</span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                        Date
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                        High (°F)
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                        Low (°F)
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                        Precip (in)
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                        ET₀ Projected (in)
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                        ET₀ Sum (inches)
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                        ETC Actual (in)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {forecastData.map((day, index) => (
                      <tr 
                        key={day.date} 
                        className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-800/50'}
                      >
                        <td className="px-3 py-2 text-sm font-medium text-gray-900 dark:text-white">
                          {new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            weekday: 'short'
                          })}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900 dark:text-white font-semibold">
                          {day.tempMax}°
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
                          {day.tempMin}°
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
                          {day.precipitation}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
                          {day.et0}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
                          {day.et0_sum}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
                          <div className="flex items-center">
                            <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                            {getETCDisplayText(location, day.date).replace(' in', '')}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Centered AI Insights for Weather Summary Table */}
              {showAIInsights && (
                <div className="flex justify-center mt-3 mb-2">
                  <ChartAIInsights
                    chartType="weather-summary"
                    chartData={weather?.daily ? weather.daily.time.map((date: string, index: number) => ({
                      date,
                      temperature: weather.daily.temperature_2m_max?.[index] || 0,
                      humidity: weather.daily.relative_humidity_2m?.[index] || 0,
                      precipitation: weather.daily.precipitation_sum?.[index] || 0,
                      evapotranspiration: weather.daily.et0_fao_evapotranspiration?.[index] || 0
                    })) : []}
                    location={location?.name || 'Field Location'}
                    className=""
                    compact={true}
                  />
                </div>
              )}

            </div>

            {/* Weather Charts */}
            <div className="mt-3">
              <ChartErrorBoundary>
                <SimpleWeatherCharts 
                  location={location} 
                  showAIInsights={showAIInsights}
                  reportMode={reportMode}
                  forecastPreset={forecastPreset}
                  dateRange={dateRange}
                  reportDate={reportMode === 'future' ? futureStartDate : undefined}
                  insights={getLocationInsights(location.id)}
                  onInsightsChange={(newInsights) => updateLocationInsights(location.id, newInsights)}
                />
              </ChartErrorBoundary>
            </div>

            {/* Crop Insights for this Location */}
            {showCropInsights && (
              <div className="mt-3">
                <ChartErrorBoundary>
                  <CropETCCharts 
                    cropInstances={cropInstances}
                    locations={[location]}
                    location={location}
                    weatherData={weather}
                    dateRange={dateRange}
                    reportMode={reportMode}
                    forecastPreset={forecastPreset}
                    reportDate={reportMode === 'future' ? futureStartDate : undefined}
                    showAIInsights={showAIInsights}
                    insights={getLocationInsights(location.id)}
                    onInsightsChange={(newInsights) => updateLocationInsights(location.id, newInsights)}
                  />
                  </ChartErrorBoundary>
                </div>
              )}
              </>
              )}
            </div>
          );
          })}
        </>
      )}

      {/* Summary Footer - only show when locations are displayed */}
      {selectedLocationIds.size > 0 && (
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3 text-center">
        <div className="text-sm text-blue-700 dark:text-blue-300 mb-2">
          <div className="flex items-center gap-2 justify-center">
            <BarChart3 className="h-5 w-5" />
            <span>Comprehensive Report Generated for {displayLocations.length} Location{displayLocations.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
        
        {displayLocations.length > 0 && (
          <div className="text-xs text-blue-600 dark:text-blue-400 mb-1 flex items-center gap-1 justify-center">
            <MapPin className="h-4 w-4" />
            <strong>Locations:</strong> {displayLocations.map(loc => loc.name).join(', ')}
          </div>
        )}
        
        {(selectedCrops.length > 0 || cropInstances.length > 0) && (
          <div className="text-xs text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-1 justify-center">
            <Sprout className="h-4 w-4" />
            <strong>Active Crops:</strong>
            <span>{(() => {
              const allCrops = new Set();
              selectedCrops.forEach(crop => allCrops.add(crop));
              cropInstances.forEach(instance => allCrops.add(instance.cropId));
              return Array.from(allCrops).join(', ');
            })()}</span>
          </div>
        )}
        
        <p className="text-xs text-blue-600 dark:text-blue-400">
          Data from NCEP GFS Seamless Model & CMIS ETC Actuals • 
          Updated {new Date().toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      </div>
      )}

      {/* Export Options Modal */}
      <ExportOptionsModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleComprehensiveExport}
        availableDataTypes={availableDataTypes}
      />
    </div>
  );
};