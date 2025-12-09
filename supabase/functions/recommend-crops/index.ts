import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Valid soil types and seasons
const VALID_SOIL_TYPES = ['clay', 'sandy', 'loamy', 'silt', 'peat', 'chalk', 'alluvial', 'red soil', 'black soil', 'laterite'];
const VALID_SEASONS = ['spring', 'summer', 'autumn', 'fall', 'winter', 'monsoon', 'dry', 'wet', 'rabi', 'kharif', 'zaid'];

// Input validation
function validateInput(body: unknown): { 
  soilType: string; 
  ph: number; 
  temperature: number; 
  rainfall: number | null; 
  season: string 
} {
  if (!body || typeof body !== 'object') {
    throw new Error("Invalid request body");
  }

  const { soilType, ph, temperature, rainfall, season } = body as Record<string, unknown>;

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

  return { 
    soilType: normalizedSoilType, 
    ph, 
    temperature, 
    rainfall: validatedRainfall, 
    season: normalizedSeason 
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { soilType, ph, temperature, rainfall, season } = validateInput(body);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log("Generating crop recommendations with Lovable AI...");

    const prompt = `Based on the following farming conditions, recommend the best crops to grow and provide a detailed monthly farming plan:

Conditions:
- Soil Type: ${soilType}
- pH: ${ph}
- Average Temperature: ${temperature}°C
- Annual Rainfall: ${rainfall || 'Not specified'} mm
- Growing Season: ${season}

Provide recommendations in JSON format:
{
  "crops": [
    {
      "name": "crop name",
      "description": "brief description",
      "suitability": number (0-100),
      "growth_period": "time period",
      "expected_yield": "yield estimate"
    }
  ],
  "selected_crop": "name of the most suitable crop",
  "farming_plan": [
    {
      "month": "month name",
      "phase": "growth phase",
      "activities": "what to do this month"
    }
  ],
  "water_requirements": "detailed water needs",
  "tips": ["5-7 practical farming tips"]
}

Provide realistic, location-appropriate recommendations.`;

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
            content: 'You are an expert agricultural consultant. Provide accurate crop recommendations and farming schedules based on soil and climate data.'
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
      throw new Error(`AI recommendation failed: ${response.status}`);
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
      console.error("Failed to parse recommendations:", content);
      result = {
        crops: [
          {
            name: "Consultation Required",
            description: "Unable to generate recommendations",
            suitability: 0,
            growth_period: "N/A",
            expected_yield: "N/A"
          }
        ],
        selected_crop: "Consultation Required",
        farming_plan: [],
        water_requirements: "Consult agricultural expert",
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
        farming_plan: [],
        water_requirements: "Unavailable",
        tips: ["Service temporarily unavailable"]
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
