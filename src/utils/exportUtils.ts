import * as XLSX from 'xlsx';
import type { LocationWithWeather } from '../types/weather';
import { exportChartsToExcel, exportChartsAsHTML } from './chartExportUtils';

// Basic weather export data (existing)
export interface DetailedExportData {
  date: string;
  location: string;
  high_temp_f: number | string;
  low_temp_f: number | string;
  wind_speed_mph: number | string;
  precipitation_in: number | string;
  et0_inches: number | string;
}

export interface TodayExportData {
  location: string;
  high_temp_f: number | string;
  low_temp_f: number | string;
  wind_speed_mph: number | string;
  precipitation_in: number | string;
  et0_inches: number | string;
  et0_sum_inches: number | string;
}

// Enhanced comprehensive export data interfaces
export interface ComprehensiveWeatherExportData extends DetailedExportData {
  etc_actual_inches?: number | string; // CMIS data when available
  etc_vs_et0_difference?: number | string; // Difference between actual and projected
  cmis_station_id?: string;
  location_state?: string;
  location_region?: string;
}

export interface CropExportData {
  location: string;
  date: string;
  crop_name: string;
  crop_category: string;
  crop_stage: string;
  kc_value: number | string;
  etc_calculated_inches: number | string; // ETc = ET0 * Kc
  et0_source: string; // 'weather-station' | 'cimis' | 'manual'
  planting_date?: string;
  days_since_planting?: number | string;
  field_name?: string;
  notes?: string;
}

export interface CalculatorExportData {
  location: string;
  date: string;
  crop_name: string;
  area: number | string;
  area_unit: string;
  system_type: string;
  system_efficiency: number | string;
  flow_rate_gpm: number | string;
  daily_water_need_gallons: number | string;
  daily_runtime_hours: number | string;
  daily_runtime_minutes: number | string;
  weekly_runtime_hours: number | string;
  etc_inches: number | string;
  calculation_formula: string;
}

export interface FieldBlockExportData {
  location: string;
  field_block_id: string;
  field_name: string;
  crop_assignments: string; // JSON string of crop assignments
  area_acres: number | string;
  irrigation_system: string;
  efficiency_percent: number | string;
  flow_rate_gpm: number | string;
  notes?: string;
  created_date?: string;
  last_updated?: string;
}

export interface ComprehensiveExportOptions {
  includeWeatherData: boolean;
  includeCMISData: boolean;
  includeCropData: boolean;
  includeCalculatorResults: boolean;
  includeFieldBlocks: boolean;
  includeHistoricalData: boolean;
  includeCharts: boolean;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  fileFormat: 'csv' | 'excel' | 'html' | 'charts-excel';
  separateSheets: boolean; // For Excel exports
}

/**
 * Convert locations data to exportable format for 14-day forecast
 */
export function prepareWeatherExportData(locations: LocationWithWeather[]): DetailedExportData[] {
  const exportData: DetailedExportData[] = [];

  locations.forEach(location => {
    if (!location.weatherData) return;

    const weatherData = location.weatherData;
    const dates = weatherData.daily?.time || [];
    const tempMax = weatherData.daily?.temperature_2m_max || [];
    const tempMin = weatherData.daily?.temperature_2m_min || [];
    const windSpeed = weatherData.daily?.wind_speed_10m_max || [];
    const precipitation = weatherData.daily?.precipitation_sum || [];
    const et0 = weatherData.daily?.et0_fao_evapotranspiration || [];

    // Process up to 14 days of data
    const daysToExport = Math.min(14, dates.length);
    
    for (let i = 0; i < daysToExport; i++) {
      const date = dates[i];
      if (!date) continue;

      // Format date
      let formattedDate = '—';
      try {
        formattedDate = new Date(date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
      } catch (e) {
        formattedDate = date;
      }

      exportData.push({
        location: location.name,
        date: formattedDate,
        high_temp_f: tempMax[i] !== undefined ? Number(tempMax[i]).toFixed(0) : '—',
        low_temp_f: tempMin[i] !== undefined ? Number(tempMin[i]).toFixed(0) : '—',
        wind_speed_mph: windSpeed[i] !== undefined ? Number(windSpeed[i]).toFixed(1) : '—',
        precipitation_in: precipitation[i] !== undefined ? Number(precipitation[i]).toFixed(2) : '—',
        et0_inches: et0[i] !== undefined ? Number(et0[i] * 0.0393701).toFixed(3) : '—'
      });
    }
  });

  return exportData;
}

/**
 * Convert locations data to exportable format for today's conditions
 */
export function prepareTodayExportData(locations: LocationWithWeather[]): TodayExportData[] {
  const exportData: TodayExportData[] = [];

  locations.forEach(location => {
    if (!location.weatherData) return;

    const weatherData = location.weatherData;
    const daily = weatherData.daily;

    // Use today's data (first day in forecast)
    exportData.push({
      location: location.name,
      high_temp_f: daily.temperature_2m_max?.[0] !== undefined ? Number(daily.temperature_2m_max[0]).toFixed(0) : '—',
      low_temp_f: daily.temperature_2m_min?.[0] !== undefined ? Number(daily.temperature_2m_min[0]).toFixed(0) : '—',
      wind_speed_mph: daily.wind_speed_10m_max?.[0] !== undefined ? Number(daily.wind_speed_10m_max[0]).toFixed(1) : '—',
      precipitation_in: daily.precipitation_sum?.[0] !== undefined ? Number(daily.precipitation_sum[0]).toFixed(2) : '—',
      et0_inches: daily.et0_fao_evapotranspiration?.[0] !== undefined ? Number(daily.et0_fao_evapotranspiration[0] * 0.0393701).toFixed(3) : '—',
      et0_sum_inches: daily.et0_fao_evapotranspiration_sum?.[0] !== undefined ? Number(daily.et0_fao_evapotranspiration_sum[0] * 0.0393701).toFixed(3) : '—'
    });
  });

  return exportData;
}

/**
 * Export weather data as CSV file
 */
export function exportToCSV(locations: LocationWithWeather[], includeToday: boolean = true) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  
  if (includeToday) {
    // Export today's conditions
    const todayData = prepareTodayExportData(locations);
    const todayCSV = convertToCSV(todayData);
    downloadFile(todayCSV, `weather-report-today-${timestamp}.csv`, 'text/csv');
  }

  // Export 14-day forecast
  const forecastData = prepareWeatherExportData(locations);
  const forecastCSV = convertToCSV(forecastData);
  downloadFile(forecastCSV, `weather-report-14day-${timestamp}.csv`, 'text/csv');
}

/**
 * Export weather data as Excel file
 */
export function exportToExcel(locations: LocationWithWeather[], includeToday: boolean = true) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  
  // Create a new workbook
  const workbook = XLSX.utils.book_new();

  if (includeToday) {
    // Add today's conditions sheet
    const todayData = prepareTodayExportData(locations);
    const todayWorksheet = XLSX.utils.json_to_sheet(todayData);
    
    // Set column widths for better readability
    const todayColWidths = [
      { wch: 20 }, // location
      { wch: 15 }, // current_temp_f
      { wch: 15 }, // feels_like_f
      { wch: 18 }, // humidity_percent
      { wch: 18 }, // wind_speed_mph
      { wch: 18 }, // precipitation_in
      { wch: 12 }  // et0_inches
    ];
    todayWorksheet['!cols'] = todayColWidths;
    
    XLSX.utils.book_append_sheet(workbook, todayWorksheet, "Today's Conditions");
  }

  // Add 14-day forecast sheet
  const forecastData = prepareWeatherExportData(locations);
  const forecastWorksheet = XLSX.utils.json_to_sheet(forecastData);
  
  // Set column widths for better readability
  const forecastColWidths = [
    { wch: 20 }, // location
    { wch: 12 }, // date
    { wch: 15 }, // high_temp_f
    { wch: 15 }, // low_temp_f
    { wch: 18 }, // wind_speed_mph
    { wch: 18 }, // precipitation_in
    { wch: 12 }  // et0_inches
  ];
  forecastWorksheet['!cols'] = forecastColWidths;
  
  XLSX.utils.book_append_sheet(workbook, forecastWorksheet, "14-Day Forecast");

  // Generate and download the Excel file
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `weather-report-${timestamp}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Convert array of objects to CSV string
 */
function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';

  // Get headers from first object
  const headers = Object.keys(data[0]);
  
  // Create CSV header row
  const csvHeader = headers.map(header => 
    header.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  ).join(',');

  // Create CSV data rows
  const csvRows = data.map(row => 
    headers.map(header => {
      const value = row[header];
      // Escape commas and quotes in values
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',')
  );

  return [csvHeader, ...csvRows].join('\n');
}

/**
 * Prepare comprehensive weather data including CMIS data
 */
export function prepareComprehensiveWeatherData(
  locations: LocationWithWeather[], 
  cmisData?: Map<string, any[]>
): ComprehensiveWeatherExportData[] {
  const exportData: ComprehensiveWeatherExportData[] = [];
  
  locations.forEach(location => {
    if (!location.weatherData) return;

    const weatherData = location.weatherData;
    const dates = weatherData.daily?.time || [];
    const tempMax = weatherData.daily?.temperature_2m_max || [];
    const tempMin = weatherData.daily?.temperature_2m_min || [];
    const windSpeed = weatherData.daily?.wind_speed_10m_max || [];
    const precipitation = weatherData.daily?.precipitation_sum || [];
    const et0 = weatherData.daily?.et0_fao_evapotranspiration || [];
    
    // Get CMIS data for this location if available
    const locationCmisData = cmisData?.get(location.id) || [];
    
    // Process up to 14 days of data
    const daysToExport = Math.min(14, dates.length);
    
    for (let i = 0; i < daysToExport; i++) {
      const date = dates[i];
      if (!date) continue;

      let formattedDate = '—';
      try {
        formattedDate = new Date(date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
      } catch (e) {
        formattedDate = date;
      }

      // Find corresponding CMIS data for this date
      const cmisEntry = locationCmisData.find((entry: any) => {
        try {
          const cmisDate = new Date(entry.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit', 
            day: '2-digit'
          });
          return cmisDate === formattedDate;
        } catch {
          return false;
        }
      });

      const et0Value = et0[i] !== undefined ? Number(et0[i] * 0.0393701) : null;
      const etcActual = cmisEntry?.etc_actual;
      const etcDifference = (etcActual !== undefined && et0Value !== null) 
        ? Number((etcActual - et0Value).toFixed(3)) 
        : undefined;

      exportData.push({
        location: location.name,
        date: formattedDate,
        high_temp_f: tempMax[i] !== undefined ? Number(tempMax[i]).toFixed(0) : '—',
        low_temp_f: tempMin[i] !== undefined ? Number(tempMin[i]).toFixed(0) : '—',
        wind_speed_mph: windSpeed[i] !== undefined ? Number(windSpeed[i]).toFixed(1) : '—',
        precipitation_in: precipitation[i] !== undefined ? Number(precipitation[i]).toFixed(2) : '—',
        et0_inches: et0Value !== null ? et0Value.toFixed(3) : '—',
        etc_actual_inches: etcActual !== undefined ? etcActual.toFixed(3) : '—',
        etc_vs_et0_difference: etcDifference !== undefined ? (etcDifference >= 0 ? `+${etcDifference}` : etcDifference.toString()) : '—',
        cmis_station_id: cmisEntry?.station_id || '—',
        location_state: (location as any)?.state || '—',
        location_region: (location as any)?.region || '—'
      });
    }
  });

  return exportData;
}

/**
 * Prepare crop export data including calculations
 */
export function prepareCropExportData(
  locations: LocationWithWeather[],
  cropInstances: any[] = [],
  selectedCrops: string[] = []
): CropExportData[] {
  const exportData: CropExportData[] = [];
  
  locations.forEach(location => {
    if (!location.weatherData) return;

    const weatherData = location.weatherData;
    const dates = weatherData.daily?.time || [];
    const et0Values = weatherData.daily?.et0_fao_evapotranspiration || [];
    
    // Process up to 14 days
    const daysToExport = Math.min(14, dates.length);
    
    for (let i = 0; i < daysToExport; i++) {
      const date = dates[i];
      if (!date) continue;
      
      let formattedDate = '—';
      try {
        formattedDate = new Date(date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
      } catch (e) {
        formattedDate = date;
      }

      const et0 = et0Values[i] ? Number(et0Values[i] * 0.0393701) : 0;
      
      // Export data for selected crops
      selectedCrops.forEach(cropName => {
        // Find crop instance for this location if exists
        const cropInstance = cropInstances.find(instance => 
          instance.cropId === cropName && instance.locationId === location.id
        );
        
        // Use a default Kc of 1.0 if no specific crop instance is found
        const kcValue = 1.0; // This should be determined by crop stage and type
        const etcCalculated = et0 * kcValue;
        
        exportData.push({
          location: location.name,
          date: formattedDate,
          crop_name: cropName,
          crop_category: 'General', // This should come from crop database
          crop_stage: cropInstance?.currentStage ? `Stage ${cropInstance.currentStage}` : 'Unknown',
          kc_value: kcValue.toFixed(2),
          etc_calculated_inches: etcCalculated.toFixed(3),
          et0_source: 'weather-station',
          planting_date: cropInstance?.plantingDate || '—',
          days_since_planting: cropInstance?.plantingDate ? 
            Math.floor((new Date(date).getTime() - new Date(cropInstance.plantingDate).getTime()) / (1000 * 60 * 60 * 24)) : '—',
          field_name: cropInstance?.fieldName || '—',
          notes: cropInstance?.notes || '—'
        });
      });
    }
  });

  return exportData;
}

/**
 * Prepare calculator results for export
 */
export function prepareCalculatorExportData(
  calculatorResult: any,
  calculatorInputs: any,
  location?: any
): CalculatorExportData[] {
  if (!calculatorResult || !calculatorInputs || !location) return [];
  
  return [{
    location: location.name || 'Unknown Location',
    date: new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }),
    crop_name: calculatorInputs.crop || '—',
    area: calculatorInputs.area || '—',
    area_unit: calculatorInputs.areaUnit || '—',
    system_type: calculatorInputs.systemType || '—',
    system_efficiency: calculatorResult.efficiency ? `${calculatorResult.efficiency}%` : '—',
    flow_rate_gpm: calculatorInputs.zoneFlowGPM || '—',
    daily_water_need_gallons: calculatorResult.dailyWaterNeed ? calculatorResult.dailyWaterNeed.toFixed(1) : '—',
    daily_runtime_hours: calculatorResult.runtimeHours || '—',
    daily_runtime_minutes: calculatorResult.runtimeMinutes || '—',
    weekly_runtime_hours: calculatorResult.weeklyHours ? calculatorResult.weeklyHours.toFixed(1) : '—',
    etc_inches: calculatorResult.etc ? (calculatorResult.etc * 0.0393701).toFixed(3) : '—',
    calculation_formula: calculatorResult.formula || '—'
  }];
}

/**
 * Prepare field blocks data for export
 */
export function prepareFieldBlocksExportData(fieldBlocks: any[] = []): FieldBlockExportData[] {
  return fieldBlocks.map(block => ({
    location: block.locationName || '—',
    field_block_id: block.id || '—',
    field_name: block.name || '—',
    crop_assignments: JSON.stringify(block.crops || []),
    area_acres: block.area || '—',
    irrigation_system: block.irrigationSystem || '—',
    efficiency_percent: block.efficiency ? `${block.efficiency}%` : '—',
    flow_rate_gpm: block.flowRate || '—',
    notes: block.notes || '—',
    created_date: block.createdAt ? new Date(block.createdAt).toLocaleDateString() : '—',
    last_updated: block.updatedAt ? new Date(block.updatedAt).toLocaleDateString() : '—'
  }));
}

/**
 * Comprehensive export function with all data types
 */
export function exportComprehensiveData(
  locations: LocationWithWeather[],
  options: ComprehensiveExportOptions,
  additionalData: {
    cmisData?: Map<string, any[]>;
    cropInstances?: any[];
    selectedCrops?: string[];
    calculatorResult?: any;
    calculatorInputs?: any;
    selectedLocation?: any;
    fieldBlocks?: any[];
  } = {}
) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const {
    cmisData,
    cropInstances = [],
    selectedCrops = [],
    calculatorResult,
    calculatorInputs,
    selectedLocation,
    fieldBlocks = []
  } = additionalData;

  // Handle special chart export formats
  if (options.fileFormat === 'charts-excel') {
    exportChartsToExcel(locations, selectedCrops, cropInstances);
    return;
  }

  if (options.fileFormat === 'html') {
    exportChartsAsHTML(locations, selectedCrops, cropInstances, {
      calculatorResult,
      calculatorInputs,
      fieldBlocks
    });
    return;
  }

  if (options.fileFormat === 'csv') {
    // Export separate CSV files for each data type
    if (options.includeWeatherData) {
      if (options.includeCMISData && cmisData) {
        const comprehensiveWeatherData = prepareComprehensiveWeatherData(locations, cmisData);
        const csv = convertToCSV(comprehensiveWeatherData);
        downloadFile(csv, `comprehensive-weather-data-${timestamp}.csv`, 'text/csv');
      } else {
        const weatherData = prepareWeatherExportData(locations);
        const csv = convertToCSV(weatherData);
        downloadFile(csv, `weather-data-${timestamp}.csv`, 'text/csv');
      }
    }

    if (options.includeCropData && selectedCrops.length > 0) {
      const cropData = prepareCropExportData(locations, cropInstances, selectedCrops);
      const csv = convertToCSV(cropData);
      downloadFile(csv, `crop-data-${timestamp}.csv`, 'text/csv');
    }

    if (options.includeCalculatorResults && calculatorResult) {
      const calculatorData = prepareCalculatorExportData(calculatorResult, calculatorInputs, selectedLocation);
      const csv = convertToCSV(calculatorData);
      downloadFile(csv, `calculator-results-${timestamp}.csv`, 'text/csv');
    }

    if (options.includeFieldBlocks && fieldBlocks.length > 0) {
      const fieldBlockData = prepareFieldBlocksExportData(fieldBlocks);
      const csv = convertToCSV(fieldBlockData);
      downloadFile(csv, `field-blocks-${timestamp}.csv`, 'text/csv');
    }
  } else {
    // Export as Excel with multiple sheets
    const workbook = XLSX.utils.book_new();

    if (options.includeWeatherData) {
      if (options.includeCMISData && cmisData) {
        const comprehensiveWeatherData = prepareComprehensiveWeatherData(locations, cmisData);
        const worksheet = XLSX.utils.json_to_sheet(comprehensiveWeatherData);
        XLSX.utils.book_append_sheet(workbook, worksheet, "Weather & CMIS Data");
      } else {
        const weatherData = prepareWeatherExportData(locations);
        const worksheet = XLSX.utils.json_to_sheet(weatherData);
        XLSX.utils.book_append_sheet(workbook, worksheet, "Weather Data");
      }
    }

    if (options.includeCropData && selectedCrops.length > 0) {
      const cropData = prepareCropExportData(locations, cropInstances, selectedCrops);
      const worksheet = XLSX.utils.json_to_sheet(cropData);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Crop Calculations");
    }

    if (options.includeCalculatorResults && calculatorResult) {
      const calculatorData = prepareCalculatorExportData(calculatorResult, calculatorInputs, selectedLocation);
      const worksheet = XLSX.utils.json_to_sheet(calculatorData);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Calculator Results");
    }

    if (options.includeFieldBlocks && fieldBlocks.length > 0) {
      const fieldBlockData = prepareFieldBlocksExportData(fieldBlocks);
      const worksheet = XLSX.utils.json_to_sheet(fieldBlockData);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Field Blocks");
    }

    // Generate and download the Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `comprehensive-report-${timestamp}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

/**
 * Download a file with given content
 */
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}