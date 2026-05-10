import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function sendZAPIMessage(instanceId: string, token: string, clientToken: string, to: string, body: string) {
  const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Client-Token": clientToken,
    },
    body: JSON.stringify({
      phone: to,
      message: body,
    }),
  });
  const result = await response.json();
  if (!response.ok) {
    console.error("Z-API send error:", JSON.stringify(result));
  }
  return result;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const ZAPI_INSTANCE_ID = Deno.env.get("ZAPI_INSTANCE_ID")!;
    const ZAPI_TOKEN = Deno.env.get("ZAPI_TOKEN")!;
    const ZAPI_CLIENT_TOKEN = Deno.env.get("ZAPI_CLIENT_TOKEN")!;

    const body = await req.json();
    console.log("Z-API Webhook received:", JSON.stringify(body));

    // Z-API webhook payload: { phone, text: { message }, fromMe, isGroup, ... }
    const phone = body?.phone;
    const messageText = body?.text?.message?.trim();
    const fromMe = body?.fromMe;

    // Ignore messages sent by us or without text
    if (fromMe || !phone || !messageText) {
      return new Response(JSON.stringify({ success: true, message: "No actionable message" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cleanPhone = phone.replace(/\D/g, "");
    console.log(`Message from ${cleanPhone}: "${messageText}"`);

    // Find user by whatsapp number
    const phoneVariants = [cleanPhone, cleanPhone.replace(/^55/, "")];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, whatsapp_number")
      .or(phoneVariants.map(p => `whatsapp_number.like.%${p.slice(-8)}%`).join(","));

    if (!profiles || profiles.length === 0) {
      console.log(`No profile found for phone ${cleanPhone}`);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const profile = profiles[0];
    const userId = profile.user_id;

    if (messageText === "1") {
      const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
      const tenMinFromNow = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      // Only confirm doses that were actually notified via WhatsApp recently.
      // This prevents marking unrelated pending doses (e.g. earlier missed ones, or other meds at nearby times).
      const { data: pendingEvents, error: fetchError } = await supabase
        .from("schedule_events")
        .select("id, medication_id, dosage, scheduled_time")
        .eq("user_id", userId)
        .eq("taken", false)
        .eq("notified", true)
        .gte("scheduled_time", threeHoursAgo)
        .lte("scheduled_time", tenMinFromNow)
        .order("scheduled_time", { ascending: false });

      if (fetchError) {
        console.error("Error fetching events:", fetchError.message);
      }

      if (pendingEvents && pendingEvents.length > 0) {
        const eventIds = pendingEvents.map((e: any) => e.id);
        await supabase
          .from("schedule_events")
          .update({ taken: true, taken_at: new Date().toISOString() })
          .in("id", eventIds);

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

        await sendZAPIMessage(
          ZAPI_INSTANCE_ID,
          ZAPI_TOKEN,
          ZAPI_CLIENT_TOKEN,
          cleanPhone,
          `✅ *Dose Registrada!*\n\n${pendingEvents.length} dose(s) marcada(s) como tomada(s). Excelente! Continue assim. Sua saúde agradece! 💪💊`
        );
      } else {
        // No pending events — likely already processed by a previous webhook call, so don't reply again
        console.log(`No pending events for user ${userId} — skipping duplicate confirmation`);
      }
    } else if (messageText === "2") {
      await sendZAPIMessage(
        ZAPI_INSTANCE_ID,
        ZAPI_TOKEN,
        ZAPI_CLIENT_TOKEN,
        cleanPhone,
        "⏰ *Entendido!*\n\nSem problemas. Não esqueça de registrar o horário correto no app assim que possível! 📱✨\nhttps://ondose.lovable.app"
      );
    } else if (messageText === "3") {
      await sendZAPIMessage(
        ZAPI_INSTANCE_ID,
        ZAPI_TOKEN,
        ZAPI_CLIENT_TOKEN,
        cleanPhone,
        "📱 *Acesse o OnDose* para gerenciar suas doses individualmente:\n\nhttps://ondose.lovable.app\n\nLá você pode marcar cada medicamento separadamente! 💊"
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
