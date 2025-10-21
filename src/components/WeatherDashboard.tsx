import React, { useEffect, useState } from 'react';
import { Droplets, Gauge, MapPin, RefreshCw } from 'lucide-react';
import { weatherService } from '../services/weatherService';
import { WeatherCard } from './WeatherCard';
import { WeatherCharts } from './WeatherCharts';
import { LocationInput } from './LocationInput';
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
      <div className="min-h-screen bg-github-canvas-default dark:bg-github-dark-canvas-default flex items-center justify-center">
        <div className="flex items-center space-x-3 gh-card p-6">
          <RefreshCw className="h-5 w-5 animate-spin text-github-accent-emphasis dark:text-github-dark-accent-emphasis" />
          <span className="text-github-fg-default dark:text-github-dark-fg-default">Loading weather data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-github-canvas-default dark:bg-github-dark-canvas-default transition-colors">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <header className="flex items-center justify-between mb-6 pb-6 border-b border-github-border-default dark:border-github-dark-border-default">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-github-canvas-subtle dark:bg-github-dark-canvas-subtle rounded-gh">
              <Gauge className="h-7 w-7 text-github-accent-emphasis dark:text-github-dark-accent-emphasis" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-github-fg-default dark:text-github-dark-fg-default">
                Weather & ET Dashboard
              </h1>
              <p className="text-sm text-github-fg-muted dark:text-github-dark-fg-muted mt-1">
                NCEP GFS Seamless Model • 14-day Forecast
              </p>
              {location && (
                <div className="flex items-center space-x-2 text-github-fg-subtle dark:text-github-dark-fg-subtle mt-2">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm font-mono">{location.name || `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => fetchWeatherData()}
              className="gh-btn gh-btn-primary"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <ThemeToggle />
          </div>
        </header>

        {error && (
          <div className="mb-6 p-4 bg-github-danger-subtle dark:bg-github-dark-danger-subtle border border-github-danger-muted dark:border-github-dark-danger-muted rounded-gh">
            <p className="text-github-danger-fg dark:text-github-dark-danger-fg text-sm">{error}</p>
          </div>
        )}

        {/* Location Input */}
        <div className="mb-6">
          <LocationInput
            onLocationSubmit={fetchWeatherData}
            currentLocation={location}
            loading={loading}
          />
        </div>

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
          <div className="gh-card overflow-hidden">
            <div className="px-6 py-4 border-b border-github-border-default dark:border-github-dark-border-default bg-github-canvas-subtle dark:bg-github-dark-canvas-subtle">
              <h2 className="text-lg font-semibold text-github-fg-default dark:text-github-dark-fg-default">
                14-Day Forecast Data
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-github-border-default dark:divide-github-dark-border-default">
                <thead className="bg-github-canvas-subtle dark:bg-github-dark-canvas-subtle">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-github-fg-muted dark:text-github-dark-fg-muted uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-github-fg-muted dark:text-github-dark-fg-muted uppercase tracking-wider">
                      Precipitation (in)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-github-fg-muted dark:text-github-dark-fg-muted uppercase tracking-wider">
                      Rain (in)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-github-fg-muted dark:text-github-dark-fg-muted uppercase tracking-wider">
                      ET₀ Daily (mm)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-github-fg-muted dark:text-github-dark-fg-muted uppercase tracking-wider">
                      ET₀ Sum (mm)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-github-canvas-default dark:bg-github-dark-canvas-default divide-y divide-github-border-default dark:divide-github-dark-border-default">
                  {weatherData.daily.time.map((date, index) => (
                    <tr key={date} className="hover:bg-github-canvas-subtle dark:hover:bg-github-dark-canvas-subtle transition-colors">
                      <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-github-fg-default dark:text-github-dark-fg-default">
                        {new Date(date).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm font-mono text-github-fg-default dark:text-github-dark-fg-default">
                        {weatherData.daily.precipitation_sum[index]?.toFixed(2) || '0.00'}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm font-mono text-github-fg-default dark:text-github-dark-fg-default">
                        {weatherData.daily.rain_sum[index]?.toFixed(2) || '0.00'}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm font-mono text-github-fg-default dark:text-github-dark-fg-default">
                        {weatherData.daily.et0_fao_evapotranspiration[index]?.toFixed(2) || '0.00'}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm font-mono text-github-fg-default dark:text-github-dark-fg-default">
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