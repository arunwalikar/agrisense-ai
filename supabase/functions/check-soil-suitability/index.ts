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
    const { cropName, soilType, ph, temperature, rainfall } = await req.json();

    if (!cropName) {
      throw new Error("Crop name is required");
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log("Analyzing soil suitability for crop:", cropName);

    const prompt = `Analyze if the given soil conditions are suitable for growing ${cropName}.

Current Soil Conditions:
${soilType ? `- Soil Type: ${soilType}` : ''}
${ph ? `- pH: ${ph}` : ''}
${temperature ? `- Temperature: ${temperature}°C` : ''}
${rainfall ? `- Rainfall: ${rainfall} mm` : ''}

Provide a detailed analysis in JSON format:
{
  "is_suitable": true/false,
  "suitability_score": number (0-100),
  "summary": "brief summary",
  "soil_requirements": {
    "ideal_ph": "range",
    "ideal_temperature": "range",
    "ideal_rainfall": "range",
    "soil_types": ["list of suitable soil types"]
  },
  "current_conditions_analysis": {
    "ph_status": "optimal/acceptable/poor",
    "temperature_status": "optimal/acceptable/poor",
    "rainfall_status": "optimal/acceptable/poor",
    "soil_type_status": "optimal/acceptable/poor"
  },
  "recommendations": ["list of 3-5 recommendations to improve suitability"],
  "alternative_crops": ["3 alternative crops if current soil is not suitable"]
}

Provide realistic agricultural guidance.`;

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
            content: 'You are an expert agricultural consultant specializing in soil science and crop suitability analysis.'
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
      throw new Error(`Soil suitability analysis failed: ${response.status}`);
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
      console.error("Failed to parse suitability analysis:", content);
      result = {
        is_suitable: false,
        suitability_score: 0,
        summary: "Unable to analyze soil suitability",
        soil_requirements: {},
        current_conditions_analysis: {},
        recommendations: ["Please verify soil parameters and try again"],
        alternative_crops: []
      };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in check-soil-suitability function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        is_suitable: false,
        suitability_score: 0,
        summary: "Error analyzing soil suitability"
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
