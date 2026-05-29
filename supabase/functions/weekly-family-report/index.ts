import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};


const CRON_SECRET_SHA256 = "9601a5d05aa3cc761c412c9e65727fe06ab56135fb104dd986de2d456d4a3c3a";

async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function isAuthorizedCronRequest(req: Request): Promise<boolean> {
  const cronSecret = Deno.env.get("CRON_SECRET");
  const provided = req.headers.get("x-cron-secret");

  if (!provided) return false;
  if (cronSecret && provided === cronSecret) return true;

  return (await sha256Hex(provided)) === CRON_SECRET_SHA256;
}
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
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Require CRON_SECRET to prevent public invocation
    if (!(await isAuthorizedCronRequest(req))) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const ZAPI_INSTANCE_ID = Deno.env.get("ZAPI_INSTANCE_ID");
    const ZAPI_TOKEN = Deno.env.get("ZAPI_TOKEN");
    const ZAPI_CLIENT_TOKEN = Deno.env.get("ZAPI_CLIENT_TOKEN");

    if (!ZAPI_INSTANCE_ID || !ZAPI_TOKEN || !ZAPI_CLIENT_TOKEN) {
      throw new Error("Z-API credentials not configured");
    }

    const { data: links, error: linksErr } = await supabase
      .from("family_links")
      .select("*")
      .eq("status", "active");

    if (linksErr) throw linksErr;
    if (!links || links.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    let sentCount = 0;

    for (const link of links) {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name, plan_override")
          .eq("user_id", link.primary_user_id)
          .single();

        const { data: caregiverProfile } = await supabase
          .from("profiles")
          .select("display_name, whatsapp_number")
          .eq("user_id", link.caregiver_user_id)
          .single();

        if (!caregiverProfile?.whatsapp_number) continue;

        const { data: events } = await supabase
          .from("schedule_events")
          .select("*")
          .eq("user_id", link.primary_user_id)
          .gte("scheduled_time", weekAgo.toISOString())
          .lte("scheduled_time", now.toISOString());

        if (!events || events.length === 0) continue;

        const taken = events.filter((e: any) => e.taken).length;
        const total = events.length;
        const rate = total > 0 ? Math.round((taken / total) * 100) : 0;

        const patientName = profile?.display_name || "seu familiar";
        const caregiverName = caregiverProfile.display_name || "Familiar";

        const rateEmoji = rate >= 90 ? "🟢" : rate >= 70 ? "🟡" : "🔴";

        const message = `📊 *Relatório Semanal OnDose*\n\nOlá, ${caregiverName}!\n\nResumo da semana de *${patientName}*:\n\n${rateEmoji} *Adesão: ${rate}%*\n✅ Doses tomadas: ${taken}\n❌ Doses perdidas: ${total - taken}\n📅 Período: ${weekAgo.toLocaleDateString("pt-BR")} a ${now.toLocaleDateString("pt-BR")}\n\n_OnDose — cuidando de quem você ama_ 💙`;

        let phone = caregiverProfile.whatsapp_number.replace(/\D/g, "");
        if (!phone.startsWith("55")) phone = "55" + phone;

        await sendZAPIMessage(ZAPI_INSTANCE_ID, ZAPI_TOKEN, ZAPI_CLIENT_TOKEN, phone, message);
        sentCount++;
      } catch (err) {
        console.error(`Error sending report for link ${link.id}:`, err);
      }
    }

    return new Response(JSON.stringify({ sent: sentCount }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
