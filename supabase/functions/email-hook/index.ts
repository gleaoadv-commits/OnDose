import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SITE_URL = Deno.env.get("SITE_URL") || "https://ondose.lovable.app";
const FROM_EMAIL = "OnDose <onboarding@resend.dev>";

function generateEmailHTML(type: string, confirmUrl: string, userName?: string) {
  const name = userName || "usuário";

  const configs: Record<string, { subject: string; heading: string; body: string; buttonText: string }> = {
    signup: {
      subject: "Confirme sua conta no OnDose",
      heading: "Bem-vindo ao OnDose! 💊",
      body: `Olá, ${name}! Estamos felizes em ter você conosco. Clique no botão abaixo para confirmar sua conta e começar a gerenciar seus medicamentos com segurança.`,
      buttonText: "Confirmar minha conta",
    },
    recovery: {
      subject: "Redefinir senha — OnDose",
      heading: "Redefinição de senha 🔐",
      body: `Olá, ${name}! Recebemos uma solicitação para redefinir a sua senha. Clique no botão abaixo para criar uma nova senha. Se não foi você, ignore este e-mail.`,
      buttonText: "Redefinir minha senha",
    },
    magic_link: {
      subject: "Seu link de acesso — OnDose",
      heading: "Link de acesso mágico ✨",
      body: `Olá, ${name}! Use o botão abaixo para acessar sua conta no OnDose. Este link expira em breve.`,
      buttonText: "Acessar minha conta",
    },
    email_change: {
      subject: "Confirme seu novo e-mail — OnDose",
      heading: "Confirmação de novo e-mail 📧",
      body: `Olá, ${name}! Recebemos uma solicitação para alterar o e-mail da sua conta. Clique no botão abaixo para confirmar o novo endereço.`,
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
  <title>${config.subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f4f8;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4f8;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:500px;background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
          <!-- Cabeçalho -->
          <tr>
            <td style="background:linear-gradient(135deg,#2a9d8f 0%,#3ab5a7 100%);padding:36px 28px;text-align:center;">
              <div style="background:rgba(255,255,255,0.18);border-radius:18px;display:inline-block;padding:14px 18px;margin-bottom:14px;">
                <span style="font-size:36px;">💊</span>
              </div>
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:-0.5px;">OnDose</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Seu controle inteligente de medicamentos</p>
            </td>
          </tr>
          <!-- Corpo -->
          <tr>
            <td style="padding:36px 32px 28px;">
              <h2 style="margin:0 0 16px;color:#1e293b;font-size:21px;font-weight:700;">${config.heading}</h2>
              <p style="margin:0 0 32px;color:#475569;font-size:15px;line-height:1.7;">${config.body}</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${confirmUrl}" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#2a9d8f,#3ab5a7);color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;padding:15px 40px;border-radius:14px;box-shadow:0 4px 14px rgba(42,157,143,0.35);">${config.buttonText}</a>
                  </td>
                </tr>
              </table>
              <p style="margin:28px 0 0;color:#94a3b8;font-size:12px;line-height:1.6;text-align:center;">
                Se você não solicitou esta ação, ignore este e-mail com segurança.<br>
                Nenhuma alteração será feita na sua conta.
              </p>
            </td>
          </tr>
          <!-- Rodapé -->
          <tr>
            <td style="padding:20px 32px;background-color:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0;color:#94a3b8;font-size:12px;">© ${new Date().getFullYear()} OnDose. Todos os direitos reservados.</p>
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

    // Monta a URL de confirmação
    let confirmUrl = confirmation_url;
    if (!confirmUrl && token_hash) {
      const redirectUrl = redirect_to || SITE_URL;
      confirmUrl = `${Deno.env.get("SUPABASE_URL")}/auth/v1/verify?token=${token_hash}&type=${type}&redirect_to=${encodeURIComponent(redirectUrl)}`;
    }

    const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "";
    const emailType =
      type === "signup" ? "signup"
      : type === "recovery" ? "recovery"
      : type === "magiclink" ? "magic_link"
      : type === "email_change" ? "email_change"
      : "signup";

    const { subject, html } = generateEmailHTML(emailType, confirmUrl || "#", userName);

    // Se não há chave do Resend, retorna no formato padrão do hook
    if (!RESEND_API_KEY) {
      console.warn("RESEND_API_KEY não configurada, usando resposta padrão do hook");
      return new Response(
        JSON.stringify({ subject, body: html }),
        { headers: { "Content-Type": "application/json; charset=utf-8" }, status: 200 }
      );
    }

    // Envia via Resend
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [email],
        subject,
        html,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("Erro ao enviar via Resend:", resendData);
      // Fallback: retorna no formato do hook para o Supabase enviar
      return new Response(
        JSON.stringify({ subject, body: html }),
        { headers: { "Content-Type": "application/json; charset=utf-8" }, status: 200 }
      );
    }

    console.log("E-mail enviado via Resend:", resendData.id);

    // Retorna resposta vazia para indicar que o e-mail já foi enviado
    return new Response(
      JSON.stringify({}),
      { headers: { "Content-Type": "application/json; charset=utf-8" }, status: 200 }
    );
  } catch (error) {
    console.error("Erro no email-hook:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
