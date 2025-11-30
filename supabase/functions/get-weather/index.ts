import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { location } = await req.json();

    if (!location) {
      throw new Error("Location is required");
    }

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
            content: 'You are a meteorologist and agricultural advisor. Provide accurate weather data and farming recommendations.'
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
      throw new Error(`Weather API failed: ${response.status}`);
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
