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
    const body = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    let messages: any[];

    // Check if this is an image-based soil analysis
    if (body.useImageAnalysis && body.image) {
      console.log("Analyzing soil image with Lovable AI vision...");

      messages = [
        {
          role: 'system',
          content: 'You are an expert soil scientist. Analyze soil images and provide detailed soil characteristics, composition, and agricultural recommendations.'
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this soil sample image and provide comprehensive soil analysis in JSON format:
{
  "visual_assessment": "description of soil color, texture, and visible characteristics",
  "category": "soil type category (e.g., Sandy Loam, Clay, Loamy, etc.)",
  "quality": "Overall quality rating (Excellent/Good/Fair/Poor)",
  "texture": "soil texture (Sandy/Loamy/Clay/etc.)",
  "color": "soil color and what it indicates",
  "moisture_appearance": "appears dry/moist/wet",
  "organic_matter": "estimated organic matter content (Low/Medium/High)",
  "estimated_ph": "estimated pH range",
  "nitrogen_status": "estimated status (Low/Adequate/High)",
  "phosphorus_status": "estimated status (Low/Adequate/High)",
  "potassium_status": "estimated status (Low/Adequate/High)",
  "deficiencies": ["list of potential deficiencies based on visual cues"],
  "suitable_crops": ["list of 5-8 crops suitable for this soil type"],
  "fertilizer_recommendations": "detailed fertilizer recommendations",
  "additional_notes": "any other observations or recommendations"
}`
            },
            {
              type: 'image_url',
              image_url: {
                url: body.image
              }
            }
          ]
        }
      ];
    } else if (body.useDigitalData && body.latitude && body.longitude) {
      // Digital soil data based on location
      console.log("Fetching digital soil data for location:", body.latitude, body.longitude);
      
      const prompt = `Based on the geographical location (Latitude: ${body.latitude}, Longitude: ${body.longitude}), provide digital soil data analysis for this region.

Use your knowledge of soil types, climate zones, and agricultural patterns to generate realistic soil data for this location.

Provide comprehensive soil analysis in JSON format:
{
  "location": "Approximate region/area name",
  "category": "soil type category (e.g., Sandy Loam, Clay, Alluvial, Red Soil, etc.)",
  "quality": "Overall quality rating (Excellent/Good/Fair/Poor)",
  "ph": "pH value (e.g., 6.5)",
  "nitrogen": "Nitrogen level in mg/kg",
  "phosphorus": "Phosphorus level in mg/kg",
  "potassium": "Potassium level in mg/kg",
  "nitrogen_status": "status (Low/Adequate/High)",
  "phosphorus_status": "status (Low/Adequate/High)",
  "potassium_status": "status (Low/Adequate/High)",
  "moisture": "Typical moisture percentage",
  "deficiencies": ["list of common deficiencies in this region"],
  "suitable_crops": ["list of 5-8 crops suitable for this region"],
  "fertilizer_recommendations": "detailed fertilizer recommendations based on soil type"
}`;

      messages = [
        {
          role: 'system',
          content: 'You are an expert soil scientist and agronomist. Provide accurate soil analysis and farming recommendations based on geographical data.'
        },
        {
          role: 'user',
          content: prompt
        }
      ];
    } else {
      // Manual soil data analysis
      const { ph, nitrogen, phosphorus, potassium, moisture } = body;

      if (!ph || !nitrogen || !phosphorus || !potassium) {
        throw new Error("Missing required soil parameters");
      }

      console.log("Analyzing manual soil data with Lovable AI...");

      const prompt = `Analyze this soil test data and provide detailed recommendations:

Soil Parameters:
- pH: ${ph}
- Nitrogen (N): ${nitrogen} mg/kg
- Phosphorus (P): ${phosphorus} mg/kg
- Potassium (K): ${potassium} mg/kg
${moisture ? `- Moisture: ${moisture}%` : ''}

Provide a comprehensive analysis in JSON format:
{
  "category": "soil type category (e.g., Sandy Loam, Clay, etc.)",
  "quality": "Overall quality rating (Excellent/Good/Fair/Poor)",
  "nitrogen_status": "status (Low/Adequate/High)",
  "phosphorus_status": "status (Low/Adequate/High)",
  "potassium_status": "status (Low/Adequate/High)",
  "deficiencies": ["list of detected deficiencies"],
  "suitable_crops": ["list of 5-8 suitable crops"],
  "fertilizer_recommendations": "detailed fertilizer recommendations"
}`;

      messages = [
        {
          role: 'system',
          content: 'You are an expert soil scientist and agronomist. Provide accurate soil analysis and farming recommendations based on test data.'
        },
        {
          role: 'user',
          content: prompt
        }
      ];
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI analysis failed: ${response.status}`);
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
      console.error("Failed to parse AI response:", content);
      result = {
        category: "Analysis incomplete",
        quality: "Unknown",
        nitrogen_status: "Unknown",
        phosphorus_status: "Unknown",
        potassium_status: "Unknown",
        deficiencies: [],
        suitable_crops: ["Consult agricultural expert"],
        fertilizer_recommendations: "Unable to generate recommendations. Please verify input data."
      };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-soil function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        category: "Error",
        quality: "Unknown",
        nitrogen_status: "Unknown",
        phosphorus_status: "Unknown",
        potassium_status: "Unknown",
        deficiencies: [],
        suitable_crops: [],
        fertilizer_recommendations: "Analysis failed. Please try again."
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
