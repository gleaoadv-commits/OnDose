import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Crown, X } from "lucide-react";
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
    <div className="space-y-4">
      <h2 className="text-elder-2xl font-bold text-foreground">👑 Planos</h2>

      <div className="grid gap-4">
        {/* Free */}
        <Card className={`p-5 ${plan === "free" ? "border-primary border-2" : ""}`}>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-elder-xl font-bold text-foreground">Gratuito</h3>
            {plan === "free" && (
              <span className="text-sm font-bold text-primary bg-primary/10 px-2 py-1 rounded-lg">Atual</span>
            )}
          </div>
          <p className="text-elder-2xl font-extrabold text-foreground mb-4">R$ 0<span className="text-elder-sm text-muted-foreground font-normal">/mês</span></p>
          <ul className="space-y-2">
            {features.map(f => (
              <li key={f.label} className="flex items-center gap-2 text-elder-sm">
                {f.free ? (
                  <Check className="h-5 w-5 text-success shrink-0" />
                ) : (
                  <X className="h-5 w-5 text-muted-foreground shrink-0" />
                )}
                <span className={f.free ? "text-foreground" : "text-muted-foreground"}>{f.label}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Pro */}
        <Card className={`p-5 border-2 ${plan === "pro" ? "border-pro" : "border-pro/30"} bg-pro/5`}>
          <div className="flex items-center gap-2 mb-3">
            <Crown className="h-6 w-6 text-pro" />
            <h3 className="text-elder-xl font-bold text-foreground">PRO</h3>
            {plan === "pro" && (
              <span className="text-sm font-bold text-pro bg-pro/10 px-2 py-1 rounded-lg">Atual</span>
            )}
          </div>
          <p className="text-elder-2xl font-extrabold text-foreground mb-1">R$ 9,90<span className="text-elder-sm text-muted-foreground font-normal">/mês</span></p>
          <p className="text-sm text-muted-foreground mb-4">Todos os recursos, sem limites</p>
          <ul className="space-y-2 mb-4">
            {features.map(f => (
              <li key={f.label} className="flex items-center gap-2 text-elder-sm">
                {f.pro ? (
                  <Check className="h-5 w-5 text-success shrink-0" />
                ) : (
                  <Check className="h-5 w-5 text-success shrink-0" />
                )}
                <span className="text-foreground">{f.label}</span>
              </li>
            ))}
          </ul>
          {plan !== "pro" && (
            <Button
              size="lg"
              className="w-full rounded-xl text-elder-base font-bold bg-pro text-pro-foreground hover:bg-pro/90"
              onClick={() => toast.info("Em breve! O plano PRO estará disponível.")}
            >
              <Crown className="h-5 w-5 mr-2" /> Assinar PRO
            </Button>
          )}
        </Card>
      </div>
    </div>
  );
}
