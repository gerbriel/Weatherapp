import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailData {
  to_name: string;
  to_email: string;
  weather_data: string;
  locations_count: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get current time
    const now = new Date()
    console.log(`Checking for emails to send at ${now.toISOString()}`)

    // Get subscriptions due for sending
    const { data: subscriptions, error: subscriptionsError } = await supabaseClient
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

    // Process each subscription
    const results = []
    
    for (const subscription of subscriptions) {
      try {
        console.log(`Processing subscription ${subscription.id} for ${subscription.email}`)

        // Fetch weather data for selected locations
        const weatherData = await fetchWeatherDataForLocations(subscription.selected_location_ids)
        
        // Create email content
        const emailContent = createEmailContent(subscription.name, weatherData)
        
        // Send email via EmailJS API (or your preferred email service)
        const emailResult = await sendEmailViaService({
          to_name: subscription.name,
          to_email: subscription.email,
          weather_data: emailContent,
          locations_count: subscription.selected_location_ids.length
        })

        // Log the send attempt
        await supabaseClient
          .from('email_send_logs')
          .insert([{
            subscription_id: subscription.id,
            status: emailResult.success ? 'sent' : 'failed',
            error_message: emailResult.success ? null : emailResult.error,
            locations_count: subscription.selected_location_ids.length,
            weather_data: { locations: weatherData }
          }])

        if (emailResult.success) {
          // Update subscription with last_sent and calculate next_send_at
          await updateSubscriptionAfterSend(supabaseClient, subscription)
          console.log(`Successfully sent email to ${subscription.email}`)
        } else {
          console.error(`Failed to send email to ${subscription.email}:`, emailResult.error)
        }

        results.push({
          subscription_id: subscription.id,
          email: subscription.email,
          success: emailResult.success,
          error: emailResult.error
        })

      } catch (error) {
        console.error(`Error processing subscription ${subscription.id}:`, error)
        
        // Log the failure
        await supabaseClient
          .from('email_send_logs')
          .insert([{
            subscription_id: subscription.id,
            status: 'failed',
            error_message: error.message,
            locations_count: subscription.selected_location_ids.length
          }])

        results.push({
          subscription_id: subscription.id,
          email: subscription.email,
          success: false,
          error: error.message
        })
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
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

// Fetch weather data for multiple locations
async function fetchWeatherDataForLocations(locationIds: string[]): Promise<any[]> {
  const weatherData = []
  
  for (const locationId of locationIds) {
    try {
      // Get location details from database
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )
      
      const { data: location, error } = await supabaseClient
        .from('weather_locations')
        .select('*')
        .eq('id', locationId)
        .single()

      if (error || !location) {
        console.error(`Location ${locationId} not found:`, error)
        continue
      }

      // Fetch weather data from Open Meteo API
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&daily=temperature_2m_max,temperature_2m_min,wind_speed_10m_max,precipitation_sum,rain_sum,et0_fao_evapotranspiration,et0_fao_evapotranspiration_sum&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=auto&forecast_days=14&models=ncep_gfs_seamless`
      
      const weatherResponse = await fetch(weatherUrl)
      const weatherJson = await weatherResponse.json()
      
      weatherData.push({
        location: location,
        weather: weatherJson
      })
      
    } catch (error) {
      console.error(`Error fetching weather for location ${locationId}:`, error)
    }
  }
  
  return weatherData
}

// Create HTML email content
function createEmailContent(userName: string, weatherData: any[]): string {
  const currentDate = new Date().toLocaleDateString('en-GB', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
  
  let emailHTML = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
      <div style="background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <h1 style="color: #0969da; margin-bottom: 8px; font-size: 24px;">🌤️ Weekly Weather Report</h1>
        <p style="color: #656d76; margin-bottom: 30px; font-size: 16px;">Hello ${userName}! Here's your weather update for ${currentDate}</p>
  `
  
  weatherData.forEach(({ location, weather }) => {
    const today = weather.daily
    const todayData = {
      tempMax: today.temperature_2m_max?.[0] || 'N/A',
      tempMin: today.temperature_2m_min?.[0] || 'N/A',
      windSpeed: today.wind_speed_10m_max?.[0] || 'N/A',
      precipitation: today.precipitation_sum?.[0] || 'N/A',
      et0: today.et0_fao_evapotranspiration?.[0] || 'N/A'
    }
    
    emailHTML += `
      <div style="border: 1px solid #d1d9e0; border-radius: 6px; padding: 20px; margin-bottom: 20px;">
        <h2 style="color: #24292f; margin-bottom: 15px; font-size: 18px;">📍 ${location.name}</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
          <div style="background: #f6f8fa; padding: 15px; border-radius: 6px;">
            <div style="color: #656d76; font-size: 12px; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Temperature</div>
            <div style="color: #24292f; font-size: 20px; font-weight: 600;">
              High: ${todayData.tempMax}°F<br>
              <small style="font-size: 16px;">Low: ${todayData.tempMin}°F</small>
            </div>
          </div>
          <div style="background: #f6f8fa; padding: 15px; border-radius: 6px;">
            <div style="color: #656d76; font-size: 12px; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Wind Speed</div>
            <div style="color: #24292f; font-size: 20px; font-weight: 600;">${todayData.windSpeed} mph</div>
          </div>
          <div style="background: #f6f8fa; padding: 15px; border-radius: 6px;">
            <div style="color: #656d76; font-size: 12px; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Precipitation</div>
            <div style="color: #24292f; font-size: 20px; font-weight: 600;">${todayData.precipitation} in</div>
          </div>
          <div style="background: #f6f8fa; padding: 15px; border-radius: 6px;">
            <div style="color: #656d76; font-size: 12px; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">ET₀ Daily</div>
            <div style="color: #24292f; font-size: 20px; font-weight: 600;">${todayData.et0} mm</div>
          </div>
        </div>
      </div>
    `
  })
  
  emailHTML += `
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #d1d9e0;">
          <p style="color: #656d76; font-size: 14px;">This report was generated by ET Weather App</p>
        </div>
      </div>
    </div>
  `
  
  return emailHTML
}

// Send email via external service (EmailJS or other)
async function sendEmailViaService(emailData: EmailData): Promise<{ success: boolean; error?: string }> {
  try {
    // Use EmailJS API directly
    const emailJSUrl = 'https://api.emailjs.com/api/v1.0/email/send'
    
    const payload = {
      service_id: Deno.env.get('EMAILJS_SERVICE_ID'),
      template_id: Deno.env.get('EMAILJS_TEMPLATE_ID'),
      user_id: Deno.env.get('EMAILJS_PUBLIC_KEY'),
      template_params: {
        to_name: emailData.to_name,
        to_email: emailData.to_email,
        from_name: 'ET Weather App',
        subject: `🌤️ Weekly Weather Report - ${new Date().toLocaleDateString('en-GB')}`,
        message_html: emailData.weather_data,
        reply_to: 'noreply@etweather.app'
      }
    }
    
    const response = await fetch(emailJSUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    })
    
    if (response.ok) {
      return { success: true }
    } else {
      const errorText = await response.text()
      return { success: false, error: `EmailJS API error: ${response.status} - ${errorText}` }
    }
    
  } catch (error) {
    return { success: false, error: `Email send failed: ${error.message}` }
  }
}

// Update subscription after successful send
async function updateSubscriptionAfterSend(supabaseClient: any, subscription: any) {
  const now = new Date().toISOString()
  
  let nextSendAt = null
  
  // If recurring, calculate next send time
  if (subscription.is_recurring) {
    const { data: nextSendResult, error: nextSendError } = await supabaseClient
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
  await supabaseClient
    .from('email_subscriptions')
    .update({
      last_sent_at: now,
      next_send_at: nextSendAt
    })
    .eq('id', subscription.id)
}