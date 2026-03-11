import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error("Z-API erro:", JSON.stringify(result));
  }
  return { ok: response.ok, response, result };
}

function roundToMinute(dateStr: string): string {
  const d = new Date(dateStr);
  d.setSeconds(0, 0);
  return d.toISOString();
}

function extractHourFromUTCString(dateStr: string): string {
  const d = new Date(dateStr);
  d.setHours(d.getHours() - 3); // UTC -> BRT
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
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

    const ZAPI_INSTANCE_ID = Deno.env.get("ZAPI_INSTANCE_ID");
    const ZAPI_TOKEN = Deno.env.get("ZAPI_TOKEN");
    const ZAPI_CLIENT_TOKEN = Deno.env.get("ZAPI_CLIENT_TOKEN");

    if (!ZAPI_INSTANCE_ID || !ZAPI_TOKEN || !ZAPI_CLIENT_TOKEN) {
      throw new Error("Z-API credentials not configured");
    }

    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    if (!STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY not configured");

    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2025-08-27.basil" });

    const now = new Date();
    // Only send for doses scheduled within the next 5 minutes (matches ~2min cron interval)
    const windowStart = new Date(now.getTime() - 1 * 60 * 1000); // 1 min ago (catch edge cases)
    const windowEnd = new Date(now.getTime() + 5 * 60 * 1000);   // 5 min from now

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

    const paidUserIds = new Set<string>();

    for (const profile of (profiles || [])) {
      if (profile.plan_override === "pro" || profile.plan_override === "premium") {
        paidUserIds.add(profile.user_id);
        console.log(`User ${profile.user_id} (${profile.display_name}) paid via plan_override`);
        continue;
      }

      try {
        const { data: authUser } = await supabase.auth.admin.getUserById(profile.user_id);
        const email = authUser?.user?.email;
        if (!email) continue;

        const customers = await stripe.customers.list({ email, limit: 1 });
        if (customers.data.length === 0) continue;

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
          console.log(`User ${profile.user_id} (${profile.display_name}) paid via Stripe`);
        }
      } catch (err) {
        console.error(`Error checking plan for user ${profile.user_id}:`, err);
      }
    }

    const profileMap = new Map(
      (profiles || [])
        .filter((p: any) => paidUserIds.has(p.user_id) && p.whatsapp_number)
        .map((p: any) => [p.user_id, p])
    );

    console.log(`Paid users with eligible WhatsApp: ${profileMap.size}`);

    const groups = new Map<string, { userId: string; originalEventTime: string; meds: string[] }>();

    for (const event of events) {
      const profile = profileMap.get(event.user_id);
      if (!profile) continue;

      const roundedTime = roundToMinute(event.scheduled_time);
      const key = `${event.user_id}::${roundedTime}`;

      if (!groups.has(key)) {
        groups.set(key, { userId: event.user_id, originalEventTime: event.scheduled_time, meds: [] });
      }
      groups.get(key)!.meds.push(`${event.medication_name} (${event.dosage})`);
    }

    let sent = 0;
    const errors: string[] = [];

    for (const group of groups.values()) {
      const profile = profileMap.get(group.userId)!;

      let phone = profile.whatsapp_number.replace(/\D/g, "").replace(/^0+/, "");
      if (!phone.startsWith("55") && phone.length <= 11) {
        phone = "55" + phone;
      }

      const varMeds = group.meds.join(" e ");
      const varHora = extractHourFromUTCString(group.originalEventTime);

      const message = `💊 *Lembrete OnDose*\n\nHora de tomar: *${varMeds}*\n⏰ Horário: ${varHora}\n\nResponda:\n*1* - ✅ Já tomei\n*2* - ⏰ Vou tomar depois`;

      try {
        console.log(`Disparando Z-API para ${phone}. Meds: ${varMeds}, Hora: ${varHora}`);

        const res = await sendZAPIMessage(ZAPI_INSTANCE_ID, ZAPI_TOKEN, ZAPI_CLIENT_TOKEN, phone, message);

        if (res.ok) {
          sent++;
          console.log(`Sucesso para ${phone}`);
        } else {
          console.error(`Erro Z-API para ${phone}:`, res.result);
          errors.push(`User ${group.userId}: ${JSON.stringify(res.result)}`);
        }
      } catch (err) {
        const errMessage = err instanceof Error ? err.message : String(err);
        console.error(`Exceção para user ${group.userId}:`, errMessage);
        errors.push(`User ${group.userId}: ${errMessage}`);
      }
    }

    console.log(`Resumo: sent=${sent}, groups=${groups.size}, errors=${errors.length}`);

    return new Response(
      JSON.stringify({ sent, groups: groups.size, errors: errors.length, errorDetails: errors }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Critical Error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
