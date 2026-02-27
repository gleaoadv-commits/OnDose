import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendEvolutionMessage } from "../_shared/evolution.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, serviceRoleKey);

        const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL")!;
        const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY")!;
        const EVOLUTION_INSTANCE = Deno.env.get("EVOLUTION_INSTANCE") || "OnDose";

        const body = await req.json();
        console.log("Webhook received:", JSON.stringify(body, null, 2));

        const data = body.data;
        if (!data) return new Response("No data", { status: 200 });

        // Extrair o ID do botão ou da lista
        const message = data.message;
        const listResponse = message?.listResponseMessage;
        const buttonResponse = message?.buttonsResponseMessage || message?.templateButtonReplyMessage;

        const buttonId = listResponse?.singleSelectReply?.selectedRowId || buttonResponse?.selectedButtonId || buttonResponse?.selectedId;
        const remoteJid = data.key?.remoteJid;
        const phone = remoteJid?.split("@")[0];

        if (!buttonId || !phone) {
            return new Response(JSON.stringify({ success: true, message: "No action required" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        if (buttonId.startsWith("take_")) {
            const eventId = buttonId.replace("take_", "");

            if (eventId !== "test-id") {
                const { error } = await supabase
                    .from("schedule_events")
                    .update({ taken: true, taken_at: new Date().toISOString() })
                    .eq("id", eventId);

                if (error) console.error("Error updating event:", error.message);
            }

            await sendEvolutionMessage(
                EVOLUTION_API_URL,
                EVOLUTION_API_KEY,
                EVOLUTION_INSTANCE,
                phone,
                "✅ *Dose Registrada!*\n\nExcelente! Continue assim. Sua saúde agradece! 💪💊"
            );
        } else if (buttonId.startsWith("delay_")) {
            await sendEvolutionMessage(
                EVOLUTION_API_URL,
                EVOLUTION_API_KEY,
                EVOLUTION_INSTANCE,
                phone,
                "⏰ *Entendido!*\n\nSem problemas. Não esqueça de registrar o horário correto no app assim que possível! 📱✨"
            );
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Error processing webhook:", errorMessage);
        return new Response(JSON.stringify({ error: errorMessage }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
