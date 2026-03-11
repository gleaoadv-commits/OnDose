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
    const ZAPI_INSTANCE_ID = Deno.env.get("ZAPI_INSTANCE_ID")!;
    const ZAPI_TOKEN = Deno.env.get("ZAPI_TOKEN")!;
    const ZAPI_CLIENT_TOKEN = Deno.env.get("ZAPI_CLIENT_TOKEN")!;
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;

    const webhookUrl = `${SUPABASE_URL}/functions/v1/whatsapp-webhook`;

    // Set the "on receive" webhook via Z-API
    const url = `https://api.z-api.io/instances/${ZAPI_INSTANCE_ID}/token/${ZAPI_TOKEN}/update-webhook-received`;
    
    console.log(`Setting Z-API webhook to: ${webhookUrl}`);

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Client-Token": ZAPI_CLIENT_TOKEN,
      },
      body: JSON.stringify({
        value: webhookUrl,
      }),
    });

    const result = await response.json();
    console.log("Z-API response:", JSON.stringify(result));

    // Also get current webhook status
    const statusUrl = `https://api.z-api.io/instances/${ZAPI_INSTANCE_ID}/token/${ZAPI_TOKEN}/webhooks`;
    const statusResponse = await fetch(statusUrl, {
      method: "GET",
      headers: {
        "Client-Token": ZAPI_CLIENT_TOKEN,
      },
    });
    const statusResult = await statusResponse.json();
    console.log("Current webhooks:", JSON.stringify(statusResult));

    return new Response(JSON.stringify({ 
      success: response.ok, 
      setResult: result, 
      currentWebhooks: statusResult,
      webhookUrl 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
