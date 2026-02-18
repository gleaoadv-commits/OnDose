import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@18.5.0";

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

const PRO_PRODUCT = "prod_U0EtzwCBMSlt6o";
const PREMIUM_PRODUCT = "prod_U0Eub1bzRh41Dc";

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
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");

    if (!ULTRAMSG_INSTANCE_ID) throw new Error("ULTRAMSG_INSTANCE_ID not configured");
    if (!ULTRAMSG_TOKEN) throw new Error("ULTRAMSG_TOKEN not configured");
    if (!STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY not configured");

    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2025-08-27.basil" });

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
      .select("user_id, display_name, whatsapp_number, plan_override")
      .in("user_id", userIds)
      .not("whatsapp_number", "is", null);

    if (profilesError) throw new Error(`Error fetching profiles: ${profilesError.message}`);

    // Build a set of paid user IDs (PRO or Premium)
    const paidUserIds = new Set<string>();

    for (const profile of (profiles || [])) {
      // Check plan_override first (fast path)
      if (profile.plan_override === "pro" || profile.plan_override === "premium") {
        paidUserIds.add(profile.user_id);
        console.log(`User ${profile.user_id} (${profile.display_name}) is paid via plan_override: ${profile.plan_override}`);
        continue;
      }

      // No override — check Stripe subscription
      try {
        const { data: authUser } = await supabase.auth.admin.getUserById(profile.user_id);
        const email = authUser?.user?.email;
        if (!email) {
          console.log(`No email for user ${profile.user_id}, skipping`);
          continue;
        }

        const customers = await stripe.customers.list({ email, limit: 1 });
        if (customers.data.length === 0) {
          console.log(`No Stripe customer for ${email} — free plan, skipping WhatsApp`);
          continue;
        }

        const customerId = customers.data[0].id;
        const subscriptions = await stripe.subscriptions.list({
          customer: customerId,
          status: "active",
          limit: 10,
        });

        let hasPaidPlan = false;
        for (const sub of subscriptions.data) {
          const productId = sub.items.data[0]?.price?.product;
          if (productId === PRO_PRODUCT || productId === PREMIUM_PRODUCT) {
            hasPaidPlan = true;
            break;
          }
        }

        if (hasPaidPlan) {
          paidUserIds.add(profile.user_id);
          console.log(`User ${profile.user_id} (${profile.display_name}) is paid via Stripe`);
        } else {
          console.log(`User ${profile.user_id} (${profile.display_name}) has no active paid plan — skipping`);
        }
      } catch (err) {
        console.error(`Error checking plan for user ${profile.user_id}:`, err.message);
      }
    }

    // Only include profiles of paid users with whatsapp
    const profileMap = new Map(
      (profiles || [])
        .filter((p: any) => paidUserIds.has(p.user_id) && p.whatsapp_number)
        .map((p: any) => [p.user_id, p])
    );

    console.log(`Paid users with WhatsApp eligible for reminders: ${profileMap.size}`);

    // Group events by user_id + rounded scheduled_time
    const groups = new Map<string, { userId: string; roundedTime: string; meds: { name: string; dosage: string }[] }>();

    for (const event of events) {
      const profile = profileMap.get(event.user_id);
      if (!profile) continue;

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
        const med = group.meds[0];
        medsText = `📌 *${med.name}*\n💊 Dose: ${med.dosage}`;
      } else {
        medsText = group.meds
          .map((med) => `📌 *${med.name}*\n   💊 Dose: ${med.dosage}`)
          .join("\n\n");
      }

      const plural = group.meds.length > 1 ? "seus medicamentos" : "seu medicamento";
      const appLink = "https://ondose.lovable.app";
      const message = `💊 *Lembrete OnDose*\n\nOlá, *${userName}*!\n\nHora de tomar ${plural}:\n\n${medsText}\n\n${closing}\n\n✅ Marque como tomado no app:\n${appLink}`;

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
