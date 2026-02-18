import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const WHATSAPP_ACCESS_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
    const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");

    if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
      throw new Error("WhatsApp credentials not configured");
    }

    const now = new Date();

    // Look for events in a ±2 minute window around "now" that haven't been taken
    // This handles timezone drift and cron timing imprecision
    const windowStart = new Date(now.getTime() - 2 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + 2 * 60 * 1000);

    console.log(`Checking events between ${windowStart.toISOString()} and ${windowEnd.toISOString()}`);

    const { data: events, error: eventsError } = await supabase
      .from("schedule_events")
      .select("*")
      .eq("taken", false)
      .gte("scheduled_time", windowStart.toISOString())
      .lte("scheduled_time", windowEnd.toISOString());

    if (eventsError) {
      throw new Error(`Error fetching events: ${eventsError.message}`);
    }

    console.log(`Found ${events?.length ?? 0} events in window`);

    if (!events || events.length === 0) {
      return new Response(
        JSON.stringify({ message: "No upcoming doses to notify", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get unique user IDs
    const userIds = [...new Set(events.map((e: any) => e.user_id))];

    // Get profiles with WhatsApp numbers
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, display_name, whatsapp_number")
      .in("user_id", userIds)
      .not("whatsapp_number", "is", null);

    if (profilesError) {
      throw new Error(`Error fetching profiles: ${profilesError.message}`);
    }

    const profileMap = new Map(
      (profiles || []).map((p: any) => [p.user_id, p])
    );

    let sent = 0;
    const errors: string[] = [];

    for (const event of events) {
      const profile = profileMap.get(event.user_id);
      if (!profile || !profile.whatsapp_number) {
        console.log(`No WhatsApp number for user ${event.user_id}`);
        continue;
      }

      const phone = profile.whatsapp_number.replace(/\D/g, "").replace(/^0+/, "");
      console.log(`Sending WhatsApp to ${phone} for event ${event.id} (${event.medication_name} at ${event.scheduled_time})`);

      try {
        const response = await fetch(
          `https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              to: phone,
              type: "template",
              template: {
                name: "lembrete_medicamento",
                language: { code: "pt_BR" },
                components: [
                  {
                    type: "body",
                    parameters: [
                      { type: "text", text: profile.display_name || "Usuário" },
                      { type: "text", text: event.medication_name },
                      { type: "text", text: event.dosage },
                    ],
                  },
                ],
              },
            }),
          }
        );

        const result = await response.json();

        if (response.ok) {
          sent++;
          console.log(`WhatsApp sent successfully to ${phone}, messageId: ${result.messages?.[0]?.id}`);
        } else {
          console.error(`WhatsApp API error for user ${event.user_id}:`, JSON.stringify(result));
          errors.push(`User ${event.user_id}: ${JSON.stringify(result)}`);
        }
      } catch (err) {
        console.error(`Exception for user ${event.user_id}:`, err.message);
        errors.push(`User ${event.user_id}: ${err.message}`);
      }
    }

    console.log(`WhatsApp reminders: sent=${sent}, errors=${errors.length}`);

    return new Response(
      JSON.stringify({ sent, errors: errors.length, errorDetails: errors }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
