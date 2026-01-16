import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Authentication helper
async function authenticateRequest(req: Request): Promise<{ userId: string } | Response> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({ error: 'Authentication required' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  );

  const token = authHeader.replace('Bearer ', '');
  const { data, error } = await supabaseClient.auth.getClaims(token);
  
  if (error || !data?.claims) {
    return new Response(
      JSON.stringify({ error: 'Invalid authentication' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return { userId: data.claims.sub as string };
}

// Valid soil types and seasons
const VALID_SOIL_TYPES = ['clay', 'sandy', 'loamy', 'silt', 'peat', 'chalk', 'alluvial', 'red soil', 'black soil', 'laterite'];
const VALID_SEASONS = ['spring', 'summer', 'autumn', 'fall', 'winter', 'monsoon', 'dry', 'wet', 'rabi', 'kharif', 'zaid'];

interface WeatherForecast {
  day: string;
  date?: string;
  temp_max?: number;
  temp_min?: number;
  temp?: number;
  condition: string;
  rainfall_chance?: number;
  humidity?: number;
}

interface WeatherData {
  location?: string;
  current?: {
    temperature: number;
    humidity: number;
    condition: string;
    rainfall?: number;
    wind_speed?: number;
  };
  forecast?: WeatherForecast[];
  alerts?: Array<{
    type: string;
    severity: string;
    title: string;
    description: string;
  }>;
}

// Input validation
function validateInput(body: unknown): { 
  soilType: string; 
  ph: number; 
  temperature: number; 
  rainfall: number | null; 
  season: string;
  location?: string;
  weatherData?: WeatherData;
} {
  if (!body || typeof body !== 'object') {
    throw new Error("Invalid request body");
  }

  const { soilType, ph, temperature, rainfall, season, location, weatherData } = body as Record<string, unknown>;

  // Validate soilType
  if (!soilType || typeof soilType !== 'string') {
    throw new Error("Soil type is required and must be a string");
  }
  const normalizedSoilType = soilType.toLowerCase().trim();
  if (normalizedSoilType.length < 2 || normalizedSoilType.length > 50) {
    throw new Error("Soil type must be between 2 and 50 characters");
  }

  // Validate pH
  if (typeof ph !== 'number' || isNaN(ph)) {
    throw new Error("pH must be a valid number");
  }
  if (ph < 0 || ph > 14) {
    throw new Error("pH must be between 0 and 14");
  }

  // Validate temperature
  if (typeof temperature !== 'number' || isNaN(temperature)) {
    throw new Error("Temperature must be a valid number");
  }
  if (temperature < -50 || temperature > 60) {
    throw new Error("Temperature must be between -50 and 60°C");
  }

  // Validate rainfall (optional)
  let validatedRainfall: number | null = null;
  if (rainfall !== undefined && rainfall !== null) {
    if (typeof rainfall !== 'number' || isNaN(rainfall)) {
      throw new Error("Rainfall must be a valid number");
    }
    if (rainfall < 0 || rainfall > 15000) {
      throw new Error("Rainfall must be between 0 and 15000 mm");
    }
    validatedRainfall = rainfall;
  }

  // Validate season
  if (!season || typeof season !== 'string') {
    throw new Error("Season is required and must be a string");
  }
  const normalizedSeason = season.toLowerCase().trim();
  if (normalizedSeason.length < 2 || normalizedSeason.length > 30) {
    throw new Error("Season must be between 2 and 30 characters");
  }

  // Validate location (optional)
  let validatedLocation: string | undefined;
  if (location && typeof location === 'string') {
    validatedLocation = location.trim();
  }

  // Validate weatherData (optional)
  let validatedWeatherData: WeatherData | undefined;
  if (weatherData && typeof weatherData === 'object') {
    validatedWeatherData = weatherData as WeatherData;
  }

  return { 
    soilType: normalizedSoilType, 
    ph, 
    temperature, 
    rainfall: validatedRainfall, 
    season: normalizedSeason,
    location: validatedLocation,
    weatherData: validatedWeatherData
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the request
    const authResult = await authenticateRequest(req);
    if (authResult instanceof Response) {
      return authResult;
    }
    console.log(`Authenticated user: ${authResult.userId}`);

    const body = await req.json();
    const { soilType, ph, temperature, rainfall, season, location, weatherData } = validateInput(body);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log("Generating crop recommendations with weather integration...");

    // Build weather context for AI prompt
    let weatherContext = '';
    if (weatherData) {
      weatherContext = `

CURRENT WEATHER CONDITIONS (${weatherData.location || location || 'Unknown Location'}):
- Current Temperature: ${weatherData.current?.temperature || temperature}°C
- Current Humidity: ${weatherData.current?.humidity || 'Not available'}%
- Current Condition: ${weatherData.current?.condition || 'Not available'}
- Current Rainfall: ${weatherData.current?.rainfall || 0}mm

7-DAY WEATHER FORECAST:
${weatherData.forecast?.slice(0, 7).map((day, i) => 
  `Day ${i + 1} (${day.day}${day.date ? ` - ${day.date}` : ''}): 
   - High: ${day.temp_max || day.temp}°C, Low: ${day.temp_min || 'N/A'}°C
   - Condition: ${day.condition}
   - Rain Chance: ${day.rainfall_chance || 0}%
   - Humidity: ${day.humidity || 'N/A'}%`
).join('\n') || 'No forecast available'}

${weatherData.alerts && weatherData.alerts.length > 0 ? `
ACTIVE WEATHER ALERTS:
${weatherData.alerts.map(alert => `- ${alert.severity?.toUpperCase()}: ${alert.title} - ${alert.description}`).join('\n')}
` : ''}

Based on this weather data, provide weather-smart planting and harvesting schedules.`;
    }

    const prompt = `Based on the following farming conditions, recommend the best crops to grow and provide a detailed planting and harvesting schedule that is PERSONALIZED to the current weather conditions and forecast:

SOIL & CLIMATE CONDITIONS:
- Soil Type: ${soilType}
- pH: ${ph}
- Average Temperature: ${temperature}°C
- Annual Rainfall: ${rainfall || 'Not specified'} mm
- Growing Season: ${season}
- Location: ${location || 'Not specified'}
${weatherContext}

Provide recommendations in JSON format:
{
  "crops": [
    {
      "name": "crop name",
      "description": "brief description",
      "suitability": number (0-100),
      "growth_period": "time period",
      "expected_yield": "yield estimate",
      "weather_suitability": "how current weather affects this crop"
    }
  ],
  "selected_crop": "name of the most suitable crop",
  "planting_schedule": {
    "optimal_planting_window": {
      "start_date": "recommended start date based on weather (e.g., 'January 15, 2026')",
      "end_date": "last recommended planting date",
      "reason": "why this window is optimal based on weather"
    },
    "weather_considerations": [
      "specific considerations based on current forecast"
    ],
    "pre_planting_tasks": [
      {
        "task": "task description",
        "timing": "when to do it (e.g., '3-5 days before planting')",
        "weather_dependency": "ideal weather conditions for this task"
      }
    ]
  },
  "harvesting_schedule": {
    "estimated_harvest_date": "expected harvest date",
    "harvest_window": "optimal harvest period (e.g., 'March 1-15, 2026')",
    "weather_indicators": "weather signs to watch for optimal harvest",
    "pre_harvest_checklist": [
      "items to check before harvesting"
    ]
  },
  "weekly_weather_actions": [
    {
      "week": "Week 1 (current)",
      "weather_summary": "brief forecast summary",
      "recommended_actions": [
        "specific actions based on this week's weather"
      ],
      "warnings": ["any weather-related warnings"]
    }
  ],
  "irrigation_plan": {
    "base_schedule": "regular irrigation schedule",
    "weather_adjustments": [
      {
        "condition": "if rain expected",
        "adjustment": "reduce/skip irrigation"
      }
    ],
    "current_recommendation": "what to do this week based on forecast"
  },
  "farming_plan": [
    {
      "month": "month name",
      "phase": "growth phase",
      "activities": "what to do this month"
    }
  ],
  "water_requirements": "detailed water needs",
  "weather_alerts_impact": [
    {
      "alert": "weather alert if any",
      "impact": "how it affects farming",
      "mitigation": "what to do about it"
    }
  ],
  "tips": ["5-7 weather-smart farming tips"]
}

IMPORTANT: 
- Use the 7-day forecast to give SPECIFIC, ACTIONABLE recommendations for the coming week
- Adjust planting dates based on upcoming weather patterns
- Include specific warnings if weather conditions are unfavorable
- Provide realistic, location-appropriate recommendations`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
            content: 'You are an expert agricultural consultant specializing in weather-smart farming. Provide accurate crop recommendations and farming schedules that are personalized based on current and forecast weather conditions. Always give specific dates and actionable advice.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI recommendation failed: ${response.status}`);
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
      console.error("Failed to parse recommendations:", content);
      result = {
        crops: [
          {
            name: "Consultation Required",
            description: "Unable to generate recommendations",
            suitability: 0,
            growth_period: "N/A",
            expected_yield: "N/A",
            weather_suitability: "N/A"
          }
        ],
        selected_crop: "Consultation Required",
        planting_schedule: null,
        harvesting_schedule: null,
        weekly_weather_actions: [],
        irrigation_plan: null,
        farming_plan: [],
        water_requirements: "Consult agricultural expert",
        weather_alerts_impact: [],
        tips: ["Please verify input parameters and try again"]
      };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in recommend-crops function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        crops: [],
        selected_crop: "Error",
        planting_schedule: null,
        harvesting_schedule: null,
        weekly_weather_actions: [],
        irrigation_plan: null,
        farming_plan: [],
        water_requirements: "Unavailable",
        weather_alerts_impact: [],
        tips: ["Service temporarily unavailable"]
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
