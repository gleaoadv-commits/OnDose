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
  if (!response.ok || result.error) {
    throw new Error(`Meta API error: ${JSON.stringify(result.error || result)}`);
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

    if (!WHATSAPP_PHONE_NUMBER_ID) throw new Error("WHATSAPP_PHONE_NUMBER_ID not configured");
    if (!WHATSAPP_ACCESS_TOKEN) throw new Error("WHATSAPP_ACCESS_TOKEN not configured");

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

    console.log(`Sending Meta WhatsApp to ${phone} (${medicationName})`);

    const result = await sendWhatsAppMessage(WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN, phone, message);
    console.log(`Meta API response:`, result);

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
