
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, medicationData } = await req.json();

    // Create a comprehensive medication knowledge base from the provided data
    const medicationKnowledge = medicationData.map(med => 
      `${med.name} (Generic: ${med.genericName}, Brands: ${med.brandNames.join(', ')}):
      - Category: ${med.category}
      - Description: ${med.description}
      - Dosage: ${med.dosage}
      - Uses: ${med.uses.join(', ')}
      - Side Effects: ${med.sideEffects.join(', ')}
      - Warnings: ${med.warnings.join(', ')}
      - Interactions: ${med.interactions.join(', ')}`
    ).join('\n\n');

    const systemPrompt = `You are a knowledgeable medication assistant AI. Your role is to provide accurate, helpful information about medications based on the medication library data provided and your general medical knowledge.

IMPORTANT GUIDELINES:
1. Only answer questions related to medications, drugs, pharmaceuticals, medical treatments, or health conditions
2. If a user asks about anything not related to medications or health, politely decline and say "I'm sorry, but I can only provide information about medications and health-related topics. Please ask me about medications, their uses, side effects, interactions, or dosages."
3. Always include a disclaimer that your information is for educational purposes only and should not replace professional medical advice
4. Be thorough but concise in your responses
5. If you don't have specific information about a medication, be honest about it
6. Always encourage users to consult healthcare providers for medical decisions

MEDICATION LIBRARY DATA:
${medicationKnowledge}

Use the above medication data as your primary source, but you can also provide general medication information from your knowledge base when appropriate.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const botResponse = data.choices[0].message.content;

    // Add disclaimer to medical responses
    const responseWithDisclaimer = `${botResponse}

*Please remember: This information is for educational purposes only. Always consult your healthcare provider before starting, stopping, or changing any medication.*`;

    return new Response(JSON.stringify({ response: responseWithDisclaimer }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in medication-chat function:', error);
    return new Response(JSON.stringify({ 
      error: 'I apologize, but I\'m having trouble processing your request right now. Please try again later.' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
