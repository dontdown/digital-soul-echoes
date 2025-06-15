
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const groqApiKey = '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';

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
    if (!groqApiKey) {
      console.error('GROQ_API_KEY não configurada');
      return new Response(JSON.stringify({ error: 'Groq API key não configurada' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { model, messages, temperature, max_tokens } = await req.json();
    
    console.log('Requisição recebida:', { model, messages: messages?.length, temperature, max_tokens });

    // Configurações otimizadas para respostas completas
    const requestBody = {
      model: model || 'llama3-8b-8192',
      messages,
      temperature: temperature || 0.9,
      max_tokens: Math.min(max_tokens || 200, 300), // limite máximo de 300 tokens
      top_p: 0.95,
      frequency_penalty: 0.1, // evita repetições
      presence_penalty: 0.1   // encoraja diversidade
    };

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro da Groq:', response.status, errorText);
      throw new Error(`Groq API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // Validação adicional da resposta
    if (data?.choices?.[0]?.message?.content) {
      const content = data.choices[0].message.content.trim();
      console.log('Resposta da Groq recebida:', content.length, 'caracteres');
      
      // Se a resposta parece estar cortada, adiciona um indicador
      if (data.choices[0].finish_reason === 'length') {
        console.warn('Resposta pode ter sido cortada por limite de tokens');
      }
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro na edge function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
