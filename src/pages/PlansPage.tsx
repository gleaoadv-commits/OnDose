import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Crown, X, Sparkles, Shield } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";

const features = [
  { label: "Cadastro de medicamentos", free: true, pro: true },
  { label: "Agenda e calendário", free: true, pro: true },
  { label: "Notificações no app", free: true, pro: true },
  { label: "Até 3 medicamentos", free: true, pro: false },
  { label: "Medicamentos ilimitados", free: false, pro: true },
  { label: "Notificações por WhatsApp", free: false, pro: true },
  { label: "Notificações por e-mail", free: false, pro: true },
  { label: "Reconhecimento por foto (IA)", free: false, pro: true },
  { label: "Relatórios de adesão", free: false, pro: true },
  { label: "Histórico completo", free: false, pro: true },
];

export default function PlansPage() {
  const { plan } = useApp();

  return (
    <div className="space-y-5">
      <h2 className="section-header">
        <Crown className="h-5 w-5 text-pro" />
        Planos
      </h2>

      <div className="grid gap-4">
        {/* Free */}
        <Card className={`p-5 rounded-2xl border-border/40 ${plan === "free" ? "border-primary/40 border-2" : ""}`}>
          <div className="flex items-center gap-2 mb-3">
            <div className="bg-muted rounded-xl p-2">
              <Shield className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="text-elder-xl font-bold text-foreground">Gratuito</h3>
            {plan === "free" && (
              <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full ml-auto">Atual</span>
            )}
          </div>
          <p className="text-elder-2xl font-extrabold text-foreground mb-4">
            R$ 0<span className="text-sm text-muted-foreground font-normal">/mês</span>
          </p>
          <ul className="space-y-2.5">
            {features.map(f => (
              <li key={f.label} className="flex items-center gap-2.5 text-sm">
                {f.free ? (
                  <div className="bg-success/10 rounded-full p-0.5">
                    <Check className="h-3.5 w-3.5 text-success stroke-[3]" />
                  </div>
                ) : (
                  <div className="bg-muted rounded-full p-0.5">
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                )}
                <span className={f.free ? "text-foreground" : "text-muted-foreground"}>{f.label}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Pro */}
        <Card className={`p-5 rounded-2xl border-2 overflow-hidden relative ${plan === "pro" ? "border-pro" : "border-pro/30"}`}>
          {/* Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-pro/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="gradient-pro rounded-xl p-2">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-elder-xl font-bold text-foreground">PRO</h3>
              {plan === "pro" && (
                <span className="text-xs font-bold text-pro bg-pro/10 px-2.5 py-1 rounded-full ml-auto">Atual</span>
              )}
            </div>
            <p className="text-elder-2xl font-extrabold text-foreground mb-1">
              R$ 9,90<span className="text-sm text-muted-foreground font-normal">/mês</span>
            </p>
            <p className="text-sm text-muted-foreground mb-4">Todos os recursos, sem limites</p>
            <ul className="space-y-2.5 mb-5">
              {features.map(f => (
                <li key={f.label} className="flex items-center gap-2.5 text-sm">
                  <div className="bg-success/10 rounded-full p-0.5">
                    <Check className="h-3.5 w-3.5 text-success stroke-[3]" />
                  </div>
                  <span className="text-foreground">{f.label}</span>
                </li>
              ))}
            </ul>
            {plan !== "pro" && (
              <Button
                size="lg"
                className="w-full rounded-2xl text-elder-base font-bold gradient-pro text-white border-0 shadow-elevated hover:opacity-90 transition-opacity"
                onClick={() => toast.info("Em breve! O plano PRO estará disponível.")}
              >
                <Crown className="h-5 w-5 mr-2" /> Assinar PRO
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
