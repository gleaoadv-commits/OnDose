import { sendEvolutionMessage } from "../_shared/evolution.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const META_API_VERSION = "v21.0";

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
  if (!response.ok || (result && result.error)) {
    throw new Error(`Meta API error: ${JSON.stringify(result?.error || result)}`);
  }
  return result;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
    const WHATSAPP_ACCESS_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
    const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL");
    const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY");
    const EVOLUTION_INSTANCE = Deno.env.get("EVOLUTION_INSTANCE") || "OnDose";

    const useEvolution = !!(EVOLUTION_API_URL && EVOLUTION_API_KEY);

    if (!useEvolution && (!WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_ACCESS_TOKEN)) {
      throw new Error("WhatsApp providers (Meta or Evolution) not properly configured");
    }

    const { to, userName, medicationName, dosage } = await req.json();

    if (!to || !userName || !medicationName || !dosage) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, userName, medicationName, dosage" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format phone: remove non-digits, ensure country code (Brazil 55 default)
    let phone = to.replace(/\D/g, "").replace(/^0+/, "");
    if (!phone.startsWith("55") && phone.length <= 11) {
      phone = "55" + phone;
    }

    const closings = [
      "Cuide-se! Você está indo muito bem! 💪",
      "Saúde é o seu maior bem. Vamos juntos! 🌱",
      "Cada dose é um passo para uma vida mais saudável! ✨",
      "Você não está sozinho nessa jornada. Continue! 🤝",
      "Pequenos hábitos fazem grandes diferenças. Parabéns! 🏆",
      "Seu bem-estar importa. Continue firme! 💙",
      "Um passo de cada vez. Você consegue! 🌟",
      "Cuidar de si mesmo é o maior ato de amor! ❤️",
      "A consistência é o segredo da saúde. Continue assim! 🎯",
      "Hoje é mais um dia de autocuidado. Orgulhe-se! 🌸",
    ];
    const closing = closings[Math.floor(Math.random() * closings.length)];
    const appLink = "https://ondose.lovable.app";
    const message = `💊 *Lembrete OnDose*\n\nOlá, *${userName}*!\n\nHora de tomar seu medicamento:\n📌 *${medicationName}*\n💊 Dose: ${dosage}\n\n${closing}\n\n✅ Marque como tomado no app:\n${appLink}`;

    console.log(`Sending ${useEvolution ? 'Evolution' : 'Meta'} WhatsApp to ${phone} (${medicationName})`);

    let result;
    if (useEvolution) {
      // Enviamos como Lista para teste manual ser interativo
      const title = `💊 Lembrete OnDose`;
      const description = `Olá, *${userName}*!\n\nHora de tomar seu medicamento:\n📌 *${medicationName}*\n💊 Dose: ${dosage}\n\n${closing}`;
      const buttonText = `Clique para Responder`;
      const footer = `Teste de Interatividade`;
      const sections = [
        {
          title: "Ações de Teste",
          rows: [
            { id: `take_test-id`, title: "✅ Tomei agora", description: "Simular registro de dose" },
            { id: `delay_test-id`, title: "⏰ Com atraso", description: "Simular registro com atraso" }
          ]
        }
      ];

      const { sendEvolutionList } = await import("../_shared/evolution.ts");
      result = await sendEvolutionList(
        EVOLUTION_API_URL!,
        EVOLUTION_API_KEY!,
        EVOLUTION_INSTANCE!,
        phone,
        title,
        description,
        buttonText,
        footer,
        sections
      );
    } else {
      result = await sendWhatsAppMessage(WHATSAPP_PHONE_NUMBER_ID!, WHATSAPP_ACCESS_TOKEN!, phone, message);
    }
    console.log(`${useEvolution ? 'Evolution' : 'Meta'} API response:`, result);

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
