import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { medicationName, frequency, dosage } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    const frequencyLabels: Record<string, string> = {
      "10-10dias": "a cada 10 dias",
      "15-15dias": "a cada 15 dias",
      "20-20dias": "a cada 20 dias",
      "mensal": "uma vez por mês",
      "semanal": "uma vez por semana",
    };

    const freqLabel = frequencyLabels[frequency] || frequency;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: "Você é um assistente de saúde carinhoso e motivador do app OnDose. Gere UMA mensagem curta (máximo 2 frases) comemorando e incentivando o paciente que lembrou de tomar seu medicamento. A mensagem deve ser calorosa, usar emojis de forma moderada, e ser específica para a frequência do medicamento. Varie o tom entre: orgulho, celebração, encorajamento, carinho. NUNCA repita a mesma mensagem. Seja criativo. Responda APENAS com a mensagem motivacional, sem prefixos." }]
        },
        contents: [
          {
            parts: [{ text: `O paciente vai tomar ${medicationName} (${dosage}), que é tomado ${freqLabel}. Gere uma mensagem motivacional única para este momento.` }]
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const message = data.candidates?.[0]?.content?.parts?.[0]?.text || "Parabéns por cuidar da sua saúde! 💊✨";

    return new Response(JSON.stringify({ message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("motivational error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
