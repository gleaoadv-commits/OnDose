import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { medications } = await req.json();

    if (!medications || medications.length < 2) {
      return new Response(JSON.stringify({ interactions: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

    const medList = medications.map((m: any) => `- ${m.name} (${m.dosage})`).join("\n");

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: "Você é um assistente farmacêutico especialista em interações medicamentosas. Analise a lista de medicamentos e identifique interações clinicamente relevantes. Retorne APENAS interações reais e conhecidas em formato JSON." }]
        },
        contents: [
          {
            parts: [{ text: `Analise as possíveis interações entre estes medicamentos em uso simultâneo:\n${medList}\n\nRetorne um objeto JSON com o campo 'interactions' sendo um array de objetos. Cada objeto deve ter 'drugs' (array de strings), 'severity' (enum: ["leve", "moderada", "grave"]) e 'description' (string).` }]
          }
        ],
        generationConfig: {
          response_mime_type: "application/json",
        }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) throw new Error("rate_limit");
      if (response.status === 402) throw new Error("payment_required");
      throw new Error(`AI error: ${response.status}`);
    }

    const aiData = await response.json();
    const content = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const result = JSON.parse(content);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    const msg = err.message || "Unknown error";
    const status = msg === "rate_limit" ? 429 : msg === "payment_required" ? 402 : 500;
    return new Response(JSON.stringify({ error: msg }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
