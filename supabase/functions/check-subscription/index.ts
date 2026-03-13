import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

// Decode JWT payload without verification (verification is done by Supabase)
function decodeJWT(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Invalid JWT format');
    const payload = parts[1];
    const padded = payload + '='.repeat((4 - payload.length % 4) % 4);
    const decoded = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch (e) {
    throw new Error(`Failed to decode JWT: ${e}`);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logStep("No authorization header - returning free plan");
      return new Response(JSON.stringify({ subscribed: false, plan: "free" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    
    // Decode JWT to get user info directly (more reliable than auth.getUser with service role)
    const payload = decodeJWT(token);
    const userEmail = payload.email;
    const userId = payload.sub;
    
    if (!userEmail || !userId) {
      logStep("Invalid token - returning free plan");
      return new Response(JSON.stringify({ subscribed: false, plan: "free" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    logStep("User authenticated via JWT", { email: userEmail, userId });

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Check for plan_override in profiles (for testing purposes)
    const { data: profileData } = await supabaseAdmin
      .from("profiles")
      .select("plan_override")
      .eq("user_id", userId)
      .single();

    if (profileData?.plan_override) {
      logStep("Plan override found", { plan: profileData.plan_override });
      return new Response(JSON.stringify({
        subscribed: true,
        plan: profileData.plan_override,
        subscription_end: null,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: userEmail, limit: 1 });

    if (customers.data.length === 0) {
      logStep("No Stripe customer found");
      return new Response(JSON.stringify({ subscribed: false, plan: "free" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found customer", { customerId });

    // Fetch active subscriptions (includes cancel_at_period_end=true — still active until period ends)
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 10,
    });

    if (subscriptions.data.length === 0) {
      logStep("No active subscription");
      return new Response(JSON.stringify({ subscribed: false, plan: "free" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const PRO_PRODUCT = "prod_U0EtzwCBMSlt6o";
    const PREMIUM_PRODUCT = "prod_U0Eub1bzRh41Dc";

    let plan = "free";
    let subscriptionEnd = null;
    let cancelAtPeriodEnd = false;

    function parsePeriodEnd(periodEnd: any): string | null {
      if (periodEnd == null) return null;
      const ms = typeof periodEnd === "number" ? periodEnd * 1000 : Number(periodEnd) * 1000;
      const d = new Date(ms);
      return isNaN(d.getTime()) ? null : d.toISOString();
    }

    for (const sub of subscriptions.data) {
      const productId = sub.items.data[0]?.price?.product;
      const endIso = parsePeriodEnd(sub.current_period_end ?? (sub as any).items?.data?.[0]?.current_period_end);
      const isCanceling = (sub as any).cancel_at_period_end === true;

      if (productId === PREMIUM_PRODUCT) {
        plan = "premium";
        subscriptionEnd = endIso;
        cancelAtPeriodEnd = isCanceling;
        break;
      }
      if (productId === PRO_PRODUCT) {
        plan = "pro";
        subscriptionEnd = endIso;
        cancelAtPeriodEnd = isCanceling;
      }
    }

    logStep("Subscription result", { plan, subscriptionEnd });

    // If not premium, deactivate any active family links (caregiver access)
    if (plan !== "premium") {
      await supabaseAdmin
        .from("family_links")
        .update({ status: "inactive" })
        .eq("primary_user_id", userId)
        .eq("status", "active");
      logStep("Deactivated family links for non-premium user");
    }

    // Send WhatsApp welcome message once when user first subscribes
    if (plan !== "free") {
      const { data: profileForWelcome } = await supabaseAdmin
        .from("profiles")
        .select("whatsapp_number, whatsapp_plan_welcome_sent, display_name")
        .eq("user_id", userId)
        .single();

      const alreadySentForPlan = profileForWelcome?.whatsapp_plan_welcome_sent;

      if (profileForWelcome?.whatsapp_number && alreadySentForPlan !== plan) {
        try {
          const ZAPI_INSTANCE_ID = Deno.env.get("ZAPI_INSTANCE_ID");
          const ZAPI_TOKEN = Deno.env.get("ZAPI_TOKEN");
          const ZAPI_CLIENT_TOKEN = Deno.env.get("ZAPI_CLIENT_TOKEN");

          if (ZAPI_INSTANCE_ID && ZAPI_TOKEN && ZAPI_CLIENT_TOKEN) {
            const planLabel = plan === "premium" ? "Premium" : "PRO";
            const userName = profileForWelcome.display_name || "usuário";
            const msg = `🎉 *Parabéns, ${userName}!*\n\nSeu plano *${planLabel}* foi ativado com sucesso! ✅\n\nA partir de agora você receberá os lembretes de medicamentos por WhatsApp nos horários programados.\n\nAproveite todos os recursos do seu plano! 💊\n\n👉 Acesse o app: https://ondose.lovable.app`;

            const url = `https://api.z-api.io/instances/${ZAPI_INSTANCE_ID}/token/${ZAPI_TOKEN}/send-text`;
            await fetch(url, {
              method: "POST",
              headers: { "Content-Type": "application/json", "Client-Token": ZAPI_CLIENT_TOKEN },
              body: JSON.stringify({ phone: profileForWelcome.whatsapp_number.replace(/\D/g, ""), message: msg }),
            });

            await supabaseAdmin
              .from("profiles")
              .update({ whatsapp_plan_welcome_sent: plan } as any)
              .eq("user_id", userId);

            logStep("Welcome WhatsApp sent", { plan, phone: profileForWelcome.whatsapp_number });
          }
        } catch (welcomeErr) {
          logStep("Welcome WhatsApp failed (non-blocking)", { error: String(welcomeErr) });
        }
      }
    }

    logStep("Subscription result", { plan, subscriptionEnd, cancelAtPeriodEnd });

    return new Response(JSON.stringify({
      subscribed: plan !== "free",
      plan,
      subscription_end: subscriptionEnd,
      cancel_at_period_end: cancelAtPeriodEnd,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
