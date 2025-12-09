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
    const body = await req.json();
    const { location } = validateInput(body);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log(`Fetching weather data for: ${location}`);

    // Using AI to generate realistic weather data based on location
    const prompt = `Generate current weather data and 7-day forecast for ${location}. 
Provide realistic data based on the location's typical climate and current season.

Return in JSON format:
{
  "location": "city name",
  "current": {
    "temperature": number in celsius,
    "feels_like": number in celsius,
    "condition": "weather condition (e.g., Sunny, Cloudy, Rainy)",
    "humidity": number (percentage),
    "wind_speed": number in km/h,
    "rainfall": number in mm (0 if no rain),
    "uv_index": number (0-11)
  },
  "forecast": [
    {
      "day": "day name",
      "temp": number,
      "condition": "condition"
    }
  ],
  "farming_advice": [
    "3-5 specific farming recommendations based on weather"
  ]
}`;

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

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

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
      result = {
        location: location,
        current: {
          temperature: 25,
          feels_like: 27,
          condition: "Data unavailable",
          humidity: 60,
          wind_speed: 10,
          rainfall: 0,
          uv_index: 5
        },
        forecast: [],
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
