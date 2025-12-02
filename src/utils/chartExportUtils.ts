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
    const dates = daily.time?.slice(0, 14) || [];
    const precipitation = daily.precipitation_sum?.slice(0, 14) || [];
    const rain = daily.rain_sum?.slice(0, 14) || [];
    const et0Values = daily.et0_fao_evapotranspiration?.slice(0, 14) || [];

    // Format dates for chart labels
    const labels = dates.map(date => {
      const d = new Date(date);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    // Convert ET0 from mm to inches
    const et0Inches = et0Values.map(value => Number((value * 0.0393701).toFixed(3)));

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
    et0: (weather.et0_fao_evapotranspiration?.[0] * 0.0393701) || 0,
    et0_sum: (weather.et0_fao_evapotranspiration_sum?.[0] * 0.0393701) || 0,
    etcActual: 'CA Only' // Placeholder for CMIS data
  };
}

/**
 * Helper function to generate 14-day forecast data
 */
function generate14DayForecast(location: LocationWithWeather): any[] {
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
      
      const et0_mm = 4 + Math.random() * 3;
      const et0_inches = et0_mm * 0.0393701;
      const et0_sum_inches = ((i + 1) * et0_mm * 0.0393701);
      
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
  const dates = weather.time?.slice(0, 14) || [];
  
  return dates.map((date: string, index: number) => ({
    formattedDate: new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      weekday: 'short'
    }),
    tempMax: weather.temperature_2m_max?.[index]?.toFixed(0) || '—',
    tempMin: weather.temperature_2m_min?.[index]?.toFixed(0) || '—',
    precipitation: weather.precipitation_sum?.[index]?.toFixed(2) || '0.00',
    et0: (weather.et0_fao_evapotranspiration?.[index] * 0.0393701) || 0,
    et0_sum: (weather.et0_fao_evapotranspiration_sum?.[index] * 0.0393701) || 0,
    etcActual: 'CA Only' // Placeholder for CMIS data
  }));
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
          background: linear-gradient(135deg, #0A7DD6 0%, #353750 100%);
          padding: 60px 40px;
          margin: 0;
          text-align: center;
          color: #FFFFFF;
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
        <h2>Weekly Snapshot</h2>
      </div>
      <div style="max-width: 800px; margin: 40px auto; padding: 0 20px;">
        <h2 style="font-size: 24px; font-weight: 600; color: #1F2937; margin: 0 0 12px 0;">Week of ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</h2>
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
    return `<svg viewBox="0 0 100 60" style="width: 26px; height: auto; display: inline-block; vertical-align: middle;">
      <path d="M15 30 Q30 5 55 10 Q45 35 25 50 Q15 40 15 30 Z"
            fill="none" stroke="#fff" stroke-width="2.5"/>
      <path d="M55 10 Q75 20 82 35 Q70 50 50 52 Q45 35 55 10 Z"
            fill="none" stroke="#fff" stroke-width="2.5"/>
    </svg>`;
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
                <th style="background-color: #353750; color: #FFFFFF; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; padding: 12px; border: 1px solid #4A4E69; text-align: center; font-weight: 600; text-transform: uppercase;">ET₀ (in)</th>
                <th style="background-color: #353750; color: #FFFFFF; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; padding: 12px; border: 1px solid #4A4E69; text-align: center; font-weight: 600; text-transform: uppercase;">ETc (in)</th>
                <th style="background-color: #353750; color: #FFFFFF; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; padding: 12px; border: 1px solid #4A4E69; text-align: center; font-weight: 600; text-transform: uppercase;">Water Need</th>
              </tr>
              <!-- Data Rows for this crop -->
              ${locationsWithCrop.map((loc, locIdx) => {
                const locForecast = generate14DayForecast(loc);
                const cropInstance = cropsForThisCrop.find(c => c.locationId === loc.id);
                
                if (!cropInstance) return '';
                
                const kc = cropInstance.currentStage === 2 ? 1.15 : 
                          cropInstance.currentStage === 1 ? 0.70 : 0.50;
                
                // Show next 7 days
                const daysToShow = locForecast.slice(0, 7);
                
                return daysToShow.map((day, dayIdx) => {
                  const et0_inches = Number(day.et0) || 0;
                  const etc_inches = et0_inches * kc;
                  
                  let waterNeedCategory = 'Low';
                  let waterNeedColor = '#10B981';
                  let waterNeedBg = '#D1FAE5';
                  
                  if (etc_inches > 0.25) {
                    waterNeedCategory = 'High';
                    waterNeedColor = '#EF4444';
                    waterNeedBg = '#FEE2E2';
                  } else if (etc_inches >= 0.15) {
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
                      <td style="color: #353750; font-size: 14px; font-family: 'Courier New', monospace; padding: 10px 12px; border: 1px solid #E5E7EB; text-align: center; font-weight: 600;">${et0_inches.toFixed(2)}</td>
                      <td style="color: #0A7DD6; font-size: 14px; font-family: 'Courier New', monospace; padding: 10px 12px; border: 1px solid #E5E7EB; text-align: center; font-weight: 700;">${etc_inches.toFixed(2)}</td>
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
    `;
  });

  // Now iterate through each location for detailed charts
  chartDataMap.forEach((data, locationId) => {
    const location = locations.find(loc => loc.id === locationId);
    if (!location) return;

    // Generate today's weather stats
    const todayData = generateTodayStats(location);
    
    // Generate 14-day forecast data
    const forecastData = generate14DayForecast(location);

    // Calculate week date range
    const weekStart = forecastData[0]?.formattedDate || 'N/A';
    const weekEnd = forecastData[forecastData.length - 1]?.formattedDate || 'N/A';
    
    htmlContent += `
      <div class="location-section">
        <!-- Header Section -->
        <div style="border-bottom: 2px solid #0A7DD6; padding-bottom: 20px; margin-bottom: 30px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                <div style="background: #E6F2FF; padding: 8px; border-radius: 8px;">
                  <span style="font-size: 24px;">💧</span>
                </div>
                <h2 style="margin: 0; border: none; padding: 0; text-align: left;">Weekly Irrigation Snapshot</h2>
              </div>
              <p style="color: #6b7280; margin: 0; font-size: 15px;">Week of ${weekStart}</p>
            </div>
            <div style="text-align: right;">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">Location</p>
              <p style="margin: 0; font-weight: bold; color: #353750; font-size: 19px;">${location.name}</p>
            </div>
          </div>
        </div>

        <!-- Today's Weather State -->
        <h3 style="text-align: left; font-size: 19px; color: #353750; margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">
          <span>☀️</span> Today's Weather State
        </h3>
        <div class="weather-stats-grid" style="margin-bottom: 30px;">
          <div class="stat-card" style="background: linear-gradient(135deg, #FFF5F5 0%, #FFE5E5 100%); border-color: #FF7D5E;">
            <div class="stat-value" style="color: #FF7D5E; font-size: 32px;">${todayData.tempMax}°F</div>
            <div class="stat-label" style="color: #353750; font-size: 14px;">Avg Temp</div>
          </div>
          <div class="stat-card" style="background: linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%); border-color: #0A7DD6;">
            <div class="stat-value" style="color: #0A7DD6; font-size: 32px;">${todayData.precipitation}"</div>
            <div class="stat-label" style="color: #353750; font-size: 14px;">Total Precip</div>
          </div>
          <div class="stat-card" style="background: linear-gradient(135deg, #F5F5F5 0%, #E5E5E5 100%); border-color: #6B7280;">
            <div class="stat-value" style="color: #353750; font-size: 32px;">--</div>
            <div class="stat-label" style="color: #353750; font-size: 14px;">Avg Wind</div>
          </div>
        </div>

        <!-- Week's Summary -->
        <div style="background: #F9FAFB; padding: 24px; border-radius: 8px; border: 1px solid #E5E7EB; margin-bottom: 30px;">
          <h3 style="text-align: left; font-size: 19px; color: #353750; margin-top: 0; margin-bottom: 12px;">Week's Summary</h3>
          <p style="color: #414042; line-height: 1.7; margin: 0; font-size: 16px;">
            ${location.name} experienced ${todayData.precipitation} inches of precipitation this period. 
            The average temperature ranged from ${todayData.tempMin}°F to ${todayData.tempMax}°F. 
            Reference evapotranspiration (ET₀) totaled ${Number(todayData.et0_sum).toFixed(2)} inches for the week.
            ${cropInstances.filter(c => c.locationId === location.id).length > 0 
              ? ` Currently tracking ${cropInstances.filter(c => c.locationId === location.id).length} active crop planting(s) at this location.`
              : ''}
          </p>
        </div>

        <!-- Charts Section -->
        <div style="margin-top: 30px;">
          <!-- Precipitation Chart -->
          <div class="chart-container" style="margin-bottom: 30px;">
            <h3 style="text-align: left; font-size: 17px; color: #353750; margin-bottom: 15px; font-weight: bold;">
              💧 Precipitation Forecast (7 Days)
            </h3>
            <img src="${data.chartImageUrls.precipitationUrl}" 
                 alt="Precipitation Chart for ${location.name}" 
                 class="chart-image" 
                 style="width: 100%; height: auto; border-radius: 8px; border: 1px solid #E5E7EB;" />
          </div>

          <!-- ET0 Chart -->
          <div class="chart-container" style="margin-bottom: 30px;">
            <h3 style="text-align: left; font-size: 17px; color: #353750; margin-bottom: 15px; font-weight: bold;">
              🌱 Reference Evapotranspiration (ET₀)
            </h3>
            <img src="${data.chartImageUrls.et0Url}" 
                 alt="ET0 Chart for ${location.name}" 
                 class="chart-image"
                 style="width: 100%; height: auto; border-radius: 8px; border: 1px solid #E5E7EB;" />
          </div>
        </div>
    `;

    // Add weather insights for this location
    const locationInsights = getLocationInsights(location.id);
    if (locationInsights && locationInsights.weather && locationInsights.weather.trim()) {
      htmlContent += `
        <div class="insight-item" style="margin: 20px 0; padding: 15px; background-color: #f8fafc; border-left: 4px solid #3b82f6; border-radius: 8px;">
          <div class="insight-label" style="font-weight: 600; color: #1f2937; margin-bottom: 8px;">🌤️ Weather Analysis - ${location.name}</div>
          <div class="insight-content" style="color: #374151; line-height: 1.6;">${locationInsights.weather.replace(/\n/g, '<br>')}</div>
        </div>
      `;
    }

    // Enhanced Agricultural Charts for ETC, ETO, and Kc
    const locationCrops = cropInstances.filter(crop => crop.locationId === location.id);
    // Show charts for all locations if there are any selected crops (not just location-specific crops)
    if (selectedCrops.length > 0 || locationCrops.length > 0) {
      if (data.chartImageUrls.etcEtoComparisonUrl) {
        htmlContent += `
          <div class="chart-container">
            <h3 class="chart-title">🌾 ETC (Crop) vs ET₀ (Reference) Comparison</h3>
            <img src="${data.chartImageUrls.etcEtoComparisonUrl}" 
                 alt="ETC vs ETO Comparison Chart for ${location.name}" 
                 class="chart-image" />
            <p><em><strong>ETC (Crop Water Requirement)</strong> vs <strong>ET₀ (Reference Evapotranspiration)</strong><br>
            Shows actual crop water needs compared to reference values for: ${selectedCrops.join(', ')}</em></p>
          </div>
        `;
      }

      if (data.chartImageUrls.kcCoefficientUrl) {
        htmlContent += `
          <div class="chart-container">
            <h3 class="chart-title">📊 Crop Coefficients (Kc) Over Time</h3>
            <img src="${data.chartImageUrls.kcCoefficientUrl}" 
                 alt="Kc Coefficient Chart for ${location.name}" 
                 class="chart-image" />
            <p><em><strong>Kc (Crop Coefficient)</strong> values showing how crop water needs change over growth stages<br>
            Higher Kc = More water needed. Lower Kc = Less water needed. Crops: ${selectedCrops.join(', ')}</em></p>
          </div>
        `;
      }

      // Legacy crop chart (if no enhanced charts available)
      if (!data.chartImageUrls.etcEtoComparisonUrl && data.chartImageUrls.cropETcUrl) {
        htmlContent += `
          <div class="chart-container">
            <h3 class="chart-title">🌾 Crop Water Requirements (ETc)</h3>
            <img src="${data.chartImageUrls.cropETcUrl}" 
                 alt="Crop ETc Chart for ${location.name}" 
                 class="chart-image" />
            <p><em>Crop-specific water requirements based on selected crops: ${selectedCrops.join(', ')}</em></p>
          </div>
        `;
      }
      
      // Add crop insights for this location
      if (locationInsights && locationInsights.crop && locationInsights.crop.trim()) {
        htmlContent += `
          <div class="insight-item" style="margin: 20px 0; padding: 15px; background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 8px;">
            <div class="insight-label" style="font-weight: 600; color: #1f2937; margin-bottom: 8px;">🌾 Crop Analysis - ${location.name}</div>
            <div class="insight-content" style="color: #374151; line-height: 1.6;">${locationInsights.crop.replace(/\n/g, '<br>')}</div>
          </div>
        `;
      }

      // Add crop comparison insights for this location
      if (locationInsights && locationInsights.cropComparison && locationInsights.cropComparison.trim()) {
        htmlContent += `
          <div class="insight-item" style="margin: 20px 0; padding: 15px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px;">
            <div class="insight-label" style="font-weight: 600; color: #1f2937; margin-bottom: 8px;">📊 ETC Comparison Analysis - ${location.name}</div>
            <div class="insight-content" style="color: #374151; line-height: 1.6;">${locationInsights.cropComparison.replace(/\n/g, '<br>')}</div>
          </div>
        `;
      }
    }

    htmlContent += '</div>';
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