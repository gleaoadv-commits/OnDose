import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SITE_URL = Deno.env.get("SITE_URL") || "https://id-preview--70946aac-51e4-4140-b754-ce75313242df.lovable.app";

function generateEmailHTML(type: string, confirmUrl: string, userName?: string) {
  const name = userName || "usuário";

  const configs: Record<string, { subject: string; heading: string; body: string; buttonText: string }> = {
    signup: {
      subject: "Confirme sua conta no On.Dose",
      heading: "Bem-vindo ao On.Dose! 💊",
      body: `Olá, ${name}! Estamos felizes em ter você conosco. Clique no botão abaixo para confirmar sua conta e começar a gerenciar seus medicamentos.`,
      buttonText: "Confirmar minha conta",
    },
    recovery: {
      subject: "Redefinir senha - On.Dose",
      heading: "Redefinição de senha 🔐",
      body: `Olá, ${name}! Recebemos uma solicitação para redefinir sua senha. Clique no botão abaixo para criar uma nova senha.`,
      buttonText: "Redefinir minha senha",
    },
    magic_link: {
      subject: "Seu link de acesso - On.Dose",
      heading: "Link de acesso mágico ✨",
      body: `Olá, ${name}! Use o botão abaixo para acessar sua conta no On.Dose.`,
      buttonText: "Acessar minha conta",
    },
    email_change: {
      subject: "Confirme seu novo e-mail - On.Dose",
      heading: "Confirmação de e-mail 📧",
      body: `Olá, ${name}! Confirme seu novo endereço de e-mail clicando no botão abaixo.`,
      buttonText: "Confirmar novo e-mail",
    },
  };

  const config = configs[type] || configs.signup;

  return {
    subject: config.subject,
    html: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f5f6f8;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f6f8;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#2a9d8f,#3ab5a7);padding:32px 24px;text-align:center;">
              <div style="background:rgba(255,255,255,0.2);border-radius:16px;display:inline-block;padding:12px;margin-bottom:12px;">
                <span style="font-size:32px;">💊</span>
              </div>
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:-0.5px;">On.Dose</h1>
              <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Seu controle inteligente de medicamentos</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 24px;">
              <h2 style="margin:0 0 16px;color:#1e293b;font-size:20px;font-weight:700;">${config.heading}</h2>
              <p style="margin:0 0 28px;color:#64748b;font-size:15px;line-height:1.6;">${config.body}</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${confirmUrl}" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#2a9d8f,#3ab5a7);color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;padding:14px 36px;border-radius:12px;box-shadow:0 4px 12px rgba(42,157,143,0.3);">${config.buttonText}</a>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;color:#94a3b8;font-size:12px;line-height:1.5;text-align:center;">Se você não solicitou esta ação, ignore este e-mail com segurança.</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 24px;background-color:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0;color:#94a3b8;font-size:12px;">© ${new Date().getFullYear()} On.Dose. Todos os direitos reservados.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  };
}

serve(async (req) => {
  try {
    const payload = await req.json();

    const {
      type,
      email,
      confirmation_url,
      token_hash,
      redirect_to,
      user,
    } = payload;

    // Build the confirmation URL
    let confirmUrl = confirmation_url;
    if (!confirmUrl && token_hash) {
      const redirectUrl = redirect_to || SITE_URL;
      confirmUrl = `${Deno.env.get("SUPABASE_URL")}/auth/v1/verify?token=${token_hash}&type=${type}&redirect_to=${encodeURIComponent(redirectUrl)}`;
    }

    const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "";
    const emailType = type === "signup" ? "signup" : type === "recovery" ? "recovery" : type === "magiclink" ? "magic_link" : type === "email_change" ? "email_change" : "signup";

    const { subject, html } = generateEmailHTML(emailType, confirmUrl || "#", userName);

    // Use Supabase's built-in email sending by returning the customized email
    return new Response(
      JSON.stringify({
        subject,
        body: html,
      }),
      {
        headers: { "Content-Type": "application/json; charset=utf-8" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Email hook error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
