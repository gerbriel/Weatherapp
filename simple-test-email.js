// Simple test to send one email with dynamic weather icon
import fetch from 'node-fetch';

// Mock weather data matching the dashboard from the screenshot (Callender, CA)
const testWeatherData = [{
  location: {
    id: 'test-location-1',
    name: 'Callender, CA',
    latitude: 35.0334,
    longitude: -120.5721
  },
  weather: {
    daily: {
      time: [
        '2025-10-20', '2025-10-21', '2025-10-22', '2025-10-23', '2025-10-24', 
        '2025-10-25', '2025-10-26', '2025-10-27', '2025-10-28', '2025-10-29',
        '2025-10-30', '2025-10-31', '2025-11-01', '2025-11-02'
      ],
      temperature_2m_max: [61, 64, 69, 71, 66, 72, 72, 75, 76, 74, 70, 68, 65, 62],
      temperature_2m_min: [52, 54, 52, 60, 59, 58, 57, 60, 61, 58, 55, 53, 50, 48],
      precipitation_sum: [0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00],
      rain_sum: [0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00],
      wind_speed_10m_max: [8.7, 14.1, 16.4, 10.1, 12.0, 16.8, 12.3, 9.7, 14.3, 11.5, 13.2, 15.6, 12.8, 10.4],
      et0_fao_evapotranspiration: [0.06, 0.08, 0.11, 0.12, 0.10, 0.13, 0.15, 0.14, 0.14, 0.12, 0.10, 0.09, 0.07, 0.06],
      et0_fao_evapotranspiration_sum: [0.08, 0.08, 0.08, 0.08, 0.08, 0.08, 0.08, 0.08, 0.08, 0.08, 0.08, 0.08, 0.08, 0.08]
    },
    daily_units: {
      temperature_2m_max: '°F',
      temperature_2m_min: '°F', 
      precipitation_sum: 'in',
      wind_speed_10m_max: 'mph',
      et0_fao_evapotranspiration: 'mm',
      et0_fao_evapotranspiration_sum: 'mm'
    }
  }
}];

// Function to determine weather icon based on conditions
function getWeatherIcon(weatherData) {
  if (!weatherData || weatherData.length === 0) return '🌤️'
  
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

// Dashboard-style email HTML builder (matching the new template)
function createDashboardEmailContent(userName, weatherData) {
  const currentDate = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const safe = (v, fallback = 'N/A') => (v === null || v === undefined) ? fallback : v;
  
  const { location, weather } = weatherData[0];
  const daily = weather.daily;
  const units = weather.daily_units;
  
  // Today's metrics
  const todayMax = safe(Number(daily.temperature_2m_max[0]).toFixed(1), 'N/A');
  const todayMin = safe(Number(daily.temperature_2m_min[0]).toFixed(1), 'N/A');
  const todayWind = safe(Number(daily.wind_speed_10m_max[0]).toFixed(1), 'N/A');
  const todayPrecip = safe(Number(daily.precipitation_sum[0]).toFixed(2), 'N/A');
  const todayET0Daily = safe(Number(daily.et0_fao_evapotranspiration[0]).toFixed(2), 'N/A');
  const todayET0Sum = safe(Number(daily.et0_fao_evapotranspiration_sum[0]).toFixed(2), 'N/A');

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; max-width: 900px; margin: 0 auto; padding: 16px; background-color: #1a202c;">
      <div style="background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%); border-radius: 12px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.3);">
        
        <!-- Email Header -->
        <div style="padding: 24px 28px 16px; background: rgba(45, 55, 72, 0.95);">
          <div style="color: #ffffff; font-size: 16px; font-weight: 600; margin-bottom: 6px;">Hello ${userName}! Dashboard-style weather update test</div>
          <div style="color: #a0aec0; font-size: 13px;">${currentDate}</div>
        </div>

        <!-- Location Section -->
        <div style="padding: 0 28px 24px;">
          
          <!-- Location Header -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding: 16px 20px; background: rgba(74, 85, 104, 0.4); border-radius: 8px; border-left: 3px solid #4299e1;">
            <div>
              <h2 style="color: #ffffff; margin: 0 0 4px 0; font-size: 20px; font-weight: 700;">${location.name}</h2>
              <div style="color: #cbd5e0; font-size: 12px; margin-bottom: 2px;">NCEP GFS Seamless Model • 14-day Forecast</div>
              <div style="color: #a0aec0; font-size: 11px;">📍 ${location.latitude}, ${location.longitude}</div>
            </div>
            <div style="font-size: 32px; opacity: 0.8;">☀️</div>
          </div>

          <!-- Metrics Grid (2x3) -->
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px;">
            
            <!-- High Temp -->
            <div style="background: rgba(74, 85, 104, 0.4); border-radius: 8px; padding: 16px; border: 1px solid rgba(255,255,255,0.1);">
              <div style="display: flex; align-items: center; margin-bottom: 8px;">
                <span style="font-size: 18px; margin-right: 8px;">🌡️</span>
                <span style="color: #cbd5e0; font-size: 12px; font-weight: 600; text-transform: uppercase;">High<br>Temp</span>
              </div>
              <div style="color: #ffffff; font-size: 24px; font-weight: 700;">${todayMax}°F</div>
              <div style="color: #a0aec0; font-size: 11px; margin-top: 2px;">Maximum temperature today</div>
            </div>

            <!-- Low Temp -->
            <div style="background: rgba(74, 85, 104, 0.4); border-radius: 8px; padding: 16px; border: 1px solid rgba(255,255,255,0.1);">
              <div style="display: flex; align-items: center; margin-bottom: 8px;">
                <span style="font-size: 18px; margin-right: 8px;">🌡️</span>
                <span style="color: #cbd5e0; font-size: 12px; font-weight: 600; text-transform: uppercase;">Low<br>Temp</span>
              </div>
              <div style="color: #ffffff; font-size: 24px; font-weight: 700;">${todayMin}°F</div>
              <div style="color: #a0aec0; font-size: 11px; margin-top: 2px;">Minimum temperature today</div>
            </div>

            <!-- Wind Speed -->
            <div style="background: rgba(74, 85, 104, 0.4); border-radius: 8px; padding: 16px; border: 1px solid rgba(255,255,255,0.1);">
              <div style="display: flex; align-items: center; margin-bottom: 8px;">
                <span style="font-size: 18px; margin-right: 8px;">🌬️</span>
                <span style="color: #cbd5e0; font-size: 12px; font-weight: 600; text-transform: uppercase;">Wind<br>Speed</span>
              </div>
              <div style="color: #ffffff; font-size: 24px; font-weight: 700;">${todayWind} mph</div>
              <div style="color: #a0aec0; font-size: 11px; margin-top: 2px;">Maximum wind speed today</div>
            </div>

            <!-- Precipitation -->
            <div style="background: rgba(74, 85, 104, 0.4); border-radius: 8px; padding: 16px; border: 1px solid rgba(255,255,255,0.1);">
              <div style="display: flex; align-items: center; margin-bottom: 8px;">
                <span style="font-size: 18px; margin-right: 8px;">💧</span>
                <span style="color: #cbd5e0; font-size: 12px; font-weight: 600; text-transform: uppercase;">Precipitation</span>
              </div>
              <div style="color: #ffffff; font-size: 24px; font-weight: 700;">${todayPrecip} in</div>
              <div style="color: #a0aec0; font-size: 11px; margin-top: 2px;">Total precipitation today</div>
            </div>

            <!-- ET₀ Daily -->
            <div style="background: rgba(74, 85, 104, 0.4); border-radius: 8px; padding: 16px; border: 1px solid rgba(255,255,255,0.1);">
              <div style="display: flex; align-items: center; margin-bottom: 8px;">
                <span style="font-size: 18px; margin-right: 8px;">🌱</span>
                <span style="color: #cbd5e0; font-size: 12px; font-weight: 600; text-transform: uppercase;">ET₀<br>(Daily)</span>
              </div>
              <div style="color: #ffffff; font-size: 24px; font-weight: 700;">${todayET0Daily} mm</div>
              <div style="color: #a0aec0; font-size: 11px; margin-top: 2px;">Daily evapotranspiration</div>
            </div>

            <!-- ET₀ Sum -->
            <div style="background: rgba(74, 85, 104, 0.4); border-radius: 8px; padding: 16px; border: 1px solid rgba(255,255,255,0.1);">
              <div style="display: flex; align-items: center; margin-bottom: 8px;">
                <span style="font-size: 18px; margin-right: 8px;">🌱</span>
                <span style="color: #cbd5e0; font-size: 12px; font-weight: 600; text-transform: uppercase;">ET₀<br>(Sum)</span>
              </div>
              <div style="color: #ffffff; font-size: 24px; font-weight: 700;">${todayET0Sum} mm</div>
              <div style="color: #a0aec0; font-size: 11px; margin-top: 2px;">Cumulative evapotranspiration</div>
            </div>

          </div>

          <!-- 14-Day Forecast Table -->
          <div style="background: rgba(74, 85, 104, 0.2); border-radius: 8px; padding: 20px; border: 1px solid rgba(255,255,255,0.1);">
            <h3 style="color: #ffffff; margin: 0 0 16px 0; font-size: 16px; font-weight: 600;">14-Day Forecast Data</h3>
            
            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                <thead>
                  <tr style="border-bottom: 1px solid rgba(255,255,255,0.2);">
                    <th style="padding: 8px 12px; text-align: left; color: #cbd5e0; font-weight: 600; font-size: 11px; text-transform: uppercase;">DATE</th>
                    <th style="padding: 8px 12px; text-align: left; color: #cbd5e0; font-weight: 600; font-size: 11px; text-transform: uppercase;">HIGH (°F)</th>
                    <th style="padding: 8px 12px; text-align: left; color: #cbd5e0; font-weight: 600; font-size: 11px; text-transform: uppercase;">LOW (°F)</th>
                    <th style="padding: 8px 12px; text-align: left; color: #cbd5e0; font-weight: 600; font-size: 11px; text-transform: uppercase;">WIND (MPH)</th>
                    <th style="padding: 8px 12px; text-align: left; color: #cbd5e0; font-weight: 600; font-size: 11px; text-transform: uppercase;">PRECIP (IN)</th>
                    <th style="padding: 8px 12px; text-align: left; color: #cbd5e0; font-weight: 600; font-size: 11px; text-transform: uppercase;">ET₀ (MM)</th>
                  </tr>
                </thead>
                <tbody>`;

  let html = `
                <tbody>`;

  // Add 14-day forecast
  for (let i = 0; i < Math.min(14, daily.time.length); i++) {
    const date = new Date(daily.time[i]).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const high = Number(daily.temperature_2m_max[i]).toFixed(0) + '°';
    const low = Number(daily.temperature_2m_min[i]).toFixed(0) + '°';
    const wind = Number(daily.wind_speed_10m_max[i]).toFixed(1);
    const precip = Number(daily.precipitation_sum[i]).toFixed(2);
    const et0 = Number(daily.et0_fao_evapotranspiration[i]).toFixed(2);
    
    const rowStyle = i % 2 === 0 ? 'background: rgba(255,255,255,0.03);' : 'background: transparent;';
    
    html += `
                  <tr style="${rowStyle}">
                    <td style="padding: 8px 12px; color: #e2e8f0; border-bottom: 1px solid rgba(255,255,255,0.08);">${date}</td>
                    <td style="padding: 8px 12px; color: #ffffff; font-weight: 600; border-bottom: 1px solid rgba(255,255,255,0.08);">${high}</td>
                    <td style="padding: 8px 12px; color: #cbd5e0; border-bottom: 1px solid rgba(255,255,255,0.08);">${low}</td>
                    <td style="padding: 8px 12px; color: #cbd5e0; border-bottom: 1px solid rgba(255,255,255,0.08);">${wind}</td>
                    <td style="padding: 8px 12px; color: #cbd5e0; border-bottom: 1px solid rgba(255,255,255,0.08);">${precip}</td>
                    <td style="padding: 8px 12px; color: #cbd5e0; border-bottom: 1px solid rgba(255,255,255,0.08);">${et0}</td>
                  </tr>`;
  }
  
  return html + `
                </tbody>
              </table>
            </div>
          </div>

        </div>

        <!-- Footer -->
        <div style="padding: 20px 28px; background: rgba(45, 55, 72, 0.7); border-top: 1px solid rgba(255,255,255,0.1); text-align: center;">
          <div style="color: #a0aec0; font-size: 13px; margin-bottom: 4px;">Dashboard-style test email generated by ET Weather App</div>
          <div style="color: #718096; font-size: 11px;">Data from Open-Meteo API & your saved locations</div>
        </div>

      </div>
    </div>
  `;
}// Send test email
async function sendTestEmail() {
  console.log('🧪 Sending single test email with dynamic weather icon...\n');
  
  const weatherIcon = getWeatherIcon(testWeatherData);
  const subject = `${weatherIcon} Dashboard-Style Weather Report - ${new Date().toLocaleDateString('en-GB')}`;
  const emailHTML = createDashboardEmailContent('Gabriel', testWeatherData);
  
  console.log(`📧 Weather Icon: ${weatherIcon}`);
  console.log(`📧 Subject: ${subject}`);
  console.log(`📧 HTML Length: ${emailHTML.length} characters\n`);
  
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.error('❌ RESEND_API_KEY environment variable is required');
    console.log('💡 Set it by running: export RESEND_API_KEY=your_key_here');
    process.exit(1);
  }
  const fromEmail = process.env.FROM_EMAIL || 'weather@resend.dev';
  
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: ['gabrielriosemail@gmail.com'],
        subject: subject,
        html: emailHTML,
        reply_to: fromEmail
      }),
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log(`✅ Email sent successfully!`);
      console.log(`📧 Email ID: ${result.id}`);
      console.log(`🎯 Sent to: gabrielriosemail@gmail.com`);
      console.log(`📱 Check your email inbox!`);
    } else {
      console.log(`❌ Email failed to send: ${result.message || 'Unknown error'}`);
      console.log('Full response:', result);
    }
  } catch (error) {
    console.error(`❌ Error sending email: ${error.message}`);
  }
}

sendTestEmail();