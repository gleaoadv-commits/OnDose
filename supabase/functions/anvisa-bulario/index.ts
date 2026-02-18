const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function searchAnvisa(query: string): Promise<any[]> {
  const url = `https://consultas.anvisa.gov.br/api/consulta/bulario?count=10&filter%5BnomeProduto%5D=${encodeURIComponent(query)}`;
  const response = await fetch(url, {
    headers: {
      "Accept": "application/json, text/plain, */*",
      "Authorization": "Guest",
      "User-Agent": "Mozilla/5.0 (compatible; OnDose/1.0)",
    },
  });

  if (!response.ok) return [];

  const data = await response.json();
  const content = data.content || data.result || data || [];
  return Array.isArray(content) ? content : [];
}

function buildVariations(name: string): string[] {
  const variations: string[] = [];
  const normalized = name.trim().toUpperCase();

  // Original name
  variations.push(normalized);

  // Common prefixes to try adding
  const prefixes = [
    "CLORIDRATO DE",
    "SULFATO DE",
    "FOSFATO DE",
    "MALEATO DE",
    "MESILATO DE",
    "TARTARATO DE",
    "FUMARATO DE",
    "SUCCINATO DE",
    "ACETATO DE",
    "BROMETO DE",
    "CITRATO DE",
    "HIDROCLORETO DE",
    "GLUCONATO DE",
  ];

  // Add prefix variations if not already there
  for (const prefix of prefixes) {
    if (!normalized.startsWith(prefix)) {
      variations.push(`${prefix} ${normalized}`);
    }
  }

  // Remove common prefixes if already there
  for (const prefix of prefixes) {
    if (normalized.startsWith(prefix + " ")) {
      variations.push(normalized.replace(prefix + " ", "").trim());
    }
  }

  // Also try partial (first word only if multi-word)
  const words = normalized.split(" ");
  if (words.length > 1) {
    variations.push(words[0]);
  }

  return [...new Set(variations)]; // deduplicate
}

function mapResult(item: any, matchedQuery: string) {
  return {
    idProduto: item.idProduto,
    nomeProduto: item.nomeProduto,
    nomeEmpresa: item.nomeEmpresa || "",
    numeroRegistro: item.numeroRegistro || "",
    expediente: item.expediente || "",
    matchedQuery,
    anvisaUrl: `https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=${encodeURIComponent(item.nomeProduto)}`,
    registroUrl: item.idProduto
      ? `https://consultas.anvisa.gov.br/#/medicamentos/${item.idProduto}`
      : null,
  };
}

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

    const variations = buildVariations(nomeProduto);
    console.log("Trying variations:", variations);

    // Search all variations in parallel
    const searches = await Promise.all(
      variations.map(async (variant) => {
        const items = await searchAnvisa(variant);
        return { variant, items };
      })
    );

    // Collect unique results (by idProduto), prioritizing exact matches first
    const seen = new Set<number>();
    const results: any[] = [];

    for (const { variant, items } of searches) {
      for (const item of items) {
        if (!seen.has(item.idProduto)) {
          seen.add(item.idProduto);
          results.push(mapResult(item, variant));
        }
      }
      // If first search (original name) returned results, stop and return them
      // to avoid too many unrelated results
      if (variant === variations[0] && results.length > 0) break;
    }

    // Limit to 8 results
    const finalResults = results.slice(0, 8);

    console.log(`Found ${finalResults.length} results for "${nomeProduto}"`);

    return new Response(JSON.stringify({ results: finalResults }), {
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
