// Test script to verify QuickChart.io integration for email charts
// This script demonstrates how the chart URLs are generated for emails

// Sample weather data for testing
const sampleWeatherData = {
  daily: {
    time: [
      "2024-10-22", "2024-10-23", "2024-10-24", "2024-10-25", "2024-10-26",
      "2024-10-27", "2024-10-28", "2024-10-29", "2024-10-30", "2024-10-31",
      "2024-11-01", "2024-11-02", "2024-11-03", "2024-11-04"
    ],
    precipitation_sum: [0.12, 0.0, 0.45, 1.23, 0.0, 0.0, 2.1, 0.33, 0.0, 0.15, 0.0, 0.78, 0.22, 0.0],
    rain_sum: [0.08, 0.0, 0.35, 0.98, 0.0, 0.0, 1.85, 0.28, 0.0, 0.12, 0.0, 0.65, 0.18, 0.0],
    et0_fao_evapotranspiration: [3.2, 3.8, 2.1, 1.5, 4.2, 4.0, 1.8, 2.3, 3.9, 3.5, 4.1, 2.7, 3.3, 3.6]
  }
};

const sampleLocation = {
  name: "Davis, CA"
};

// Function to generate chart URLs (same as in Supabase function)
function generateEmailChartUrls(location, weather) {
  if (!weather?.daily) return null;

  const daily = weather.daily;
  const dates = daily.time?.slice(0, 14) || [];
  const precipitation = daily.precipitation_sum?.slice(0, 14) || [];
  const rain = daily.rain_sum?.slice(0, 14) || [];
  const et0 = daily.et0_fao_evapotranspiration?.slice(0, 14) || [];

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
          title: { display: true, text: 'Inches' }
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
          title: { display: true, text: 'mm' }
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
}

// Test the chart URL generation
console.log('🧪 Testing Chart URL Generation for Emails\n');

const chartUrls = generateEmailChartUrls(sampleLocation, sampleWeatherData);

if (chartUrls) {
  console.log('✅ Chart URLs generated successfully!\n');
  
  console.log('📊 Precipitation Chart URL:');
  console.log(chartUrls.precipitationUrl);
  console.log('\n🌱 ET₀ Chart URL:');
  console.log(chartUrls.et0Url);
  
  console.log('\n📝 Sample HTML for Email:');
  console.log(`
<div style="margin: 24px 0;">
  <div style="margin-bottom: 20px; text-align: center;">
    <img src="${chartUrls.precipitationUrl}" 
         alt="Precipitation Forecast - ${sampleLocation.name}" 
         style="max-width: 100%; height: auto; border-radius: 8px;" />
  </div>
  <div style="margin-bottom: 20px; text-align: center;">
    <img src="${chartUrls.et0Url}" 
         alt="ET₀ Forecast - ${sampleLocation.name}" 
         style="max-width: 100%; height: auto; border-radius: 8px;" />
  </div>
</div>
  `);
  
  console.log('\n🔍 To test these URLs, copy and paste them into your browser.');
  console.log('   The charts should display properly for email embedding.\n');
  
} else {
  console.error('❌ Failed to generate chart URLs');
}

// Test QuickChart.io availability
console.log('🌐 Testing QuickChart.io Service...');
fetch('https://quickchart.io/chart?width=400&height=200&chart={"type":"bar","data":{"labels":["Test"],"datasets":[{"data":[1],"backgroundColor":"#3B82F6"}]}}')
  .then(response => {
    if (response.ok) {
      console.log('✅ QuickChart.io service is available and responding');
    } else {
      console.log('⚠️  QuickChart.io returned status:', response.status);
    }
  })
  .catch(error => {
    console.log('❌ QuickChart.io service test failed:', error.message);
  });