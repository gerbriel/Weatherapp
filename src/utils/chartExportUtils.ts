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
  _cropInstances: any[] = []
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

    if (selectedCrops.length > 0) {
      // Generate Kc values for different crops and growth stages
      const generateKcValues = (cropName: string) => {
        // Simplified Kc coefficient progression for different crops
        const kcProfiles: { [key: string]: number[] } = {
          'Tomatoes': [0.6, 0.8, 1.15, 1.15, 1.15, 0.9, 0.8, 0.7, 0.65, 0.6, 0.6, 0.65, 0.7, 0.75],
          'Corn': [0.3, 0.5, 0.8, 1.2, 1.2, 1.15, 1.1, 1.0, 0.95, 0.9, 0.8, 0.75, 0.7, 0.65],
          'Wheat': [0.4, 0.6, 0.8, 1.15, 1.15, 1.1, 1.0, 0.9, 0.8, 0.7, 0.6, 0.55, 0.5, 0.45],
          'Lettuce': [0.7, 0.8, 0.9, 1.0, 1.0, 0.95, 0.9, 0.85, 0.8, 0.75, 0.7, 0.65, 0.6, 0.6],
          'Alfalfa': [0.4, 0.6, 0.85, 1.2, 1.2, 1.15, 1.1, 1.05, 1.0, 0.95, 0.9, 0.85, 0.8, 0.75]
        };
        
        // Default Kc progression if crop not found
        const defaultKc = [0.5, 0.7, 0.9, 1.1, 1.15, 1.1, 1.0, 0.95, 0.9, 0.85, 0.8, 0.75, 0.7, 0.65];
        
        return kcProfiles[cropName] || defaultKc;
      };

      // Calculate crop-specific data
      const cropCalculations = selectedCrops.map((cropName, index) => {
        const colors = ['#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#3B82F6', '#F97316', '#84CC16'];
        const color = colors[index % colors.length];
        const kcValues = generateKcValues(cropName);
        
        const etcData = et0Inches.map((et0, dayIndex) => {
          const kc = kcValues[dayIndex] || kcValues[kcValues.length - 1];
          return Number((et0 * kc).toFixed(3));
        });
        
        return {
          cropName,
          color,
          kcValues,
          etcData,
          datasets: {
            etc: {
              label: `${cropName} ETc`,
              data: etcData,
              borderColor: color,
              backgroundColor: `${color}33`,
              fill: false,
              tension: 0.3,
              pointBackgroundColor: color,
              pointBorderColor: color
            },
            kc: {
              label: `${cropName} Kc`,
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
  }
) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const chartDataMap = generateComprehensiveChartUrls(locations, selectedCrops, cropInstances);

  let htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Comprehensive Weather Report - ${new Date().toLocaleDateString()}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          background: #f8f9fa;
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
          padding: 30px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .location-section {
          margin-bottom: 50px;
          background: white;
          padding: 30px;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .chart-container {
          margin: 30px 0;
          text-align: center;
        }
        .chart-image {
          max-width: 100%;
          border-radius: 8px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
          margin: 20px 0;
        }
        .chart-title {
          color: #2563eb;
          margin-bottom: 15px;
          font-size: 1.3em;
        }
        .weather-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 20px;
          margin: 30px 0;
        }
        .stat-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
        }
        .stat-label {
          font-size: 0.875rem;
          color: #64748b;
          text-transform: uppercase;
          font-weight: 600;
          margin-bottom: 8px;
        }
        .stat-value {
          font-size: 1.5rem;
          font-weight: bold;
          color: #1e293b;
        }
        .forecast-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          font-size: 0.875rem;
          overflow-x: auto;
          display: block;
          white-space: nowrap;
        }
        .forecast-table thead {
          background: #f1f5f9;
        }
        .forecast-table th, .forecast-table td {
          border: 1px solid #d1d5db;
          padding: 8px 12px;
          text-align: left;
        }
        .forecast-table th {
          font-weight: 600;
          color: #374151;
          text-transform: uppercase;
          font-size: 0.75rem;
        }
        .forecast-table tbody tr:nth-child(even) {
          background: #f9fafb;
        }
        .data-sources-panel {
          background: #dbeafe;
          border: 1px solid #93c5fd;
          border-radius: 8px;
          padding: 20px;
          margin: 30px 0;
        }
        .data-sources-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 15px;
          margin-top: 15px;
        }
        .data-source-card {
          background: white;
          border: 1px solid #93c5fd;
          border-radius: 6px;
          padding: 15px;
        }
        .crop-summary {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 8px;
          padding: 20px;
          margin: 30px 0;
        }
        .crop-summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-top: 15px;
        }
        h1 { color: #1e40af; font-size: 2.5em; margin-bottom: 10px; }
        h2 { color: #1e40af; border-bottom: 3px solid #3b82f6; padding-bottom: 10px; }
        h3 { color: #374151; margin-top: 30px; }
        h4 { color: #374151; margin-top: 20px; margin-bottom: 10px; }
        .metadata {
          background: #f1f5f9;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .footer {
          text-align: center;
          margin-top: 50px;
          padding: 20px;
          background: #e5e7eb;
          border-radius: 8px;
          color: #6b7280;
        }
        @media print {
          body { background: white; }
          .location-section { page-break-inside: avoid; }
          .forecast-table { display: table; white-space: normal; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📊 Comprehensive Weather Charts Report</h1>
        <div class="metadata">
          <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Locations:</strong> ${locations.map(loc => loc.name).join(', ')}</p>
          <p><strong>Report Period:</strong> 14-Day Forecast</p>
          ${selectedCrops.length > 0 ? `<p><strong>Selected Crops:</strong> ${selectedCrops.join(', ')}</p>` : ''}
        </div>
      </div>
  `;

  // Data Sources Information Panel
  htmlContent += `
    <div class="data-sources-panel">
      <h4 style="color: #1e40af; margin-bottom: 15px;">📡 Data Sources & APIs</h4>
      <div class="data-sources-grid">
        <div class="data-source-card">
          <div style="font-weight: 600; color: #1e40af; margin-bottom: 8px;">🌤️ Weather Data</div>
          <div style="font-size: 0.875rem; color: #6b7280;">
            <strong>API:</strong> Open-Meteo Forecast<br/>
            <strong>Data:</strong> Temperature, precipitation, wind, humidity<br/>
            <strong>Coverage:</strong> GFS Global forecast
          </div>
        </div>
        <div class="data-source-card">
          <div style="font-weight: 600; color: #059669; margin-bottom: 8px;">💧 Evapotranspiration</div>
          <div style="font-size: 0.875rem; color: #6b7280;">
            <strong>API:</strong> Open-Meteo ET₀<br/>
            <strong>Method:</strong> FAO-56 Penman-Monteith<br/>
            <strong>Type:</strong> Reference evapotranspiration
          </div>
        </div>
        <div class="data-source-card">
          <div style="font-weight: 600; color: #7c3aed; margin-bottom: 8px;">🌾 Crop Coefficients</div>
          <div style="font-size: 0.875rem; color: #6b7280;">
            <strong>Source:</strong> FAO-56 Guidelines<br/>
            <strong>Enhancement:</strong> CMIS API (CA only)<br/>
            <strong>Analysis:</strong> ETC = ET₀ × Kc
          </div>
        </div>
      </div>
    </div>
  `;

  // Crop Management Summary (if any crop data exists)
  if (selectedCrops.length > 0 || cropInstances.length > 0 || additionalData?.calculatorResult || (additionalData?.fieldBlocks && additionalData.fieldBlocks.length > 0)) {
    htmlContent += `
      <div class="crop-summary">
        <h4 style="color: #059669; margin-bottom: 15px;">🌱 Crop Management Summary</h4>
        <div class="crop-summary-grid">
    `;

    if (selectedCrops.length > 0) {
      htmlContent += `
        <div>
          <h5 style="margin-bottom: 10px;">Active Crops (${selectedCrops.length})</h5>
          <ul style="margin: 0; padding-left: 20px;">
            ${selectedCrops.slice(0, 10).map(crop => `<li>${crop}</li>`).join('')}
            ${selectedCrops.length > 10 ? `<li><em>+${selectedCrops.length - 10} more crops</em></li>` : ''}
          </ul>
        </div>
      `;
    }

    if (cropInstances.length > 0) {
      htmlContent += `
        <div>
          <h5 style="margin-bottom: 10px;">Active Plantings (${cropInstances.length})</h5>
          <ul style="margin: 0; padding-left: 20px;">
            ${cropInstances.slice(0, 5).map(instance => `
              <li>
                <strong>${instance.cropId}</strong><br/>
                <small>Planted: ${new Date(instance.plantingDate).toLocaleDateString()}</small>
                ${instance.fieldName ? `<br/><small>Field: ${instance.fieldName}</small>` : ''}
              </li>
            `).join('')}
            ${cropInstances.length > 5 ? `<li><em>+${cropInstances.length - 5} more plantings</em></li>` : ''}
          </ul>
        </div>
      `;
    }

    if (additionalData?.fieldBlocks && additionalData.fieldBlocks.length > 0) {
      const fieldBlocks = additionalData.fieldBlocks;
      htmlContent += `
        <div>
          <h5 style="margin-bottom: 10px;">Field Blocks (${fieldBlocks.length})</h5>
          <ul style="margin: 0; padding-left: 20px;">
            ${fieldBlocks.slice(0, 5).map(block => `
              <li>
                <strong>${block.name}</strong><br/>
                <small>${block.crop_name} • ${block.acres} acres • ${block.status}</small>
                ${block.address ? `<br/><small>${block.address}</small>` : ''}
              </li>
            `).join('')}
            ${fieldBlocks.length > 5 ? `<li><em>+${fieldBlocks.length - 5} more blocks</em></li>` : ''}
          </ul>
        </div>
      `;
    }

    if (additionalData?.calculatorResult) {
      const calc = additionalData.calculatorResult;
      htmlContent += `
        <div>
          <h5 style="margin-bottom: 10px;">Current Calculation</h5>
          <div style="font-size: 0.875rem;">
            <div><strong>Daily Water Need:</strong> ${calc.dailyWaterNeed?.toFixed(1) || 'N/A'} gal</div>
            <div><strong>Runtime:</strong> ${calc.runtimeHours || 0}h ${calc.runtimeMinutes || 0}m</div>
            <div><strong>Efficiency:</strong> ${calc.efficiency || 'N/A'}%</div>
            ${additionalData.calculatorInputs?.crop ? `<div><strong>Crop:</strong> ${additionalData.calculatorInputs.crop}</div>` : ''}
          </div>
        </div>
      `;
    }

    htmlContent += '</div></div>';
  }

  chartDataMap.forEach((data, locationId) => {
    const location = locations.find(loc => loc.id === locationId);
    if (!location) return;

    // Generate today's weather stats
    const todayData = generateTodayStats(location);
    
    // Generate 14-day forecast data
    const forecastData = generate14DayForecast(location);

    htmlContent += `
      <div class="location-section">
        <h2>🌍 ${location.name}</h2>
        <p style="color: #6b7280; margin-bottom: 20px;">
          📍 ${location.latitude?.toFixed(4) || 'N/A'}, ${location.longitude?.toFixed(4) || 'N/A'} • 
          NCEP GFS Seamless Model
        </p>

        <!-- Today's Weather Stats Grid -->
        <h3>📅 Today's Weather Stats</h3>
        <div class="weather-stats-grid">
          <div class="stat-card">
            <div class="stat-label">🌡️ High</div>
            <div class="stat-value">${todayData.tempMax}°F</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">🌡️ Low</div>
            <div class="stat-value">${todayData.tempMin}°F</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">💧 Precip</div>
            <div class="stat-value">${todayData.precipitation} in</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">🌱 ET₀</div>
            <div class="stat-value">${Number(todayData.et0).toFixed(2)} inches</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">📊 ET₀ Sum</div>
            <div class="stat-value">${Number(todayData.et0_sum).toFixed(2)} inches</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">🌾 ETC Actual</div>
            <div class="stat-value">${todayData.etcActual}</div>
          </div>
        </div>

        <!-- 14-Day Forecast Table -->
        <h3>📈 14-Day Forecast Data</h3>
        <div style="overflow-x: auto;">
          <table class="forecast-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>High (°F)</th>
                <th>Low (°F)</th>
                <th>Precip (in)</th>
                <th>ET₀ Projected (in)</th>
                <th>ET₀ Sum (inches)</th>
                <th>ETC Actual (in)</th>
              </tr>
            </thead>
            <tbody>
              ${forecastData.map((day) => `
                <tr>
                  <td style="font-weight: 600;">${day.formattedDate}</td>
                  <td><strong>${day.tempMax}°</strong></td>
                  <td>${day.tempMin}°</td>
                  <td>${day.precipitation}</td>
                  <td>${Number(day.et0).toFixed(2)}</td>
                  <td>${Number(day.et0_sum).toFixed(2)}</td>
                  <td>🌾 ${day.etcActual}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Weather Charts -->
        <div class="chart-container">
          <h3 class="chart-title">💧 Precipitation Forecast (14 Days)</h3>
          <img src="${data.chartImageUrls.precipitationUrl}" 
               alt="Precipitation Chart for ${location.name}" 
               class="chart-image" />
          <p><em>Shows total precipitation and rain amounts for the next 14 days</em></p>
        </div>

        <div class="chart-container">
          <h3 class="chart-title">🌱 Evapotranspiration (ET₀) Forecast</h3>
          <img src="${data.chartImageUrls.et0Url}" 
               alt="ET0 Chart for ${location.name}" 
               class="chart-image" />
          <p><em>Daily reference evapotranspiration rates for irrigation planning</em></p>
        </div>
    `;

    // Enhanced Agricultural Charts for ETC, ETO, and Kc
    if (selectedCrops.length > 0) {
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
    }

    htmlContent += '</div>';
  });

  htmlContent += `
      <div class="footer">
        <p>📊 Charts generated using QuickChart.io • 🌐 Data from Open-Meteo Weather API</p>
        <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
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
  exportChartsAsHTML(locations, selectedCrops, cropInstances);
  
  // Provide user instructions
  alert('📊 Chart report generated!\n\n' +
        '✅ The HTML report will download automatically\n' +
        '🖨️ To create a PDF: Open the HTML file → Print → Save as PDF\n' +
        '📱 The report is mobile-friendly and print-optimized');
}