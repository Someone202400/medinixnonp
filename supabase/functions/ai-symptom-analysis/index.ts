import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const groqApiKey = Deno.env.get('GROQ_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

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
    // Validate environment variables
    if (!groqApiKey) throw new Error('Missing GROQ_API_KEY');
    if (!supabaseUrl) throw new Error('Missing SUPABASE_URL');
    if (!supabaseServiceRoleKey) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { symptoms, userId }: SymptomAnalysisRequest = await req.json();
    if (!symptoms?.trim()) throw new Error('No symptoms provided');

    console.log('Processing symptoms:', symptoms, 'for user:', userId);

    const symptomContext = `
Analyze symptoms: "${symptoms}"
Return only valid JSON (no extra text or markdown):
{
  "conditions": [{"name": "Condition", "probability": 0, "description": "Brief description"}],
  "nextSteps": ["Step"],
  "disclaimer": "Not a substitute for medical advice."
}
    `;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: 'You are an AI symptom checker. Analyze symptoms and return only valid JSON with conditions (name, probability as a decimal, description), next steps, and a disclaimer. Do not include markdown or extra text.'
          },
          {
            role: 'user',
            content: symptomContext
          }
        ],
        temperature: 0.5,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error:', errorText);
      if (errorText.includes('rate_limit_exceeded')) {
        throw new Error('Groq API rate limit exceeded. Please try again later.');
      }
      throw new Error(`Groq API failed: ${response.status} - ${errorText}`);
    }

    const aiResponse = await response.json();
    let analysisText = aiResponse.choices?.[0]?.message?.content;
    if (!analysisText) throw new Error('No content in AI response');

    console.log('Raw AI response:', analysisText);

    // Clean the response to extract JSON
    try {
      // Extract content between ```json and ``` markers, if present
      const jsonMatch = analysisText.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch && jsonMatch[1]) {
        analysisText = jsonMatch[1].trim();
      } else {
        // Remove any non-JSON text before/after
        analysisText = analysisText.trim();
        if (!analysisText.startsWith('{')) {
          const start = analysisText.indexOf('{');
          const end = analysisText.lastIndexOf('}');
          if (start !== -1 && end !== -1) {
            analysisText = analysisText.slice(start, end + 1);
          }
        }
      }
      console.log('Cleaned AI response:', analysisText);
    } catch (cleanError) {
      console.error('Failed to clean AI response:', cleanError.message);
    }

    let analysisResult: AnalysisResult;
    try {
      analysisResult = JSON.parse(analysisText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', analysisText, parseError.message);
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

    // Attempt to save to database, but don't fail the request if it errors
    try {
      const { error: dbError } = await supabase
        .from('symptom_sessions')
        .insert({
          user_id: userId || 'anonymous',
          symptoms: [symptoms],
          ai_analysis: analysisResult,
        });

      if (dbError) {
        console.error('Database error:', dbError.message);
      }
    } catch (dbError) {
      console.error('Unexpected database error:', dbError.message);
    }

    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Handler error:', error.message);
    return new Response(
      JSON.stringify({ 
        error: 'Analysis failed',
        message: error.message.includes('rate_limit_exceeded') 
          ? 'Symptom analysis is temporarily unavailable due to API limits. Please try again later.'
          : error.message.includes('No symptoms provided')
          ? 'Please provide symptoms to analyze.'
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
