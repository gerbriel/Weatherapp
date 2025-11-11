import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, ResponsiveContainer } from 'recharts';
import ChartAIInsights from './ChartAIInsights';

interface SimpleWeatherChartsProps {
  location: {
    id?: string;
    name?: string;
    latitude?: number;
    longitude?: number;
    weatherData?: any; // The actual weather data from API
  };
}

export const SimpleWeatherCharts: React.FC<SimpleWeatherChartsProps> = ({ location }) => {
  const [isReady, setIsReady] = useState(false);

  // Delay rendering to ensure parent container has proper dimensions
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Process weather data into chart format
  const chartData = React.useMemo(() => {
    if (!location?.weatherData?.daily) {
      // Return empty array if no NOAA weather data available - this will show error state
      return [];
    }

    const weather = location.weatherData.daily;
    const dates = weather.time || [];
    const precipitation = weather.precipitation_sum || [];
    const et0 = weather.et0_fao_evapotranspiration || [];

    return dates.map((date: string, index: number) => {
      const dateObj = new Date(date);
      return {
        date: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        precipitation: precipitation[index] || 0,
        et0: (et0[index] * 0.0393701) || 0 // Convert mm to inches
      };
    }).slice(0, 14); // Limit to 14 days
  }, [location?.weatherData]);

  // Show loading placeholder until ready
  if (!isReady) {
    return (
      <div className="space-y-6">
        <div style={{ width: '100%', height: '400px', backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: 'white', fontSize: '16px' }}>Loading NOAA weather data...</div>
        </div>
        <div style={{ width: '100%', height: '400px', backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: 'white', fontSize: '16px' }}>Loading NOAA weather data...</div>
        </div>
      </div>
    );
  }

  // Show error state if no weather data is available
  if (chartData.length === 0) {
    return (
      <div className="space-y-6" style={{ width: '100%', minWidth: '400px' }}>
        <div style={{ width: '100%', height: '400px', backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', color: '#f87171' }}>
            <div style={{ fontSize: '16px', marginBottom: '8px' }}>⚠️ No NOAA Weather Data Available</div>
            <div style={{ fontSize: '12px', color: '#9CA3AF' }}>Unable to fetch NOAA data from Open-Meteo API</div>
          </div>
        </div>
        <div style={{ width: '100%', height: '400px', backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', color: '#f87171' }}>
            <div style={{ fontSize: '16px', marginBottom: '8px' }}>⚠️ No NOAA Weather Data Available</div>
            <div style={{ fontSize: '12px', color: '#9CA3AF' }}>Unable to fetch NOAA data from Open-Meteo API</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" style={{ width: '100%', minWidth: '400px' }}>
      <div style={{ width: '100%', backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px', position: 'relative' }}>
        <h3 style={{ color: 'white', textAlign: 'center', marginBottom: '10px', fontSize: '16px' }}>
          Precipitation Data {location?.name ? `- ${location.name}` : ''}
        </h3>
        <div style={{ color: '#9CA3AF', textAlign: 'center', marginBottom: '15px', fontSize: '12px' }}>
          📡 Data Source: NOAA GFS Global & NAM CONUS models via Open-Meteo API • Precipitation, temperature, and wind data
        </div>
        <div style={{ width: '100%', height: '320px', minWidth: '360px', minHeight: '300px' }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={360} minHeight={320}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" tick={{ fill: 'white', fontSize: 12 }} axisLine={{ stroke: '#6b7280' }} />
              <YAxis tick={{ fill: 'white', fontSize: 12 }} axisLine={{ stroke: '#6b7280' }} />
              <Tooltip contentStyle={{ backgroundColor: '#374151', border: 'none', borderRadius: '4px', color: 'white' }} />
              <Legend />
              <Bar dataKey="precipitation" fill="#3b82f6" name="Total Precipitation" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* AI Insights for Precipitation - Centered */}
        <ChartAIInsights
          chartType="precipitation"
          chartData={chartData}
          location={location?.name || 'Field Location'}
          className=""
          compact={true}
        />

      </div>

      <div style={{ width: '100%', backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px', position: 'relative' }}>
        <h3 style={{ color: 'white', textAlign: 'center', marginBottom: '10px', fontSize: '16px' }}>
          Evapotranspiration (ET₀) {location?.name ? `- ${location.name}` : ''}
        </h3>
        <div style={{ color: '#9CA3AF', textAlign: 'center', marginBottom: '15px', fontSize: '12px' }}>
          📡 Data Source: NOAA GFS Global & NAM CONUS models via Open-Meteo API • FAO-56 reference evapotranspiration
        </div>
        <div style={{ width: '100%', height: '320px', minWidth: '360px', minHeight: '300px' }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={360} minHeight={320}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" tick={{ fill: 'white', fontSize: 12 }} axisLine={{ stroke: '#6b7280' }} />
              <YAxis tick={{ fill: 'white', fontSize: 12 }} axisLine={{ stroke: '#6b7280' }} domain={[0, 0.01]} />
              <Tooltip contentStyle={{ backgroundColor: '#374151', border: 'none', borderRadius: '4px', color: 'white' }} />
              <Legend />
              <Line type="monotone" dataKey="et0" stroke="#f97316" strokeWidth={2} name="Daily ET₀" dot={{ fill: '#f97316', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, fill: '#f97316' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* AI Insights for Evapotranspiration - Centered */}
        <ChartAIInsights
          chartType="evapotranspiration"
          chartData={chartData}
          location={location?.name || 'Field Location'}
          className=""
          compact={true}
        />
        
      </div>
    </div>
  );
};
