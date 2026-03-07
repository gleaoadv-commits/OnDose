import { useState } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Check, Crown, X, Sparkles, Shield, Star, Loader2, Settings, AlertTriangle, CalendarClock, TrendingUp, Info } from "lucide-react";
import { useApp } from "../context/AppContext";
import { supabase } from "../integrations/supabase/client";
import { toast } from "sonner";
import { Alert, AlertDescription } from "../components/ui/alert";

const TIERS = {
  pro: {
    monthly: { price_id: "price_1T8QwmDqdLmQstZGbDxSVMBC", amount: 9.9 },
    product_id: "prod_U6eFRdGuH5fd70",
  },
  premium: {
    monthly: { price_id: "price_1T8QvxDqdLmQstZGMjnYfUKg", amount: 18.9 },
    product_id: "prod_U0Eub1bzRh41Dc",
  },
};

const features = [
  { label: "Cadastro de medicamentos", free: true, pro: true, premium: true, freeOnly: false },
  { label: "Agenda diária", free: true, pro: true, premium: true, freeOnly: false },
  { label: "Calendário visual", free: false, pro: true, premium: true, freeOnly: false },
  { label: "Notificações no app", free: true, pro: true, premium: true, freeOnly: false },
  { label: "Até 2 medicamentos", free: true, pro: false, premium: false, freeOnly: true },
  { label: "Medicamentos ilimitados", free: false, pro: true, premium: true, freeOnly: false },
  { label: "Notificações por WhatsApp", free: false, pro: true, premium: true, freeOnly: false },
  { label: "Reconhecimento por foto (IA)", free: false, pro: true, premium: true, freeOnly: false },
  { label: "Relatórios de adesão", free: false, pro: true, premium: true, freeOnly: false },
  { label: "Histórico completo de medicamentos", free: false, pro: true, premium: true, freeOnly: false },
  { label: "Bulário eletrônico ANVISA", free: false, pro: false, premium: true, freeOnly: false },
  { label: "Gestão de informações para até 2 familiares", free: false, pro: false, premium: true, freeOnly: false },
  { label: "Familiares extras (R$19,90/mês cada)", free: false, pro: false, premium: true, freeOnly: false },
  { label: "Relatórios para familiares", free: false, pro: false, premium: true, freeOnly: false },
  { label: "Acompanhamento de exames (IA)", free: false, pro: false, premium: true, freeOnly: false },
  { label: "Gráficos de evolução de saúde", free: false, pro: false, premium: true, freeOnly: false },
  { label: "Lembrete de exames recorrentes (IA)", free: false, pro: false, premium: true, freeOnly: false },
];

export default function PlansPage() {
  const { plan, subscriptionEnd, cancelAtPeriodEnd, refreshSubscription } = useApp();
  const [loadingCheckout, setLoadingCheckout] = useState<string | null>(null);
  const [loadingCheckout, setLoadingCheckout] = useState<string | null>(null);
  const [loadingPortal, setLoadingPortal] = useState(false);

  const handleCheckout = async (tier: "pro" | "premium") => {
    setLoadingCheckout(tier);
    try {
      // Verify session is active before calling checkout
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        toast.error("Sua sessão expirou. Faça login novamente.");
        return;
      }

      const priceId = TIERS[tier].monthly.price_id;
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("URL de checkout não retornada");
      }
    } catch (err: any) {
      console.error("[Checkout error]", err);
      toast.error("Erro ao iniciar pagamento. Tente novamente.");
    } finally {
      setLoadingCheckout(null);
    }
  };

  const handleManageSubscription = async () => {
    setLoadingPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.error === "no_customer") {
        toast.info("Esta conta possui acesso administrativo. O portal de assinatura Stripe não está disponível.");
        return;
      }
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      toast.error("Erro ao abrir portal. Tente novamente.");
      console.error(err);
    } finally {
      setLoadingPortal(false);
    }
  };

  const handleRefresh = async () => {
    await refreshSubscription();
    toast.success("Status atualizado!");
  };

  // Savings calculation removed as yearly billing is gone

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="section-header">
          <Crown className="h-5 w-5 text-pro" />
          Planos
        </h2>
        {plan !== "free" && (
          <Button variant="outline" size="sm" onClick={handleRefresh} className="text-xs">
            Atualizar status
          </Button>
        )}
      </div>

      {/* Subscription management card */}
      {plan !== "free" && (
        <Card className="p-4 rounded-2xl border-border/40 bg-muted/30 space-y-3">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-bold text-foreground">Gerenciamento da assinatura</h3>
          </div>

          {/* Cancellation scheduled banner */}
          {cancelAtPeriodEnd && subscriptionEnd && (
            <Alert className="border-destructive/40 bg-destructive/5 py-2.5">
              <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
              <AlertDescription className="text-xs text-muted-foreground ml-1">
                <strong className="text-destructive">Cancelamento agendado:</strong> Seu acesso ao plano{" "}
                {plan === "pro" ? "PRO" : "Premium"} ficará ativo até{" "}
                <strong className="text-foreground">
                  {new Date(subscriptionEnd).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                </strong>
                {" "}— após essa data, você retorna ao plano Gratuito automaticamente.
              </AlertDescription>
            </Alert>
          )}

          {subscriptionEnd && (
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <CalendarClock className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>
                Plano {plan === "pro" ? "PRO" : "Premium"} ativo até{" "}
                <strong className="text-foreground">
                  {new Date(subscriptionEnd).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                </strong>
              </span>
            </div>
          )}

          {!cancelAtPeriodEnd && (
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5 mt-0.5 shrink-0 text-success" />
              <span>
                <strong className="text-foreground">Upgrade:</strong> Ao mudar para um plano superior, cobraremos apenas o valor proporcional ao período restante.
              </span>
            </div>
          )}

          {!cancelAtPeriodEnd && (
            <Alert className="border-amber-500/30 bg-amber-500/5 py-2.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              <AlertDescription className="text-xs text-muted-foreground ml-1">
                <strong className="text-foreground">Cancelamento:</strong> Não implica devolução de valores pagos.
                {subscriptionEnd && (
                  <span> Ao cancelar, você mantém o acesso até{" "}
                    <strong className="text-amber-600">
                      {new Date(subscriptionEnd).toLocaleDateString("pt-BR")}
                    </strong>
                    {" "}e retorna ao plano Gratuito automaticamente.
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          {!cancelAtPeriodEnd && (
            <Button
              size="sm"
              variant="outline"
              className="w-full rounded-xl text-sm font-semibold"
              onClick={handleManageSubscription}
              disabled={loadingPortal}
            >
              {loadingPortal ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Settings className="h-4 w-4 mr-2" />}
              Gerenciar / Cancelar assinatura
            </Button>
          )}

          {cancelAtPeriodEnd && (
            <Button
              size="sm"
              variant="outline"
              className="w-full rounded-xl text-sm font-semibold border-primary/40 text-primary hover:bg-primary/5"
              onClick={handleManageSubscription}
              disabled={loadingPortal}
            >
              {loadingPortal ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Settings className="h-4 w-4 mr-2" />}
              Reativar assinatura
            </Button>
          )}

          <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <Info className="h-3 w-3 mt-0.5 shrink-0" />
            <span>Gerenciamento processado pelo portal seguro do Stripe.</span>
          </div>
        </Card>
      )}


      {/* Billing toggle removed */}

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
            {[...features].sort((a, b) => Number(b.free) - Number(a.free)).map(f => (
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
          <div className="absolute top-0 right-0 w-32 h-32 bg-pro/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="gradient-pro rounded-xl p-2">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-elder-xl font-bold text-foreground">PRO</h3>
              <p className="text-elder-2xl font-extrabold text-foreground mb-1">
                R$ 9,90<span className="text-sm text-muted-foreground font-normal">/mês</span>
              </p>

              <p className="text-sm text-muted-foreground mb-4">Todos os recursos, sem limites</p>
              <ul className="space-y-2.5 mb-5">
                {[...features].filter(f => !f.freeOnly).sort((a, b) => Number(b.pro) - Number(a.pro)).map(f => (
                  <li key={f.label} className="flex items-center gap-2.5 text-sm">
                    {f.pro ? (
                      <div className="bg-success/10 rounded-full p-0.5">
                        <Check className="h-3.5 w-3.5 text-success stroke-[3]" />
                      </div>
                    ) : (
                      <div className="bg-muted rounded-full p-0.5">
                        <X className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    )}
                    <span className={f.pro ? "text-foreground" : "text-muted-foreground"}>{f.label}</span>
                  </li>
                ))}
              </ul>
              {plan === "free" && (
                <Button
                  size="lg"
                  className="w-full rounded-2xl text-elder-base font-bold gradient-pro text-white border-0 shadow-elevated hover:opacity-90 transition-opacity"
                  onClick={() => handleCheckout("pro")}
                  disabled={!!loadingCheckout}
                >
                  {loadingCheckout === "pro" ? (
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  ) : (
                    <Crown className="h-5 w-5 mr-2" />
                  )}
                  Assinar PRO Mensal
                </Button>
              )}
            </div>
        </Card>

        {/* Premium */}
        <Card className={`p-5 rounded-2xl border-2 overflow-hidden relative ${plan === "premium" ? "border-amber-500" : "border-amber-500/30"}`}>
          <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-600/8 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-2">
                <Star className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-elder-xl font-bold text-foreground">Premium</h3>
              <p className="text-elder-2xl font-extrabold text-foreground mb-1">
                R$ 18,90<span className="text-sm text-muted-foreground font-normal">/mês</span>
              </p>

              <p className="text-sm text-muted-foreground mb-4">Controle total + 2 familiares inclusos + exames IA</p>
              <ul className="space-y-2.5 mb-5">
                {features.filter(f => !f.freeOnly).map(f => (
                  <li key={f.label} className="flex items-center gap-2.5 text-sm">
                    <div className="bg-success/10 rounded-full p-0.5">
                      <Check className="h-3.5 w-3.5 text-success stroke-[3]" />
                    </div>
                    <span className="text-foreground">{f.label}</span>
                  </li>
                ))}
              </ul>
              {plan !== "premium" && (
                <Button
                  size="lg"
                  className="w-full rounded-2xl text-elder-base font-bold bg-gradient-to-r from-amber-500 to-amber-600 text-white border-0 shadow-elevated hover:opacity-90 transition-opacity"
                  onClick={() => handleCheckout("premium")}
                  disabled={!!loadingCheckout}
                >
                  {loadingCheckout === "premium" ? (
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  ) : (
                    <Star className="h-5 w-5 mr-2" />
                  )}
                  Assinar Premium Mensal
                </Button>
              )}
              {plan === "premium" && (
                <p className="text-center text-xs text-muted-foreground py-2">
                  ✅ Você já está no plano mais completo. Gerencie sua assinatura acima.
                </p>
              )}
            </div>
        </Card>
      </div>
    </div>
  );
}
