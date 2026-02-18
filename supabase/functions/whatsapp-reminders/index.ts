import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Round a date to the nearest minute for grouping same-time doses
function roundToMinute(dateStr: string): string {
  const d = new Date(dateStr);
  d.setSeconds(0, 0);
  return d.toISOString();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const ULTRAMSG_INSTANCE_ID = Deno.env.get("ULTRAMSG_INSTANCE_ID");
    const ULTRAMSG_TOKEN = Deno.env.get("ULTRAMSG_TOKEN");

    if (!ULTRAMSG_INSTANCE_ID) throw new Error("ULTRAMSG_INSTANCE_ID not configured");
    if (!ULTRAMSG_TOKEN) throw new Error("ULTRAMSG_TOKEN not configured");

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

    // Group events by user_id + rounded scheduled_time
    // Key: "userId::roundedMinute"
    const groups = new Map<string, { userId: string; roundedTime: string; meds: { name: string; dosage: string }[] }>();

    for (const event of events) {
      const profile = profileMap.get(event.user_id);
      if (!profile || !profile.whatsapp_number) continue;

      const roundedTime = roundToMinute(event.scheduled_time);
      const key = `${event.user_id}::${roundedTime}`;

      if (!groups.has(key)) {
        groups.set(key, { userId: event.user_id, roundedTime, meds: [] });
      }
      groups.get(key)!.meds.push({ name: event.medication_name, dosage: event.dosage });
    }

    const closings = [
      "Cuide-se! Você está indo muito bem! 💪",
      "Saúde é o seu maior bem. Vamos juntos! 🌱",
      "Cada dose é um passo para uma vida mais saudável! ✨",
      "Você não está sozinho nessa jornada. Continue! 🤝",
      "Pequenos hábitos fazem grandes diferenças. Parabéns! 🏆",
      "Seu bem-estar importa. Continue firme! 💙",
      "Um passo de cada vez. Você consegue! 🌟",
      "Cuidar de si mesmo é o maior ato de amor! ❤️",
      "A consistência é o segredo da saúde. Continue assim! 🎯",
      "Hoje é mais um dia de autocuidado. Orgulhe-se! 🌸",
    ];

    let sent = 0;
    const errors: string[] = [];

    for (const group of groups.values()) {
      const profile = profileMap.get(group.userId)!;

      // Format phone: remove non-digits, add Brazil country code if needed
      let phone = profile.whatsapp_number.replace(/\D/g, "").replace(/^0+/, "");
      if (!phone.startsWith("55") && phone.length <= 11) {
        phone = "55" + phone;
      }

      const userName = profile.display_name || "Usuário";
      const closing = closings[Math.floor(Math.random() * closings.length)];

      let medsText: string;
      if (group.meds.length === 1) {
        // Single medication
        const med = group.meds[0];
        medsText = `📌 *${med.name}*\n💊 Dose: ${med.dosage}`;
      } else {
        // Multiple medications at same time — list all together
        medsText = group.meds
          .map((med, i) => `📌 *${med.name}*\n   💊 Dose: ${med.dosage}`)
          .join("\n\n");
      }

      const plural = group.meds.length > 1 ? "seus medicamentos" : "seu medicamento";
      const message = `💊 *Lembrete OnDose*\n\nOlá, *${userName}*!\n\nHora de tomar ${plural}:\n\n${medsText}\n\n${closing}`;

      console.log(`Sending UltraMsg to ${phone} — ${group.meds.length} med(s) at ${group.roundedTime}`);

      try {
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

        if (response.ok && !result.error) {
          sent++;
          console.log(`UltraMsg sent to ${phone}: ${response.status}`);
        } else {
          console.error(`UltraMsg error for user ${group.userId}:`, result);
          errors.push(`User ${group.userId}: ${result.error || response.status}`);
        }
      } catch (err) {
        console.error(`Exception for user ${group.userId}:`, err.message);
        errors.push(`User ${group.userId}: ${err.message}`);
      }
    }

    console.log(`UltraMsg reminders: sent=${sent}, groups=${groups.size}, errors=${errors.length}`);

    return new Response(
      JSON.stringify({ sent, groups: groups.size, errors: errors.length, errorDetails: errors }),
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
