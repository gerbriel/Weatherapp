import type { LocationWithWeather } from '../types/weather';

// Generate chart URLs for email templates using QuickChart.io
export const generateEmailChartUrls = (location: LocationWithWeather) => {
  if (!location.weatherData) return null;

  const daily = location.weatherData.daily;
  const dates = daily.time.slice(0, 14);
  const precipitation = daily.precipitation_sum.slice(0, 14);
  const rain = daily.rain_sum.slice(0, 14);
  // API already returns ET₀ in inches (precipitation_unit: 'inch' in weatherService)
  const et0 = daily.et0_fao_evapotranspiration.slice(0, 14);

  // Format dates for chart labels (Oct 21, Oct 22, etc.)
  const labels = dates.map(date => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });

  // Precipitation Chart Configuration
  const precipitationChart = {
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
          ticks: {
            callback: '(value) => value + "\""'
          }
        },
        x: {
          title: { display: true, text: 'Date' }
        }
      }
    }
  };

  // ET₀ Chart Configuration
  const et0Chart = {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Daily ET₀',
          data: et0,
          borderColor: '#FB923C',
          backgroundColor: 'rgba(251, 146, 60, 0.1)',
          tension: 0.3,
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: '#FB923C',
          pointBorderColor: '#FB923C'
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
          title: { display: true, text: 'inches' }
        },
        x: {
          title: { display: true, text: 'Date' }
        }
      }
    }
  };

  // Generate QuickChart URLs
  const precipitationUrl = `https://quickchart.io/chart?width=600&height=300&chart=${encodeURIComponent(JSON.stringify(precipitationChart))}`;
  const et0Url = `https://quickchart.io/chart?width=600&height=300&chart=${encodeURIComponent(JSON.stringify(et0Chart))}`;

  return {
    precipitationUrl,
    et0Url
  };
};

// Generate chart HTML for email templates
export const generateEmailChartHTML = (location: LocationWithWeather): string => {
  const chartUrls = generateEmailChartUrls(location);
  
  if (!chartUrls) return '';

  return `
    <!-- Weather Charts for ${location.name} -->
    <div style="margin: 24px 0;">
      <!-- Precipitation Chart -->
      <div style="margin-bottom: 20px; text-align: center;">
        <img src="${chartUrls.precipitationUrl}" 
             alt="Precipitation Forecast (14 Days) - ${location.name}" 
             style="max-width: 100%; height: auto; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);" />
      </div>
      
      <!-- ET₀ Chart -->
      <div style="margin-bottom: 20px; text-align: center;">
        <img src="${chartUrls.et0Url}" 
             alt="Evapotranspiration (ET₀) Forecast - ${location.name}" 
             style="max-width: 100%; height: auto; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);" />
      </div>
    </div>
  `;
};

// Generate simple ASCII art chart for plain text emails (fallback)
export const generateTextChart = (location: LocationWithWeather): string => {
  if (!location.weatherData) return '';

  const daily = location.weatherData.daily;
  const precipitation = daily.precipitation_sum.slice(0, 7); // Just 7 days for text
  const et0 = daily.et0_fao_evapotranspiration.slice(0, 7);

  const maxPrecip = Math.max(...precipitation);
  const maxEt0 = Math.max(...et0);

  let textChart = `\n📊 7-Day Weather Charts - ${location.name}\n\n`;
  
  // Precipitation chart (simple bar using characters)
  textChart += `Precipitation (inches):\n`;
  precipitation.forEach((value, index) => {
    const date = new Date(daily.time[index]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const barLength = Math.round((value / Math.max(maxPrecip, 0.1)) * 20);
    const bar = '█'.repeat(barLength) + '░'.repeat(20 - barLength);
    textChart += `${date.padEnd(6)} │${bar}│ ${value.toFixed(2)}"\n`;
  });

  textChart += `\nET₀ (inches):\n`;
  et0.forEach((value, index) => {
    const date = new Date(daily.time[index]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const barLength = Math.round((value / Math.max(maxEt0, 1)) * 20);
    const bar = '▓'.repeat(barLength) + '░'.repeat(20 - barLength);
    textChart += `${date.padEnd(6)} │${bar}│ ${value.toFixed(3)} inches\n`;
  });

  return textChart + '\n';
};