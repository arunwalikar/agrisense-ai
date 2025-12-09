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

function validateManualInput(body: Record<string, unknown>): { 
  ph: number; 
  nitrogen: number; 
  phosphorus: number; 
  potassium: number; 
  moisture?: number 
} {
  const { ph, nitrogen, phosphorus, potassium, moisture } = body;

  if (typeof ph !== 'number' || ph < 0 || ph > 14) {
    throw new Error("pH must be a number between 0 and 14");
  }

  if (typeof nitrogen !== 'number' || nitrogen < 0 || nitrogen > 1000) {
    throw new Error("Nitrogen must be a number between 0 and 1000 mg/kg");
  }

  if (typeof phosphorus !== 'number' || phosphorus < 0 || phosphorus > 1000) {
    throw new Error("Phosphorus must be a number between 0 and 1000 mg/kg");
  }

  if (typeof potassium !== 'number' || potassium < 0 || potassium > 1000) {
    throw new Error("Potassium must be a number between 0 and 1000 mg/kg");
  }

  if (moisture !== undefined && (typeof moisture !== 'number' || moisture < 0 || moisture > 100)) {
    throw new Error("Moisture must be a number between 0 and 100");
  }

  return { ph, nitrogen, phosphorus, potassium, moisture };
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

    // Check if this is an image-based soil analysis
    if (body.useImageAnalysis && body.image) {
      const { image } = validateImageAnalysis(body);
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
      const validatedInput = validateManualInput(body);
      const { ph, nitrogen, phosphorus, potassium, moisture } = validatedInput;

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
