import React from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface WeatherChartsProps {
  locationName: string;
}

export const WeatherCharts: React.FC<WeatherChartsProps> = ({ locationName }) => {
  // Generate 14-day forecast data
  const forecastData = React.useMemo(() => {
    const data = [];
    const today = new Date();
    
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const baseTemp = 75 + Math.sin(i * 0.3) * 5;
      data.push({
        date: date.toISOString().split('T')[0],
        displayDate: date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        }),
        high: Math.round(baseTemp + Math.random() * 10),
        low: Math.round(baseTemp - 15 + Math.random() * 5),
        wind: Math.round(3 + Math.random() * 7),
        precipitation: Math.random() * 0.1,
        et0: 0.004 + Math.random() * 0.002,
        et0Sum: 0.004 + Math.random() * 0.002
      });
    }
    return data;
  }, []);

  const precipitationChartData = {
    labels: forecastData.map(d => d.displayDate),
    datasets: [
      {
        label: 'Total Precipitation',
        data: forecastData.map(d => d.precipitation),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
      {
        label: 'Rain',
        data: forecastData.map(d => d.precipitation * 0.7),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1,
      }
    ]
  };

  const et0ChartData = {
    labels: forecastData.map(d => d.displayDate),
    datasets: [
      {
        label: 'Daily ET₀',
        data: forecastData.map(d => d.et0),
        borderColor: 'rgba(249, 115, 22, 1)',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0.1,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#9CA3AF',
          font: { size: 12 }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#F9FAFB',
        bodyColor: '#F9FAFB',
        borderColor: '#374151',
        borderWidth: 1,
      }
    },
    scales: {
      x: {
        ticks: {
          color: '#9CA3AF',
          font: { size: 11 }
        },
        grid: { color: 'rgba(55, 65, 81, 0.3)' }
      },
      y: {
        ticks: {
          color: '#9CA3AF',
          font: { size: 11 }
        },
        grid: { color: 'rgba(55, 65, 81, 0.3)' }
      }
    }
  };

  const handleExportCSV = () => {
    const csvContent = [
      ['Date', 'High (°F)', 'Low (°F)', 'Wind (mph)', 'Precipitation (in)', 'ET₀ (inches)', 'ET₀ Sum (inches)'],
      ...forecastData.map(row => [
        row.date,
        row.high,
        row.low,
        row.wind,
        row.precipitation.toFixed(3),
        row.et0.toFixed(3),
        row.et0Sum.toFixed(3)
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `weather-forecast-${locationName.replace(/[^a-zA-Z0-9]/g, '-')}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    const csvContent = [
      ['Weather Forecast Report'],
      [`Location: ${locationName}`],
      [`Generated: ${new Date().toLocaleDateString()}`],
      [''],
      ['Date', 'High (°F)', 'Low (°F)', 'Wind (mph)', 'Precipitation (in)', 'ET₀ (inches)', 'ET₀ Sum (inches)'],
      ...forecastData.map(row => [
        row.date,
        row.high,
        row.low,
        row.wind,
        row.precipitation.toFixed(3),
        row.et0.toFixed(3),
        row.et0Sum.toFixed(3)
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `weather-forecast-${locationName.replace(/[^a-zA-Z0-9]/g, '-')}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-white flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Comprehensive Weather Report
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              14-day forecast for {locationName}
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleExportCSV}
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export Excel
            </button>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Precipitation Forecast (14 Days)</h3>
        <div className="h-96">
          <Bar data={precipitationChartData} options={chartOptions} />
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Evapotranspiration (ET₀) Forecast</h3>
        <div className="h-96">
          <Line data={et0ChartData} options={chartOptions} />
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">14-Day Forecast Data</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-gray-300 font-medium">DATE</th>
                <th className="text-left py-3 px-4 text-gray-300 font-medium">HIGH (°F)</th>
                <th className="text-left py-3 px-4 text-gray-300 font-medium">LOW (°F)</th>
                <th className="text-left py-3 px-4 text-gray-300 font-medium">WIND (MPH)</th>
                <th className="text-left py-3 px-4 text-gray-300 font-medium">PRECIP (IN)</th>
                <th className="text-left py-3 px-4 text-gray-300 font-medium">ET₀ (INCHES)</th>
                <th className="text-left py-3 px-4 text-gray-300 font-medium">ET₀ SUM (INCHES)</th>
              </tr>
            </thead>
            <tbody>
              {forecastData.map((day, index) => (
                <tr key={index} className="border-b border-gray-800 hover:bg-gray-800/50">
                  <td className="py-3 px-4 text-white font-medium">
                    {new Date(day.date).toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </td>
                  <td className="py-3 px-4 text-white">{day.high}°</td>
                  <td className="py-3 px-4 text-gray-300">{day.low}°</td>
                  <td className="py-3 px-4 text-gray-300">{day.wind}</td>
                  <td className="py-3 px-4 text-gray-300">{day.precipitation.toFixed(2)}</td>
                  <td className="py-3 px-4 text-gray-300">{day.et0.toFixed(3)}</td>
                  <td className="py-3 px-4 text-gray-300">{day.et0Sum.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
