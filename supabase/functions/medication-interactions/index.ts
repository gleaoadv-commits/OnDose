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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const medList = medications.map((m: any) => `- ${m.name} (${m.dosage})`).join("\n");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Você é um assistente farmacêutico especialista em interações medicamentosas.
Analise a lista de medicamentos e identifique interações clinicamente relevantes.
Retorne APENAS interações reais e conhecidas — não invente.
Para cada interação, indique: os medicamentos envolvidos, a gravidade (leve/moderada/grave) e uma explicação breve em português simples.
Se não houver interações conhecidas, retorne lista vazia.`,
          },
          {
            role: "user",
            content: `Analise as possíveis interações entre estes medicamentos em uso simultâneo:\n${medList}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "report_interactions",
              description: "Reporta interações medicamentosas encontradas",
              parameters: {
                type: "object",
                properties: {
                  interactions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        drugs: { type: "array", items: { type: "string" }, description: "Nomes dos medicamentos envolvidos" },
                        severity: { type: "string", enum: ["leve", "moderada", "grave"] },
                        description: { type: "string", description: "Explicação em português simples" },
                      },
                      required: ["drugs", "severity", "description"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["interactions"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "report_interactions" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) throw new Error("rate_limit");
      if (response.status === 402) throw new Error("payment_required");
      throw new Error(`AI error: ${response.status}`);
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    const result = toolCall ? JSON.parse(toolCall.function.arguments) : { interactions: [] };

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
