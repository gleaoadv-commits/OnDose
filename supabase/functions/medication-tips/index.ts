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

    const { medicationName, currentMedications, times } = await req.json();

    if (!medicationName || medicationName.trim().length < 2) {
      return new Response(JSON.stringify({ tips: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build context about existing medications and schedule conflicts
    const existingMedsText = currentMedications && currentMedications.length > 0
      ? currentMedications.map((m: any) => `- ${m.name} (${m.dosage}) nos horários: ${m.times.join(", ")}`).join("\n")
      : "Nenhum medicamento cadastrado ainda.";

    const newTimesText = times && times.length > 0 ? times.join(", ") : "não definidos";

    // Find time conflicts
    const conflicts: string[] = [];
    if (times && currentMedications) {
      for (const med of currentMedications) {
        const overlap = times.filter((t: string) => med.times.includes(t));
        if (overlap.length > 0) {
          conflicts.push(`${med.name} (horários: ${overlap.join(", ")})`);
        }
      }
    }
    const conflictText = conflicts.length > 0
      ? `ATENÇÃO: Os seguintes medicamentos já estão agendados nos MESMOS horários: ${conflicts.join("; ")}`
      : "";

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: "Você é um assistente farmacêutico brasileiro especializado em medicamentos. Seu papel é fornecer dicas práticas e alertas importantes sobre medicamentos de forma clara e acessível. Retorne APENAS dicas relevantes em formato JSON." }]
        },
        contents: [
          {
            parts: [{
              text: `O usuário está cadastrando o medicamento: "${medicationName.trim()}" 
Horários programados para o novo medicamento: ${newTimesText}
Medicamentos que o usuário JÁ TEM cadastrados:
${existingMedsText}
${conflictText}

Por favor, analise e retorne um objeto JSON com o campo 'tips' sendo um array de objetos. Cada objeto deve ter 'type' (enum: ["info", "warning", "danger"]) e 'message' (string, máx 100 caracteres).` }]
          }
        ],
        generationConfig: {
          response_mime_type: "application/json",
        }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "rate_limit", tips: [] }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "payment_required", tips: [] }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    let tips: any[] = [];

    try {
      const parsed = JSON.parse(content);
      tips = (parsed.tips || []).slice(0, 4);
    } catch (e) {
      console.error("Erro ao parsear resposta do Gemini:", e);
      tips = [];
    }

    return new Response(JSON.stringify({ tips }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message, tips: [] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
