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

    const systemPrompt = `Você é um médico laboratorista especialista em interpretar resultados de exames brasileiros.
Analise o exame enviado (imagem ou texto) e extraia TODOS os indicadores de saúde encontrados.

Siga estas regras rigorosamente:
1. Extraia o nome exato do indicador (ex: Glicose, Colesterol LDL, Creatinina, Hemoglobina).
2. O campo "value" DEVE ser um número. Se o valor no exame usar vírgula (ex: "95,5"), converta para ponto ("95.5").
3. Identifique a unidade de medida (ex: mg/dL, g/dL, UI/L).
4. Extraia os limites de referência (min e max) se estiverem presentes. Caso contrário, use valores padrão médicos brasileiros.
5. Defina o "status": "normal" (dentro da faixa), "alto" (acima do max) ou "baixo" (abaixo do min).
6. Se não conseguir ler ou os dados forem inconsistentes, retorne success=false.
7. Retorne SEMPRE um JSON puro seguindo a estrutura fornecida. Não inclua Markdown.

Aviso: Informe sempre que os dados são informativos e não substituem avaliação médica.`;

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
