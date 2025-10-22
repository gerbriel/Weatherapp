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
    if (!location.weatherData) return null;

    const daily = location.weatherData.daily;
    const dates = daily.time.slice(0, 14); // 14 days
    const precipitation = daily.precipitation_sum.slice(0, 14);
    const rain = daily.rain_sum.slice(0, 14);
    // Convert ET₀ from mm to inches (1 mm = 0.0393701 inches)
    const et0 = daily.et0_fao_evapotranspiration.slice(0, 14).map((value: number) => value * 0.0393701);

    // Format dates for display (Oct 21, Oct 22, etc.)
    const labels = dates.map(date => {
      const d = new Date(date);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    return { labels, precipitation, rain, et0 };
  }, [location.weatherData]);

  if (!chartData) return null;

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
          color: 'rgb(203, 213, 225)', // text-slate-300
          font: {
            size: 12,
          },
        },
      },
      title: {
        display: true,
        text: 'Precipitation Forecast (14 Days)',
        color: 'rgb(241, 245, 249)', // text-slate-100
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(30, 41, 59, 0.95)', // slate-800
        titleColor: 'rgb(241, 245, 249)',
        bodyColor: 'rgb(203, 213, 225)',
        borderColor: 'rgba(71, 85, 105, 0.5)',
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
          color: 'rgba(71, 85, 105, 0.3)',
        },
        ticks: {
          color: 'rgb(148, 163, 184)', // text-slate-400
          font: {
            size: 11,
          },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(71, 85, 105, 0.3)',
        },
        ticks: {
          color: 'rgb(148, 163, 184)',
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
          color: 'rgb(203, 213, 225)',
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
          color: 'rgb(203, 213, 225)',
          font: {
            size: 12,
          },
        },
      },
      title: {
        display: true,
        text: 'Evapotranspiration (ET₀) Forecast',
        color: 'rgb(241, 245, 249)',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        titleColor: 'rgb(241, 245, 249)',
        bodyColor: 'rgb(203, 213, 225)',
        borderColor: 'rgba(71, 85, 105, 0.5)',
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
          color: 'rgba(71, 85, 105, 0.3)',
        },
        ticks: {
          color: 'rgb(148, 163, 184)',
          font: {
            size: 11,
          },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(71, 85, 105, 0.3)',
        },
        ticks: {
          color: 'rgb(148, 163, 184)',
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
          color: 'rgb(203, 213, 225)',
          font: {
            size: 12,
          },
        },
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Precipitation Forecast Chart */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <div className="h-80">
          <Bar data={precipitationData} options={precipitationOptions} />
        </div>
      </div>

      {/* ET₀ Forecast Chart */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <div className="h-80">
          <Line data={et0Data} options={et0Options} />
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
  // Convert ET₀ from mm to inches (1 mm = 0.0393701 inches)
  const et0 = daily.et0_fao_evapotranspiration.slice(0, 14).map((value: number) => value * 0.0393701);

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