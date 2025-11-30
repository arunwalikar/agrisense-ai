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
    const { soilType, ph, temperature, rainfall, season } = await req.json();

    if (!soilType || !ph || !temperature || !season) {
      throw new Error("Missing required parameters");
    }

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
