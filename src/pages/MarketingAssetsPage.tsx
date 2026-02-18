import post1 from "@/assets/instagram-post-1.jpg";
import post2 from "@/assets/instagram-post-2.jpg";
import post3 from "@/assets/instagram-post-3.jpg";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

const posts = [
  {
    src: post1,
    title: "Post 1 — Nunca mais esqueça seu remédio",
    caption: `💊 Você já esqueceu de tomar um remédio hoje?

Com o OnDose PRO, isso não acontece mais. Alertas inteligentes, calendário completo e histórico de adesão — tudo no seu bolso. 📱

✅ Alertas no horário certo
✅ Calendário de medicamentos
✅ Histórico e relatórios

🔗 Teste grátis agora! Link na bio.
.
#OnDose #SaudeEmDia #Medicamentos #LembreteDeMedicamento #SaudeDigital #AppDeSaude #CuidadoComASaude`,
  },
  {
    src: post2,
    title: "Post 2 — Cuide de quem você ama",
    caption: `❤️ Você cuida de alguém que mora longe?

Com o OnDose PRO, familiares recebem alertas em tempo real se o remédio não foi tomado. Paz de espírito para toda a família. 👴👩

🛡️ Alertas se não tomou
💚 Relatórios da família
🔔 Estoque monitorado

Conecte sua família agora. Link na bio.
.
#OnDose #CuidadoEmFamilia #IdososComSaude #FamiliaUnida #AppDeSaude #SaudeDigital #CuidadorDeSaude`,
  },
  {
    src: post3,
    title: "Post 3 — Comece grátis agora",
    caption: `🆓 Sabia que o OnDose tem uma versão 100% gratuita?

Sem cartão de crédito. Sem compromisso. Só saúde em dia. 💊

Organize seus medicamentos, configure lembretes e nunca mais esqueça uma dose — tudo de graça!

✅ Até 2 medicamentos cadastrados
✅ Agenda e lembretes diários
✅ Histórico básico de doses

👇 Experimente agora. Link na bio.
.
#OnDose #Gratis #AppGratuito #SaudeEmDia #Medicamentos #LembreteDeMedicamento #AppDeSaude #SaudeDigital`,
  },
];

function downloadImage(src: string, name: string) {
  const a = document.createElement("a");
  a.href = src;
  a.download = name;
  a.click();
}

export default function MarketingAssetsPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-10">
      <div>
        <h1 className="text-elder-xl font-extrabold text-foreground">📸 Posts para Instagram</h1>
        <p className="text-muted-foreground text-elder-sm mt-1">
          Baixe as imagens e use a legenda sugerida para postar no seu perfil.
        </p>
      </div>

      {posts.map((post, i) => (
        <div key={i} className="glass-card p-4 space-y-4">
          <h2 className="font-bold text-foreground">{post.title}</h2>

          <img
            src={post.src}
            alt={post.title}
            className="w-full rounded-2xl shadow-card"
          />

          <Button
            className="w-full gap-2"
            onClick={() => downloadImage(post.src, `ondose-instagram-post-${i + 1}.jpg`)}
          >
            <Download size={16} />
            Baixar imagem
          </Button>

          <div className="bg-muted rounded-xl p-4">
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Legenda sugerida</p>
            <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">{post.caption}</pre>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 w-full"
              onClick={() => navigator.clipboard.writeText(post.caption)}
            >
              Copiar legenda
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
