import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Language mapping for AI responses
const languageMap: Record<string, string> = {
  'en': 'English',
  'kn': 'Kannada',
  'hi': 'Hindi',
  'ta': 'Tamil',
  'te': 'Telugu',
  'ml': 'Malayalam',
  'mr': 'Marathi',
  'gu': 'Gujarati',
  'bn': 'Bengali',
  'ur': 'Urdu'
};

// Input validation helper
function validateInput(body: unknown): { image: string; detectDisease: boolean; language: string } {
  if (!body || typeof body !== 'object') {
    throw new Error("Invalid request body");
  }

  const { image, detectDisease = false, language = 'en' } = body as Record<string, unknown>;

  if (!image || typeof image !== 'string') {
    throw new Error("No image provided or invalid image format");
  }

  // Validate image is a valid base64 data URL or URL
  if (!image.startsWith('data:image/') && !image.startsWith('http://') && !image.startsWith('https://')) {
    throw new Error("Invalid image format. Must be base64 data URL or valid URL");
  }

  // Limit image size (approximately 10MB base64)
  if (image.length > 10 * 1024 * 1024) {
    throw new Error("Image too large. Maximum size is 10MB");
  }

  if (typeof detectDisease !== 'boolean') {
    throw new Error("detectDisease must be a boolean");
  }

  const validLanguage = typeof language === 'string' && languageMap[language] ? language : 'en';

  return { image, detectDisease, language: validLanguage };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { image, detectDisease, language } = validateInput(body);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const targetLanguage = languageMap[language] || 'English';
    console.log(`Analyzing plant image (disease detection: ${detectDisease}, language: ${targetLanguage})...`);

    const systemPrompt = detectDisease 
      ? `You are an expert botanist and plant pathologist. Analyze plant leaf images to:
1. Identify the plant species
2. Detect any diseases present
3. Provide symptoms, treatment, and pesticide recommendations

IMPORTANT: Respond entirely in ${targetLanguage} language. All text values must be in ${targetLanguage}.

Respond in JSON format with this structure:
{
  "species": "plant name in ${targetLanguage}",
  "confidence": 0.95,
  "disease": "disease name in ${targetLanguage} or null if healthy",
  "symptoms": "description of visible symptoms in ${targetLanguage}",
  "cure": "treatment recommendations in ${targetLanguage}",
  "pesticides": "recommended pesticides in ${targetLanguage}"
}`
      : `You are an expert botanist. Identify plant species from images.

IMPORTANT: Respond entirely in ${targetLanguage} language. All text values must be in ${targetLanguage}.

Respond in JSON format with this structure:
{
  "species": "plant name in ${targetLanguage}",
  "confidence": 0.95,
  "disease": null,
  "symptoms": null,
  "cure": null,
  "pesticides": null
}`;

    const userPrompt = detectDisease
      ? `Analyze this plant leaf image. Identify the species and check for any diseases. Respond in ${targetLanguage}.`
      : `Identify the plant species in this image. Respond in ${targetLanguage}.`;

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
            content: systemPrompt
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: userPrompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: image
                }
              }
            ]
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
    console.log("AI response received");
    
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('No content in AI response');
    }

    // Parse the JSON response from AI
    let result;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/);
      const jsonString = jsonMatch ? jsonMatch[1] : content;
      result = JSON.parse(jsonString);
    } catch (e) {
      console.error("Failed to parse AI response as JSON:", content);
      // Fallback to a basic response
      result = {
        species: "Unable to identify",
        confidence: 0.5,
        disease: null,
        symptoms: "Analysis incomplete",
        cure: "Please upload a clearer image",
        pesticides: "N/A"
      };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-plant function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        species: "Error",
        confidence: 0,
        disease: null,
        symptoms: "Analysis failed",
        cure: "Please try again",
        pesticides: "N/A"
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
