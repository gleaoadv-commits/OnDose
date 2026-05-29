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

async function generateMotivationalPhrase(apiKey: string, userName: string, medNames: string): Promise<string> {
  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: "Gere EXATAMENTE UMA ÚNICA frase motivacional curta (máximo 15 palavras, máximo 80 caracteres) sobre saúde e adesão a medicamentos. REGRAS OBRIGATÓRIAS: 1) Apenas UMA frase. 2) Apenas UMA linha. 3) Nunca gere lista, nunca gere múltiplas frases. 4) Use no máximo 1 emoji. 5) Seja criativo e acolhedor. 6) Retorne SOMENTE a frase, sem aspas, sem JSON, sem quebra de linha."
          },
          {
            role: "user",
            content: `Gere uma frase motivacional única para ${userName} que está tomando ${medNames}. Varie o estilo: às vezes engraçada, às vezes carinhosa, às vezes inspiradora.`
          }
        ],
      }),
    });

    if (!response.ok) {
      console.error("AI motivational error:", response.status);
      return "💪 Cuidar da saúde é o melhor investimento!";
    }

    const data = await response.json();
    const rawPhrase = data.choices?.[0]?.message?.content?.trim();
    // Force single line: take only the first non-empty line
    const phrase = rawPhrase?.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0)[0];
    return phrase || "💪 Cuidar da saúde é o melhor investimento!";
  } catch (e) {
    console.error("AI motivational exception:", e);
    return "💪 Cuidar da saúde é o melhor investimento!";
  }
}

const PRO_PRODUCT = "prod_U0EtzwCBMSlt6o";
const PREMIUM_PRODUCT = "prod_U0Eub1bzRh41Dc";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require CRON_SECRET to prevent public invocation
    const cronSecret = Deno.env.get("CRON_SECRET");
    const provided = req.headers.get("x-cron-secret");
    if (!cronSecret || provided !== cronSecret) {
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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!ZAPI_INSTANCE_ID || !ZAPI_TOKEN || !ZAPI_CLIENT_TOKEN) {
      throw new Error("Z-API credentials not configured");
    }

    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    if (!STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY not configured");

    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2025-08-27.basil" });

    const now = new Date();
    const reminderLookbackMs = 2 * 60 * 60 * 1000;
    const reminderLookaheadMs = 90 * 1000;
    const windowStart = new Date(now.getTime() - reminderLookbackMs);
    const windowEnd = new Date(now.getTime() + reminderLookaheadMs);

    console.log(`Checking events between ${windowStart.toISOString()} and ${windowEnd.toISOString()} (catch-up enabled)`);

    const { data: events, error: eventsError } = await supabase
      .from("schedule_events")
      .select("*")
      .eq("taken", false)
      .eq("notified", false)
      .gte("scheduled_time", windowStart.toISOString())
      .lte("scheduled_time", windowEnd.toISOString())
      .order("scheduled_time", { ascending: true });

    if (eventsError) throw new Error(`Error fetching events: ${eventsError.message}`);

    console.log(`Found ${events?.length ?? 0} events in window`);

    if (!events || events.length === 0) {
      return new Response(
        JSON.stringify({ message: "No upcoming doses to notify", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Filter out events whose medication is no longer active (encerrado/pausado/inativo/deleted).
    // schedule_events are pre-generated, so a status change after creation must be respected.
    const medIds = [...new Set(events.map((e: any) => e.medication_id))];
    const { data: medsForCheck, error: medsCheckError } = await supabase
      .from("medications")
      .select("id, status, deleted_at, pause_until")
      .in("id", medIds);

    if (medsCheckError) {
      console.error("Error fetching medications for status check:", medsCheckError.message);
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const activeMedIds = new Set(
      (medsForCheck || [])
        .filter((m: any) => {
          if (m.deleted_at) return false;
          if (m.status !== "ativo") return false;
          if (m.pause_until && m.pause_until >= todayStr) return false;
          return true;
        })
        .map((m: any) => m.id)
    );

    const skippedEventIds = events
      .filter((e: any) => !activeMedIds.has(e.medication_id))
      .map((e: any) => e.id);

    if (skippedEventIds.length > 0) {
      console.log(`Skipping ${skippedEventIds.length} events tied to inactive/ended/paused/deleted medications`);
      // Mark as notified to avoid re-evaluating them every minute
      await supabase
        .from("schedule_events")
        .update({ notified: true })
        .in("id", skippedEventIds);
    }

    const activeEvents = events.filter((e: any) => activeMedIds.has(e.medication_id));

    if (activeEvents.length === 0) {
      return new Response(
        JSON.stringify({ message: "No active-medication doses to notify", sent: 0, skipped: skippedEventIds.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userIds = [...new Set(activeEvents.map((e: any) => e.user_id))];

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

    const groups = new Map<string, { userId: string; originalEventTime: string; meds: string[]; eventIds: string[] }>();

    for (const event of activeEvents) {
      const profile = profileMap.get(event.user_id);
      if (!profile) continue;

      const roundedTime = roundToMinute(event.scheduled_time);
      const key = `${event.user_id}::${roundedTime}`;

      if (!groups.has(key)) {
        groups.set(key, {
          userId: event.user_id,
          originalEventTime: event.scheduled_time,
          meds: [],
          eventIds: [],
        });
      }

      const groupEntry = groups.get(key)!;
      groupEntry.meds.push(`${event.medication_name} (${event.dosage})`);
      groupEntry.eventIds.push(event.id);
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
      const userName = profile.display_name || "você";

      // Generate unique motivational phrase via AI
      let motivationalPhrase = "💪 Cuidar da saúde é o melhor investimento!";
      if (LOVABLE_API_KEY) {
        motivationalPhrase = await generateMotivationalPhrase(LOVABLE_API_KEY, userName, varMeds);
      }

      const message = `💊 *Lembrete OnDose*\n\nOlá, *${userName}*! Hora de tomar:\n*${varMeds}*\n⏰ Horário: ${varHora}\n\n${motivationalPhrase}\n\nResponda:\n*1* - ✅ Já tomei tudo\n*2* - ⏰ Vou tomar depois\n*3* - 📱 Abrir o app (marcar individualmente)`;

      const { data: claimedEvents, error: claimError } = await supabase
        .from("schedule_events")
        .update({ notified: true })
        .in("id", group.eventIds)
        .eq("notified", false)
        .eq("taken", false)
        .select("id");

      if (claimError) {
        console.error(`Erro ao reservar eventos para ${group.userId}:`, claimError.message);
        errors.push(`User ${group.userId}: ${claimError.message}`);
        continue;
      }

      const claimedEventIds = (claimedEvents || []).map((event: any) => event.id);
      if (claimedEventIds.length !== group.eventIds.length) {
        console.log(`Pulando grupo ${group.userId}::${roundToMinute(group.originalEventTime)} por disputa de execução`);

        if (claimedEventIds.length > 0) {
          await supabase
            .from("schedule_events")
            .update({ notified: false })
            .in("id", claimedEventIds)
            .eq("taken", false);
        }

        continue;
      }

      try {
        console.log(`Disparando Z-API para ${phone}. Meds: ${varMeds}, Hora: ${varHora}`);

        const res = await sendZAPIMessage(ZAPI_INSTANCE_ID, ZAPI_TOKEN, ZAPI_CLIENT_TOKEN, phone, message);

        if (res.ok) {
          sent++;
          console.log(`Sucesso para ${phone}`);
        } else {
          console.error(`Erro Z-API para ${phone}:`, res.result);
          errors.push(`User ${group.userId}: ${JSON.stringify(res.result)}`);

          await supabase
            .from("schedule_events")
            .update({ notified: false })
            .in("id", claimedEventIds)
            .eq("taken", false);
        }
      } catch (err) {
        const errMessage = err instanceof Error ? err.message : String(err);
        console.error(`Exceção para user ${group.userId}:`, errMessage);
        errors.push(`User ${group.userId}: ${errMessage}`);

        await supabase
          .from("schedule_events")
          .update({ notified: false })
          .in("id", claimedEventIds)
          .eq("taken", false);
      }
    }

    // === LOW STOCK ALERTS (< 7 pills) ===
    let stockAlertsSent = 0;
    try {
      const { data: lowStockMeds } = await supabase
        .from("medications")
        .select("id, user_id, name, dosage, stock_current, stock_total")
        .eq("status", "ativo")
        .not("stock_current", "is", null)
        .lt("stock_current", 7)
        .gt("stock_current", 0);

      if (lowStockMeds && lowStockMeds.length > 0) {
        // Only send once per day: check current hour is between 09:00-09:01 UTC (06:00 BRT)
        const currentHourUTC = now.getUTCHours();
        const currentMinUTC = now.getUTCMinutes();
        if (currentHourUTC === 12 && currentMinUTC === 0) {
          const stockByUser = new Map<string, { name: string; stock: number }[]>();
          for (const med of lowStockMeds) {
            if (!stockByUser.has(med.user_id)) stockByUser.set(med.user_id, []);
            stockByUser.get(med.user_id)!.push({ name: med.name, stock: med.stock_current! });
          }

          for (const [userId, meds] of stockByUser) {
            const profile = profileMap.get(userId);
            if (!profile) continue;

            let phone = profile.whatsapp_number.replace(/\D/g, "").replace(/^0+/, "");
            if (!phone.startsWith("55") && phone.length <= 11) phone = "55" + phone;

            const medList = meds.map(m => `• *${m.name}* — ${m.stock} comprimido(s)`).join("\n");
            const userName = profile.display_name || "você";
            const appLink = "https://ondose.lovable.app";

            const msg = `📦 *Alerta de Estoque - OnDose*\n\nOlá, *${userName}*! Alguns medicamentos estão acabando:\n\n${medList}\n\n🔄 Renove sua cartela para não ficar sem!\n\n📱 Acesse o app: ${appLink}`;

            try {
              const res = await sendZAPIMessage(ZAPI_INSTANCE_ID, ZAPI_TOKEN, ZAPI_CLIENT_TOKEN, phone, msg);
              if (res.ok) stockAlertsSent++;
            } catch (err) {
              console.error(`Stock alert error for ${userId}:`, err);
            }
          }
        }
      }
    } catch (err) {
      console.error("Low stock check error:", err);
    }

    console.log(`Resumo: sent=${sent}, stockAlerts=${stockAlertsSent}, groups=${groups.size}, errors=${errors.length}`);

    return new Response(
      JSON.stringify({ sent, stockAlertsSent, groups: groups.size, errors: errors.length, errorDetails: errors }),
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
