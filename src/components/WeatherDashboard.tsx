import React, { useEffect, useState } from 'react';
import { Droplets, Gauge, MapPin, RefreshCw } from 'lucide-react';
import { weatherService } from '../services/weatherService';
import { WeatherCard } from './WeatherCard';
import { WeatherCharts } from './WeatherCharts';
import { ThemeToggle } from './ThemeToggle';
import { useTheme } from '../contexts/ThemeContext';
import type { WeatherApiResponse, LocationData } from '../types/weather';

export const WeatherDashboard: React.FC = () => {
  const { isDarkMode } = useTheme();
  const [weatherData, setWeatherData] = useState<WeatherApiResponse | null>(null);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeatherData = async (locationData?: LocationData) => {
    setLoading(true);
    setError(null);
    
    try {
      const loc = locationData || await weatherService.getCurrentLocation();
      setLocation(loc);
      
      const data = await weatherService.getWeatherData(loc);
      setWeatherData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch weather data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeatherData();
  }, []);

  const getTodayData = () => {
    if (!weatherData) return null;
    
    const today = new Date().toISOString().split('T')[0];
    const todayIndex = weatherData.daily.time.findIndex(date => date === today);
    
    if (todayIndex === -1) return null;
    
    return {
      precipitation: weatherData.daily.precipitation_sum[todayIndex] || 0,
      rain: weatherData.daily.rain_sum[todayIndex] || 0,
      et0: weatherData.daily.et0_fao_evapotranspiration[todayIndex] || 0,
      et0_sum: weatherData.daily.et0_fao_evapotranspiration_sum[todayIndex] || 0,
    };
  };

  const todayData = getTodayData();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
          <span className="text-gray-700 dark:text-gray-300">Loading weather data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <Gauge className="h-8 w-8 text-blue-500" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Weather & ET Dashboard
              </h1>
              {location && (
                <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                  <MapPin className="h-4 w-4" />
                  <span>{location.name || `${location.latitude.toFixed(2)}, ${location.longitude.toFixed(2)}`}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => fetchWeatherData()}
              className="p-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors"
              disabled={loading}
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <ThemeToggle />
          </div>
        </header>

        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg">
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Today's Data Cards */}
        {todayData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <WeatherCard
              title="Total Precipitation"
              value={todayData.precipitation}
              unit="inches"
              icon={<Droplets className="h-6 w-6" />}
              description="Total precipitation for today"
            />
            
            <WeatherCard
              title="Rain Sum"
              value={todayData.rain}
              unit="inches"
              icon={<Droplets className="h-6 w-6" />}
              description="Rain amount for today"
            />
            
            <WeatherCard
              title="ET₀ (Daily)"
              value={todayData.et0}
              unit="mm"
              icon={<Gauge className="h-6 w-6" />}
              description="Daily evapotranspiration"
            />
            
            <WeatherCard
              title="ET₀ (Sum)"
              value={todayData.et0_sum}
              unit="mm"
              icon={<Gauge className="h-6 w-6" />}
              description="Cumulative evapotranspiration"
            />
          </div>
        )}

        {/* 14-day forecast table */}
        {weatherData && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                14-Day Forecast
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Precipitation (in)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Rain (in)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      ET₀ Daily (mm)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      ET₀ Sum (mm)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {weatherData.daily.time.map((date, index) => (
                    <tr key={date} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {new Date(date).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                        {weatherData.daily.precipitation_sum[index]?.toFixed(2) || '0.00'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                        {weatherData.daily.rain_sum[index]?.toFixed(2) || '0.00'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                        {weatherData.daily.et0_fao_evapotranspiration[index]?.toFixed(2) || '0.00'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                        {weatherData.daily.et0_fao_evapotranspiration_sum[index]?.toFixed(2) || '0.00'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Charts */}
        {weatherData && (
          <div className="mt-8">
            <WeatherCharts weatherData={weatherData} isDarkMode={isDarkMode} />
          </div>
        )}
      </div>
    </div>
  );
};