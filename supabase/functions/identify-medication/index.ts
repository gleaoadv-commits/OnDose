const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      console.error("ERRO: GEMINI_API_KEY não encontrada nos secrets do Supabase");
      return new Response(JSON.stringify({ error: "Configuração pendente: Chave de IA não encontrada." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { imageBase64, mimeType } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "imageBase64 is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `Você é um farmacêutico especialista em identificação de medicamentos. 
Analise a foto enviada e identifique o medicamento.

Responda SEMPRE em JSON com a seguinte estrutura (sem markdown, apenas JSON puro):
{
  "identified": true/false,
  "name": "Nome do medicamento (nome comercial e/ou princípio ativo)",
  "dosage": "Dosagem identificada (ex: 500mg, 10mg/ml)",
  "form": "Forma farmacêutica (comprimido, cápsula, xarope, etc)",
  "manufacturer": "Fabricante (se visível)",
  "description": "Breve descrição do medicamento e para que serve",
  "instructions": "Instruções gerais de uso (se conhecidas)",
  "warnings": "Avisos importantes ou contraindicações comuns",
  "confidence": "alta/média/baixa"
}

Se não conseguir identificar, retorne identified=false com uma mensagem em description explicando por quê.
Seja preciso e responsável — informe que o usuário deve sempre consultar um médico ou farmacêutico.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemPrompt }]
        },
        contents: [
          {
            parts: [
              { text: "Identifique este medicamento na foto. Responda em JSON." },
              {
                inline_data: {
                  mime_type: mimeType || "image/jpeg",
                  data: imageBase64
                }
              }
            ]
          }
        ],
        generationConfig: {
          response_mime_type: "application/json",
        }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Muitas requisições. Tente novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes para IA." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(
        JSON.stringify({ error: "Erro na análise da imagem" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResult = await response.json();
    const content = aiResult.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    // Parse the JSON from the AI response
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = {
        identified: false,
        description: "Não foi possível processar a resposta da IA.",
        confidence: "baixa",
      };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
