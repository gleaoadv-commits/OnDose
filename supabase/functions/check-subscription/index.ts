import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

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

    for (const sub of subscriptions.data) {
      const productId = sub.items.data[0]?.price?.product;
      if (productId === PREMIUM_PRODUCT) {
        plan = "premium";
        subscriptionEnd = new Date(sub.current_period_end * 1000).toISOString();
        break;
      }
      if (productId === PRO_PRODUCT) {
        plan = "pro";
        subscriptionEnd = new Date(sub.current_period_end * 1000).toISOString();
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

    return new Response(JSON.stringify({
      subscribed: plan !== "free",
      plan,
      subscription_end: subscriptionEnd,
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
