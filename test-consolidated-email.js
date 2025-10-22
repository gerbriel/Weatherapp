// Test script for consolidated multi-location weather emails with individual 14-day forecast tables

// Test weather data with 14 days for multiple locations
const testMultiLocationWeatherData = [
  {
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
        temperature_2m_max: [61, 64, 67, 63, 66, 69, 65, 62, 68, 66, 64, 61, 59, 57],
        temperature_2m_min: [52, 55, 58, 54, 57, 60, 56, 53, 59, 57, 55, 52, 50, 48],
        precipitation_sum: [0.00, 0.00, 0.00, 0.03, 0.00, 0.00, 0.05, 0.00, 0.00, 0.02, 0.00, 0.00, 0.00, 0.00],
        rain_sum: [0.00, 0.00, 0.00, 0.03, 0.00, 0.00, 0.05, 0.00, 0.00, 0.02, 0.00, 0.00, 0.00, 0.00],
        wind_speed_10m_max: [8.7, 11.2, 14.5, 10.8, 9.3, 12.6, 15.1, 11.4, 10.7, 13.2, 14.8, 16.2, 13.9, 11.5],
        et0_fao_evapotranspiration: [0.06, 0.08, 0.11, 0.09, 0.10, 0.13, 0.12, 0.09, 0.12, 0.10, 0.08, 0.06, 0.05, 0.04],
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
  },
  {
    location: {
      id: 'test-location-2',
      name: 'Los Angeles, CA',
      latitude: 34.0522,
      longitude: -118.2437
    },
    weather: {
      daily: {
        time: [
          '2025-10-20', '2025-10-21', '2025-10-22', '2025-10-23', '2025-10-24', 
          '2025-10-25', '2025-10-26', '2025-10-27', '2025-10-28', '2025-10-29',
          '2025-10-30', '2025-10-31', '2025-11-01', '2025-11-02'
        ],
        temperature_2m_max: [75, 78, 73, 76, 79, 81, 77, 74, 80, 78, 76, 73, 71, 69],
        temperature_2m_min: [58, 61, 59, 62, 64, 66, 63, 60, 65, 63, 61, 58, 56, 54],
        precipitation_sum: [0.00, 0.05, 0.12, 0.00, 0.00, 0.00, 0.08, 0.00, 0.00, 0.03, 0.00, 0.00, 0.00, 0.00],
        rain_sum: [0.00, 0.05, 0.12, 0.00, 0.00, 0.00, 0.08, 0.00, 0.00, 0.03, 0.00, 0.00, 0.00, 0.00],
        wind_speed_10m_max: [6.2, 9.8, 12.1, 8.3, 7.5, 10.2, 11.8, 7.9, 9.4, 8.7, 10.5, 12.3, 11.1, 9.6],
        et0_fao_evapotranspiration: [0.08, 0.10, 0.09, 0.11, 0.12, 0.14, 0.13, 0.11, 0.13, 0.11, 0.10, 0.08, 0.07, 0.06],
        et0_fao_evapotranspiration_sum: [0.10, 0.10, 0.10, 0.10, 0.10, 0.10, 0.10, 0.10, 0.10, 0.10, 0.10, 0.10, 0.10, 0.10]
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
  },
  {
    location: {
      id: 'test-location-3',
      name: 'San Francisco, CA',
      latitude: 37.7749,
      longitude: -122.4194
    },
    weather: {
      daily: {
        time: [
          '2025-10-20', '2025-10-21', '2025-10-22', '2025-10-23', '2025-10-24', 
          '2025-10-25', '2025-10-26', '2025-10-27', '2025-10-28', '2025-10-29',
          '2025-10-30', '2025-10-31', '2025-11-01', '2025-11-02'
        ],
        temperature_2m_max: [68, 70, 65, 67, 71, 73, 69, 66, 72, 70, 68, 65, 63, 61],
        temperature_2m_min: [54, 56, 53, 55, 58, 60, 57, 54, 59, 57, 55, 52, 50, 48],
        precipitation_sum: [0.00, 0.15, 0.32, 0.08, 0.00, 0.00, 0.18, 0.00, 0.00, 0.25, 0.12, 0.00, 0.00, 0.00],
        rain_sum: [0.00, 0.15, 0.32, 0.08, 0.00, 0.00, 0.18, 0.00, 0.00, 0.25, 0.12, 0.00, 0.00, 0.00],
        wind_speed_10m_max: [12.8, 15.2, 18.1, 14.3, 11.7, 13.6, 16.2, 13.8, 12.4, 14.9, 16.7, 17.3, 15.8, 13.2],
        et0_fao_evapotranspiration: [0.05, 0.06, 0.04, 0.05, 0.07, 0.08, 0.06, 0.05, 0.07, 0.06, 0.05, 0.04, 0.03, 0.03],
        et0_fao_evapotranspiration_sum: [0.06, 0.06, 0.06, 0.06, 0.06, 0.06, 0.06, 0.06, 0.06, 0.06, 0.06, 0.06, 0.06, 0.06]
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
  }
]

// Helper function to determine weather icon based on conditions
function getWeatherIcon(weatherData) {
  // Simple logic based on first location's conditions
  const firstLocation = weatherData[0]
  if (!firstLocation?.weather?.daily) return '🌤️'
  
  const todayPrecip = firstLocation.weather.daily.precipitation_sum?.[0] || 0
  const todayTemp = firstLocation.weather.daily.temperature_2m_max?.[0] || 70
  
  if (todayPrecip > 0.1) return '🌧️'
  if (todayTemp > 80) return '☀️'
  if (todayTemp < 50) return '❄️'
  return '☀️' // Default sunny
}

// Create consolidated email content with individual 14-day tables for each location
function createConsolidatedEmailContent(recipientName, weatherData, includeUnsubscribe = false, locationCount = null) {
  const safe = (v, fallback = 'N/A') => (v === null || v === undefined) ? fallback : v
  
  let emailHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Multi-Location Weather Report</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%); color: #ffffff;">
      
      <!-- Email Container -->
      <div style="max-width: 800px; margin: 0 auto; background: #1a202c;">
        
        <!-- Header -->
        <div style="padding: 32px 28px 24px; text-align: center; border-bottom: 2px solid rgba(255,255,255,0.1);">
          <h1 style="color: #ffffff; margin: 0 0 8px 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">
            🌦️ Multi-Location Weather Report
          </h1>
          <div style="color: #cbd5e0; font-size: 14px; margin-bottom: 4px;">
            ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          <div style="color: #a0aec0; font-size: 12px;">
            ${locationCount || weatherData.length} location${(locationCount || weatherData.length) !== 1 ? 's' : ''} • Fresh data • 14-day forecast
          </div>
        </div>
  `

  // Add each location with its own metrics and 14-day table
  for (const { location, weather } of weatherData) {
    const coords = `${location.latitude?.toFixed(4) || 'N/A'}, ${location.longitude?.toFixed(4) || 'N/A'}`
    
    // Get today's values (first day in forecast)
    const todayMax = safe(weather?.daily?.temperature_2m_max?.[0]?.toFixed(0), 'N/A')
    const todayMin = safe(weather?.daily?.temperature_2m_min?.[0]?.toFixed(0), 'N/A')
    const todayWind = safe(weather?.daily?.wind_speed_10m_max?.[0]?.toFixed(1), 'N/A')
    const todayPrecip = safe(weather?.daily?.precipitation_sum?.[0]?.toFixed(2), '0.00')
    const todayET0Daily = safe(weather?.daily?.et0_fao_evapotranspiration?.[0]?.toFixed(2), 'N/A')
    const todayET0Sum = safe(weather?.daily?.et0_fao_evapotranspiration_sum?.[0]?.toFixed(2), 'N/A')

    emailHTML += `
        <!-- Location Card -->
        <div style="padding: 28px; margin: 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
          
          <!-- Location Header -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding: 16px 20px; background: rgba(74, 85, 104, 0.4); border-radius: 8px; border-left: 3px solid #4299e1;">
            <div>
              <h2 style="color: #ffffff; margin: 0 0 4px 0; font-size: 20px; font-weight: 700;">${safe(location.name, 'Unknown location')}</h2>
              <div style="color: #cbd5e0; font-size: 12px; margin-bottom: 2px;">NCEP GFS Seamless Model • 14-day Forecast</div>
              <div style="color: #a0aec0; font-size: 11px;">📍 ${coords}</div>
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

          <!-- 14-Day Forecast Table for this location -->
          <div style="margin-top: 24px; padding: 20px; background: rgba(74, 85, 104, 0.2); border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);">
            <h3 style="color: #ffffff; margin: 0 0 16px 0; font-size: 16px; font-weight: 600;">📊 14-Day Forecast - ${location.name}</h3>
            <div style="color: #cbd5e0; font-size: 12px; margin-bottom: 12px;">Complete weather data for the next two weeks</div>
            
            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                <thead>
                  <tr style="border-bottom: 1px solid rgba(255,255,255,0.2);">
                    <th style="padding: 6px 8px; text-align: left; color: #cbd5e0; font-weight: 600; font-size: 10px; text-transform: uppercase;">DATE</th>
                    <th style="padding: 6px 8px; text-align: left; color: #cbd5e0; font-weight: 600; font-size: 10px; text-transform: uppercase;">HIGH (°F)</th>
                    <th style="padding: 6px 8px; text-align: left; color: #cbd5e0; font-weight: 600; font-size: 10px; text-transform: uppercase;">LOW (°F)</th>
                    <th style="padding: 6px 8px; text-align: left; color: #cbd5e0; font-weight: 600; font-size: 10px; text-transform: uppercase;">WIND (MPH)</th>
                    <th style="padding: 6px 8px; text-align: left; color: #cbd5e0; font-weight: 600; font-size: 10px; text-transform: uppercase;">PRECIP (IN)</th>
                    <th style="padding: 6px 8px; text-align: left; color: #cbd5e0; font-weight: 600; font-size: 10px; text-transform: uppercase;">ET₀ (MM)</th>
                  </tr>
                </thead>
                <tbody>`

    // Add 14 days of data for this specific location
    for (let dayIndex = 0; dayIndex < 14; dayIndex++) {
      if (!weather?.daily?.time?.[dayIndex]) continue

      const rowStyle = dayIndex % 2 === 0 ? 'background: rgba(255,255,255,0.03);' : 'background: transparent;'
      
      // Get date
      let displayDate = '—'
      try {
        displayDate = new Date(weather.daily.time[dayIndex]).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })
      } catch (e) {}

      const high = (weather.daily.temperature_2m_max?.[dayIndex] !== undefined) ? Number(weather.daily.temperature_2m_max[dayIndex]).toFixed(0) + '°' : '—'
      const low = (weather.daily.temperature_2m_min?.[dayIndex] !== undefined) ? Number(weather.daily.temperature_2m_min[dayIndex]).toFixed(0) + '°' : '—'
      const wind = (weather.daily.wind_speed_10m_max?.[dayIndex] !== undefined) ? Number(weather.daily.wind_speed_10m_max[dayIndex]).toFixed(1) : '—'
      const precip = (weather.daily.precipitation_sum?.[dayIndex] !== undefined) ? Number(weather.daily.precipitation_sum[dayIndex]).toFixed(2) : '—'
      const et0 = (weather.daily.et0_fao_evapotranspiration?.[dayIndex] !== undefined) ? Number(weather.daily.et0_fao_evapotranspiration[dayIndex]).toFixed(2) : '—'

      emailHTML += `
                  <tr style="${rowStyle}">
                    <td style="padding: 6px 8px; color: #e2e8f0; border-bottom: 1px solid rgba(255,255,255,0.08); font-weight: 600;">${displayDate}</td>
                    <td style="padding: 6px 8px; color: #ffffff; font-weight: 600; border-bottom: 1px solid rgba(255,255,255,0.08);">${high}</td>
                    <td style="padding: 6px 8px; color: #cbd5e0; border-bottom: 1px solid rgba(255,255,255,0.08);">${low}</td>
                    <td style="padding: 6px 8px; color: #cbd5e0; border-bottom: 1px solid rgba(255,255,255,0.08);">${wind}</td>
                    <td style="padding: 6px 8px; color: #cbd5e0; border-bottom: 1px solid rgba(255,255,255,0.08);">${precip}</td>
                    <td style="padding: 6px 8px; color: #cbd5e0; border-bottom: 1px solid rgba(255,255,255,0.08);">${et0}</td>
                  </tr>`
    }

    emailHTML += `
                </tbody>
              </table>
            </div>
          </div>

        </div>`
  }

  // Close email content
  emailHTML += `
        <!-- Email Footer -->
        <div style="padding: 20px 28px; border-top: 1px solid rgba(255,255,255,0.1); margin-top: 20px;">
          <div style="text-align: center; color: #a0aec0; font-size: 11px; line-height: 1.5;">
            <div style="margin-bottom: 8px;">
              <strong style="color: #cbd5e0;">Weather data provided by Open-Meteo</strong><br>
              NCEP GFS Seamless Model • Updated multiple times daily
            </div>
            <div>
              📧 You're receiving this because you subscribed to weather updates<br>
              ${includeUnsubscribe ? '<a href="#" style="color: #4299e1; text-decoration: none;">Unsubscribe</a> | ' : ''}<a href="#" style="color: #4299e1; text-decoration: none;">Manage Preferences</a>
            </div>
          </div>
        </div>

      </div>
    </body>
    </html>
  `

  return emailHTML
}

// Send test email for multi-location consolidation
async function sendConsolidatedTestEmail() {
  console.log('🧪 Sending consolidated multi-location test email with individual 14-day tables...\n')
  
  const weatherIcon = getWeatherIcon(testMultiLocationWeatherData)
  const subject = `${weatherIcon} Multi-Location Weather Report - ${new Date().toLocaleDateString('en-GB')}`
  const emailHTML = createConsolidatedEmailContent('Gabriel', testMultiLocationWeatherData, false, 3)
  
  console.log(`📧 Weather Icon: ${weatherIcon}`)
  console.log(`📧 Subject: ${subject}`)
  console.log(`📧 Locations: ${testMultiLocationWeatherData.map(d => d.location.name).join(', ')}`)
  console.log(`📧 HTML Length: ${emailHTML.length} characters\n`)
  
  const resendApiKey = process.env.RESEND_API_KEY || 're_Y8QJJ4f6_LAzk7qfPPZv9ZL1kfQZnhsej'
  const fromEmail = process.env.FROM_EMAIL || 'weather@resend.dev'
  
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
    })

    const result = await response.json()
    
    if (response.ok) {
      console.log(`✅ Consolidated email sent successfully!`)
      console.log(`📧 Email ID: ${result.id}`)
      console.log(`🎯 Sent to: gabrielriosemail@gmail.com`)
      console.log(`📍 Locations included:`)
      testMultiLocationWeatherData.forEach((data, index) => {
        console.log(`   ${index + 1}. ${data.location.name} (${data.location.latitude}, ${data.location.longitude})`)
      })
      console.log(`📱 Each location has its own 14-day forecast table!`)
      console.log(`📊 Check your email inbox for the complete report!`)
    } else {
      console.log(`❌ Email failed to send: ${result.message || 'Unknown error'}`)
      console.log('Full response:', result)
    }
  } catch (error) {
    console.error(`❌ Error sending email: ${error.message}`)
  }
}

sendConsolidatedTestEmail()