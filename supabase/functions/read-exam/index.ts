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
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    const { imageBase64, mimeType, pdfText } = await req.json();

    if (!imageBase64 && !pdfText) {
      return new Response(
        JSON.stringify({ error: "imageBase64 ou pdfText é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `Você é um médico laboratorista especialista em interpretar resultados de exames.
Analise o exame enviado e extraia TODOS os indicadores encontrados.

Responda SEMPRE em JSON puro (sem markdown) com a seguinte estrutura:
{
  "success": true/false,
  "exam_name": "Nome do exame (ex: Hemograma Completo, Perfil Lipídico, etc)",
  "indicators": [
    {
      "name": "Nome do indicador (ex: Glicose, Colesterol Total, Hemoglobina)",
      "value": 95.5,
      "unit": "mg/dL",
      "reference_min": 70,
      "reference_max": 99,
      "status": "normal/alto/baixo"
    }
  ],
  "observations": "Observações gerais sobre o exame"
}

Regras:
- Extraia TODOS os indicadores visíveis no exame
- Os valores de referência devem ser os padrões médicos se não estiverem visíveis
- O campo "value" deve ser numérico
- Se não conseguir ler, retorne success=false com uma mensagem em observations
- Sempre informe que os resultados são apenas informativos e não substituem avaliação médica`;

    let userContent: any[];

    if (pdfText) {
      // PDF: text was extracted on the client, send as text
      userContent = [
        {
          type: "text",
          text: `Aqui está o texto extraído de um PDF de exame laboratorial. Extraia todos os indicadores. Responda em JSON.\n\n${pdfText}`,
        },
      ];
    } else {
      // Image: send as image_url
      const resolvedMime = mimeType || "image/jpeg";
      userContent = [
        {
          type: "image_url",
          image_url: {
            url: `data:${resolvedMime};base64,${imageBase64}`,
          },
        },
        {
          type: "text",
          text: "Extraia todos os indicadores deste exame. Responda em JSON.",
        },
      ];
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
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
            parts: pdfText ? [{ text: `Aqui está o texto extraído de um PDF de exame laboratorial. Extraia todos os indicadores. Responda em JSON.\n\n${pdfText}` }] : [
              { text: "Extraia todos os indicadores deste exame. Responda em JSON." },
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
        JSON.stringify({ error: "Erro na análise do exame" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResult = await response.json();
    const content = aiResult.candidates?.[0]?.content?.parts?.[0]?.text || "";

    let parsed;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      parsed = JSON.parse(jsonMatch[1].trim());
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
