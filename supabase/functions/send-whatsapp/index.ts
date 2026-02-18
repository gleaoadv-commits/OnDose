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
    const ULTRAMSG_INSTANCE_ID = Deno.env.get("ULTRAMSG_INSTANCE_ID");
    const ULTRAMSG_TOKEN = Deno.env.get("ULTRAMSG_TOKEN");

    if (!ULTRAMSG_INSTANCE_ID) {
      throw new Error("ULTRAMSG_INSTANCE_ID not configured");
    }
    if (!ULTRAMSG_TOKEN) {
      throw new Error("ULTRAMSG_TOKEN not configured");
    }

    const { to, userName, medicationName, dosage } = await req.json();

    if (!to || !userName || !medicationName || !dosage) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, userName, medicationName, dosage" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format phone: remove non-digits, ensure country code (Brazil 55 default)
    let phone = to.replace(/\D/g, "").replace(/^0+/, "");
    if (!phone.startsWith("55") && phone.length <= 11) {
      phone = "55" + phone;
    }

    const message = `💊 *Lembrete OnDose*\n\nOlá, *${userName}*!\n\nHora de tomar seu medicamento:\n📌 *${medicationName}*\n💊 Dose: ${dosage}\n\nCuide-se! 😊`;

    console.log(`Sending UltraMsg to ${phone} (${medicationName})`);

    const response = await fetch(
      `https://api.ultramsg.com/${ULTRAMSG_INSTANCE_ID}/messages/chat`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          token: ULTRAMSG_TOKEN,
          to: phone,
          body: message,
        }).toString(),
      }
    );

    const result = await response.json();
    console.log(`UltraMsg response: ${response.status}`, result);

    if (!response.ok || result.error) {
      throw new Error(`UltraMsg error: ${result.error || response.status}`);
    }

    return new Response(JSON.stringify({ success: true, result }), {
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
