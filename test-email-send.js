// Test script to simulate email sending with dynamic weather icons
import fetch from 'node-fetch';

// Mock weather data for testing (simulating Open-Meteo API response)
const mockWeatherData = [
  {
    location: {
      id: 'test-location-1',
      name: 'Los Angeles, CA',
      latitude: 34.0522,
      longitude: -118.2437
    },
    weather: {
      daily: {
        time: ['2025-10-21', '2025-10-22', '2025-10-23', '2025-10-24', '2025-10-25', '2025-10-26', '2025-10-27'],
        temperature_2m_max: [75.2, 73.4, 71.6, 74.1, 76.3, 78.0, 75.8],
        temperature_2m_min: [58.1, 56.7, 55.3, 57.2, 59.4, 61.1, 58.9],
        precipitation_sum: [0.0, 0.12, 0.45, 0.0, 0.0, 0.08, 0.0],
        rain_sum: [0.0, 0.12, 0.45, 0.0, 0.0, 0.08, 0.0],
        wind_speed_10m_max: [8.3, 12.1, 15.2, 9.7, 7.4, 11.8, 10.2]
      },
      daily_units: {
        temperature_2m_max: '°F',
        temperature_2m_min: '°F', 
        precipitation_sum: 'in',
        wind_speed_10m_max: 'mph'
      }
    }
  }
];

// Function to determine weather icon based on conditions (copied from Edge Function)
function getWeatherIcon(weatherData) {
  if (!weatherData || weatherData.length === 0) return '🌤️'
  
  // Use the first location as primary for icon selection
  const primaryLocation = weatherData[0]
  if (!primaryLocation.weather?.daily) return '🌤️'
  
  const daily = primaryLocation.weather.daily
  const todayPrecip = daily.precipitation_sum?.[0] || 0
  const todayRain = daily.rain_sum?.[0] || 0
  
  // Rain conditions
  if (todayPrecip > 2.0 || todayRain > 2.0) return '🌧️' // Heavy rain
  if (todayPrecip > 0.5 || todayRain > 0.5) return '🌦️' // Light rain
  if (todayPrecip > 0.1 || todayRain > 0.1) return '☁️' // Cloudy with precipitation
  
  // Clear/sunny conditions
  return '☀️' // Sunny/clear
}

// Create email content (simplified version for testing)
function createEmailContent(userName, weatherData, isWelcome = false) {
  const currentDate = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const safe = (v, fallback = 'N/A') => (v === null || v === undefined) ? fallback : v;

  let emailHTML = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 820px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
      <div style="background: white; border-radius: 8px; padding: 28px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
        <h1 style="color: #0969da; margin-bottom: 6px; font-size: 24px;">🌤️ ET Weather — Forecast</h1>
        <p style="color: #656d76; margin-bottom: 18px; font-size: 15px;">Hello ${userName}! ${isWelcome ? 'Welcome — here is your first' : 'Here is your'} weather update for ${currentDate}.</p>
  `;

  // For each location, include metadata, a short summary, today's key numbers and a 7-day mini table
  for (const { location, weather } of weatherData) {
    // Location metadata
    const lat = safe(location.latitude);
    const lon = safe(location.longitude);
    const coords = `${lat}, ${lon}`;
    const mapLink = `https://www.openstreetmap.org/?mlat=${encodeURIComponent(lat)}&mlon=${encodeURIComponent(lon)}#map=10/${encodeURIComponent(lat)}/${encodeURIComponent(lon)}`;

    const daily = (weather && weather.daily) ? weather.daily : {};
    const units = (weather && weather.daily_units) ? weather.daily_units : {};

    // Today's indices (array 0 is today in Open-Meteo response)
    const tempMaxArr = daily.temperature_2m_max || [];
    const tempMinArr = daily.temperature_2m_min || [];
    const windArr = daily.wind_speed_10m_max || [];
    const precipArr = daily.precipitation_sum || [];
    const datesArr = daily.time || [];

    const todayMax = safe((tempMaxArr[0] !== undefined) ? Number(tempMaxArr[0]).toFixed(1) : null, 'N/A');
    const todayMin = safe((tempMinArr[0] !== undefined) ? Number(tempMinArr[0]).toFixed(1) : null, 'N/A');
    const todayWind = safe((windArr[0] !== undefined) ? Number(windArr[0]).toFixed(1) : null, 'N/A');
    const todayPrecip = safe((precipArr[0] !== undefined) ? Number(precipArr[0]).toFixed(2) : null, 'N/A');

    // Short natural-language summary
    const summaryParts = [];
    if (todayMax !== 'N/A' && todayMin !== 'N/A') summaryParts.push(`Temperatures ${todayMin}–${todayMax} ${units.temperature_2m_max || '°'}`);
    if (todayPrecip !== 'N/A') summaryParts.push(`Precipitation ${todayPrecip} ${units.precipitation_sum || ''}`);
    if (todayWind !== 'N/A') summaryParts.push(`Wind up to ${todayWind} ${units.wind_speed_10m_max || ''}`);
    const summary = summaryParts.length > 0 ? summaryParts.join(' · ') : 'No detailed data available for today.';

    emailHTML += `
      <div style="border: 1px solid #e6edf3; border-radius: 8px; padding: 18px; margin-bottom: 18px;">
        <div style="display:flex; justify-content:space-between; align-items:center; gap:12px;">
          <div>
            <h2 style="color:#0f1724; margin:0 0 6px 0; font-size:18px;">📍 ${safe(location.name, 'Unknown location')}</h2>
            <div style="font-size:13px; color:#475569;">${summary}</div>
            <div style="font-size:12px; color:#6b7280; margin-top:6px;">Coordinates: ${coords} • <a href="${mapLink}" style="color:#0969da; text-decoration:none;">View map</a></div>
          </div>
          <div style="text-align:right; min-width:160px;">
            <div style="font-size:12px; color:#9aa4ad;">Today</div>
            <div style="font-weight:700; color:#0f1724; font-size:16px; margin-top:6px;">High ${todayMax}${units.temperature_2m_max || '°'}</div>
            <div style="color:#374151; font-size:13px;">Low ${todayMin}${units.temperature_2m_min || '°'}</div>
          </div>
        </div>

        <!-- 7-day mini forecast table -->
        <div style="margin-top:14px; overflow:auto;">
          <table style="width:100%; border-collapse:collapse; font-size:13px;">
            <thead>
              <tr style="text-align:left; color:#475569; font-size:12px; border-bottom:1px solid #e6edf3;">
                <th style="padding:8px 6px;">Date</th>
                <th style="padding:8px 6px;">High</th>
                <th style="padding:8px 6px;">Low</th>
                <th style="padding:8px 6px;">Precip</th>
              </tr>
            </thead>
            <tbody>
    `;

    // show up to 7 days (or as many as available)
    const days = Math.min(7, datesArr.length);
    for (let i = 0; i < days; i++) {
      const date = datesArr[i] || '';
      const max = (tempMaxArr[i] !== undefined) ? Number(tempMaxArr[i]).toFixed(1) : 'N/A';
      const min = (tempMinArr[i] !== undefined) ? Number(tempMinArr[i]).toFixed(1) : 'N/A';
      const prec = (precipArr[i] !== undefined) ? Number(precipArr[i]).toFixed(2) : 'N/A';

      // human-friendly date
      let displayDate = date;
      try {
        displayDate = date ? new Date(date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) : '—';
      } catch (e) { displayDate = date; }

      emailHTML += `
              <tr style="border-bottom:1px solid #f1f5f9;">
                <td style="padding:8px 6px; color:#374151;">${displayDate}</td>
                <td style="padding:8px 6px; color:#0f1724; font-weight:600;">${max}${units.temperature_2m_max || '°'}</td>
                <td style="padding:8px 6px; color:#374151;">${min}${units.temperature_2m_min || '°'}</td>
                <td style="padding:8px 6px; color:#374151;">${prec}${units.precipitation_sum || ''}</td>
              </tr>
      `;
    }

    emailHTML += `
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  emailHTML += `
        <div style="text-align: center; margin-top: 18px; padding-top: 16px; border-top: 1px solid #e6edf3; color:#64748b; font-size:13px;">
          <div>This automated report was generated by ET Weather App.</div>
          <div style="font-size:12px; margin-top:6px;">Data from Open-Meteo & your saved locations</div>
        </div>
      </div>
    </div>
  `;

  return emailHTML;
}

// Test function to send email via Resend
async function testEmailSend() {
  try {
    console.log('🧪 Testing Email Send with Dynamic Weather Icons...\n');
    
    // Test different weather conditions
    const testScenarios = [
      {
        name: 'Sunny Day',
        data: [{
          ...mockWeatherData[0],
          weather: {
            ...mockWeatherData[0].weather,
            daily: {
              ...mockWeatherData[0].weather.daily,
              precipitation_sum: [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
              rain_sum: [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]
            }
          }
        }]
      },
      {
        name: 'Light Rain',
        data: [{
          ...mockWeatherData[0],
          weather: {
            ...mockWeatherData[0].weather,
            daily: {
              ...mockWeatherData[0].weather.daily,
              precipitation_sum: [0.3, 0.2, 0.1, 0.0, 0.0, 0.0, 0.0],
              rain_sum: [0.3, 0.2, 0.1, 0.0, 0.0, 0.0, 0.0]
            }
          }
        }]
      },
      {
        name: 'Heavy Rain',
        data: [{
          ...mockWeatherData[0],
          weather: {
            ...mockWeatherData[0].weather,
            daily: {
              ...mockWeatherData[0].weather.daily,
              precipitation_sum: [2.5, 1.8, 1.2, 0.5, 0.0, 0.0, 0.0],
              rain_sum: [2.5, 1.8, 1.2, 0.5, 0.0, 0.0, 0.0]
            }
          }
        }]
      }
    ];

    for (const scenario of testScenarios) {
      console.log(`📧 Testing "${scenario.name}" scenario:`);
      
      const weatherIcon = getWeatherIcon(scenario.data);
      const subject = `${weatherIcon} Weather Report - ${new Date().toLocaleDateString('en-GB')}`;
      const emailHTML = createEmailContent('Test User', scenario.data, false);
      
      console.log(`   Icon: ${weatherIcon}`);
      console.log(`   Subject: ${subject}`);
      console.log(`   HTML Length: ${emailHTML.length} characters`);
      
      // Attempt to send actual email via Resend API
      const resendApiKey = process.env.RESEND_API_KEY;
      if (!resendApiKey) {
        console.error('❌ RESEND_API_KEY environment variable is required');
        console.log('💡 Set it by running: export RESEND_API_KEY=your_key_here');
        process.exit(1);
      }
      const fromEmail = process.env.FROM_EMAIL || 'weather@resend.dev';
      
      if (resendApiKey && resendApiKey !== 'your_resend_api_key_here') {
        try {
          const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: fromEmail,
              to: ['gabrielriosemail@gmail.com'], // Your email for testing
              subject: subject,
              html: emailHTML,
              reply_to: fromEmail
            }),
          });

          const emailResult = await emailResponse.json();
          
          if (emailResponse.ok) {
            console.log(`   ✅ Email sent successfully! ID: ${emailResult.id}`);
          } else {
            console.log(`   ❌ Email failed to send: ${emailResult.message || 'Unknown error'}`);
          }
        } catch (error) {
          console.log(`   ❌ Email send error: ${error.message}`);
        }
      } else {
        console.log(`   ⏭️  Skipping actual email send (no API key configured)`);
      }
      
      console.log('');
    }
    
    console.log('✨ Test completed! Check the generated HTML and subject lines above.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testEmailSend();