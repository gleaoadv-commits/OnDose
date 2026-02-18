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
    const { nomeProduto } = await req.json();

    if (!nomeProduto || nomeProduto.trim().length < 2) {
      return new Response(JSON.stringify({ results: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const name = nomeProduto.trim().toUpperCase();
    const query = encodeURIComponent(name);
    const url = `https://consultas.anvisa.gov.br/api/consulta/bulario?count=5&filter%5BnomeProduto%5D=${query}`;

    const response = await fetch(url, {
      headers: {
        "Accept": "application/json, text/plain, */*",
        "Authorization": "Guest",
        "User-Agent": "Mozilla/5.0 (compatible; OnDose/1.0)",
      },
    });

    if (!response.ok) {
      console.error("ANVISA API error:", response.status);
      return new Response(
        JSON.stringify({ results: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.content || data.result || data || [];

    const results = Array.isArray(content)
      ? content.slice(0, 5).map((item: any) => ({
          idProduto: item.idProduto,
          nomeProduto: item.nomeProduto,
          nomeEmpresa: item.nomeEmpresa || "",
          numeroRegistro: item.numeroRegistro || "",
          expediente: item.expediente || "",
          // Direct link to ANVISA website for this product
          anvisaUrl: `https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=${encodeURIComponent(item.nomeProduto)}`,
          // Direct link to medication registration details
          registroUrl: item.idProduto
            ? `https://consultas.anvisa.gov.br/#/medicamentos/${item.idProduto}`
            : null,
        }))
      : [];

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error.message);
    return new Response(
      JSON.stringify({ results: [], error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
