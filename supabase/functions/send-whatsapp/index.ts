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
    const ZAPIER_WEBHOOK_URL = Deno.env.get("ZAPIER_WEBHOOK_URL");

    if (!ZAPIER_WEBHOOK_URL) {
      throw new Error("ZAPIER_WEBHOOK_URL not configured");
    }

    const { to, userName, medicationName, dosage } = await req.json();

    if (!to || !userName || !medicationName || !dosage) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, userName, medicationName, dosage" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const phone = to.replace(/\D/g, "").replace(/^0+/, "");

    console.log(`Sending to Zapier webhook for ${phone} (${medicationName})`);

    const response = await fetch(ZAPIER_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone,
        userName,
        medicationName,
        dosage,
        timestamp: new Date().toISOString(),
      }),
    });

    const text = await response.text();
    console.log(`Zapier response: ${response.status} - ${text}`);

    return new Response(JSON.stringify({ success: true, zapierStatus: response.status }), {
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
