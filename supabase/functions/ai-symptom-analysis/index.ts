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
  followUpQuestions?: Array<{question: string, answer: string}>;
  userId: string;
}

interface AnalysisResult {
  possibleConditions: Array<{
    condition: string;
    probability: number;
    description: string;
  }>;
  urgency: 'low' | 'moderate' | 'high' | 'emergency';
  recommendations: string[];
  followUpQuestions?: string[];
  seekImmediateCare: boolean;
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

    const { symptoms, followUpQuestions = [], userId }: SymptomAnalysisRequest = await req.json();

    // Construct the AI prompt
    const symptomContext = `
Patient describes the following symptoms: "${symptoms}"

${followUpQuestions.length > 0 ? `
Additional information from follow-up questions:
${followUpQuestions.map(q => `Q: ${q.question}\nA: ${q.answer}`).join('\n')}
` : ''}

Please analyze these symptoms and provide:
1. Top 3-5 most likely medical conditions with probability percentages
2. Urgency level (emergency, high, moderate, low)
3. Specific recommendations for immediate care
4. Whether immediate medical attention is needed
5. 2-3 follow-up questions to gather more information (if needed)

Format your response as JSON with this structure:
{
  "possibleConditions": [
    {"condition": "condition name", "probability": 85, "description": "brief description"}
  ],
  "urgency": "emergency|high|moderate|low",
  "recommendations": ["recommendation 1", "recommendation 2"],
  "followUpQuestions": ["question 1", "question 2"],
  "seekImmediateCare": true/false,
  "reasoning": "explanation of analysis"
}

Be conservative with emergency classifications. Only use "emergency" for truly life-threatening symptoms.
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
            content: `You are an experienced medical AI assistant specializing in symptom analysis. You provide careful, evidence-based assessments while being clear that you are not a replacement for professional medical care. Always err on the side of caution and recommend professional medical evaluation when there's any uncertainty about serious conditions.

CRITICAL SAFETY GUIDELINES:
- Never diagnose definitively - only suggest possible conditions
- Always recommend professional medical evaluation for concerning symptoms
- Be conservative with emergency classifications
- Include appropriate medical disclaimers
- Focus on symptom patterns and risk assessment`
          },
          {
            role: 'user',
            content: symptomContext
          }
        ],
        temperature: 0.3,
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
      const parsedResult = JSON.parse(analysisText);
      analysisResult = {
        ...parsedResult,
        disclaimer: "This analysis is for informational purposes only and should not replace professional medical advice, diagnosis, or treatment. Always seek the advice of qualified healthcare providers with any questions you may have regarding a medical condition."
      };
    } catch (parseError) {
      // Fallback if JSON parsing fails
      analysisResult = {
        possibleConditions: [
          {
            condition: "Symptom assessment needed",
            probability: 0,
            description: "Unable to analyze symptoms properly. Please consult a healthcare provider."
          }
        ],
        urgency: 'moderate',
        recommendations: [
          "Consult with a healthcare provider for proper symptom evaluation",
          "Monitor symptoms and seek care if they worsen",
          "Keep a symptom diary for your doctor"
        ],
        seekImmediateCare: true,
        disclaimer: "This analysis is for informational purposes only and should not replace professional medical advice."
      };
    }

    // Save the analysis to the database
    const { error: dbError } = await supabase
      .from('symptom_sessions')
      .insert({
        user_id: userId,
        symptoms: [symptoms],
        responses: { 
          original_symptoms: symptoms, 
          follow_up_questions: followUpQuestions 
        },
        recommendations: analysisResult.recommendations.join('; '),
        ai_analysis: {
          possible_conditions: analysisResult.possibleConditions,
          urgency: analysisResult.urgency,
          seek_immediate_care: analysisResult.seekImmediateCare
        }
      });

    if (dbError) {
      console.error('Error saving symptom analysis:', dbError);
    }

    // If emergency, notify caregivers
    if (analysisResult.urgency === 'emergency' || analysisResult.seekImmediateCare) {
      // Get user's caregivers
      const { data: caregivers } = await supabase
        .from('caregivers')
        .select('*')
        .eq('user_id', userId)
        .eq('notifications_enabled', true);

      if (caregivers && caregivers.length > 0) {
        // Create emergency notifications for caregivers
        for (const caregiver of caregivers) {
          await supabase
            .from('notifications')
            .insert({
              user_id: userId,
              caregiver_id: caregiver.id,
              title: '🚨 Emergency Health Alert',
              message: `Your care recipient has reported concerning symptoms that may require immediate medical attention. Please check on them immediately.`,
              type: 'emergency_health_alert',
              scheduled_for: new Date().toISOString(),
              channels: JSON.stringify(['push', 'email'])
            });
        }
      }
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