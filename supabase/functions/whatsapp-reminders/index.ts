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

    const ZAPIER_WEBHOOK_URL = Deno.env.get("ZAPIER_WEBHOOK_URL");

    if (!ZAPIER_WEBHOOK_URL) {
      throw new Error("ZAPIER_WEBHOOK_URL not configured");
    }

    const now = new Date();
    const windowStart = new Date(now.getTime() - 2 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + 2 * 60 * 1000);

    console.log(`Checking events between ${windowStart.toISOString()} and ${windowEnd.toISOString()}`);

    const { data: events, error: eventsError } = await supabase
      .from("schedule_events")
      .select("*")
      .eq("taken", false)
      .gte("scheduled_time", windowStart.toISOString())
      .lte("scheduled_time", windowEnd.toISOString());

    if (eventsError) throw new Error(`Error fetching events: ${eventsError.message}`);

    console.log(`Found ${events?.length ?? 0} events in window`);

    if (!events || events.length === 0) {
      return new Response(
        JSON.stringify({ message: "No upcoming doses to notify", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userIds = [...new Set(events.map((e: any) => e.user_id))];

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, display_name, whatsapp_number")
      .in("user_id", userIds)
      .not("whatsapp_number", "is", null);

    if (profilesError) throw new Error(`Error fetching profiles: ${profilesError.message}`);

    const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

    let sent = 0;
    const errors: string[] = [];

    for (const event of events) {
      const profile = profileMap.get(event.user_id);
      if (!profile || !profile.whatsapp_number) {
        console.log(`No WhatsApp number for user ${event.user_id}`);
        continue;
      }

      const phone = profile.whatsapp_number.replace(/\D/g, "").replace(/^0+/, "");
      console.log(`Sending via Zapier to ${phone} for ${event.medication_name}`);

      try {
        const response = await fetch(ZAPIER_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone,
            userName: profile.display_name || "Usuário",
            medicationName: event.medication_name,
            dosage: event.dosage,
            scheduledTime: event.scheduled_time,
            timestamp: new Date().toISOString(),
          }),
        });

        const text = await response.text();

        if (response.ok || response.status === 0) {
          sent++;
          console.log(`Zapier triggered for ${phone}: ${response.status}`);
        } else {
          console.error(`Zapier error for user ${event.user_id}: ${response.status} - ${text}`);
          errors.push(`User ${event.user_id}: Zapier ${response.status}`);
        }
      } catch (err) {
        console.error(`Exception for user ${event.user_id}:`, err.message);
        errors.push(`User ${event.user_id}: ${err.message}`);
      }
    }

    console.log(`Zapier reminders: sent=${sent}, errors=${errors.length}`);

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
