import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};


async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
const PREMIUM_PRODUCT = "prod_U0Eub1bzRh41Dc";

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
  return { response, result };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require CRON_SECRET to prevent public invocation
    const cronSecret = Deno.env.get("CRON_SECRET");
    const provided = req.headers.get("x-cron-secret");
    if (!cronSecret || provided !== cronSecret) {
      console.error("Cron auth mismatch", {
        hasCronSecret: Boolean(cronSecret),
        cronSecretLength: cronSecret?.length ?? 0,
        providedLength: provided?.length ?? 0,
        cronSecretHash: cronSecret ? await sha256Hex(cronSecret) : null,
        providedHash: provided ? await sha256Hex(provided) : null,
      });
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const ZAPI_INSTANCE_ID = Deno.env.get("ZAPI_INSTANCE_ID");
    const ZAPI_TOKEN = Deno.env.get("ZAPI_TOKEN");
    const ZAPI_CLIENT_TOKEN = Deno.env.get("ZAPI_CLIENT_TOKEN");
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");

    if (!ZAPI_INSTANCE_ID || !ZAPI_TOKEN || !ZAPI_CLIENT_TOKEN) throw new Error("Z-API credentials not configured");
    if (!STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY not configured");

    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2025-08-27.basil" });

    const now = new Date();
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() + 7);
    const targetDateStr = targetDate.toISOString().split("T")[0];

    console.log(`Checking exam reminders with next_reminder_date = ${targetDateStr}`);

    const { data: reminders, error: remindersError } = await supabase
      .from("exam_reminders")
      .select("*")
      .eq("next_reminder_date", targetDateStr);

    if (remindersError) throw new Error(`Error fetching reminders: ${remindersError.message}`);

    console.log(`Found ${reminders?.length ?? 0} exam reminders for ${targetDateStr}`);

    if (!reminders || reminders.length === 0) {
      return new Response(
        JSON.stringify({ message: "No exam reminders to notify", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userIds = [...new Set(reminders.map((r: any) => r.user_id))];

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, display_name, whatsapp_number, plan_override")
      .in("user_id", userIds)
      .not("whatsapp_number", "is", null);

    if (profilesError) throw new Error(`Error fetching profiles: ${profilesError.message}`);

    const premiumUserIds = new Set<string>();

    for (const profile of (profiles || [])) {
      if (profile.plan_override === "premium") {
        premiumUserIds.add(profile.user_id);
        continue;
      }

      try {
        const { data: authUser } = await supabase.auth.admin.getUserById(profile.user_id);
        const email = authUser?.user?.email;
        if (!email) continue;

        const customers = await stripe.customers.list({ email, limit: 1 });
        if (customers.data.length === 0) continue;

        const subscriptions = await stripe.subscriptions.list({
          customer: customers.data[0].id,
          status: "active",
          limit: 10,
        });

        for (const sub of subscriptions.data) {
          const productId = sub.items.data[0]?.price?.product;
          if (productId === PREMIUM_PRODUCT) {
            premiumUserIds.add(profile.user_id);
            break;
          }
        }
      } catch (err: any) {
        console.error(`Error checking plan for user ${profile.user_id}:`, err.message);
      }
    }

    const profileMap = new Map(
      (profiles || [])
        .filter((p: any) => premiumUserIds.has(p.user_id) && p.whatsapp_number)
        .map((p: any) => [p.user_id, p])
    );

    console.log(`Premium users with WhatsApp eligible: ${profileMap.size}`);

    const userReminders = new Map<string, string[]>();
    for (const reminder of reminders) {
      if (!profileMap.has(reminder.user_id)) continue;
      if (!userReminders.has(reminder.user_id)) {
        userReminders.set(reminder.user_id, []);
      }
      userReminders.get(reminder.user_id)!.push(reminder.exam_name);
    }

    let sent = 0;
    const errors: string[] = [];

    for (const [userId, examNames] of userReminders.entries()) {
      const profile = profileMap.get(userId)!;

      let phone = profile.whatsapp_number.replace(/\D/g, "").replace(/^0+/, "");
      if (!phone.startsWith("55") && phone.length <= 11) {
        phone = "55" + phone;
      }

      const userName = profile.display_name || "Usuário";

      let examsText: string;
      if (examNames.length === 1) {
        examsText = `🔬 *${examNames[0]}*`;
      } else {
        examsText = examNames.map((name) => `🔬 *${name}*`).join("\n");
      }

      const plural = examNames.length > 1 ? "alguns exames vencem" : "um exame vence";
      const appLink = "https://ondose.lovable.app/exames";
      const message = `🩺 *Lembrete de Exame — OnDose*\n\nOlá, *${userName}*!\n\n${plural} em *7 dias*:\n\n${examsText}\n\nAgende com seu médico ou laboratório o quanto antes! 📋\n\n📲 Veja detalhes no app:\n${appLink}`;

      console.log(`Sending exam reminder to ${phone} — ${examNames.length} exam(s)`);

      try {
        const { response, result } = await sendZAPIMessage(ZAPI_INSTANCE_ID, ZAPI_TOKEN, ZAPI_CLIENT_TOKEN, phone, message);

        if (response.ok) {
          sent++;
          console.log(`Sent to ${phone}: ${response.status}`);
        } else {
          console.error(`Z-API error for ${userId}:`, result);
          errors.push(`User ${userId}: ${JSON.stringify(result)}`);
        }
      } catch (err: any) {
        console.error(`Exception for ${userId}:`, err.message);
        errors.push(`User ${userId}: ${err.message}`);
      }
    }

    console.log(`Exam reminders: sent=${sent}, errors=${errors.length}`);

    return new Response(
      JSON.stringify({ sent, users: userReminders.size, errors: errors.length, errorDetails: errors }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
