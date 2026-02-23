import React, { useState, useRef, useEffect } from 'react';
import { Droplets, Gauge, MapPin, Menu, X, Thermometer, Wind, Shield, FileText, Mail, Sprout, User, LogOut, Settings } from 'lucide-react';
import { WeatherCard } from './WeatherCard';
import { WeatherCharts } from './WeatherCharts';
import { LocationsList } from './LocationsList';
import { ReportView } from './ReportView';
import { EmailNotifications } from './EmailNotifications';
import { CropManagement } from './CropManagement';
import { ThemeToggle } from './ThemeToggle';
import { AdminPanel } from './AdminPanel';
import { AuthModal } from './auth/AuthModal';
import { UserProfile } from './UserProfile';
import { useAuth } from '../contexts/AuthContext';
import type { LocationWithWeather } from '../types/weather';

export const WeatherDashboard: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const [selectedLocation, setSelectedLocation] = useState<LocationWithWeather | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [currentView, setCurrentView] = useState<'location' | 'report' | 'emails' | 'crops' | 'profile'>('location');
  const [cropWeeklySummaries, setCropWeeklySummaries] = useState<Record<string, string>>({});
  
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Fetch weather data on-demand when a location is selected (if it doesn't have data yet)
  useEffect(() => {
    // For authenticated users, weather data is managed by AuthContext
    // The data will be fetched automatically through the context
  }, [selectedLocation?.id]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLocationSelect = (location: LocationWithWeather) => {
    setSelectedLocation(location);
    setSidebarOpen(false); // Close sidebar on mobile after selection
  };

  const handleSignOut = async () => {
    await signOut();
    setShowUserMenu(false);
    setCurrentView('location');
  };

  const handleViewProfile = () => {
    setCurrentView('profile');
    setShowUserMenu(false);
  };

  const getTodayData = () => {
    if (!selectedLocation?.weatherData) return null;
    
    const today = new Date().toISOString().split('T')[0];
    const todayIndex = selectedLocation.weatherData.daily.time.findIndex(date => date === today);
    
    if (todayIndex === -1) return null;
    
    return {
      tempMax: selectedLocation.weatherData.daily.temperature_2m_max[todayIndex] || 0,
      tempMin: selectedLocation.weatherData.daily.temperature_2m_min[todayIndex] || 0,
      windSpeed: selectedLocation.weatherData.daily.wind_speed_10m_max[todayIndex] || 0,
      precipitation: selectedLocation.weatherData.daily.precipitation_sum[todayIndex] || 0,
      rain: selectedLocation.weatherData.daily.rain_sum[todayIndex] || 0,
      et0: selectedLocation.weatherData.daily.et0_fao_evapotranspiration[todayIndex] || 0,
      et0_sum: selectedLocation.weatherData.daily.et0_fao_evapotranspiration_sum[todayIndex] || 0,
    };
  };

  const todayData = getTodayData();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="flex h-screen w-full">
        {/* Sidebar */}
        <div className={`
          fixed inset-y-0 left-0 z-50 w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
          transform transition-transform duration-300 ease-in-out flex flex-col
          lg:translate-x-0 lg:static lg:inset-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <Gauge className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                ET Weather
              </h1>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex-1 p-6 overflow-y-auto">
            <LocationsList 
              onLocationSelect={handleLocationSelect}
              selectedLocationId={selectedLocation?.id}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Menu className="h-5 w-5" />
                </button>
                
                <div>
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {selectedLocation ? selectedLocation.name : 'Weather & ET Dashboard'}
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    NOAA GFS Seamless (Global Forecast System) • 14-day Forecast
                  </p>
                  {selectedLocation && (
                    <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 mt-1">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm font-mono">
                        {selectedLocation.latitude.toFixed(4)}, {selectedLocation.longitude.toFixed(4)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {/* View Navigation Buttons */}
                <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                  <button
                    onClick={() => setCurrentView('location')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      currentView === 'location'
                        ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <MapPin className="h-4 w-4 mr-1 inline" />
                    Location View
                  </button>
                  <button
                    onClick={() => setCurrentView('report')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      currentView === 'report'
                        ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <FileText className="h-4 w-4 mr-1 inline" />
                    View Report
                  </button>
                  <button
                    onClick={() => setCurrentView('emails')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      currentView === 'emails'
                        ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <Mail className="h-4 w-4 mr-1 inline" />
                    Email Reports
                  </button>
                  <button
                    onClick={() => setCurrentView('crops')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      currentView === 'crops'
                        ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <Sprout className="h-4 w-4 mr-1 inline" />
                    Crop Management
                  </button>
                  {user && (
                    <button
                      onClick={() => setCurrentView('profile')}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                        currentView === 'profile'
                          ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      <User className="h-4 w-4 mr-1 inline" />
                      Profile
                    </button>
                  )}
                </div>

                {/* User Authentication */}
                {user ? (
                  <div className="relative" ref={userMenuRef}>
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center space-x-2 p-2 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {profile?.first_name?.[0] || profile?.email?.[0]?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <span className="hidden md:block text-sm font-medium text-gray-900 dark:text-white">
                        {profile?.display_name || profile?.email}
                      </span>
                    </button>
                    
                    {showUserMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                        <div className="py-1">
                          <button
                            onClick={handleViewProfile}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            Profile Settings
                          </button>
                          <hr className="my-1 border-gray-200 dark:border-gray-700" />
                          <button
                            onClick={handleSignOut}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                          >
                            <LogOut className="h-4 w-4 mr-2" />
                            Sign Out
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Sign In
                  </button>
                )}

                <button
                  onClick={() => setShowAdminPanel(true)}
                  className="p-2 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Admin Panel"
                >
                  <Shield className="h-5 w-5" />
                </button>
                <ThemeToggle />
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 overflow-y-auto p-6 w-full">
            {currentView === 'report' ? (
              <ReportView 
                cropWeeklySummaries={cropWeeklySummaries}
                onCropWeeklySummariesChange={setCropWeeklySummaries}
              />
            ) : currentView === 'emails' ? (
              <EmailNotifications />
            ) : currentView === 'crops' ? (
              <CropManagement />
            ) : currentView === 'profile' ? (
              <UserProfile />
            ) : selectedLocation ? (
              <>
                {/* Error Display */}
                {selectedLocation.error && (
                  <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-red-700 dark:text-red-400 text-sm">{selectedLocation.error}</p>
                  </div>
                )}

                {/* 24-Hour Hourly Forecast */}
                {selectedLocation?.weatherData?.hourly && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-8">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">24-Hour Forecast</h3>
                    <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-700">
                      <div className="flex space-x-4 pb-2">
                        {selectedLocation.weatherData.hourly.time.slice(0, 24).map((time: string, index: number) => {
                          const hour = new Date(time);
                          const isNow = index === 0; // Only the first hour is "Now"
                          const hourlyData = selectedLocation.weatherData!.hourly!;
                          const temp = hourlyData.temperature_2m[index];
                          const precip = hourlyData.precipitation_probability?.[index] || 0;
                          const weatherCode = hourlyData.weather_code[index];
                          const windSpeed = hourlyData.wind_speed_10m[index];
                          
                          // Weather code to emoji mapping (WMO codes)
                          const getWeatherEmoji = (code: number) => {
                            if (code === 0) return '☀️';
                            if (code <= 3) return '⛅';
                            if (code <= 48) return '☁️';
                            if (code <= 67) return '🌧️';
                            if (code <= 77) return '❄️';
                            if (code <= 82) return '🌧️';
                            if (code <= 86) return '🌨️';
                            if (code >= 95) return '⛈️';
                            return '☁️';
                          };

                          return (
                            <div
                              key={time}
                              className={`flex-shrink-0 text-center min-w-[80px] p-3 rounded-lg transition-colors ${
                                isNow 
                                  ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-400 dark:border-blue-500' 
                                  : 'bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600'
                              }`}
                            >
                              <div className={`text-xs font-medium mb-2 ${
                                isNow ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
                              }`}>
                                {isNow ? 'Now' : hour.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true })}
                              </div>
                              <div className="text-2xl mb-2">
                                {getWeatherEmoji(weatherCode)}
                              </div>
                              <div className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                                {Math.round(temp)}°
                              </div>
                              {precip > 0 && (
                                <div className="flex items-center justify-center text-xs text-blue-600 dark:text-blue-400 mb-1">
                                  <span className="mr-1">💧</span>
                                  {Math.round(precip)}%
                                </div>
                              )}
                              <div className="flex items-center justify-center text-xs text-gray-500 dark:text-gray-400">
                                <span className="mr-1">💨</span>
                                {Math.round(windSpeed)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* 7-Day Forecast */}
                {selectedLocation?.weatherData?.daily && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-8">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">7-Day Forecast</h3>
                    <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-700">
                      <div className="flex space-x-3 pb-2">
                        {(() => {
                          const weatherData = selectedLocation.weatherData;
                          const today = new Date().toISOString().split('T')[0];
                          const todayIndex = weatherData.daily.time.findIndex(date => date === today);
                          
                          if (todayIndex < 0) return null;
                          
                          // Get next 7 days starting from today
                          return weatherData.daily.time.slice(todayIndex, todayIndex + 7).map((date, index) => {
                            const actualIndex = todayIndex + index;
                            const dateObj = new Date(date);
                            const dayName = index === 0 ? 'Today' : dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                            const monthDay = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                            
                            const tempMax = weatherData.daily.temperature_2m_max[actualIndex];
                            const tempMin = weatherData.daily.temperature_2m_min[actualIndex];
                            const precipitation = weatherData.daily.precipitation_sum[actualIndex] || 0;
                            const weatherCode = weatherData.daily.weather_code?.[actualIndex] || 0;
                            const et0 = weatherData.daily.et0_fao_evapotranspiration[actualIndex] || 0;
                            
                            // Weather code to emoji mapping (WMO codes)
                            const getWeatherEmoji = (code: number) => {
                              if (code === 0) return '☀️';
                              if (code <= 3) return '⛅';
                              if (code <= 48) return '☁️';
                              if (code <= 67) return '🌧️';
                              if (code <= 77) return '❄️';
                              if (code <= 82) return '🌧️';
                              if (code <= 86) return '🌨️';
                              if (code >= 95) return '⛈️';
                              return '☁️';
                            };

                            return (
                              <div
                                key={date}
                                className={`flex-shrink-0 text-center min-w-[100px] p-3 rounded-lg transition-colors ${
                                  index === 0 
                                    ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-400 dark:border-blue-500' 
                                    : 'bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600'
                                }`}
                              >
                                <div className={`text-xs font-semibold mb-1 ${
                                  index === 0 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'
                                }`}>
                                  {dayName}
                                </div>
                                <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-2">
                                  {monthDay}
                                </div>
                                <div className="text-2xl mb-2">
                                  {getWeatherEmoji(weatherCode)}
                                </div>
                                <div className="mb-2">
                                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                                    {Math.round(tempMax)}°
                                  </div>
                                  <div className="text-sm text-gray-600 dark:text-gray-400">
                                    {Math.round(tempMin)}°
                                  </div>
                                </div>
                                {precipitation > 0 && (
                                  <div className="flex items-center justify-center text-[10px] text-blue-600 dark:text-blue-400 mb-1">
                                    <span className="mr-0.5">💧</span>
                                    <span>{precipitation.toFixed(2)}"</span>
                                  </div>
                                )}
                                <div className="flex items-center justify-center text-[10px] text-green-600 dark:text-green-400">
                                  <span className="mr-0.5">🌱</span>
                                  <span>{et0.toFixed(2)}"</span>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  </div>
                )}

                {/* Today's Data Cards */}
                {todayData && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
                    <WeatherCard
                      title="High Temp"
                      value={todayData.tempMax}
                      unit="°F"
                      icon={<Thermometer className="h-6 w-6" />}
                      description="Maximum temperature today"
                    />
                    
                    <WeatherCard
                      title="Low Temp"
                      value={todayData.tempMin}
                      unit="°F"
                      icon={<Thermometer className="h-6 w-6" />}
                      description="Minimum temperature today"
                    />
                    
                    <WeatherCard
                      title="Wind Speed"
                      value={todayData.windSpeed}
                      unit="mph"
                      icon={<Wind className="h-6 w-6" />}
                      description="Maximum wind speed today"
                    />
                    
                    <WeatherCard
                      title="Precipitation"
                      value={todayData.precipitation}
                      unit="in"
                      icon={<Droplets className="h-6 w-6" />}
                      description="Total precipitation today"
                    />
                    
                    <WeatherCard
                      title="ET₀ (Daily)"
                      value={todayData.et0}
                      unit="inches"
                      icon={<Gauge className="h-6 w-6" />}
                      description="Daily evapotranspiration"
                    />
                    
                    <WeatherCard
                      title="ET₀ (Sum)"
                      value={todayData.et0_sum}
                      unit="inches"
                      icon={<Gauge className="h-6 w-6" />}
                      description="Cumulative evapotranspiration"
                    />
                  </div>
                )}

                {/* 14-day forecast table */}
                {selectedLocation.weatherData && (
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden mb-8">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        14-Day Forecast Data
                      </h2>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              High (°F)
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Low (°F)
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Wind (mph)
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Precip (in)
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              ET₀ (inches)
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {selectedLocation.weatherData.daily.time.map((date, index) => {
                            const formattedDate = new Date(date).toLocaleDateString('en-GB', { 
                              day: '2-digit', 
                              month: '2-digit', 
                              year: 'numeric' 
                            });
                            return (
                              <tr key={date} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                  {formattedDate}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-900 dark:text-gray-200">
                                  {selectedLocation.weatherData?.daily.temperature_2m_max[index]?.toFixed(0) || '--'}°
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-900 dark:text-gray-200">
                                  {selectedLocation.weatherData?.daily.temperature_2m_min[index]?.toFixed(0) || '--'}°
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-900 dark:text-gray-200">
                                  {selectedLocation.weatherData?.daily.wind_speed_10m_max[index]?.toFixed(1) || '0.0'}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-900 dark:text-gray-200">
                                  {selectedLocation.weatherData?.daily.precipitation_sum[index]?.toFixed(2) || '0.00'}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-900 dark:text-gray-200">
                                  {selectedLocation.weatherData?.daily.et0_fao_evapotranspiration[index] ? selectedLocation.weatherData?.daily.et0_fao_evapotranspiration[index].toFixed(3) : '0.000'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Charts */}
                {selectedLocation.weatherData && (
                  <WeatherCharts locationName={selectedLocation.name} />
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <MapPin className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Welcome to ET Weather
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Add a location to get started with weather data and evapotranspiration calculations
                </p>
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="gh-btn gh-btn-primary lg:hidden"
                >
                  Add Location
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
      
      {/* Admin Panel Modal */}
      {showAdminPanel && (
        <AdminPanel onClose={() => setShowAdminPanel(false)} />
      )}
      
      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
};