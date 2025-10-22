import * as XLSX from 'xlsx';
import type { LocationWithWeather } from '../types/weather';

export interface WeatherExportData {
  location: string;
  date: string;
  high_temp_f: number | string;
  low_temp_f: number | string;
  wind_speed_mph: number | string;
  precipitation_in: number | string;
  et0_mm: number | string;
}

export interface TodayExportData {
  location: string;
  high_temp_f: number | string;
  low_temp_f: number | string;
  wind_speed_mph: number | string;
  precipitation_in: number | string;
  et0_mm: number | string;
  et0_sum_mm: number | string;
}

/**
 * Convert locations data to exportable format for 14-day forecast
 */
export function prepareWeatherExportData(locations: LocationWithWeather[]): WeatherExportData[] {
  const exportData: WeatherExportData[] = [];

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
        et0_mm: et0[i] !== undefined ? Number(et0[i]).toFixed(2) : '—'
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
      et0_mm: daily.et0_fao_evapotranspiration?.[0] !== undefined ? Number(daily.et0_fao_evapotranspiration[0]).toFixed(2) : '—',
      et0_sum_mm: daily.et0_fao_evapotranspiration_sum?.[0] !== undefined ? Number(daily.et0_fao_evapotranspiration_sum[0]).toFixed(2) : '—'
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
      { wch: 12 }  // et0_mm
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
    { wch: 12 }  // et0_mm
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