import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const META_API_VERSION = "v21.0";

// --- NOVAS CREDENCIAIS META OFICIAIS --- //
const DEFAULT_ACCESS_TOKEN = "EAAW3hFgBhZAcBQ0TZADskq52BYtAlyCbM0JRdEGHXv8bGrFCzDYL8HQq5ZAMjTyuZBvMVcPv3hjTujAhFXYnAPeyd746rQCGPcun3ZCOlY8AenFEufNK4P7IeFTTPaUGwjnCKWmDCmE3SOZB1T8JnZBk4FmX95tVZA4MbmqV4GEi2MMCbhLQuhHA59SZCoz1yk48VizAObXrV6dwmKssEZA5c1MFEVq5anGjWNBxeA7hwuMxYGX2IqT1b5XoTCZAL9WDwZBouVVuVkeRImJVKaZAIArfFk5QZD";
const DEFAULT_PHONE_ID = "1029626996895162";
// Nome exato que deve ter sido dado ao modelo de mensagem no painel do Facebook:
const DEFAULT_TEMPLATE_NAME = "lembrete_dose"; // <-- AVISO: Se você usou outro nome, precisaremos trocar aqui.

async function sendMetaWhatsAppTemplate(phoneNumberId: string, accessToken: string, templateName: string, to: string, variable1: string, variable2: string) {
  const url = `https://graph.facebook.com/${META_API_VERSION}/${phoneNumberId}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: to,
    type: "template",
    template: {
      name: templateName,
      language: {
        code: "pt_BR" // Padrão Brasil
      },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: variable1 }, // Corresponde à {{1}}
            { type: "text", text: variable2 }  // Corresponde à {{2}}
          ]
        }
      ]
    }
  };

  console.log(`Payload enviado para a Meta API (${to}):`, JSON.stringify(payload));

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json().catch(() => ({}));
  if (result.error) {
    console.error("Meta API retornou Erro:", result.error.message);
  }
  return { ok: response.ok && !result.error, response, result };
}

function roundToMinute(dateStr: string): string {
  const d = new Date(dateStr);
  d.setSeconds(0, 0);
  return d.toISOString();
}

function extractHourFromUTCString(dateStr: string): string {
  const d = new Date(dateStr);
  // Converte a data salva (UTC) para o horário local (America/Sao_Paulo seria ideal)
  // Como Deno Edge Functions rodam em UTC, subtraímos 3 horas (BRT) manualmente para facilitar:
  d.setHours(d.getHours() - 3);
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

    const META_ACCESS_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN") || DEFAULT_ACCESS_TOKEN;
    const META_PHONE_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID") || DEFAULT_PHONE_ID;
    const TEMPLATE_NAME = Deno.env.get("WHATSAPP_TEMPLATE_NAME") || DEFAULT_TEMPLATE_NAME;

    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");

    if (!STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY not configured");

    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2025-08-27.basil" });

    const now = new Date();
    // Aumenta a janela de busca para mitigar delays ou acionamentos manuais distantes (8 horas para cima e baixo)
    const windowStart = new Date(now.getTime() - 8 * 60 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + 8 * 60 * 60 * 1000);

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
        console.log(`User ${profile.user_id} (${profile.display_name}) is paid via plan_override`);
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
          console.log(`User ${profile.user_id} (${profile.display_name}) is paid via Stripe`);
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
      // Nós enviaremos um Lote de remédios como {{1}}: "Aspirina (1mg), Buscopan (5 gotas)"
      groups.get(key)!.meds.push(`${event.medication_name} (${event.dosage})`);
    }

    let sent = 0;
    const errors: string[] = [];

    for (const group of groups.values()) {
      const profile = profileMap.get(group.userId)!;

      // Meta Cloud API aceita com ou sem DDI 55, mas exige clareza no código de país.
      let phone = profile.whatsapp_number.replace(/\D/g, "").replace(/^0+/, "");
      if (!phone.startsWith("55") && phone.length <= 11) {
        phone = "55" + phone;
      }

      // Prepara as {{1}} e {{2}} pro template oficial
      const varRestoDosRemedios = group.meds.join(" e ");
      const varHoraFormatada = extractHourFromUTCString(group.originalEventTime);

      try {
        console.log(`Disparando Cloud API Meta para ${phone}. Medicamentos: ${varRestoDosRemedios}, Horário: ${varHoraFormatada}`);

        const res = await sendMetaWhatsAppTemplate(
          META_PHONE_ID,
          META_ACCESS_TOKEN,
          TEMPLATE_NAME,
          phone,
          varRestoDosRemedios, // Template {{1}}
          varHoraFormatada     // Template {{2}}
        );

        if (res.ok) {
          sent++;
          console.log(`Sucesso! Meta aceitou a mensagem de ${phone}.`);
        } else {
          console.error(`Erro Meta API para ${phone}:`, res.result);
          const errorMsg = res.result && typeof res.result === "object" ? JSON.stringify(res.result) : String(res.result);
          errors.push(`User ${group.userId}: ${errorMsg}`);
        }
      } catch (err) {
        const errMessage = err instanceof Error ? err.message : String(err);
        console.error(`Exceção Grave para user ${group.userId}:`, errMessage);
        errors.push(`User ${group.userId}: ${errMessage}`);
      }
    }

    console.log(`Resumo Cloud API: sent=${sent}, groups=${groups.size}, errors=${errors.length}`);

    return new Response(
      JSON.stringify({ sent, groups: groups.size, errors: errors.length, errorDetails: errors }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Critical Error no Lembrete:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
