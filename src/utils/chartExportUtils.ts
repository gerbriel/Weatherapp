import * as XLSX from 'xlsx';
import type { LocationWithWeather } from '../types/weather';

/**
 * Chart Export Utilities
 * Handles exporting charts as images and data for comprehensive reports
 */

// Chart configuration interfaces
interface ChartConfig {
  type: string;
  data: any;
  options: any;
}

interface ChartExportData {
  chartImageUrls: {
    precipitationUrl: string;
    et0Url: string;
    cropETcUrl?: string;
    etcEtoComparisonUrl?: string;
    kcCoefficientUrl?: string;
  };
  chartData: {
    precipitation: any[];
    et0: any[];
    cropETc?: any[];
  };
}

/**
 * Generate QuickChart.io URLs for weather and crop charts
 */
export function generateComprehensiveChartUrls(
  locations: LocationWithWeather[],
  selectedCrops: string[] = [],
  cropInstances: any[] = []
): Map<string, ChartExportData> {
  const chartDataMap = new Map<string, ChartExportData>();

  locations.forEach(location => {
    if (!location.weatherData?.daily) return;

    const daily = location.weatherData.daily;
    
    // Find today's date to determine the proper 14-day range (7 past + 7 future including today)
    const today = new Date().toISOString().split('T')[0];
    const allDates = daily.time || [];
    const todayIdx = allDates.findIndex((d: string) => d >= today);
    
    // Calculate start and end indices for 7 days past + today + 6 days future = 14 days total
    let startIdx = 0;
    let endIdx = Math.min(14, allDates.length);
    
    if (todayIdx !== -1) {
      // Start from 7 days before today (not including today in the count back)
      startIdx = Math.max(0, todayIdx - 7);
      // End at today + 6 more days = 14 days total (7 past, today, 6 future)
      endIdx = Math.min(todayIdx + 7, allDates.length);
    }
    
    const dates = allDates.slice(startIdx, endIdx);
    const precipitation = (daily.precipitation_sum || []).slice(startIdx, endIdx);
    const rain = (daily.rain_sum || []).slice(startIdx, endIdx);
    const et0Values = (daily.et0_fao_evapotranspiration || []).slice(startIdx, endIdx);

    // Format dates for chart labels
    const labels = dates.map(date => {
      const d = new Date(date);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    // API already returns ET0 in inches
    const et0Inches = et0Values.map(value => Number(value.toFixed(3)));

    // Precipitation Chart Configuration
    const precipitationChart: ChartConfig = {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Total Precipitation',
            data: precipitation,
            backgroundColor: '#3B82F6',
            borderColor: '#3B82F6',
            borderWidth: 1
          },
          {
            label: 'Rain',
            data: rain,
            backgroundColor: '#22C55E',
            borderColor: '#22C55E',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: `Precipitation Forecast (14 Days) - ${location.name}`,
            font: { size: 16 },
            color: '#1F2937'
          },
          legend: {
            position: 'bottom',
            labels: { font: { size: 12 } }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Inches' },
            ticks: { color: '#374151' }
          },
          x: {
            title: { display: true, text: 'Date' },
            ticks: { color: '#374151' }
          }
        }
      }
    };

    // ET₀ Chart Configuration
    const et0Chart: ChartConfig = {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Daily ET₀',
            data: et0Inches,
            borderColor: '#F59E0B',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            fill: true,
            tension: 0.3,
            pointBackgroundColor: '#F59E0B',
            pointBorderColor: '#F59E0B'
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: `Evapotranspiration (ET₀) Forecast - ${location.name}`,
            font: { size: 16 },
            color: '#1F2937'
          },
          legend: {
            position: 'bottom',
            labels: { font: { size: 12 } }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Inches' },
            ticks: { color: '#374151' }
          },
          x: {
            title: { display: true, text: 'Date' },
            ticks: { color: '#374151' }
          }
        }
      }
    };

    // Generate URLs
    const precipitationUrl = `https://quickchart.io/chart?width=800&height=400&chart=${encodeURIComponent(JSON.stringify(precipitationChart))}`;
    const et0Url = `https://quickchart.io/chart?width=800&height=400&chart=${encodeURIComponent(JSON.stringify(et0Chart))}`;

    // Enhanced Agricultural Charts (ETC, ETO, Kc)
    let etcEtoComparisonUrl: string | undefined;
    let kcCoefficientUrl: string | undefined;
    let cropETcUrl: string | undefined;
    let cropETcData: any[] | undefined;

    // Use all selected crops for each location chart (instead of just location-specific crops)
    // This ensures all crop lines appear on every chart
    const allCropTypes = selectedCrops.length > 0 ? selectedCrops : 
      Array.from(new Set(cropInstances.map(crop => crop.cropId)));
    
    if (allCropTypes.length > 0) {
      // Generate Kc values for different crops and growth stages
      const generateKcValues = (cropName: string) => {
        // Simplified Kc coefficient progression for different crops
        const kcProfiles: { [key: string]: number[] } = {
          'tomatoes': [0.6, 0.8, 1.15, 1.15, 1.15, 0.9, 0.8, 0.7, 0.65, 0.6, 0.6, 0.65, 0.7, 0.75],
          'corn': [0.3, 0.5, 0.8, 1.2, 1.2, 1.15, 1.1, 1.0, 0.95, 0.9, 0.8, 0.75, 0.7, 0.65],
          'wheat': [0.4, 0.6, 0.8, 1.15, 1.15, 1.1, 1.0, 0.9, 0.8, 0.7, 0.6, 0.55, 0.5, 0.45],
          'lettuce': [0.7, 0.8, 0.9, 1.0, 1.0, 0.95, 0.9, 0.85, 0.8, 0.75, 0.7, 0.65, 0.6, 0.6],
          'alfalfa': [0.4, 0.6, 0.85, 1.2, 1.2, 1.15, 1.1, 1.05, 1.0, 0.95, 0.9, 0.85, 0.8, 0.75]
        };
        
        // Default Kc progression if crop not found
        const defaultKc = [0.5, 0.7, 0.9, 1.1, 1.15, 1.1, 1.0, 0.95, 0.9, 0.85, 0.8, 0.75, 0.7, 0.65];
        
        return kcProfiles[cropName.toLowerCase()] || defaultKc;
      };

      // Calculate crop-specific data
      const cropCalculations = allCropTypes.map((cropName, index) => {
        const colors = ['#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#3B82F6', '#F97316', '#84CC16'];
        const color = colors[index % colors.length];
        const kcValues = generateKcValues(cropName);
        
        const etcData = et0Inches.map((et0, dayIndex) => {
          const kc = kcValues[dayIndex] || kcValues[kcValues.length - 1];
          return Number((et0 * kc).toFixed(3));
        });
        
        // Format crop name for display (capitalize first letter)
        const displayName = cropName.charAt(0).toUpperCase() + cropName.slice(1);
        
        return {
          cropName: displayName,
          color,
          kcValues,
          etcData,
          datasets: {
            etc: {
              label: `${displayName} ETc`,
              data: etcData,
              borderColor: color,
              backgroundColor: `${color}33`,
              fill: false,
              tension: 0.3,
              pointBackgroundColor: color,
              pointBorderColor: color
            },
            kc: {
              label: `${displayName} Kc`,
              data: kcValues,
              borderColor: color,
              backgroundColor: 'transparent',
              fill: false,
              tension: 0.3,
              pointBackgroundColor: color,
              pointBorderColor: color
            }
          }
        };
      });

      // ETC vs ETO Comparison Chart
      const etcEtoChart: ChartConfig = {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'ET₀ (Reference)',
              data: et0Inches,
              borderColor: '#6B7280',
              backgroundColor: 'rgba(107, 114, 128, 0.1)',
              borderWidth: 3,
              borderDash: [8, 4],
              fill: false,
              tension: 0.3,
              pointRadius: 4,
              pointBackgroundColor: '#6B7280',
              pointBorderColor: '#6B7280'
            },
            ...cropCalculations.map(crop => ({
              ...crop.datasets.etc,
              borderWidth: 2,
              pointRadius: 3
            }))
          ]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: `ETC (Crop) vs ET₀ (Reference) Comparison - ${location.name}`,
              font: { size: 16, weight: 'bold' },
              color: '#1F2937'
            },
            legend: {
              position: 'bottom',
              labels: { 
                font: { size: 11 },
                padding: 15,
                usePointStyle: true
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              title: { 
                display: true, 
                text: 'Water Requirement (inches/day)',
                font: { size: 13, weight: 'bold' }
              },
              ticks: { 
                color: '#374151',
                font: { size: 11 }
              },
              grid: {
                color: 'rgba(107, 114, 128, 0.2)'
              }
            },
            x: {
              title: { 
                display: true, 
                text: 'Date',
                font: { size: 13, weight: 'bold' }
              },
              ticks: { 
                color: '#374151',
                font: { size: 11 }
              },
              grid: {
                color: 'rgba(107, 114, 128, 0.2)'
              }
            }
          },
          elements: {
            point: {
              hoverRadius: 6
            }
          }
        }
      };

      // Kc Coefficient Chart
      const kcChart: ChartConfig = {
        type: 'line',
        data: {
          labels: labels,
          datasets: cropCalculations.map(crop => ({
            ...crop.datasets.kc,
            borderWidth: 3,
            pointRadius: 4
          }))
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: `Crop Coefficients (Kc) Over Time - ${location.name}`,
              font: { size: 16, weight: 'bold' },
              color: '#1F2937'
            },
            legend: {
              position: 'bottom',
              labels: { 
                font: { size: 11 },
                padding: 15,
                usePointStyle: true
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 1.4,
              title: { 
                display: true, 
                text: 'Crop Coefficient (Kc)',
                font: { size: 13, weight: 'bold' }
              },
              ticks: { 
                color: '#374151',
                font: { size: 11 },
                stepSize: 0.2
              },
              grid: {
                color: 'rgba(107, 114, 128, 0.2)'
              }
            },
            x: {
              title: { 
                display: true, 
                text: 'Date',
                font: { size: 13, weight: 'bold' }
              },
              ticks: { 
                color: '#374151',
                font: { size: 11 }
              },
              grid: {
                color: 'rgba(107, 114, 128, 0.2)'
              }
            }
          },
          elements: {
            point: {
              hoverRadius: 6
            }
          }
        }
      };

      // Generate URLs
      etcEtoComparisonUrl = `https://quickchart.io/chart?width=900&height=450&chart=${encodeURIComponent(JSON.stringify(etcEtoChart))}`;
      kcCoefficientUrl = `https://quickchart.io/chart?width=900&height=450&chart=${encodeURIComponent(JSON.stringify(kcChart))}`;
      
      // Legacy crop chart for backward compatibility
      const legacyChart: ChartConfig = {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'ET₀ Reference',
              data: et0Inches,
              borderColor: '#9CA3AF',
              backgroundColor: 'transparent',
              borderDash: [5, 5],
              fill: false,
              pointRadius: 0
            },
            ...cropCalculations.map(crop => crop.datasets.etc)
          ]
        },
        options: etcEtoChart.options
      };

      cropETcUrl = `https://quickchart.io/chart?width=800&height=400&chart=${encodeURIComponent(JSON.stringify(legacyChart))}`;
      
      // Prepare detailed crop data for export
      cropETcData = labels.map((date, index) => {
        const dataPoint: any = {
          date,
          et0_reference: et0Inches[index]
        };
        
        cropCalculations.forEach(crop => {
          dataPoint[`${crop.cropName}_Kc`] = crop.kcValues[index] || crop.kcValues[crop.kcValues.length - 1];
          dataPoint[`${crop.cropName}_ETc`] = crop.etcData[index];
        });
        
        return dataPoint;
      });
    }

    chartDataMap.set(location.id, {
      chartImageUrls: {
        precipitationUrl,
        et0Url,
        ...(cropETcUrl && { cropETcUrl }),
        ...(etcEtoComparisonUrl && { etcEtoComparisonUrl }),
        ...(kcCoefficientUrl && { kcCoefficientUrl })
      },
      chartData: {
        precipitation: labels.map((date, index) => ({
          date,
          total_precipitation: precipitation[index] || 0,
          rain: rain[index] || 0
        })),
        et0: labels.map((date, index) => ({
          date,
          et0_inches: et0Inches[index] || 0,
          et0_mm: et0Values[index] || 0
        })),
        ...(cropETcData && { cropETc: cropETcData })
      }
    });
  });

  return chartDataMap;
}

/**
 * Export charts to Excel with embedded images and data
 */
export async function exportChartsToExcel(
  locations: LocationWithWeather[],
  selectedCrops: string[] = [],
  cropInstances: any[] = []
) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const workbook = XLSX.utils.book_new();
  const chartDataMap = generateComprehensiveChartUrls(locations, selectedCrops, cropInstances);

  // Create Chart URLs sheet
  const chartUrls: any[] = [];
  chartDataMap.forEach((data, locationId) => {
    const location = locations.find(loc => loc.id === locationId);
    if (!location) return;

    chartUrls.push({
      location: location.name,
      precipitation_chart_url: data.chartImageUrls.precipitationUrl,
      et0_reference_chart_url: data.chartImageUrls.et0Url,
      ...(data.chartImageUrls.etcEtoComparisonUrl && { etc_vs_eto_comparison_url: data.chartImageUrls.etcEtoComparisonUrl }),
      ...(data.chartImageUrls.kcCoefficientUrl && { kc_coefficient_chart_url: data.chartImageUrls.kcCoefficientUrl }),
      ...(data.chartImageUrls.cropETcUrl && { legacy_crop_etc_chart_url: data.chartImageUrls.cropETcUrl })
    });
  });

  if (chartUrls.length > 0) {
    const chartUrlsWorksheet = XLSX.utils.json_to_sheet(chartUrls);
    chartUrlsWorksheet['!cols'] = [
      { wch: 20 }, // location
      { wch: 50 }, // precipitation_chart_url
      { wch: 50 }, // et0_chart_url
      { wch: 50 }  // crop_etc_chart_url
    ];
    XLSX.utils.book_append_sheet(workbook, chartUrlsWorksheet, "Chart URLs");
  }

  // Create individual data sheets for each location
  chartDataMap.forEach((data, locationId) => {
    const location = locations.find(loc => loc.id === locationId);
    if (!location) return;

    // Precipitation data sheet
    const precipWorksheet = XLSX.utils.json_to_sheet(data.chartData.precipitation);
    XLSX.utils.book_append_sheet(workbook, precipWorksheet, `${location.name} - Precipitation`.substring(0, 31));

    // ET₀ data sheet
    const et0Worksheet = XLSX.utils.json_to_sheet(data.chartData.et0);
    XLSX.utils.book_append_sheet(workbook, et0Worksheet, `${location.name} - ET0`.substring(0, 31));

    // Crop ETc data sheet (if available)
    if (data.chartData.cropETc) {
      const cropWorksheet = XLSX.utils.json_to_sheet(data.chartData.cropETc);
      XLSX.utils.book_append_sheet(workbook, cropWorksheet, `${location.name} - Crops`.substring(0, 31));
    }
  });

  // Generate and download Excel file
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `weather-charts-and-data-${timestamp}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Helper function to generate today's weather stats
 */
function generateTodayStats(location: LocationWithWeather): any {
  if (!location.weatherData?.daily) {
    return {
      tempMax: '—',
      tempMin: '—', 
      precipitation: '0.00',
      et0: 0,
      et0_sum: 0,
      etcActual: 'CA Only'
    };
  }

  const weather = location.weatherData.daily;
  return {
    tempMax: weather.temperature_2m_max?.[0]?.toFixed(0) || '—',
    tempMin: weather.temperature_2m_min?.[0]?.toFixed(0) || '—',
    precipitation: weather.precipitation_sum?.[0]?.toFixed(2) || '0.00',
    et0: weather.et0_fao_evapotranspiration?.[0] || 0, // API already returns in inches
    et0_sum: weather.et0_fao_evapotranspiration_sum?.[0] || 0,
    etcActual: 'CA Only' // Placeholder for CMIS data
  };
}

/**
 * Helper function to generate 14-day forecast data
 */
function generate14DayForecast(
  location: LocationWithWeather,
  reportMode: 'current' | 'future' | 'historical' = 'current',
  futureStartDate?: string,
  forecastPreset?: 'today' | '7day',
  dateRange?: { startDate: string; endDate: string },
  cmisData?: Map<string, any[]>
): any[] {
  if (!location.weatherData?.daily) {
    // Generate mock forecast data for trial locations
    const mockDays = [];
    const startDate = new Date();
    
    for (let i = 0; i < 14; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const baseTemp = 75;
      const tempVariation = Math.sin(i * 0.5) * 8 + Math.random() * 4;
      const highTemp = Math.round(baseTemp + tempVariation + 5);
      const lowTemp = Math.round(baseTemp + tempVariation - 10);
      
      // Generate ET0 in inches (0.15-0.27 range)
      const et0_inches = 0.15 + Math.random() * 0.12;
      const et0_sum_inches = (i + 1) * 0.2; // Cumulative average
      
      mockDays.push({
        formattedDate: date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          weekday: 'short'
        }),
        tempMax: highTemp,
        tempMin: lowTemp,
        precipitation: Math.random() < 0.2 ? (Math.random() * 0.5).toFixed(2) : '0.00',
        et0: et0_inches,
        et0_sum: et0_sum_inches,
        etcActual: 'CA Only'
      });
    }
    return mockDays;
  }

  const weather = location.weatherData.daily;
  
  // Determine date range based on report mode
  const today = new Date().toISOString().split('T')[0];
  const allDates = weather.time || [];
  let startIdx = 0;
  let endIdx = allDates.length;
  
  if (reportMode === 'current') {
    // Current mode: Show 7 days before today + 7 days after (14 days total)
    const todayIdx = allDates.findIndex((d: string) => d >= today);
    
    if (todayIdx === -1) {
      startIdx = 0;
      endIdx = Math.min(14, allDates.length);
    } else {
      startIdx = Math.max(0, todayIdx - 7);
      const daysToShow = forecastPreset === 'today' ? 1 : 14;
      endIdx = Math.min(startIdx + daysToShow, allDates.length);
    }
  } else if (reportMode === 'future') {
    // Future mode: Show 7 days before selected date + 7 days after (14 days total)
    let futureTargetDate: string;
    if (futureStartDate) {
      futureTargetDate = futureStartDate;
    } else {
      const future = new Date();
      future.setDate(future.getDate() + 7);
      futureTargetDate = future.toISOString().split('T')[0];
    }
    
    const targetIdx = allDates.findIndex((d: string) => d >= futureTargetDate);
    
    if (targetIdx === -1) {
      startIdx = Math.min(7, allDates.length - 14);
      endIdx = Math.min(startIdx + 14, allDates.length);
    } else {
      startIdx = Math.max(0, targetIdx - 7);
      const daysToShow = forecastPreset === 'today' ? 1 : 14;
      endIdx = Math.min(startIdx + daysToShow, allDates.length);
    }
  } else if (reportMode === 'historical') {
    // Historical mode: Use custom date range
    if (dateRange?.startDate && dateRange?.endDate) {
      startIdx = allDates.findIndex((d: string) => d >= dateRange.startDate);
      if (startIdx === -1) startIdx = 0;
      endIdx = allDates.findIndex((d: string) => d > dateRange.endDate);
      if (endIdx === -1) endIdx = allDates.length;
    }
  }
  
  const dates = allDates.slice(startIdx, endIdx);
  
  console.log('🔥 FINAL EXPORT DATA for', location.name, {
    reportMode,
    dates: dates,
    firstDate: dates[0],
    lastDate: dates[dates.length - 1]
  });
  
  // Get CIMIS data for this location if available
  const locationCmisData = cmisData?.get(location.id) || [];
  
  const result = dates.map((date: string, i: number) => {
    const index = startIdx + i; // Actual index in the full array
    // Fix timezone issue: append 'T12:00:00' to ensure midday local time
    const formattedDate = new Date(date + 'T12:00:00').toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      weekday: 'short'
    });
    
    // Get OpenMeteo forecast data (always available)
    const et0_forecast = weather.et0_fao_evapotranspiration?.[index] || 0;
    
    // Try to get CIMIS actual data for past/current dates
    let et0_actual = null;
    let hasActualData = false;
    
    if (date <= today) {
      const cimisDay = locationCmisData.find(d => d.date === date);
      if (cimisDay && cimisDay.etc_actual !== undefined && cimisDay.etc_actual !== null) {
        et0_actual = cimisDay.etc_actual; // CIMIS data in inches
        hasActualData = true;
      }
    }
    
    if (i === 0) {
      console.log('🔥 FIRST ROW DATA:', {
        rawDate: date,
        formattedDate: formattedDate,
        index: index,
        et0_actual,
        et0_forecast,
        hasActualData
      });
    }
    
    return {
      formattedDate: formattedDate,
      date: date,
      tempMax: weather.temperature_2m_max?.[index]?.toFixed(0) || '—',
      tempMin: weather.temperature_2m_min?.[index]?.toFixed(0) || '—',
      precipitation: weather.precipitation_sum?.[index]?.toFixed(2) || '0.00',
      et0: et0_forecast, // OpenMeteo forecast
      et0_actual: et0_actual, // CIMIS actual (null if not available)
      et0_forecast: et0_forecast, // OpenMeteo forecast
      hasActualData: hasActualData,
      et0_sum: weather.et0_fao_evapotranspiration_sum?.[index] || 0,
      etcActual: 'CA Only' // Placeholder for CMIS data
    };
  });
  
  return result;
}

/**
 * Export charts as HTML report with embedded images
 */
export async function exportChartsAsHTML(
  locations: LocationWithWeather[],
  selectedCrops: string[] = [],
  cropInstances: any[] = [],
  additionalData?: {
    calculatorResult?: any;
    calculatorInputs?: any;
    fieldBlocks?: any[];
    insights?: {
      weather?: string;
      crop?: string;
      cropComparison?: string;
      general?: string;
    } | Map<string, { weather: string; crop: string; cropComparison: string; general: string; }>;
    cropWeeklySummaries?: Record<string, string>;
    waterUseNotes?: string;
    reportMode?: 'current' | 'future' | 'historical';
    futureStartDate?: string;
    forecastPreset?: 'today' | '7day';
    dateRange?: {
      startDate: string;
      endDate: string;
    };
    cmisData?: Map<string, any[]>;
  }
) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const chartDataMap = generateComprehensiveChartUrls(locations, selectedCrops, cropInstances);
  
  // Helper function to get insights for a specific location
  const getLocationInsights = (locationId: string) => {
    if (!additionalData?.insights) return null;
    
    if (additionalData.insights instanceof Map) {
      return additionalData.insights.get(locationId) || { weather: '', crop: '', cropComparison: '', general: '' };
    } else {
      // For backward compatibility with combined insights
      return additionalData.insights;
    }
  };

  let htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Comprehensive Weather Report - ${new Date().toLocaleDateString()}</title>
      <style>
        * {
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #353750;
          font-size: 16px;
          max-width: 100%;
          margin: 0;
          padding: 0;
          background: #F9FAFB;
        }
        .hero {
          background: url('https://image.email.netafim.com/lib/fe3a11717564047b751776/m/1/7cee6a62-4ac9-433b-9c17-94bae07295f7.png');
          background-size: contain;
          background-repeat: no-repeat;
          background-position: center top;
          padding: 0;
          margin: 0;
          text-align: center;
          color: #FFFFFF;
          width: 100%;
          min-height: 400px;
          height: auto;
        }
        .hero h2 {
          font-size: 32px;
          font-weight: 700;
          margin: 0 0 12px 0;
          padding: 0;
          color: #FFFFFF;
          letter-spacing: -0.5px;
        }
        .hero p {
          font-size: 18px;
          font-weight: 400;
          margin: 0;
          color: rgba(255,255,255,0.95);
          line-height: 1.5;
          max-width: 800px;
          margin: 0 auto;
        }
        .content-wrapper {
          max-width: 800px;
          margin: 0 auto;
          padding: 30px 20px;
        }
        .metadata {
          background: #FFFFFF;
          padding: 25px 30px;
          border-radius: 12px;
          margin: -30px auto 40px;
          max-width: 760px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.1);
          border: 1px solid #E5E7EB;
          font-size: 14px;
          position: relative;
          z-index: 2;
        }
        .metadata p {
          margin: 8px 0;
          color: #414042;
        }
        .location-section {
          margin-bottom: 50px;
          background: #FFFFFF;
          padding: 40px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          border: 1px solid #E5E7EB;
        }
        .chart-container {
          margin: 25px 0;
        }
        .chart-image {
          max-width: 100%;
          border-radius: 8px;
          border: 1px solid #E5E7EB;
          margin: 15px 0;
        }
        .weather-stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
          margin: 25px 0;
        }
        .stat-card {
          background: #F9FAFB;
          border: 2px solid #0A7DD6;
          border-radius: 10px;
          padding: 20px 16px;
          text-align: center;
          transition: transform 0.2s;
        }
        .stat-label {
          font-size: 14px;
          color: #353750;
          text-transform: uppercase;
          font-weight: 600;
          margin-top: 8px;
          letter-spacing: 0.5px;
        }
        .stat-value {
          font-size: 28px;
          font-weight: bold;
          color: #0A7DD6;
          line-height: 1;
        }
        .forecast-table {
          width: 100%;
          border-collapse: collapse;
          margin: 0;
          font-size: 14px;
          background: white;
        }
        .forecast-table thead {
          background: #F9FAFB;
        }
        .forecast-table th {
          border: 1px solid #E5E7EB;
          padding: 12px 16px;
          text-align: left;
          font-weight: 600;
          color: #353750;
          text-transform: uppercase;
          font-size: 13px;
          letter-spacing: 0.3px;
        }
        .forecast-table td {
          border: 1px solid #E5E7EB;
          padding: 12px 16px;
          text-align: left;
          color: #414042;
        }
        .forecast-table tbody tr:nth-child(even) {
          background: #F9FAFB;
        }
        .forecast-table tbody tr:hover {
          background: #F0F9FF;
        }
        h1 { 
          color: #0A7DD6; 
          font-size: 26px; 
          font-weight: 700;
          margin: 0 0 12px 0; 
          letter-spacing: -0.5px;
        }
        h2 { 
          color: #0A7DD6; 
          font-size: 22px; 
          font-weight: 700;
          margin: 0;
          padding: 0;
          border: none;
        }
        h3 { 
          color: #353750; 
          font-size: 18px; 
          font-weight: 600;
          margin-top: 25px; 
          margin-bottom: 15px;
        }
        h4 { 
          color: #353750; 
          font-size: 16px; 
          font-weight: 600;
          margin-top: 20px; 
          margin-bottom: 12px; 
        }
        .metadata {
          background: #F9FAFB;
          padding: 20px;
          border-radius: 8px;
          margin-top: 20px;
          border: 1px solid #E5E7EB;
          font-size: 14px;
        }
        .metadata p {
          margin: 8px 0;
          color: #414042;
        }
        .footer {
          text-align: center;
          margin-top: 50px;
          padding: 25px;
          background: #353750;
          border-radius: 12px;
          color: #FFFFFF;
        }
        .data-sources-panel {
          background: #F9FAFB;
          border: 1px solid #E5E7EB;
          border-radius: 12px;
          padding: 30px;
          margin: 30px 0;
        }
        .data-sources-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 20px;
          margin-top: 15px;
        }
        .data-source-card {
          background: #FFFFFF;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          padding: 20px;
        }
        .crop-summary {
          background: #F9FAFB;
          border: 1px solid #E5E7EB;
          border-radius: 12px;
          padding: 30px;
          margin: 30px 0;
        }
        .crop-summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 20px;
          margin-top: 15px;
        }
        @media (max-width: 768px) {
          body { 
            padding: 20px 15px; 
          }
          .header, .location-section {
            padding: 25px 20px;
          }
          .weather-stats-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          .forecast-table {
            font-size: 12px;
          }
          .forecast-table th,
          .forecast-table td {
            padding: 8px 10px;
          }
        }
        @media print {
          body { 
            background: white;
            max-width: 100%;
          }
          .location-section { 
            page-break-inside: avoid;
            box-shadow: none;
            border: 1px solid #E5E7EB;
          }
          .stat-card {
            break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <div class="hero">
      </div>
      ${additionalData?.waterUseNotes ? `
      <div style="max-width: 800px; margin: 20px auto; padding: 20px; background: #F9FAFB; border-radius: 8px;">
        <p style="font-size: 15px; color: #374151; margin: 0; line-height: 1.6; white-space: pre-wrap;">${additionalData.waterUseNotes}</p>
      </div>
      ` : ''}
      <div style="max-width: 800px; margin: 40px auto; padding: 0 20px;">
        <h2 style="font-size: 24px; font-weight: 600; color: #1F2937; margin: 0 0 12px 0;">${(() => {
          // Get the date range from the first location's forecast data
          const firstLocation = locations[0];
          const firstCrop = cropInstances.find(c => c.locationId === firstLocation.id);
          if (firstCrop && firstLocation.weatherData) {
            const forecastData = generate14DayForecast(
              firstLocation,
              additionalData?.reportMode || 'current',
              additionalData?.futureStartDate,
              additionalData?.forecastPreset || '7day',
              additionalData?.dateRange,
              additionalData?.cmisData
            );
            if (forecastData.length > 0) {
              const startDate = new Date(forecastData[0].date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              const endDate = new Date(forecastData[forecastData.length - 1].date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              return `${startDate} - ${endDate}`;
            }
          }
          return new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        })()}</h2>
        <p style="font-size: 16px; color: #4B5563; margin: 0; line-height: 1.6;">Today's Weather Stats, ET trends and irrigation updates for ${selectedCrops.length > 0 ? selectedCrops.join(', ') : 'selected crops'} across ${locations.map(loc => loc.name).join(', ')}</p>
      </div>
      <div class="content-wrapper">
  `;

  // Add comprehensive ET Summary - SEPARATE TABLE FOR EACH CROP
  htmlContent += `
    <h2 style="text-align: center; margin: 0 0 30px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 22px; color: #353750;">📊 Comprehensive ET Summary</h2>
  `;

  // Get unique crops
  const uniqueCrops = Array.from(new Set(cropInstances.map(c => c.cropId)));
  
  // Helper function to get crop color from palette
  const getCropColor = (cropName: string, index: number) => {
    const colors = [
      '#0A7DD6',  // Primary Blue
      '#5C9D6D',  // Green (Pantone 333 U)
      '#E97B6E',  // Coral (Pantone 2024 U)
      '#F4B942',  // Yellow (Pantone 135 U)
      '#C94D4A',  // Red (Pantone 1797 U)
      '#E6AAB8',  // Pink (Pantone 639 U)
      '#353750'   // Dark Navy
    ];
    return colors[index % colors.length];
  };
  
  // Helper function to get crop SVG icon
  const getCropSVG = (cropName: string) => {
    const lowerName = cropName.toLowerCase();
    
    if (lowerName === 'almonds') {
      return `<svg viewBox="0 0 55.03 55.61" style="width: 26px; height: auto; display: inline-block; vertical-align: middle;">
        <path d="M8.78,33.51c-.65-.35-1.26-.74-1.83-1.17-3.27-2.44-5.17-5.92-5.51-9.68-.34-3.73,1.08-7.55,3.77-11.2C15.42-2.42,49.21,2.08,50.32,2.15c.92.05,1.53.22,1.74.97.23.8-1.6,5.76-1.94,6.75-1.38,4.02-2.88,7.77-4.86,11.11-2.59,4.37-5.95,8.01-10.82,10.58M10.99,31.49c2.35-1.57,8.38-3.28,15.19-2.42,1.62.21,3.18.58,4.69,1.07l3.58,1.43c6.08,2.86,11.12,7.27,14.66,10.1,4.72,3.77,6.61,4.46,1.39,7.33-6.97,3.83-17.15,5.59-24.18,5.15-17.69-1.11-23.58-13.41-17.53-20.64,0,0,.83-1.1,2.21-2.01Z" 
              fill="none" stroke="#fff" stroke-miterlimit="10" stroke-width="2.8"/>
      </svg>`;
    } else if (lowerName === 'citrus') {
      return `<svg viewBox="0 0 63.27 57.61" style="width: 26px; height: auto; display: inline-block; vertical-align: middle;">
        <ellipse cx="41.91" cy="37.23" rx="19.96" ry="18.98" fill="none" stroke="#fff" stroke-miterlimit="10" stroke-width="2.8"/>
        <line x1="41.8" y1="29" x2="41.8" y2="45.46" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.8"/>
        <line x1="36.05" y1="31.38" x2="47.69" y2="43.02" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.8"/>
        <line x1="33.68" y1="37.13" x2="50.14" y2="37.13" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.8"/>
        <line x1="36.05" y1="42.87" x2="47.69" y2="31.23" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.8"/>
      </svg>`;
    } else if (lowerName === 'pistachios') {
      return `<svg viewBox="0 0 631.1 569.32" style="width: 26px; height: auto; display: inline-block; vertical-align: middle;">
        <path d="M210.6,403.13c-15.29,9.36-37.86,11.23-55.24,7.94-6.73-1.27-13.8-7.75-17.86-7.83-5.15-.1-8.85,5.71-16.46,5.11-9.03-.71-45.08-20.56-53.52-26.97C-64.57,280.99,8.32-5.76,189.23.09c3,.44,5.67,3.84,6.44,6.61,4.52,16.31-10.58,62.64-13.38,82.89-5.88,42.51-4.98,87.26-8.92,130.07L235.02,30.53c17.61-47.15,41.52-9.85,56.33,15.22,41.81,70.76,56.17,139.91,28.19,219.77,85.8-41.23,202.23-43.63,266.5,35.91,3.28,4.06,21.89,32.13,22.04,34.35s-2.95,6.81-4.72,8.64c-12.18,12.59-76.87,17.93-96.13,29.99l-98.83,43.02,193.35-28.73c60.84-4.28,10.92,57.65-5.91,80.07-66.13,88.11-151.37,114.49-259.63,93.98-50.87-9.64-122.37-34.85-111.25-99.39-3.96,1.21-14.35-4.26-14.35-7.2v-53.03ZM175.68,11.11C4.1,25.45-51.42,302.8,91.15,383.55c8.02,4.54,31.07,19.72,35.73,8.95,8.99-44.41,25.17-86.59,31.71-131.67,11.72-80.84,3.7-164.69,28.96-243.49-.78-8.1-5.67-6.74-11.87-6.22ZM260.33,306.67c15.78-15.32,40.8-24.47,49.12-44.04,29.75-69.95,10.51-146.71-25.7-209.29-5.2-8.99-19.87-36.48-31.49-34.45-47.09,118.37-77.73,243.08-113.33,365.56,8.48,25.12,52.14,21.5,68.78,8.62,5.45-4.22,19.32-43.4,27.5-55.62,6.12-9.14,17.41-23.29,25.12-30.78ZM594.7,340.04c6.53-7.59-30.91-48.09-38.63-54.51-115.87-96.26-367.02,1.82-333.97,169.21,41.15-12.56,84.04-15.77,125.41-27.93,83.43-24.51,159.55-74.15,247.19-86.78ZM620.5,400.28c-44.89,2.37-91.02,7.99-135.68,14.8-70.57,10.75-160.05,24.34-228.45,40.99-17.71,4.31-25.24,7.5-22.2,28.04,10.34,70.1,164.52,82.71,217.8,70.11,68.64-16.24,113.22-54.84,150.79-112.92,7.9-12.21,18.35-26.07,17.75-41.01Z" 
              fill="#fff"/>
      </svg>`;
    } else if (lowerName === 'grapes') {
      return `<svg viewBox="0 0 54.3 65.3" style="width: 26px; height: auto; display: inline-block; vertical-align: middle;">
        <circle cx="9.98" cy="20.11" r="8.58" fill="none" stroke="#fff" stroke-miterlimit="10" stroke-width="2.8"/>
        <circle cx="18.35" cy="37.71" r="8.58" fill="none" stroke="#fff" stroke-miterlimit="10" stroke-width="2.8"/>
        <circle cx="35.51" cy="37.71" r="8.58" fill="none" stroke="#fff" stroke-miterlimit="10" stroke-width="2.8"/>
        <circle cx="27.15" cy="20.11" r="8.58" fill="none" stroke="#fff" stroke-miterlimit="10" stroke-width="2.8"/>
        <circle cx="26.71" cy="55.32" r="8.58" fill="none" stroke="#fff" stroke-miterlimit="10" stroke-width="2.8"/>
        <circle cx="44.32" cy="20.11" r="8.58" fill="none" stroke="#fff" stroke-miterlimit="10" stroke-width="2.8"/>
        <line x1="27.37" y1="11.08" x2="27.37" y2="1.4" fill="none" stroke="#fff" stroke-linecap="round" stroke-miterlimit="10" stroke-width="2.8"/>
      </svg>`;
    } else if (lowerName === 'walnuts') {
      return `<svg viewBox="0 0 200.5 150.17" style="width: 26px; height: auto; display: inline-block; vertical-align: middle;">
        <path d="M61.09.22c7.39-1.54,7.54,5.23,11.9,7.7,2.93,1.66,7.86,2.14,11.35,3.65,7.94,3.43,14.51,8.31,20.66,14.34,17.46-9.66,39.41-13.73,58.61-6.61,3.51,1.3,8.4,4.92,11.47,5.53,4.12.83,11.64-1.17,14.35,2.65,2.14,3.02.17,8.92,1.17,12.83.55,2.16,4.3,7.33,5.52,10.48,22.72,58.77-47.72,122.61-103.26,90.61C16.98,182.55-32.67,68.1,25.35,20.54c10.13-8.3,20-7.82,27.4-12.6,2.61-1.68,3.87-6.79,8.34-7.72ZM62,5.13c-6.96,10.49-18.78,9.66-28.96,16.1-53.4,33.8-24.31,138.47,42.33,122.33,54.66-13.24,60.12-102.33,9.98-125.99-4.52-2.13-11.32-3.05-14.91-5.09-2.16-1.23-6.53-7.67-8.43-7.35ZM181.35,30.06c-7.87,1.72-12.11-3.26-18.73-5.77-17.03-6.44-38.45-3.74-53.78,5.75l6.19,8.91c4.3.03,18.68-4.4,15.36,3.64-2.34,1.46-12.86-.92-13.02,1.96,3.14,5.85,5.7,12.78,5.99,19.51,5.3-7.03,10.48-12.75,18.07-17.42,2.11-1.3,16.94-9.8,17.91-5.07-2.57,4.79-9.94,6.07-14.92,9.06-6.18,3.72-16.55,13.46-18.63,20.37-1.56,5.17.92,11.08-1.45,16.04l56.99-56.99ZM98.36,139.04c53.27,24.72,114.55-34.41,92.19-88.68-2.13-5.17-6.82-8.56-5.2-15.31l-61,60.49c-4.7,13.59-10.07,26.32-20,37-1.12,1.2-7.38,4.57-5.99,6.49Z" fill="#fff"/>
        <path d="M44.09,34.3c8.35-1.42,13.58,1.52,18.76,7.74,7.6-11.88,27.37-10.24,31.73,3.28,1.16,3.58.07,8.76,1.27,10.73.52.85,4.5,3.15,6.02,4.98,3.63,4.38,4.21,8.82,3.39,14.44-.52,3.53-3.56,6.58-3.72,8.24-.13,1.37,1.62,3.52,1.84,5.81.53,5.61.21,9.43-3.04,14.03-1.09,1.54-3.88,3.16-4.48,4.52-.93,2.12-.13,4.4-.74,6.26-4.89,15.01-23.36,17.44-32.27,4.74-7.98,12.09-28.09,10.41-32.08-3.94-.65-2.33,0-4.92-.94-7.06-2.03-4.58-8.68-5.6-8.52-15.46.05-3.2,2.94-7.83,2.86-8.9-.39-4.73-6.94-6.26-3.54-16.87,2.06-6.44,8.98-9.74,9.55-11.44.73-2.16-.1-5.83.39-8.61,1.06-6.06,7.64-11.49,13.51-12.49ZM34.08,103.32c2.47,2.19-.48,10.87,4.76,15.76,6.63,6.19,18.7,2.78,21.09-5.95l.37-63.5c-6.18-19.04-30.67-10.4-24.01,8.79-.72,2.18-14.18,4-11.11,16.28,2.1,8.38,4.95,3.69,10.55,6.5,4.83,2.42,8.4,13.22,3.1,12.63-2.45-.27-2.85-7.06-5.49-8.31l-2.26-.28c-6.14,2.06-5.4,11.81-1.29,15.91,1.62,1.61,3.55,1.53,4.29,2.19ZM83.36,75.06c4.71-1.18,4.54,2.59,7.01,4.47,7.77,5.92,12.54-6.72,8.86-13.85-2.06-3.99-9.1-5.14-9.78-7.3,6.4-18.28-16.99-27.84-23.86-9.59,1.45,19.35-2.8,43.95-.15,62.67,1.44,10.14,14.33,14.49,21.57,7.25,5.26-5.26,2.03-12.14,3.8-14.7,1.04-1.51,6.13-1.38,7.32-6.67,3.2-14.14-4.67-9.09-10.83-13.75-2.59-1.96-4.41-5.2-3.95-8.54Z" fill="#fff"/>
        <path d="M134.14,112.81c-1.51,2.01-4.57.4-4.72-2.21-.27-4.72,6.56-12.88,10.05-15.94,11.72-10.28,19.44-9.9,28.07-25.93,2.09-3.88,3.12-11.5,7.32-11.66,4.99,1.56-4.84,17.6-6.68,20.31-9.37,13.78-24.92,16.61-32.01,28.98-1.09,1.9-1.23,5.41-2.02,6.46Z" fill="#fff"/>
        <path d="M156,98.13l3.12,2.41c-6.13,9.8-27.78,32.73-40.01,30.34-3.43-.67-5.33-3.78-1.72-5.35,1.04-.45,5.08.34,8.21-.74,11.87-4.1,21.47-18.4,30.4-26.65Z" fill="#fff"/>
        <path d="M151.36,125.05c-.74-12.82,19.81-17.67,21.76-28.73.53-2.98-1.3-12.84,3.72-11.26,2.17.68,1.73,8.52,1.51,10.5-1.35,12.21-12.46,15.46-19.53,23.47-2.61,2.95-2.25,7.09-7.47,6.02Z" fill="#fff"/>
        <path d="M44.87,60.06c7.84-2.23,1.43,20.5-5.51,8.5,4.42-.75,3.74-8,5.51-8.5Z" fill="#fff"/>
        <path d="M50.26,107.96l-4.47-.9c2.41-5.12-7.97-6.35-3.46-9.54s11.49,5.73,7.93,10.44Z" fill="#fff"/>
        <path d="M81.26,95.15c4.99,5.46-5.44,14.76-7.82,10.81-2.23-3.7,2.76-4.46,3.48-5.91.88-1.78-2.67-6.04,4.34-4.91Z" fill="#fff"/>
        <path d="M81.2,65.9l-3.84.16c.58-4.39-.5-6.43-4.98-7.05,1.22-9.92,13.63.13,8.82,6.89Z" fill="#fff"/>
      </svg>`;
    } else {
      // Default generic crop icon for any crop without a specific icon
      return `<svg viewBox="0 0 100 60" style="width: 26px; height: auto; display: inline-block; vertical-align: middle;">
        <path d="M15 30 Q30 5 55 10 Q45 35 25 50 Q15 40 15 30 Z"
              fill="none" stroke="#fff" stroke-width="2.5"/>
        <path d="M55 10 Q75 20 82 35 Q70 50 50 52 Q45 35 55 10 Z"
              fill="none" stroke="#fff" stroke-width="2.5"/>
      </svg>`;
    }
  };
  
  // Create a separate table for each crop
  uniqueCrops.forEach((cropId, cropIndex) => {
    const cropName = cropId.charAt(0).toUpperCase() + cropId.slice(1);
    const cropSVG = getCropSVG(cropName);
    const cropColor = getCropColor(cropName, cropIndex);
    
    // Get locations that have this crop
    const cropsForThisCrop = cropInstances.filter(c => c.cropId === cropId);
    const locationsWithCrop = locations.filter(loc => 
      cropsForThisCrop.some(c => c.locationId === loc.id)
    );
    
    if (locationsWithCrop.length === 0) return;
    
    htmlContent += `
      <div style="margin: ${cropIndex > 0 ? '40px' : '0'} 0 20px 0;">
        <div style="display: inline-flex; align-items: center; gap: 8px; padding: 8px 18px 8px 12px; background: ${cropColor}; color: #fff; font-weight: 600; border-radius: 2px; clip-path: polygon(0 0, 92% 0, 100% 100%, 0 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 18px;">
          ${cropSVG}
          <span>${cropName}</span>
        </div>
      </div>
      
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 30px;">
        <tr>
          <td>
            <table width="100%" cellpadding="12" cellspacing="0" border="0" style="border: 1px solid #E5E7EB; border-collapse: collapse;">
              <!-- Header Row -->
              <tr style="background-color: #353750;">
                <th style="background-color: #353750; color: #FFFFFF; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; padding: 12px; border: 1px solid #4A4E69; text-align: left; font-weight: 600; text-transform: uppercase;">Location</th>
                <th style="background-color: #353750; color: #FFFFFF; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; padding: 12px; border: 1px solid #4A4E69; text-align: left; font-weight: 600; text-transform: uppercase;">Date</th>
                <th style="background-color: #353750; color: #FFFFFF; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; padding: 12px; border: 1px solid #4A4E69; text-align: center; font-weight: 600; text-transform: uppercase;">Kc</th>
                <th style="background-color: #353750; color: #FFFFFF; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; padding: 12px; border: 1px solid #4A4E69; text-align: center; font-weight: 600; text-transform: uppercase;">ET₀ Actual (in)</th>
                <th style="background-color: #353750; color: #FFFFFF; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; padding: 12px; border: 1px solid #4A4E69; text-align: center; font-weight: 600; text-transform: uppercase;">ET₀ Forecast (in)</th>
                <th style="background-color: #353750; color: #FFFFFF; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; padding: 12px; border: 1px solid #4A4E69; text-align: center; font-weight: 600; text-transform: uppercase;">ETc Actual (in)</th>
                <th style="background-color: #353750; color: #FFFFFF; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; padding: 12px; border: 1px solid #4A4E69; text-align: center; font-weight: 600; text-transform: uppercase;">ETc Forecast (in)</th>
                <th style="background-color: #353750; color: #FFFFFF; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; padding: 12px; border: 1px solid #4A4E69; text-align: center; font-weight: 600; text-transform: uppercase;">Water Need</th>
              </tr>
              <!-- Data Rows for this crop -->
              ${locationsWithCrop.map((loc, locIdx) => {
                const locForecast = generate14DayForecast(
                  loc,
                  additionalData?.reportMode || 'current',
                  additionalData?.futureStartDate,
                  additionalData?.forecastPreset,
                  additionalData?.dateRange,
                  additionalData?.cmisData
                );
                const cropInstance = cropsForThisCrop.find(c => c.locationId === loc.id);
                
                if (!cropInstance) return '';
                
                const kc = cropInstance.currentStage === 2 ? 1.15 : 
                          cropInstance.currentStage === 1 ? 0.70 : 0.50;
                
                // Show all 14 days (7 past + 7 future)
                const daysToShow = locForecast;
                
                // Determine today's index for actual vs forecast
                const today = new Date().toISOString().split('T')[0];
                const allDates = loc.weatherData?.daily?.time || [];
                const todayIdx = allDates.findIndex((d: string) => d >= today);
                
                return daysToShow.map((day, dayIdx) => {
                  // Get ET0 values from the day object (which now includes CIMIS data)
                  const et0_forecast_inches = Number(day.et0_forecast) || 0; // OpenMeteo forecast
                  const et0_actual_inches = day.et0_actual; // CIMIS actual (null if not available)
                  const hasActualData = day.hasActualData;
                  
                  // Calculate ETc values
                  const etc_forecast_inches = et0_forecast_inches * kc;
                  const etc_actual_inches = hasActualData && et0_actual_inches !== null ? et0_actual_inches * kc : null;
                  
                  // Format values for display
                  const et0Actual = et0_actual_inches !== null ? et0_actual_inches.toFixed(2) : '—';
                  const et0Forecast = et0_forecast_inches.toFixed(2);
                  const etcActual = etc_actual_inches !== null ? etc_actual_inches.toFixed(2) : '—';
                  const etcForecast = etc_forecast_inches.toFixed(2);
                  
                  // Determine water need category based on available data
                  const etc_for_need = etc_actual_inches !== null ? etc_actual_inches : etc_forecast_inches;
                  let waterNeedCategory = 'Low';
                  let waterNeedColor = '#10B981';
                  let waterNeedBg = '#D1FAE5';
                  
                  if (etc_for_need > 0.25) {
                    waterNeedCategory = 'High';
                    waterNeedColor = '#EF4444';
                    waterNeedBg = '#FEE2E2';
                  } else if (etc_for_need >= 0.15) {
                    waterNeedCategory = 'Med';
                    waterNeedColor = '#F59E0B';
                    waterNeedBg = '#FEF3C7';
                  }
                  
                  return `
                    <tr style="background-color: ${(locIdx * daysToShow.length + dayIdx) % 2 === 0 ? '#FFFFFF' : '#F3F4F6'};">
                      ${dayIdx === 0 ? `
                        <td rowspan="${daysToShow.length}" style="font-weight: 600; color: #353750; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; padding: 12px; border: 1px solid #E5E7EB; background-color: #E3F2FD; vertical-align: top;">
                          📍 ${loc.name}
                        </td>
                      ` : ''}
                      <td style="color: #4B5563; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; padding: 10px 12px; border: 1px solid #E5E7EB; text-align: left;">
                        ${day.formattedDate}
                      </td>
                      <td style="color: #353750; font-size: 14px; font-family: 'Courier New', monospace; padding: 10px 12px; border: 1px solid #E5E7EB; text-align: center; font-weight: 600;">${kc.toFixed(2)}</td>
                      <td style="color: #353750; font-size: 14px; font-family: 'Courier New', monospace; padding: 10px 12px; border: 1px solid #E5E7EB; text-align: center; font-weight: 600;">${et0Actual}</td>
                      <td style="color: #6B7280; font-size: 14px; font-family: 'Courier New', monospace; padding: 10px 12px; border: 1px solid #E5E7EB; text-align: center; font-weight: 600; font-style: italic;">${et0Forecast}</td>
                      <td style="color: #0A7DD6; font-size: 14px; font-family: 'Courier New', monospace; padding: 10px 12px; border: 1px solid #E5E7EB; text-align: center; font-weight: 700;">${etcActual}</td>
                      <td style="color: #0EA5E9; font-size: 14px; font-family: 'Courier New', monospace; padding: 10px 12px; border: 1px solid #E5E7EB; text-align: center; font-weight: 700; font-style: italic;">${etcForecast}</td>
                      <td style="padding: 10px 12px; border: 1px solid #E5E7EB; text-align: center;">
                        <span style="background-color: ${waterNeedBg}; color: ${waterNeedColor}; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; display: inline-block;">
                          ${waterNeedCategory}
                        </span>
                      </td>
                    </tr>
                  `;
                }).join('');
              }).join('')}
            </table>
          </td>
        </tr>
      </table>
      
      <!-- Average ETc Chart for this Crop -->
      ${(() => {
        // Calculate average ETc across all locations for this crop
        const dateMap = new Map();
        
        locationsWithCrop.forEach(loc => {
          const locForecast = generate14DayForecast(
            loc,
            additionalData?.reportMode || 'current',
            additionalData?.futureStartDate,
            additionalData?.forecastPreset,
            additionalData?.dateRange,
            additionalData?.cmisData
          );
          const cropInstance = cropsForThisCrop.find(c => c.locationId === loc.id);
          if (!cropInstance) return;
          
          const kc = cropInstance.currentStage === 2 ? 1.15 : 
                    cropInstance.currentStage === 1 ? 0.70 : 0.50;
          
          // Use next 7 days
          locForecast.slice(0, 7).forEach(day => {
            const et0_inches = Number(day.et0) || 0;
            const etc_inches = et0_inches * kc;
            
            const existing = dateMap.get(day.formattedDate) || { total: 0, count: 0 };
            dateMap.set(day.formattedDate, {
              total: existing.total + etc_inches,
              count: existing.count + 1
            });
          });
        });
        
        const chartData = Array.from(dateMap.entries()).map(([date, data]) => ({
          date,
          avgEtc: (data.total / data.count).toFixed(2)
        }));
        
        if (chartData.length === 0) return '';
        
        // Generate a simple SVG line chart
        const chartWidth = 700;
        const chartHeight = 250;
        const padding = { top: 40, right: 40, bottom: 50, left: 60 };
        const plotWidth = chartWidth - padding.left - padding.right;
        const plotHeight = chartHeight - padding.top - padding.bottom;
        
        const maxEtc = Math.max(...chartData.map(d => parseFloat(d.avgEtc)));
        const minEtc = 0;
        const yScale = plotHeight / (maxEtc - minEtc);
        const xScale = plotWidth / (chartData.length - 1);
        
        const points = chartData.map((d, i) => {
          const x = padding.left + (i * xScale);
          const y = chartHeight - padding.bottom - ((parseFloat(d.avgEtc) - minEtc) * yScale);
          return { x, y, value: d.avgEtc, date: d.date };
        });
        
        const pathData = points.map((p, i) => 
          i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`
        ).join(' ');
        
        return `
          <div style="margin: 20px 0; padding: 20px; background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px;">
            <h4 style="margin: 0 0 15px 0; font-size: 16px; font-weight: 600; color: #353750; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">
              📈 Average ETc Across All Locations
            </h4>
            <svg width="${chartWidth}" height="${chartHeight}" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">
              <!-- Grid lines -->
              ${Array.from({length: 6}, (_, i) => {
                const y = padding.top + (plotHeight / 5) * i;
                const value = (maxEtc - (maxEtc / 5) * i).toFixed(2);
                return `
                  <line x1="${padding.left}" y1="${y}" x2="${chartWidth - padding.right}" y2="${y}" 
                        stroke="#E5E7EB" stroke-width="1" stroke-dasharray="3,3"/>
                  <text x="${padding.left - 10}" y="${y + 5}" text-anchor="end" fill="#6B7280" font-size="11">${value}</text>
                `;
              }).join('')}
              
              <!-- X-axis labels -->
              ${points.map((p, i) => `
                <text x="${p.x}" y="${chartHeight - padding.bottom + 20}" 
                      text-anchor="middle" fill="#6B7280" font-size="11">${p.date}</text>
              `).join('')}
              
              <!-- Y-axis label -->
              <text x="${padding.left - 45}" y="${padding.top + plotHeight/2}" 
                    text-anchor="middle" fill="#6B7280" font-size="12" font-weight="600"
                    transform="rotate(-90, ${padding.left - 45}, ${padding.top + plotHeight/2})">
                ETc (inches)
              </text>
              
              <!-- Line -->
              <path d="${pathData}" stroke="#3B82F6" stroke-width="3" fill="none"/>
              
              <!-- Data points -->
              ${points.map(p => `
                <circle cx="${p.x}" cy="${p.y}" r="5" fill="#3B82F6" stroke="#FFFFFF" stroke-width="2"/>
              `).join('')}
              
              <!-- Title -->
              <text x="${chartWidth/2}" y="25" text-anchor="middle" fill="#353750" font-size="14" font-weight="600">
                Average ETc for ${cropName}
              </text>
            </svg>
            <p style="margin: 10px 0 0 0; font-size: 12px; color: #6B7280; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">
              Shows the average crop water use (ETc) across all ${locationsWithCrop.length} location${locationsWithCrop.length !== 1 ? 's' : ''} growing ${cropName.toLowerCase()}
            </p>
          </div>
        `;
      })()}
      
      <!-- Weekly Summary for this Crop -->
      ${additionalData?.cropWeeklySummaries?.[cropId] ? `
        <div style="margin: 20px 0; padding: 20px; background-color: #F0FDF4; border: 1px solid #86EFAC; border-radius: 8px;">
          <h4 style="margin: 0 0 10px 0; font-size: 15px; font-weight: 600; color: #166534; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">
            📝 Weekly Summary - ${cropName}
          </h4>
          <p style="margin: 0; font-size: 14px; color: #166534; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; white-space: pre-wrap;">
            ${additionalData.cropWeeklySummaries[cropId]}
          </p>
        </div>
      ` : ''}
    `;
  });

  // Now iterate through each location for detailed charts
  chartDataMap.forEach((data, locationId) => {
    const location = locations.find(loc => loc.id === locationId);
    if (!location) return;
  });

  // Add any remaining general insights at the bottom (backward compatibility)
  if (additionalData?.insights && !(additionalData.insights instanceof Map)) {
    if (additionalData.insights.general && additionalData.insights.general.trim()) {
      htmlContent += `
        <div class="insights-section" style="margin-top: 30px;">
          <h3 class="insights-title">📋 General Report Summary</h3>
          <div class="insight-item">
            <div class="insight-content" style="color: #374151; line-height: 1.6;">${additionalData.insights.general.replace(/\n/g, '<br>')}</div>
          </div>
        </div>
      `;
    }
  }

  htmlContent += `
      </div>
    </body>
    </html>
  `;

  // Download as HTML file
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `weather-charts-report-${timestamp}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Export charts as PDF (requires html2pdf library - alternative approach)
 * For now, this creates a print-friendly HTML that can be printed to PDF
 */
export function generatePrintableChartReport(
  locations: LocationWithWeather[],
  selectedCrops: string[] = [],
  cropInstances: any[] = []
) {
  // This will open the HTML report in a new window that's optimized for printing
  exportChartsAsHTML(locations, selectedCrops, cropInstances, {});
  
  // Provide user instructions
  alert('📊 Chart report generated!\n\n' +
        '✅ The HTML report will download automatically\n' +
        '🖨️ To create a PDF: Open the HTML file → Print → Save as PDF\n' +
        '📱 The report is mobile-friendly and print-optimized');
}