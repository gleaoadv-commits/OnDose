import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const META_API_VERSION = "v21.0";

async function sendMetaTextMessage(phoneNumberId: string, accessToken: string, to: string, body: string) {
  const url = `https://graph.facebook.com/${META_API_VERSION}/${phoneNumberId}/messages`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body },
    }),
  });
  const result = await response.json();
  if (!response.ok || result?.error) {
    console.error("Meta send error:", JSON.stringify(result?.error || result));
  }
  return result;
}

Deno.serve(async (req) => {
  // Meta webhook verification (GET request with hub.verify_token)
  if (req.method === "GET") {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    const VERIFY_TOKEN = Deno.env.get("WHATSAPP_VERIFY_TOKEN") || "ondose_verify_2024";

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("Webhook verification successful");
      return new Response(challenge, { status: 200 });
    }
    return new Response("Forbidden", { status: 403 });
  }

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID")!;
    const WHATSAPP_ACCESS_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN")!;

    const body = await req.json();
    console.log("Meta Webhook received:", JSON.stringify(body));

    // Meta webhook payload structure
    const entry = body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (!value?.messages || value.messages.length === 0) {
      // Status updates or other non-message events
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const message = value.messages[0];
    const phone = message.from; // sender phone number
    const messageText = message?.text?.body?.trim();

    if (!phone || !messageText) {
      return new Response(JSON.stringify({ success: true, message: "No actionable message" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Message from ${phone}: "${messageText}"`);

    // Find user by whatsapp number
    const phoneVariants = [phone, phone.replace(/^55/, "")];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, whatsapp_number")
      .or(phoneVariants.map(p => `whatsapp_number.like.%${p.slice(-8)}%`).join(","));

    if (!profiles || profiles.length === 0) {
      console.log(`No profile found for phone ${phone}`);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const profile = profiles[0];
    const userId = profile.user_id;

    if (messageText === "1") {
      // Mark recent pending doses as taken
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      const now = new Date().toISOString();

      const { data: pendingEvents, error: fetchError } = await supabase
        .from("schedule_events")
        .select("id, medication_id, dosage")
        .eq("user_id", userId)
        .eq("taken", false)
        .gte("scheduled_time", twoHoursAgo)
        .lte("scheduled_time", now);

      if (fetchError) {
        console.error("Error fetching events:", fetchError.message);
      }

      if (pendingEvents && pendingEvents.length > 0) {
        const eventIds = pendingEvents.map((e: any) => e.id);
        await supabase
          .from("schedule_events")
          .update({ taken: true, taken_at: new Date().toISOString() })
          .in("id", eventIds);

        // Decrement stock for each medication
        for (const event of pendingEvents) {
          const { data: med } = await supabase
            .from("medications")
            .select("stock_current")
            .eq("id", event.medication_id)
            .single();

          if (med?.stock_current != null && med.stock_current > 0) {
            await supabase
              .from("medications")
              .update({ stock_current: med.stock_current - 1 })
              .eq("id", event.medication_id);
          }
        }

        await sendMetaTextMessage(
          WHATSAPP_PHONE_NUMBER_ID,
          WHATSAPP_ACCESS_TOKEN,
          phone,
          `✅ *Dose Registrada!*\n\n${pendingEvents.length} dose(s) marcada(s) como tomada(s). Excelente! Continue assim. Sua saúde agradece! 💪💊`
        );
      } else {
        await sendMetaTextMessage(
          WHATSAPP_PHONE_NUMBER_ID,
          WHATSAPP_ACCESS_TOKEN,
          phone,
          "ℹ️ Não encontrei doses pendentes nas últimas 2 horas. Verifique no app: https://ondose.lovable.app"
        );
      }
    } else if (messageText === "2") {
      await sendMetaTextMessage(
        WHATSAPP_PHONE_NUMBER_ID,
        WHATSAPP_ACCESS_TOKEN,
        phone,
        "⏰ *Entendido!*\n\nSem problemas. Não esqueça de registrar o horário correto no app assim que possível! 📱✨\nhttps://ondose.lovable.app"
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error processing webhook:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
