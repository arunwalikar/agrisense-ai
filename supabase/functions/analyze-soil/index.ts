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
    const { ph, nitrogen, phosphorus, potassium, moisture } = await req.json();

    if (!ph || !nitrogen || !phosphorus || !potassium) {
      throw new Error("Missing required soil parameters");
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log("Analyzing soil data with Lovable AI...");

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
            content: 'You are an expert soil scientist and agronomist. Provide accurate soil analysis and farming recommendations based on test data.'
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
