import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
    const userId = userData.user.id;


    console.log(`[DELETE-ACCOUNT] Starting deletion for user ${userId}`);

    // Delete all user data in order (respecting FK constraints)
    await supabaseAdmin.from("schedule_events").delete().eq("user_id", userId);
    console.log(`[DELETE-ACCOUNT] schedule_events deleted`);

    await supabaseAdmin.from("medications").delete().eq("user_id", userId);
    console.log(`[DELETE-ACCOUNT] medications deleted`);

    await supabaseAdmin.from("exam_indicators").delete().eq("user_id", userId);
    console.log(`[DELETE-ACCOUNT] exam_indicators deleted`);

    await supabaseAdmin.from("exam_results").delete().eq("user_id", userId);
    console.log(`[DELETE-ACCOUNT] exam_results deleted`);

    await supabaseAdmin.from("exam_reminders").delete().eq("user_id", userId);
    console.log(`[DELETE-ACCOUNT] exam_reminders deleted`);

    await supabaseAdmin.from("caregivers").delete().eq("user_id", userId);
    console.log(`[DELETE-ACCOUNT] caregivers deleted`);

    // Delete family links (both as primary and as caregiver)
    await supabaseAdmin.from("family_links").delete().eq("primary_user_id", userId);
    await supabaseAdmin.from("family_links").delete().eq("caregiver_user_id", userId);
    console.log(`[DELETE-ACCOUNT] family_links deleted`);

    await supabaseAdmin.from("profiles").delete().eq("user_id", userId);
    console.log(`[DELETE-ACCOUNT] profile deleted`);

    // Finally delete the auth user
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteAuthError) {
      console.error(`[DELETE-ACCOUNT] Error deleting auth user:`, deleteAuthError.message);
      return new Response(JSON.stringify({ error: deleteAuthError.message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    console.log(`[DELETE-ACCOUNT] Auth user deleted successfully for ${userId}`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[DELETE-ACCOUNT] Error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
