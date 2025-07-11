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

    if (!symptoms.trim()) {
      throw new Error('No symptoms provided');
    }

    console.log('Received symptoms:', symptoms);

    const symptomContext = `
You are an AI symptom checker. Analyze the following symptoms and provide:
1. A list of possible conditions with their probabilities (as percentages).
2. Recommended next steps for managing the symptoms.
3. A disclaimer emphasizing the importance of consulting a healthcare professional.

Symptoms: "${symptoms}"

Return the response in JSON format:
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
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAIApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an AI symptom checker. Analyze symptoms and suggest conditions with probabilities and next steps. Always include a disclaimer.'
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
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      if (errorText.includes('insufficient_quota')) {
        throw new Error('OpenAI API quota exceeded. Please check your plan and billing details.');
      }
      throw new Error(`OpenAI API failed: ${response.status} - ${errorText}`);
    }

    const aiResponse = await response.json();
    const analysisText = aiResponse.choices[0].message.content;
    console.log('Raw AI response:', analysisText);

    let analysisResult: AnalysisResult;
    try {
      analysisResult = JSON.parse(analysisText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', analysisText);
      analysisResult = {
        conditions: [
          {
            name: "Analysis unavailable",
            probability: 0,
            description: "Unable to process symptoms due to an internal error."
          }
        ],
        nextSteps: [
          "Consult a healthcare provider for proper evaluation",
          "Try again later or contact support"
        ],
        disclaimer: "This analysis is for informational purposes only and should not replace professional medical advice."
      };
    }

    const { error: dbError } = await supabase
      .from('symptom_sessions')
      .insert({
        user_id: userId,
        symptoms: [symptoms],
        ai_analysis: analysisResult,
      });

    if (dbError) {
      console.error('Database error:', dbError);
    }

    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Handler error:', error.message);
    return new Response(
      JSON.stringify({ 
        error: 'Analysis failed',
        message: error.message.includes('quota') 
          ? 'Symptom analysis is temporarily unavailable due to API limits. Please try again later or consult a healthcare provider.'
          : 'Unable to analyze symptoms. Please try again or consult a healthcare provider.'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);
