import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const ULTRAMSG_INSTANCE = Deno.env.get("ULTRAMSG_INSTANCE_ID");
    const ULTRAMSG_TOKEN = Deno.env.get("ULTRAMSG_TOKEN");

    if (!ULTRAMSG_INSTANCE || !ULTRAMSG_TOKEN) {
      throw new Error("UltraMsg credentials not configured");
    }

    // Find all active family links for premium users
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
        // Check if primary user has premium plan
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name, plan_override")
          .eq("user_id", link.primary_user_id)
          .single();

        // Get caregiver profile with whatsapp
        const { data: caregiverProfile } = await supabase
          .from("profiles")
          .select("display_name, whatsapp_number")
          .eq("user_id", link.caregiver_user_id)
          .single();

        if (!caregiverProfile?.whatsapp_number) continue;

        // Get last 7 days schedule events for primary user
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

        let rateEmoji = rate >= 90 ? "🟢" : rate >= 70 ? "🟡" : "🔴";

        const message = `📊 *Relatório Semanal OnDose*\n\nOlá, ${caregiverName}!\n\nResumo da semana de *${patientName}*:\n\n${rateEmoji} *Adesão: ${rate}%*\n✅ Doses tomadas: ${taken}\n❌ Doses perdidas: ${total - taken}\n📅 Período: ${weekAgo.toLocaleDateString("pt-BR")} a ${now.toLocaleDateString("pt-BR")}\n\n_OnDose — cuidando de quem você ama_ 💙`;

        // Format Brazilian number
        let phone = caregiverProfile.whatsapp_number.replace(/\D/g, "");
        if (!phone.startsWith("55")) phone = "55" + phone;

        await fetch(`https://api.ultramsg.com/${ULTRAMSG_INSTANCE}/messages/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            token: ULTRAMSG_TOKEN,
            to: phone,
            body: message,
          }),
        });

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
