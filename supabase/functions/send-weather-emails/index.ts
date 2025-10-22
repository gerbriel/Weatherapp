import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WeatherLocationData {
  location: {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
  };
  weather: any;
}

// Generate chart URLs for email templates using QuickChart.io
function generateEmailChartUrls(location: any, weather: any) {
  if (!weather?.daily) return null;

  const daily = weather.daily;
  const dates = daily.time?.slice(0, 14) || [];
  const precipitation = daily.precipitation_sum?.slice(0, 14) || [];
  const rain = daily.rain_sum?.slice(0, 14) || [];
  // Convert ET₀ from mm to inches (1 mm = 0.0393701 inches)
  const et0 = (daily.et0_fao_evapotranspiration?.slice(0, 14) || []).map((value: number) => value * 0.0393701);

  // Format dates for chart labels (Oct 21, Oct 22, etc.)
  const labels = dates.map((date: string) => {
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
}

// Generate chart HTML for email templates
function generateEmailChartHTML(location: any, weather: any): string {
  const chartUrls = generateEmailChartUrls(location, weather);
  
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
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const fromEmail = Deno.env.get('FROM_EMAIL') || 'weather@resend.dev'

    if (!supabaseUrl || !supabaseKey || !resendApiKey) {
      throw new Error('Missing required environment variables')
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get current time
    const now = new Date()
    console.log(`Checking for emails to send at ${now.toISOString()}`)

    // Get subscriptions due for sending
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from('email_subscriptions')
      .select('*')
      .eq('enabled', true)
      .lte('next_send_at', now.toISOString())

    if (subscriptionsError) {
      console.error('Error fetching subscriptions:', subscriptionsError)
      throw subscriptionsError
    }

    console.log(`Found ${subscriptions?.length || 0} subscriptions due for sending`)

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No subscriptions due for sending', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Group subscriptions by email and send time for consolidation
    const emailGroups = new Map<string, any[]>()
    
    for (const subscription of subscriptions) {
      // Create a key combining email and send time (rounded to nearest hour for grouping)
      const sendTime = new Date(subscription.next_send_at || now)
      const hourKey = `${sendTime.getFullYear()}-${sendTime.getMonth()}-${sendTime.getDate()}-${sendTime.getHours()}`
      const groupKey = `${subscription.email}:${hourKey}`
      
      if (!emailGroups.has(groupKey)) {
        emailGroups.set(groupKey, [])
      }
      emailGroups.get(groupKey)!.push(subscription)
    }

    console.log(`Grouped ${subscriptions.length} subscriptions into ${emailGroups.size} consolidated emails`)

    // Process each email group (one email per group)
    const results = []
    
    for (const [groupKey, groupSubscriptions] of emailGroups) {
      try {
        const firstSubscription = groupSubscriptions[0]
        const email = firstSubscription.email
        const userName = firstSubscription.name
        
        console.log(`Processing email group for ${email} with ${groupSubscriptions.length} subscription(s)`)

        // Debug: Log subscription details
        console.log('Subscription details:')
        for (let i = 0; i < groupSubscriptions.length; i++) {
          const sub = groupSubscriptions[i]
          console.log(`  Subscription ${i + 1}:`)
          console.log(`    ID: ${sub.id}`)
          console.log(`    Email: ${sub.email}`)
          console.log(`    selected_location_ids:`, sub.selected_location_ids)
          console.log(`    selected_location_ids type:`, typeof sub.selected_location_ids)
          console.log(`    selected_location_ids length:`, sub.selected_location_ids?.length || 'undefined')
        }

        // Collect all unique location IDs from all subscriptions in this group
        const allLocationIds = new Set<string>()
        for (const sub of groupSubscriptions) {
          console.log(`Processing subscription ${sub.id} with selected_location_ids:`, sub.selected_location_ids)
          if (sub.selected_location_ids && Array.isArray(sub.selected_location_ids)) {
            for (const locationId of sub.selected_location_ids) {
              console.log(`  Adding location ID: ${locationId}`)
              allLocationIds.add(locationId)
            }
          } else {
            console.log(`  WARNING: selected_location_ids is not an array or is null/undefined`)
          }
        }
        
        console.log(`Total unique location IDs collected: ${allLocationIds.size}`)
        console.log(`Location IDs:`, Array.from(allLocationIds))
        
        // Fetch fresh weather data for all locations (ensure fresh data right before send)
        const allWeatherData = await fetchWeatherDataForLocations(Array.from(allLocationIds), supabase)
        
        // Create consolidated email content
        const isWelcomeEmail = groupSubscriptions.some(sub => !sub.last_sent_at)
        const emailHtml = createConsolidatedEmailContent(userName, allWeatherData, isWelcomeEmail)
        
        // Generate dynamic weather icon based on primary location
        const weatherIcon = getWeatherIcon(allWeatherData)
        
        // Send consolidated email via Resend API
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [email],
            subject: `${weatherIcon} Weather Report - ${new Date().toLocaleDateString('en-GB')}`,
            html: emailHtml,
            reply_to: fromEmail
          }),
        })

        const emailResult = await emailResponse.json()
        const success = emailResponse.ok

        // Log the send attempt for each subscription in the group
        for (const subscription of groupSubscriptions) {
          await supabase
            .from('email_send_logs')
            .insert([{
              subscription_id: subscription.id,
              status: success ? 'sent' : 'failed',
              error_message: success ? null : (emailResult.message || 'Unknown error'),
              locations_count: allLocationIds.size,
              weather_data: { locations: allWeatherData }
            }])

          if (success) {
            // Update subscription with last_sent and calculate next_send_at
            await updateSubscriptionAfterSend(supabase, subscription)
          }

          results.push({
            subscription_id: subscription.id,
            email: subscription.email,
            success: success,
            error: success ? null : emailResult.message
          })
        }

        if (success) {
          console.log(`Successfully sent consolidated email to ${email} (${groupSubscriptions.length} subscriptions, ${allLocationIds.size} locations)`)
        } else {
          console.error(`Failed to send consolidated email to ${email}:`, emailResult.message)
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error(`Error processing email group ${groupKey}:`, error)
        
        // Log the failure for each subscription in the group
        for (const subscription of groupSubscriptions) {
          await supabase
            .from('email_send_logs')
            .insert([{
              subscription_id: subscription.id,
              status: 'failed',
              error_message: errorMessage,
              locations_count: subscription.selected_location_ids.length
            }])

          results.push({
            subscription_id: subscription.id,
            email: subscription.email,
            success: false,
            error: errorMessage
          })
        }
      }
    }

    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    return new Response(
      JSON.stringify({
        message: `Processed ${results.length} subscriptions`,
        success_count: successCount,
        failure_count: failureCount,
        results: results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

// Fetch weather data for multiple locations
async function fetchWeatherDataForLocations(locationIds: string[], supabase: any): Promise<WeatherLocationData[]> {
  console.log(`\n=== fetchWeatherDataForLocations called with ${locationIds.length} location IDs ===`)
  console.log('Location IDs to fetch:', locationIds)
  
  const locations: WeatherLocationData[] = []
  
  for (const locationId of locationIds) {
    try {
      console.log(`\n--- Fetching location data for ID: ${locationId} ---`)
      
      // Get location from database
      const { data: locationData, error: locationError } = await supabase
        .from('weather_locations')
        .select('*')
        .eq('id', locationId)
        .single()

      if (locationError) {
        console.error(`❌ Error fetching location ${locationId}:`, locationError)
        continue
      }
      
      if (!locationData) {
        console.error(`❌ No location data found for ID: ${locationId}`)
        continue
      }
      
      console.log(`✅ Found location data for ${locationId}:`, {
        id: locationData.id,
        name: locationData.name,
        latitude: locationData.latitude,
        longitude: locationData.longitude
      })
      
      // TODO: Add weather fetching and processing here
      
    } catch (error) {
      console.error(`❌ Error processing location ${locationId}:`, error)
    }
  }
  
  console.log(`\n=== Finished fetching. Returning ${locations.length} locations ===`)
  return locations
}

// Function to determine weather icon based on conditions
function getWeatherIcon(weatherData: WeatherLocationData[]): string {
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

// Create consolidated HTML email content with dashboard-style design and footer sections
function createConsolidatedEmailContent(userName: string, weatherData: WeatherLocationData[], isWelcome: boolean = false, subscriptionCount: number = 1): string {
  const currentDate = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const safe = (v: any, fallback = 'N/A') => (v === null || v === undefined) ? fallback : v
  const locationCount = weatherData.length

  let emailHTML = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; max-width: 900px; margin: 0 auto; padding: 16px; background-color: #1a202c;">
      <div style="background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%); border-radius: 12px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.3);">
        
        <!-- Email Header -->
        <div style="padding: 24px 28px 16px; background: rgba(45, 55, 72, 0.95);">
          <div style="color: #ffffff; font-size: 16px; font-weight: 600; margin-bottom: 6px;">Hello ${userName}! ${isWelcome ? 'Welcome — here is your first' : 'Here is your'} weather update</div>
          <div style="color: #a0aec0; font-size: 13px;">${currentDate} • ${locationCount} location${locationCount === 1 ? '' : 's'}</div>
        </div>
  `

  // For each location, create a dashboard-style section (without 14-day table)
  for (const { location, weather } of weatherData) {
    const lat = safe(location.latitude)
    const lon = safe(location.longitude)
    const coords = `${lat}, ${lon}`

    const daily = (weather && weather.daily) ? weather.daily : {}
    const units = (weather && weather.daily_units) ? weather.daily_units : {}
    const et0Daily = daily.et0_fao_evapotranspiration || []
    const et0Sum = daily.et0_fao_evapotranspiration_sum || []

    // Today's data (index 0)
    const tempMaxArr = daily.temperature_2m_max || []
    const tempMinArr = daily.temperature_2m_min || []
    const windArr = daily.wind_speed_10m_max || []
    const precipArr = daily.precipitation_sum || []
    const datesArr = daily.time || []

    const todayMax = safe((tempMaxArr[0] !== undefined) ? Number(tempMaxArr[0]).toFixed(1) : null, 'N/A')
    const todayMin = safe((tempMinArr[0] !== undefined) ? Number(tempMinArr[0]).toFixed(1) : null, 'N/A')
    const todayWind = safe((windArr[0] !== undefined) ? Number(windArr[0]).toFixed(1) : null, 'N/A')
    const todayPrecip = safe((precipArr[0] !== undefined) ? Number(precipArr[0]).toFixed(2) : null, 'N/A')
    // Convert ET₀ values from mm to inches for display
    const todayET0Daily = safe((et0Daily[0] !== undefined) ? Number(et0Daily[0] * 0.0393701).toFixed(3) : null, 'N/A')
    const todayET0Sum = safe((et0Sum[0] !== undefined) ? Number(et0Sum[0] * 0.0393701).toFixed(3) : null, 'N/A')

    emailHTML += `
        <!-- Location Section -->
        <div style="padding: 0 28px 24px;">
          
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
              <div style="color: #ffffff; font-size: 24px; font-weight: 700;">${todayET0Daily} inches</div>
              <div style="color: #a0aec0; font-size: 11px; margin-top: 2px;">Daily evapotranspiration</div>
            </div>

            <!-- ET₀ Sum -->
            <div style="background: rgba(74, 85, 104, 0.4); border-radius: 8px; padding: 16px; border: 1px solid rgba(255,255,255,0.1);">
              <div style="display: flex; align-items: center; margin-bottom: 8px;">
                <span style="font-size: 18px; margin-right: 8px;">🌱</span>
                <span style="color: #cbd5e0; font-size: 12px; font-weight: 600; text-transform: uppercase;">ET₀<br>(Sum)</span>
              </div>
              <div style="color: #ffffff; font-size: 24px; font-weight: 700;">${todayET0Sum} inches</div>
              <div style="color: #a0aec0; font-size: 11px; margin-top: 2px;">Cumulative evapotranspiration</div>
            </div>

          </div>

          <!-- Weather Charts for this location -->
          ${generateEmailChartHTML(location, weather)}

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
                    <th style="padding: 6px 8px; text-align: left; color: #cbd5e0; font-weight: 600; font-size: 10px; text-transform: uppercase;">ET₀ (INCHES)</th>
                  </tr>
                </thead>
                <tbody>`

    // Add 14 days of data for this specific location
    for (let dayIndex = 0; dayIndex < Math.min(14, datesArr.length); dayIndex++) {
      if (!datesArr[dayIndex]) continue

      const rowStyle = dayIndex % 2 === 0 ? 'background: rgba(255,255,255,0.03);' : 'background: transparent;'
      
      // Get date
      let displayDate = '—'
      try {
        displayDate = new Date(datesArr[dayIndex]).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })
      } catch (e) {}

      const high = (tempMaxArr[dayIndex] !== undefined) ? Number(tempMaxArr[dayIndex]).toFixed(0) + '°' : '—'
      const low = (tempMinArr[dayIndex] !== undefined) ? Number(tempMinArr[dayIndex]).toFixed(0) + '°' : '—'
      const wind = (windArr[dayIndex] !== undefined) ? Number(windArr[dayIndex]).toFixed(1) : '—'
      const precip = (precipArr[dayIndex] !== undefined) ? Number(precipArr[dayIndex]).toFixed(2) : '—'
      const et0 = (et0Daily[dayIndex] !== undefined) ? Number(et0Daily[dayIndex] * 0.0393701).toFixed(3) : '—'

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

        </div>
    `
  }

  // Add consolidated footer sections for all locations
  // Footer sections are now included individually with each location, not consolidated

  emailHTML += `
        <!-- Footer -->
        <div style="padding: 20px 28px; background: rgba(45, 55, 72, 0.7); border-top: 1px solid rgba(255,255,255,0.1); text-align: center;">
          <div style="color: #a0aec0; font-size: 13px; margin-bottom: 4px;">This automated report was generated by ET Weather App</div>
          <div style="color: #718096; font-size: 11px;">Data from Open-Meteo API & your saved locations • Fresh data fetched at send time</div>
        </div>

      </div>
    </div>
  `

  return emailHTML
}

// Create footer sections: Precipitation Forecast, ET₀ Forecast, and 14-Day Data Table
function createConsolidatedFooterSections(weatherData: WeatherLocationData[]): string {
  const safe = (v: any, fallback = 'N/A') => (v === null || v === undefined) ? fallback : v
  
  if (!weatherData || weatherData.length === 0) {
    return ''
  }

  let footerHTML = `
        <!-- Consolidated Footer Sections -->
        <div style="padding: 0 28px 24px; border-top: 2px solid rgba(255,255,255,0.1); margin-top: 20px;">
          
          <!-- Precipitation Forecast (14 Days) -->
          <div style="background: rgba(74, 85, 104, 0.2); border-radius: 8px; padding: 20px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.1);">
            <h3 style="color: #ffffff; margin: 0 0 16px 0; font-size: 16px; font-weight: 600;">💧 Precipitation Forecast (14 Days)</h3>
            <div style="color: #cbd5e0; font-size: 12px; margin-bottom: 12px;">Daily precipitation amounts across all selected locations</div>
            
            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                <thead>
                  <tr style="border-bottom: 1px solid rgba(255,255,255,0.2);">
                    <th style="padding: 6px 8px; text-align: left; color: #cbd5e0; font-weight: 600; font-size: 10px; text-transform: uppercase;">DATE</th>`

  // Add column headers for each location
  for (const { location } of weatherData) {
    footerHTML += `<th style="padding: 6px 8px; text-align: left; color: #cbd5e0; font-weight: 600; font-size: 10px; text-transform: uppercase;">${location.name}</th>`
  }

  footerHTML += `
                  </tr>
                </thead>
                <tbody>`

  // Add 14 days of precipitation data
  const maxDays = Math.max(...weatherData.map(wd => wd.weather?.daily?.time?.length || 0))
  for (let dayIndex = 0; dayIndex < Math.min(14, maxDays); dayIndex++) {
    const rowStyle = dayIndex % 2 === 0 ? 'background: rgba(255,255,255,0.03);' : 'background: transparent;'
    
    // Get date from first location that has data
    let displayDate = '—'
    for (const { weather } of weatherData) {
      if (weather?.daily?.time?.[dayIndex]) {
        try {
          displayDate = new Date(weather.daily.time[dayIndex]).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })
          break
        } catch (e) {}
      }
    }

    footerHTML += `
                  <tr style="${rowStyle}">
                    <td style="padding: 6px 8px; color: #e2e8f0; border-bottom: 1px solid rgba(255,255,255,0.08); font-weight: 600;">${displayDate}</td>`

    // Add precipitation data for each location
    for (const { weather } of weatherData) {
      const precip = weather?.daily?.precipitation_sum?.[dayIndex]
      const precipValue = (precip !== undefined) ? Number(precip).toFixed(2) + ' in' : '—'
      footerHTML += `<td style="padding: 6px 8px; color: #cbd5e0; border-bottom: 1px solid rgba(255,255,255,0.08);">${precipValue}</td>`
    }

    footerHTML += `</tr>`
  }

  footerHTML += `
                </tbody>
              </table>
            </div>
          </div>

          <!-- ET₀ Forecast (14 Days) -->
          <div style="background: rgba(74, 85, 104, 0.2); border-radius: 8px; padding: 20px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.1);">
            <h3 style="color: #ffffff; margin: 0 0 16px 0; font-size: 16px; font-weight: 600;">🌱 Evapotranspiration (ET₀) Forecast (14 Days)</h3>
            <div style="color: #cbd5e0; font-size: 12px; margin-bottom: 12px;">Daily evapotranspiration rates across all selected locations</div>
            
            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                <thead>
                  <tr style="border-bottom: 1px solid rgba(255,255,255,0.2);">
                    <th style="padding: 6px 8px; text-align: left; color: #cbd5e0; font-weight: 600; font-size: 10px; text-transform: uppercase;">DATE</th>`

  // Add column headers for each location
  for (const { location } of weatherData) {
    footerHTML += `<th style="padding: 6px 8px; text-align: left; color: #cbd5e0; font-weight: 600; font-size: 10px; text-transform: uppercase;">${location.name}</th>`
  }

  footerHTML += `
                  </tr>
                </thead>
                <tbody>`

  // Add 14 days of ET₀ data
  for (let dayIndex = 0; dayIndex < Math.min(14, maxDays); dayIndex++) {
    const rowStyle = dayIndex % 2 === 0 ? 'background: rgba(255,255,255,0.03);' : 'background: transparent;'
    
    // Get date from first location that has data
    let displayDate = '—'
    for (const { weather } of weatherData) {
      if (weather?.daily?.time?.[dayIndex]) {
        try {
          displayDate = new Date(weather.daily.time[dayIndex]).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })
          break
        } catch (e) {}
      }
    }

    footerHTML += `
                  <tr style="${rowStyle}">
                    <td style="padding: 6px 8px; color: #e2e8f0; border-bottom: 1px solid rgba(255,255,255,0.08); font-weight: 600;">${displayDate}</td>`

    // Add ET₀ data for each location
    for (const { weather } of weatherData) {
      const et0 = weather?.daily?.et0_fao_evapotranspiration?.[dayIndex]
      const et0Value = (et0 !== undefined) ? Number(et0 * 0.0393701).toFixed(3) + ' inches' : '—'
      footerHTML += `<td style="padding: 6px 8px; color: #cbd5e0; border-bottom: 1px solid rgba(255,255,255,0.08);">${et0Value}</td>`
    }

    footerHTML += `</tr>`
  }

  footerHTML += `
                </tbody>
              </table>
            </div>
          </div>

          <!-- 14-Day Forecast Data -->
          <div style="background: rgba(74, 85, 104, 0.2); border-radius: 8px; padding: 20px; border: 1px solid rgba(255,255,255,0.1);">
            <h3 style="color: #ffffff; margin: 0 0 16px 0; font-size: 16px; font-weight: 600;">📊 14-Day Forecast Data</h3>
            <div style="color: #cbd5e0; font-size: 12px; margin-bottom: 12px;">Comprehensive weather data for all selected locations</div>
            
            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                <thead>
                  <tr style="border-bottom: 1px solid rgba(255,255,255,0.2);">
                    <th style="padding: 6px 8px; text-align: left; color: #cbd5e0; font-weight: 600; font-size: 10px; text-transform: uppercase;">DATE</th>
                    <th style="padding: 6px 8px; text-align: left; color: #cbd5e0; font-weight: 600; font-size: 10px; text-transform: uppercase;">LOCATION</th>
                    <th style="padding: 6px 8px; text-align: left; color: #cbd5e0; font-weight: 600; font-size: 10px; text-transform: uppercase;">HIGH (°F)</th>
                    <th style="padding: 6px 8px; text-align: left; color: #cbd5e0; font-weight: 600; font-size: 10px; text-transform: uppercase;">LOW (°F)</th>
                    <th style="padding: 6px 8px; text-align: left; color: #cbd5e0; font-weight: 600; font-size: 10px; text-transform: uppercase;">WIND (MPH)</th>
                    <th style="padding: 6px 8px; text-align: left; color: #cbd5e0; font-weight: 600; font-size: 10px; text-transform: uppercase;">PRECIP (IN)</th>
                    <th style="padding: 6px 8px; text-align: left; color: #cbd5e0; font-weight: 600; font-size: 10px; text-transform: uppercase;">ET₀ (INCHES)</th>
                  </tr>
                </thead>
                <tbody>`

  // Add 14 days of comprehensive data for all locations
  let rowIndex = 0
  for (let dayIndex = 0; dayIndex < Math.min(14, maxDays); dayIndex++) {
    for (const { location, weather } of weatherData) {
      if (!weather?.daily?.time?.[dayIndex]) continue

      const rowStyle = rowIndex % 2 === 0 ? 'background: rgba(255,255,255,0.03);' : 'background: transparent;'
      
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

      footerHTML += `
                  <tr style="${rowStyle}">
                    <td style="padding: 6px 8px; color: #e2e8f0; border-bottom: 1px solid rgba(255,255,255,0.08); font-weight: 600;">${displayDate}</td>
                    <td style="padding: 6px 8px; color: #cbd5e0; border-bottom: 1px solid rgba(255,255,255,0.08); font-weight: 500;">${location.name}</td>
                    <td style="padding: 6px 8px; color: #ffffff; font-weight: 600; border-bottom: 1px solid rgba(255,255,255,0.08);">${high}</td>
                    <td style="padding: 6px 8px; color: #cbd5e0; border-bottom: 1px solid rgba(255,255,255,0.08);">${low}</td>
                    <td style="padding: 6px 8px; color: #cbd5e0; border-bottom: 1px solid rgba(255,255,255,0.08);">${wind}</td>
                    <td style="padding: 6px 8px; color: #cbd5e0; border-bottom: 1px solid rgba(255,255,255,0.08);">${precip}</td>
                    <td style="padding: 6px 8px; color: #cbd5e0; border-bottom: 1px solid rgba(255,255,255,0.08);">${et0}</td>
                  </tr>`
      
      rowIndex++
    }
  }

  footerHTML += `
                </tbody>
              </table>
            </div>
          </div>

        </div>
  `

  return footerHTML
}

// Update subscription after successful send
async function updateSubscriptionAfterSend(supabase: any, subscription: any) {
  const now = new Date().toISOString()
  
  let nextSendAt = null
  
  // If recurring, calculate next send time
  if (subscription.is_recurring) {
    const { data: nextSendResult, error: nextSendError } = await supabase
      .rpc('calculate_next_send_time', {
        day_of_week: subscription.schedule_day_of_week,
        hour: subscription.schedule_hour,
        minute: subscription.schedule_minute,
        timezone: subscription.schedule_timezone || 'UTC'
      })

    if (!nextSendError) {
      nextSendAt = nextSendResult
    }
  }
  
  // Update the subscription
  await supabase
    .from('email_subscriptions')
    .update({
      last_sent_at: now,
      next_send_at: nextSendAt
    })
    .eq('id', subscription.id)
}