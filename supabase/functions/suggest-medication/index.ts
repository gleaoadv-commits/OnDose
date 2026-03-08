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
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

    const { query } = await req.json();
    if (!query || query.trim().length < 2) {
      return new Response(JSON.stringify({ suggestions: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: "Você é um assistente farmacêutico especialista no mercado brasileiro. Sua tarefa é sugerir nomes de medicamentos (comerciais ou genéricos) reais e populares no Brasil com base no texto parcial fornecido. Retorne SEMPRE um JSON puro com o campo 'suggestions' contendo um array de até 5 strings. Não inclua Markdown ou explicações." }]
        },
        contents: [
          {
            parts: [{ text: `Sugira até 5 medicamentos que comecem ou contenham: "${query.trim()}"` }]
          }
        ],
        generationConfig: {
          response_mime_type: "application/json",
        }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "rate_limit", suggestions: [] }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "payment_required", suggestions: [] }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    let suggestions: string[] = [];

    try {
      const parsed = JSON.parse(content);
      suggestions = (parsed.suggestions || []).slice(0, 5);
    } catch (e) {
      console.error("Erro ao parsear resposta do Gemini:", e);
      suggestions = [];
    }

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message, suggestions: [] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
