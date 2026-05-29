import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }
    const caregiverId = userData.user.id;


    // Get all active links where this user is the caregiver
    const { data: links, error: linksError } = await supabaseAdmin
      .from("family_links")
      .select("id, primary_user_id, status")
      .eq("caregiver_user_id", caregiverId)
      .in("status", ["active", "pending"]);

    if (linksError || !links || links.length === 0) {
      return new Response(JSON.stringify({ status: "no_links" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const PRO_PRODUCT = "prod_U0EtzwCBMSlt6o";
    const PREMIUM_PRODUCT = "prod_U0Eub1bzRh41Dc";

    for (const link of links) {
      const primaryUserId = link.primary_user_id;

      // Check plan_override first
      const { data: profileData } = await supabaseAdmin
        .from("profiles")
        .select("plan_override")
        .eq("user_id", primaryUserId)
        .single();

      if (profileData?.plan_override === "premium") {
        // Premium via override — keep link active if it's active
        continue;
      }

      // Get primary user's email to check Stripe
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(primaryUserId);
      const primaryEmail = authUser?.user?.email;

      if (!primaryEmail) continue;

      let isPremium = false;

      if (!profileData?.plan_override) {
        // Check Stripe subscription
        const customers = await stripe.customers.list({ email: primaryEmail, limit: 1 });
        if (customers.data.length > 0) {
          const customerId = customers.data[0].id;
          const subscriptions = await stripe.subscriptions.list({
            customer: customerId,
            status: "active",
            limit: 10,
          });

          for (const sub of subscriptions.data) {
            const productId = sub.items.data[0]?.price?.product;
            if (productId === PREMIUM_PRODUCT) {
              isPremium = true;
              break;
            }
          }
        }
      }

      // If primary user is not premium and link is active, deactivate it
      if (!isPremium && link.status === "active") {
        await supabaseAdmin
          .from("family_links")
          .update({ status: "inactive" })
          .eq("id", link.id);
        console.log(`Deactivated link ${link.id} — primary user ${primaryUserId} is not premium`);
      }
    }

    // Return fresh link status for this caregiver
    const { data: freshLinks } = await supabaseAdmin
      .from("family_links")
      .select("id, status, primary_user_id")
      .eq("caregiver_user_id", caregiverId)
      .order("created_at", { ascending: false })
      .limit(1);

    const currentStatus = freshLinks?.[0]?.status ?? "no_links";

    return new Response(JSON.stringify({ status: currentStatus }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("verify-link-status error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
