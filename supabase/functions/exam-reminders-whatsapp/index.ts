import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const META_API_VERSION = "v21.0";
const PREMIUM_PRODUCT = "prod_U0Eub1bzRh41Dc";

async function sendWhatsAppMessage(phoneNumberId: string, accessToken: string, to: string, body: string) {
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
  return { response, result };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
    const WHATSAPP_ACCESS_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");

    if (!WHATSAPP_PHONE_NUMBER_ID) throw new Error("WHATSAPP_PHONE_NUMBER_ID not configured");
    if (!WHATSAPP_ACCESS_TOKEN) throw new Error("WHATSAPP_ACCESS_TOKEN not configured");
    if (!STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY not configured");

    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2025-08-27.basil" });

    // Calculate the date 7 days from now
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
      } catch (err) {
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
        const { response, result } = await sendWhatsAppMessage(WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN, phone, message);

        if (response.ok && !result.error) {
          sent++;
          console.log(`Sent to ${phone}: ${response.status}`);
        } else {
          console.error(`Meta API error for ${userId}:`, result);
          errors.push(`User ${userId}: ${JSON.stringify(result.error || result)}`);
        }
      } catch (err) {
        console.error(`Exception for ${userId}:`, err.message);
        errors.push(`User ${userId}: ${err.message}`);
      }
    }

    console.log(`Exam reminders: sent=${sent}, errors=${errors.length}`);

    return new Response(
      JSON.stringify({ sent, users: userReminders.size, errors: errors.length, errorDetails: errors }),
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
