import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation
function validateInput(body: unknown): { location: string } {
  if (!body || typeof body !== 'object') {
    throw new Error("Invalid request body");
  }

  const { location } = body as Record<string, unknown>;

  if (!location || typeof location !== 'string') {
    throw new Error("Location is required and must be a string");
  }

  const trimmedLocation = location.trim();

  if (trimmedLocation.length < 2) {
    throw new Error("Location must be at least 2 characters");
  }

  if (trimmedLocation.length > 200) {
    throw new Error("Location must be less than 200 characters");
  }

  // Basic sanitization - allow only alphanumeric, spaces, commas, hyphens, and common location chars
  if (!/^[a-zA-Z0-9\s,\-.'()]+$/.test(trimmedLocation)) {
    throw new Error("Location contains invalid characters");
  }

  return { location: trimmedLocation };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Processing weather request...");

    const body = await req.json();
    const { location } = validateInput(body);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log(`Fetching weather data for: ${location}`);

    // Get current date/time for accurate weather generation
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(' ')[0].slice(0, 5);

    // Using AI to generate realistic weather data based on location
    const prompt = `Generate comprehensive, professional-grade weather data for ${location} as of ${currentDate} ${currentTime} UTC.
Provide highly accurate, realistic data based on the location's typical climate, current season, and time of day.

Return in JSON format:
{
  "location": "city name, country",
  "coordinates": { "lat": number, "lon": number },
  "timezone": "timezone string",
  "last_updated": "ISO datetime string",
  "current": {
    "temperature": number in celsius,
    "feels_like": number in celsius,
    "condition": "weather condition (e.g., Sunny, Partly Cloudy, Overcast, Light Rain, Heavy Rain, Thunderstorm, Fog, Haze, Snow)",
    "condition_icon": "icon code (clear, partly_cloudy, cloudy, rain, heavy_rain, thunderstorm, fog, snow, mist)",
    "humidity": number (percentage 0-100),
    "wind_speed": number in km/h,
    "wind_direction": "direction (N, NE, E, SE, S, SW, W, NW)",
    "wind_degree": number (0-360),
    "pressure": number in hPa/mb,
    "visibility": number in km,
    "rainfall": number in mm (0 if no rain),
    "uv_index": number (0-11),
    "rain_chance": number (percentage 0-100),
    "cloud_cover": number (percentage 0-100),
    "dew_point": number in celsius,
    "air_quality_index": number (1-5 scale, 1=good, 5=hazardous)
  },
  "sun_moon": {
    "sunrise": "HH:MM format in local time",
    "sunset": "HH:MM format in local time",
    "moonrise": "HH:MM format in local time",
    "moonset": "HH:MM format in local time",
    "moon_phase": "phase name (New Moon, Waxing Crescent, First Quarter, Waxing Gibbous, Full Moon, Waning Gibbous, Last Quarter, Waning Crescent)",
    "day_length": "X hours Y minutes"
  },
  "hourly_forecast": [
    {
      "time": "HH:MM",
      "temperature": number,
      "feels_like": number,
      "condition": "condition",
      "condition_icon": "icon code",
      "rain_chance": number,
      "humidity": number,
      "wind_speed": number,
      "wind_direction": "direction"
    }
  ],
  "forecast": [
    {
      "day": "day name",
      "date": "YYYY-MM-DD",
      "temp_max": number,
      "temp_min": number,
      "temp": number (average),
      "condition": "condition",
      "condition_icon": "icon code",
      "rainfall_chance": number,
      "humidity": number,
      "wind_speed": number,
      "sunrise": "HH:MM",
      "sunset": "HH:MM",
      "uv_index": number
    }
  ],
  "alerts": [
    {
      "type": "alert type (heat_wave, cold_wave, heavy_rain, thunderstorm, flood, air_quality, uv_warning, wind_warning, fog_warning)",
      "severity": "low/medium/high/extreme",
      "title": "alert title",
      "description": "detailed description",
      "valid_from": "ISO datetime",
      "valid_until": "ISO datetime"
    }
  ],
  "farming_advice": [
    "5-7 specific, actionable farming recommendations based on current and forecast weather conditions"
  ]
}

Important instructions:
- Generate exactly 24 hourly forecasts starting from the current hour
- Generate exactly 7 days of forecast data including today
- Include realistic weather alerts if conditions warrant (extreme heat >40°C, heavy rain >50mm, high UV >8, strong winds >50km/h, poor air quality)
- Base all data on realistic patterns for the specified location and season
- Use local timezone for sunrise/sunset times`;

    let response;
    let lastError;
    
    // Retry logic for transient failures
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content: 'You are a meteorologist and agricultural advisor. Provide accurate weather data and farming recommendations.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
          }),
        });

        if (response.ok) {
          break; // Success, exit retry loop
        }
        
        const errorText = await response.text();
        lastError = `${response.status}: ${errorText}`;
        console.error(`AI API error (attempt ${attempt}/3):`, lastError);
        
        if (attempt < 3) {
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      } catch (fetchError) {
        lastError = fetchError instanceof Error ? fetchError.message : 'Unknown fetch error';
        console.error(`Network error (attempt ${attempt}/3):`, lastError);
        
        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    if (!response || !response.ok) {
      console.error('All retry attempts failed. Using fallback data.');
      throw new Error(`Weather API failed after retries: ${lastError}`);
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    let result;
    try {
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/);
      const jsonString = jsonMatch ? jsonMatch[1] : content;
      result = JSON.parse(jsonString);
    } catch (e) {
      console.error("Failed to parse weather data:", content);
      const now = new Date();
      result = {
        location: location,
        coordinates: { lat: 0, lon: 0 },
        timezone: "UTC",
        last_updated: now.toISOString(),
        current: {
          temperature: 25,
          feels_like: 27,
          condition: "Data unavailable",
          condition_icon: "cloudy",
          humidity: 60,
          wind_speed: 10,
          wind_direction: "N",
          wind_degree: 0,
          pressure: 1013,
          visibility: 10,
          rainfall: 0,
          uv_index: 5,
          rain_chance: 0,
          cloud_cover: 50,
          dew_point: 15,
          air_quality_index: 1
        },
        sun_moon: {
          sunrise: "06:00",
          sunset: "18:00",
          moonrise: "20:00",
          moonset: "08:00",
          moon_phase: "Waxing Crescent",
          day_length: "12 hours 0 minutes"
        },
        hourly_forecast: [],
        forecast: [],
        alerts: [],
        farming_advice: ["Weather data temporarily unavailable. Please try again."]
      };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in get-weather function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        location: "Unknown",
        current: {
          temperature: 0,
          feels_like: 0,
          condition: "Error",
          humidity: 0,
          wind_speed: 0,
          rainfall: 0,
          uv_index: 0
        },
        forecast: [],
        farming_advice: ["Weather service temporarily unavailable"]
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
