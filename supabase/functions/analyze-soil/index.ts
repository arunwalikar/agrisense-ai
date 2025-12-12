import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation helpers
function validateImageAnalysis(body: Record<string, unknown>): { image: string } {
  const { image } = body;
  
  if (!image || typeof image !== 'string') {
    throw new Error("Image is required for image analysis");
  }

  if (!image.startsWith('data:image/') && !image.startsWith('http://') && !image.startsWith('https://')) {
    throw new Error("Invalid image format. Must be base64 data URL or valid URL");
  }

  if (image.length > 10 * 1024 * 1024) {
    throw new Error("Image too large. Maximum size is 10MB");
  }

  return { image };
}

function validateDigitalData(body: Record<string, unknown>): { latitude: number; longitude: number } {
  const { latitude, longitude } = body;

  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    throw new Error("Latitude and longitude must be numbers");
  }

  if (latitude < -90 || latitude > 90) {
    throw new Error("Latitude must be between -90 and 90");
  }

  if (longitude < -180 || longitude > 180) {
    throw new Error("Longitude must be between -180 and 180");
  }

  return { latitude, longitude };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    if (!body || typeof body !== 'object') {
      throw new Error("Invalid request body");
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    let messages: any[];

    // Check if this is an image-based soil analysis with disease detection
    if (body.useImageAnalysis && body.image) {
      const { image } = validateImageAnalysis(body);
      console.log("Analyzing soil image for diseases and characteristics...");

      messages = [
        {
          role: 'system',
          content: `You are an expert soil scientist and plant pathologist. Analyze soil images to identify:
1. Soil characteristics (type, texture, color, moisture)
2. Diseases and pathogens present in the soil
3. Fungal infections (like Fusarium, Pythium, Rhizoctonia, etc.)
4. Signs of soil-borne diseases
5. Agricultural recommendations

Provide detailed, actionable insights for farmers.`
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this soil sample image comprehensively. Detect any diseases, fungal infections, or pathogens. Provide analysis in JSON format:
{
  "visual_assessment": "description of soil appearance",
  "category": "soil type (Sandy Loam, Clay, Loamy, etc.)",
  "quality": "Overall quality rating (Excellent/Good/Fair/Poor)",
  "texture": "soil texture",
  "color": "soil color and implications",
  "moisture_appearance": "dry/moist/wet",
  "organic_matter": "Low/Medium/High",
  "estimated_ph": "pH range estimate",
  "nitrogen_status": "Low/Adequate/High",
  "phosphorus_status": "Low/Adequate/High",
  "potassium_status": "Low/Adequate/High",
  "health_status": "Overall soil health assessment",
  "diseases_detected": [
    {
      "name": "disease name",
      "severity": "Low/Medium/High",
      "description": "brief description of the disease"
    }
  ],
  "fungal_infections": [
    {
      "name": "fungal pathogen name",
      "severity": "Low/Medium/High", 
      "description": "signs and symptoms observed"
    }
  ],
  "treatment_recommendations": "specific treatments for detected issues",
  "deficiencies": ["list of nutrient deficiencies"],
  "suitable_crops": ["5-8 suitable crops"],
  "fertilizer_recommendations": "detailed fertilizer advice",
  "additional_notes": "other observations"
}

If no diseases or infections are detected, return empty arrays for diseases_detected and fungal_infections, and provide a positive health_status message.`
            },
            {
              type: 'image_url',
              image_url: {
                url: image
              }
            }
          ]
        }
      ];
    } else if (body.useDigitalData && body.latitude !== undefined && body.longitude !== undefined) {
      const { latitude, longitude } = validateDigitalData(body);
      console.log("Fetching digital soil data for location:", latitude, longitude);
      
      const prompt = `Based on the geographical location (Latitude: ${latitude}, Longitude: ${longitude}), provide digital soil data analysis for this region.

Use your knowledge of soil types, climate zones, agricultural patterns, and common soil-borne diseases in this region.

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
  "health_status": "General soil health in this region",
  "common_diseases": ["list of common soil diseases in this region"],
  "common_fungi": ["list of common fungal pathogens in this region"],
  "prevention_tips": "preventive measures for common soil issues",
  "deficiencies": ["common deficiencies in this region"],
  "suitable_crops": ["5-8 crops suitable for this region"],
  "fertilizer_recommendations": "fertilizer recommendations based on soil type"
}`;

      messages = [
        {
          role: 'system',
          content: 'You are an expert soil scientist, agronomist, and plant pathologist. Provide accurate soil analysis, disease risk assessment, and farming recommendations based on geographical data.'
        },
        {
          role: 'user',
          content: prompt
        }
      ];
    } else {
      throw new Error("Invalid request. Use either image analysis or location-based analysis.");
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
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
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
        health_status: "Unable to determine",
        nitrogen_status: "Unknown",
        phosphorus_status: "Unknown",
        potassium_status: "Unknown",
        diseases_detected: [],
        fungal_infections: [],
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
        health_status: "Analysis failed",
        nitrogen_status: "Unknown",
        phosphorus_status: "Unknown",
        potassium_status: "Unknown",
        diseases_detected: [],
        fungal_infections: [],
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
