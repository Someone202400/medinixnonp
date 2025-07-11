import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

interface SymptomAnalysisRequest {
  symptoms: string;
  userId: string;
}

interface AnalysisResult {
  conditions: Array<{
    name: string;
    probability: number;
    description: string;
  }>;
  nextSteps: string[];
  disclaimer: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { symptoms, userId }: SymptomAnalysisRequest = await req.json();

    // Construct the AI prompt
    const symptomContext = `
You are an AI symptom checker. Analyze the following symptoms and provide:

1. A list of possible illnesses or injuries with their probabilities (as percentages).
2. Recommended next steps for managing the symptoms.
3. A disclaimer emphasizing the importance of consulting a healthcare professional.

Symptoms: "${symptoms}"

Output format:
{
  "conditions": [
    {"name": "Condition 1", "probability": 80, "description": "Brief description"},
    {"name": "Condition 2", "probability": 50, "description": "Brief description"}
  ],
  "nextSteps": ["Step 1", "Step 2"],
  "disclaimer": "This is not a substitute for professional medical advice."
}
    `;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an AI symptom checker. Your role is to analyze symptoms, suggest possible conditions with probabilities, and recommend next steps. Always include a disclaimer that this is not a substitute for professional medical advice. Rely entirely on your knowledge base, not predefined tables or scripts, to cover a wide range of illnesses and injuries.`
          },
          {
            role: 'user',
            content: symptomContext
          }
        ],
        temperature: 0.5,
        max_tokens: 1000
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const analysisText = aiResponse.choices[0].message.content;

    // Parse the JSON response from OpenAI
    let analysisResult: AnalysisResult;
    try {
      analysisResult = JSON.parse(analysisText);
    } catch (parseError) {
      // Fallback if JSON parsing fails
      analysisResult = {
        conditions: [
          {
            name: "Symptom assessment needed",
            probability: 0,
            description: "Unable to analyze symptoms properly. Please consult a healthcare provider."
          }
        ],
        nextSteps: [
          "Consult with a healthcare provider for proper symptom evaluation",
          "Monitor symptoms and seek care if they worsen"
        ],
        disclaimer: "This analysis is for informational purposes only and should not replace professional medical advice."
      };
    }

    // Save the analysis to the database
    const { error: dbError } = await supabase
      .from('symptom_sessions')
      .insert({
        user_id: userId,
        symptoms: [symptoms],
        ai_analysis: analysisResult,
      });

    if (dbError) {
      console.error('Error saving symptom analysis:', dbError);
    }

    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-symptom-analysis function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Analysis failed',
        message: 'Unable to analyze symptoms at this time. Please consult a healthcare provider.'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);
