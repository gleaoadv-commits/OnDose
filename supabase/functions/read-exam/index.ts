import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    // Require authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );
    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("ERRO: LOVABLE_API_KEY não configurada");
      return new Response(JSON.stringify({ error: "Configuração de IA pendente." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { imageBase64, mimeType, pdfText } = await req.json();

    if (!imageBase64 && !pdfText) {
      return new Response(
        JSON.stringify({ error: "imageBase64 ou pdfText é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `Você é um médico laboratorista especialista em interpretar resultados de exames brasileiros.
Analise o exame enviado (imagem ou texto) e extraia TODAS as informações abaixo.

Estrutura JSON obrigatória (sem markdown, sem texto extra):
{
  "success": boolean,
  "exam_name": string,        // Nome principal do exame (ex: "Hemograma Completo", "Perfil Lipídico")
  "exam_date": string|null,   // Data da coleta no formato YYYY-MM-DD se identificável
  "doctor_name": string|null, // Nome completo do médico solicitante/responsável, se houver
  "doctor_crm": string|null,  // CRM do médico no formato "CRM/UF 123456" se identificável
  "indicators": [
    { "name": string, "value": number, "unit": string, "reference_min": number|null, "reference_max": number|null, "status": "normal"|"alto"|"baixo" }
  ],
  "observations": string
}

Regras:
1. Extraia o nome exato de cada indicador (Glicose, Colesterol LDL, Creatinina, Hemoglobina, etc).
2. "value" DEVE ser número. Converta vírgula em ponto ("95,5" → 95.5).
3. Identifique a unidade (mg/dL, g/dL, UI/L).
4. Extraia min/max de referência se presentes; senão use padrões médicos brasileiros.
5. status: "normal" (dentro da faixa), "alto" (acima do máx) ou "baixo" (abaixo do mín).
6. Procure cuidadosamente por nome do médico (geralmente "Dr.", "Dra.", "Médico Responsável") e CRM.
7. Se não conseguir ler ou os dados forem inconsistentes, retorne success=false.
8. Retorne SEMPRE JSON puro. Não inclua Markdown.`;

    let userContent: any;
    if (pdfText) {
      userContent = [
        { type: "text", text: `Aqui está o texto extraído de um PDF de exame laboratorial. Extraia todos os indicadores. Responda em JSON.\n\n${pdfText}` },
      ];
    } else {
      const resolvedMime = mimeType || "image/jpeg";
      userContent = [
        { type: "text", text: "Extraia todos os indicadores deste exame. Responda em JSON." },
        { type: "image_url", image_url: { url: `data:${resolvedMime};base64,${imageBase64}` } },
      ];
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
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
          JSON.stringify({ error: "Créditos de IA insuficientes." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(
        JSON.stringify({ error: "Erro na análise do exame" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || "";

    let parsed;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const raw = jsonMatch ? jsonMatch[1].trim() : content.trim();
      parsed = JSON.parse(raw);
    } catch {
      parsed = {
        success: false,
        observations: content || "Não foi possível processar a resposta da IA.",
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
