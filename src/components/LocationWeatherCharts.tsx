import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import type { LocationWithWeather } from '../types/weather';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

interface WeatherChartsProps {
  location: LocationWithWeather;
}

export const WeatherCharts: React.FC<WeatherChartsProps> = ({ location }) => {
  const chartData = useMemo(() => {
    if (!location.weatherData) {
      return null;
    }

    const daily = location.weatherData.daily;
    
    if (!daily) {
      return null;
    }
    
    const dates = daily.time.slice(0, 14); // 14 days
    const precipitation = daily.precipitation_sum.slice(0, 14);
    const rain = daily.rain_sum.slice(0, 14);
    // API already returns ET₀ in inches (precipitation_unit: 'inch' in weatherService)
    const et0 = daily.et0_fao_evapotranspiration.slice(0, 14);

    // Format dates for display (Oct 21, Oct 22, etc.)
    const labels = dates.map(date => {
      const d = new Date(date);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    const result = { labels, precipitation, rain, et0 };
    return result;
  }, [location.weatherData]);

  if (!chartData) {
    return (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
        <strong>No weather data available</strong> for {location?.name}. Please refresh the location data.
      </div>
    );
  }

  // Precipitation Forecast Chart (Bar Chart)
  const precipitationData = {
    labels: chartData.labels,
    datasets: [
      {
        label: 'Total Precipitation',
        data: chartData.precipitation,
        backgroundColor: 'rgba(59, 130, 246, 0.8)', // Blue
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
      {
        label: 'Rain',
        data: chartData.rain,
        backgroundColor: 'rgba(34, 197, 94, 0.8)', // Green
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1,
      }
    ],
  };

  const precipitationOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#374151', // Better visibility for both themes
          font: {
            size: 12,
          },
        },
      },
      title: {
        display: false, // We'll use the HTML title instead
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: 'rgb(255, 255, 255)',
        bodyColor: 'rgb(229, 231, 235)',
        borderColor: 'rgba(107, 114, 128, 0.5)',
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ${context.parsed.y.toFixed(2)} inches`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(107, 114, 128, 0.3)',
        },
        ticks: {
          color: '#374151',
          font: {
            size: 11,
          },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(107, 114, 128, 0.3)',
        },
        ticks: {
          color: '#374151',
          font: {
            size: 11,
          },
          callback: function(value: any) {
            return `${value}"`;
          }
        },
        title: {
          display: true,
          text: 'Inches',
          color: '#374151',
          font: {
            size: 12,
          },
        },
      },
    },
  };

  // ET₀ Forecast Chart (Line Chart)
  const et0Data = {
    labels: chartData.labels,
    datasets: [
      {
        label: 'Daily ET₀',
        data: chartData.et0,
        borderColor: 'rgba(251, 146, 60, 1)', // Orange
        backgroundColor: 'rgba(251, 146, 60, 0.1)',
        pointBackgroundColor: 'rgba(251, 146, 60, 1)',
        pointBorderColor: 'rgba(251, 146, 60, 1)',
        pointHoverBackgroundColor: 'rgba(251, 146, 60, 0.8)',
        pointHoverBorderColor: 'rgba(251, 146, 60, 1)',
        tension: 0.3,
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      }
    ],
  };

  const et0Options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#374151',
          font: {
            size: 12,
          },
        },
      },
      title: {
        display: false, // We'll use the HTML title instead
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: 'rgb(255, 255, 255)',
        bodyColor: 'rgb(229, 231, 235)',
        borderColor: 'rgba(107, 114, 128, 0.5)',
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            return `Daily ET₀: ${context.parsed.y.toFixed(3)} inches`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(107, 114, 128, 0.3)',
        },
        ticks: {
          color: '#374151',
          font: {
            size: 11,
          },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(107, 114, 128, 0.3)',
        },
        ticks: {
          color: '#374151',
          font: {
            size: 11,
          },
          callback: function(value: any) {
            return `${value} inches`;
          }
        },
        title: {
          display: true,
          text: 'inches',
          color: '#374151',
          font: {
            size: 12,
          },
        },
      },
    },
  };

  return (
    <div className="space-y-6">
      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        📈 Weather Charts - Debug Mode
      </h4>
      
      {/* Debug Info */}
      <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
        <p><strong>Debug Info:</strong></p>
        <p>Location: {location?.name}</p>
        <p>Chart Data Labels: {chartData.labels.length} items</p>
        <p>Precipitation Data: {chartData.precipitation.length} items</p>
        <p>ET0 Data: {chartData.et0.length} items</p>
      </div>
      
      {/* Simple Test Chart */}
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-4 shadow-sm">
        <h5 className="text-md font-medium text-gray-900 dark:text-white mb-3">
          Test Chart (Simple Data)
        </h5>
        <div className="h-40 relative bg-gray-50 dark:bg-gray-700 rounded">
          {(() => {
            try {
              const testData = {
                labels: ['A', 'B', 'C'],
                datasets: [{
                  label: 'Test',
                  data: [1, 2, 3],
                  backgroundColor: 'rgba(59, 130, 246, 0.8)',
                }]
              };
              const testOptions = {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
              };
              return <Bar data={testData} options={testOptions} />;
            } catch (error) {
              console.error('❌ Test chart error:', error);
              return <div className="flex items-center justify-center h-full text-red-500">Test Chart Error: {String(error)}</div>;
            }
          })()}
        </div>
      </div>
      
      {/* Precipitation Forecast Chart */}
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-4 shadow-sm">
        <h5 className="text-md font-medium text-gray-900 dark:text-white mb-3">
          Precipitation Forecast (14 Days)
        </h5>
        <div className="h-80 relative bg-gray-50 dark:bg-gray-700 rounded">
          {(() => {
            try {
              return <Bar data={precipitationData} options={precipitationOptions} />;
            } catch (error) {
              console.error('❌ Precipitation chart error:', error);
              return (
                <div className="flex items-center justify-center h-full text-red-500">
                  <p>Precipitation Chart Error: {String(error)}</p>
                </div>
              );
            }
          })()}
        </div>
      </div>

      {/* ET₀ Forecast Chart */}
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-4 shadow-sm">
        <h5 className="text-md font-medium text-gray-900 dark:text-white mb-3">
          Reference Evapotranspiration (ET₀) Forecast
        </h5>
        <div className="h-80 relative bg-gray-50 dark:bg-gray-700 rounded">
          {(() => {
            try {
              return <Line data={et0Data} options={et0Options} />;
            } catch (error) {
              console.error('❌ ET0 chart error:', error);
              return (
                <div className="flex items-center justify-center h-full text-red-500">
                  <p>ET₀ Chart Error: {String(error)}</p>
                </div>
              );
            }
          })()}
        </div>
      </div>
    </div>
  );
};

// Helper function to generate chart data for emails (returns data objects for server-side chart generation)
export const generateEmailChartData = (location: LocationWithWeather) => {
  if (!location.weatherData) return null;

  const daily = location.weatherData.daily;
  const dates = daily.time.slice(0, 14);
  const precipitation = daily.precipitation_sum.slice(0, 14);
  const rain = daily.rain_sum.slice(0, 14);
  // API already returns ET₀ in inches (precipitation_unit: 'inch' in weatherService)
  const et0 = daily.et0_fao_evapotranspiration.slice(0, 14);

  // Format dates for display
  const labels = dates.map(date => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });

  return {
    labels,
    precipitation: {
      type: 'bar',
      title: `Precipitation Forecast (14 Days) - ${location.name}`,
      datasets: [
        { label: 'Total Precipitation', data: precipitation, color: '#3B82F6' },
        { label: 'Rain', data: rain, color: '#22C55E' }
      ]
    },
    et0: {
      type: 'line',
      title: `Evapotranspiration (ET₀) Forecast - ${location.name}`,
      datasets: [
        { label: 'Daily ET₀', data: et0, color: '#FB923C' }
      ]
    }
  };
};