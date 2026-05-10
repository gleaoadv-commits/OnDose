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

    const TOO_LATE_MSG = "⏳ *Tempo expirado*\n\nFaz mais de 1 hora desde o lembrete. Por segurança, não posso registrar por aqui. Por favor, abra o app para atualizar manualmente:\n\nhttps://ondose.lovable.app";

    if (messageText === "1" || messageText === "2") {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
      const tenMinFromNow = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      // Look up notified events in the last 3h to detect "too late" replies (>1h after reminder).
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

      // Filter to events within the 1h window (recent reminder).
      const recentEvents = (pendingEvents || []).filter(
        (e: any) => e.scheduled_time >= oneHourAgo
      );

      if (recentEvents.length === 0) {
        // Either no pending events at all, or the most recent one is older than 1h.
        // If there ARE older notified events still pending, tell the user it's too late.
        if (pendingEvents && pendingEvents.length > 0) {
          await sendZAPIMessage(ZAPI_INSTANCE_ID, ZAPI_TOKEN, ZAPI_CLIENT_TOKEN, cleanPhone, TOO_LATE_MSG);
        } else {
          console.log(`No pending events for user ${userId} — skipping duplicate confirmation`);
        }
      } else if (messageText === "1") {
        // Only confirm doses from the most recent reminder (same scheduled minute).
        const latestTime = new Date(recentEvents[0].scheduled_time);
        latestTime.setSeconds(0, 0);
        const latestKey = latestTime.toISOString();
        const matchingEvents = recentEvents.filter((e: any) => {
          const d = new Date(e.scheduled_time);
          d.setSeconds(0, 0);
          return d.toISOString() === latestKey;
        });
        const eventIds = matchingEvents.map((e: any) => e.id);
        await supabase
          .from("schedule_events")
          .update({ taken: true, taken_at: new Date().toISOString() })
          .in("id", eventIds);

        for (const event of matchingEvents) {
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
          `✅ *Dose Registrada!*\n\n${matchingEvents.length} dose(s) marcada(s) como tomada(s). Excelente! Continue assim. Sua saúde agradece! 💪💊`
        );
      } else {
        // messageText === "2"
        await sendZAPIMessage(
          ZAPI_INSTANCE_ID,
          ZAPI_TOKEN,
          ZAPI_CLIENT_TOKEN,
          cleanPhone,
          "⏰ *Entendido!*\n\nSem problemas. Não esqueça de registrar o horário correto no app assim que possível! 📱✨\nhttps://ondose.lovable.app"
        );
      }
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
