import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, ResponsiveContainer } from 'recharts';

interface SimpleWeatherChartsProps {
  location: {
    id?: string;
    name?: string;
    latitude?: number;
    longitude?: number;
  };
}

export const SimpleWeatherCharts: React.FC<SimpleWeatherChartsProps> = ({ location: _location }) => {
  const [isReady, setIsReady] = useState(false);

  // Delay rendering to ensure parent container has proper dimensions
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  const mockData = [
    { date: 'Oct 21', precipitation: 0.00, et0: 0.005 },
    { date: 'Oct 22', precipitation: 0.00, et0: 0.005 },
    { date: 'Oct 23', precipitation: 0.00, et0: 0.005 },
    { date: 'Oct 24', precipitation: 0.00, et0: 0.005 },
    { date: 'Oct 25', precipitation: 0.00, et0: 0.005 },
    { date: 'Oct 26', precipitation: 0.00, et0: 0.005 },
    { date: 'Oct 27', precipitation: 0.00, et0: 0.005 },
    { date: 'Oct 28', precipitation: 0.00, et0: 0.005 },
    { date: 'Oct 29', precipitation: 0.00, et0: 0.004 },
    { date: 'Oct 30', precipitation: 0.00, et0: 0.005 },
    { date: 'Oct 31', precipitation: 0.00, et0: 0.005 },
    { date: 'Nov 1', precipitation: 0.00, et0: 0.005 },
    { date: 'Nov 2', precipitation: 0.00, et0: 0.005 },
    { date: 'Nov 3', precipitation: 0.00, et0: 0.004 },
  ];

  // Show loading placeholder until ready
  if (!isReady) {
    return (
      <div className="space-y-6">
        <div style={{ width: '100%', height: '400px', backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: 'white', fontSize: '16px' }}>Loading charts...</div>
        </div>
        <div style={{ width: '100%', height: '400px', backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: 'white', fontSize: '16px' }}>Loading charts...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" style={{ width: '100%', minWidth: '400px' }}>
      <div style={{ width: '100%', height: '400px', backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px', position: 'relative' }}>
        <h3 style={{ color: 'white', textAlign: 'center', marginBottom: '20px', fontSize: '16px' }}>
          Precipitation Forecast (14 Days)
        </h3>
        <div style={{ width: '100%', height: '340px', minWidth: '360px', minHeight: '320px' }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={360} minHeight={320}>
            <BarChart data={mockData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" tick={{ fill: 'white', fontSize: 12 }} axisLine={{ stroke: '#6b7280' }} />
              <YAxis tick={{ fill: 'white', fontSize: 12 }} axisLine={{ stroke: '#6b7280' }} />
              <Tooltip contentStyle={{ backgroundColor: '#374151', border: 'none', borderRadius: '4px', color: 'white' }} />
              <Legend />
              <Bar dataKey="precipitation" fill="#3b82f6" name="Total Precipitation" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ width: '100%', height: '400px', backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px', position: 'relative' }}>
        <h3 style={{ color: 'white', textAlign: 'center', marginBottom: '20px', fontSize: '16px' }}>
          Evapotranspiration (ET₀) Forecast
        </h3>
        <div style={{ width: '100%', height: '340px', minWidth: '360px', minHeight: '320px' }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={360} minHeight={320}>
            <LineChart data={mockData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" tick={{ fill: 'white', fontSize: 12 }} axisLine={{ stroke: '#6b7280' }} />
              <YAxis tick={{ fill: 'white', fontSize: 12 }} axisLine={{ stroke: '#6b7280' }} domain={[0, 0.01]} />
              <Tooltip contentStyle={{ backgroundColor: '#374151', border: 'none', borderRadius: '4px', color: 'white' }} />
              <Legend />
              <Line type="monotone" dataKey="et0" stroke="#f97316" strokeWidth={2} name="Daily ET₀" dot={{ fill: '#f97316', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, fill: '#f97316' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
