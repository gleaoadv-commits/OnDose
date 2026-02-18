import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Crown, X, Sparkles, Shield, Star, Loader2, Settings } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const TIERS = {
  pro: {
    monthly: { price_id: "price_1T2EPyDqdLmQstZG9zWUo1B9", amount: 12.9 },
    yearly:  { price_id: "price_1T2EQADqdLmQstZGyxXZjRuE", amount: 118.8, monthly_equiv: 9.9 },
    product_id: "prod_U0EtzwCBMSlt6o",
  },
  premium: {
    monthly: { price_id: "price_1T2EQNDqdLmQstZGikpcg2wl", amount: 34.9 },
    yearly:  { price_id: "price_1T2EQYDqdLmQstZGqYOhvxtI", amount: 298.8, monthly_equiv: 24.9 },
    product_id: "prod_U0Eub1bzRh41Dc",
  },
};

const features = [
  { label: "Cadastro de medicamentos",                    free: true,  pro: true,  premium: true,  freeOnly: false },
  { label: "Agenda diária",                               free: true,  pro: true,  premium: true,  freeOnly: false },
  { label: "Calendário visual",                           free: false, pro: true,  premium: true,  freeOnly: false },
  { label: "Notificações no app",                         free: true,  pro: true,  premium: true,  freeOnly: false },
  { label: "Até 2 medicamentos",                          free: true,  pro: false, premium: false, freeOnly: true  },
  { label: "Medicamentos ilimitados",                     free: false, pro: true,  premium: true,  freeOnly: false },
  { label: "Notificações por WhatsApp",                   free: false, pro: true,  premium: true,  freeOnly: false },
  { label: "Reconhecimento por foto (IA)",                free: false, pro: true,  premium: true,  freeOnly: false },
  { label: "Relatórios de adesão",                        free: false, pro: true,  premium: true,  freeOnly: false },
  { label: "Histórico completo de medicamentos",          free: false, pro: true,  premium: true,  freeOnly: false },
  { label: "Bulário eletrônico ANVISA",                   free: false, pro: false, premium: true,  freeOnly: false },
  { label: "Gestão de informações para até 2 familiares",  free: false, pro: false, premium: true,  freeOnly: false },
  { label: "Familiares extras (R$19,90/mês cada)",        free: false, pro: false, premium: true,  freeOnly: false },
  { label: "Relatórios para familiares",                  free: false, pro: false, premium: true,  freeOnly: false },
  { label: "Acompanhamento de exames (IA)",               free: false, pro: false, premium: true,  freeOnly: false },
  { label: "Gráficos de evolução de saúde",               free: false, pro: false, premium: true,  freeOnly: false },
  { label: "Lembrete de exames recorrentes (IA)",         free: false, pro: false, premium: true,  freeOnly: false },
];

export default function PlansPage() {
  const { plan, subscriptionEnd, refreshSubscription } = useApp();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");
  const [loadingCheckout, setLoadingCheckout] = useState<string | null>(null);
  const [loadingPortal, setLoadingPortal] = useState(false);

  const handleCheckout = async (tier: "pro" | "premium") => {
    setLoadingCheckout(tier);
    try {
      const priceId = TIERS[tier][billingCycle].price_id;
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      toast.error("Erro ao iniciar pagamento. Tente novamente.");
      console.error(err);
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
        toast.info("Nenhuma assinatura ativa encontrada. Assine um plano para gerenciar.");
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

  const proSavings = Math.round((1 - TIERS.pro.yearly.monthly_equiv / TIERS.pro.monthly.amount) * 100);
  const premiumSavings = Math.round((1 - TIERS.premium.yearly.monthly_equiv / TIERS.premium.monthly.amount) * 100);

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

      {subscriptionEnd && plan !== "free" && (
        <p className="text-xs text-muted-foreground">
          Sua assinatura renova em {new Date(subscriptionEnd).toLocaleDateString("pt-BR")}
        </p>
      )}

      {/* Billing toggle */}
      <div className="flex items-center justify-center">
        <div className="flex items-center bg-muted rounded-2xl p-1 gap-1 relative">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              billingCycle === "monthly"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Mensal
          </button>
          <button
            onClick={() => setBillingCycle("yearly")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              billingCycle === "yearly"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Anual
            <span className="text-xs font-extrabold text-success bg-success/10 px-1.5 py-0.5 rounded-full">
              -{proSavings}%
            </span>
          </button>
        </div>
      </div>

      {billingCycle === "yearly" && (
        <p className="text-center text-xs text-muted-foreground">
          💡 Cobrado anualmente — economize comparado ao plano mensal
        </p>
      )}

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
              {billingCycle === "yearly" && plan !== "pro" && (
                <span className="text-xs font-extrabold text-success bg-success/10 px-2 py-0.5 rounded-full">
                  Economize {proSavings}%
                </span>
              )}
              {plan === "pro" && (
                <span className="text-xs font-bold text-pro bg-pro/10 px-2.5 py-1 rounded-full ml-auto">Atual</span>
              )}
            </div>

            {billingCycle === "yearly" ? (
              <div className="mb-1">
                <div className="flex items-baseline gap-2">
                  <p className="text-elder-2xl font-extrabold text-foreground">
                    R$ {TIERS.pro.yearly.monthly_equiv.toFixed(2).replace(".", ",")}
                    <span className="text-sm text-muted-foreground font-normal">/mês</span>
                  </p>
                  <span className="text-sm text-muted-foreground line-through">R$ 12,90</span>
                </div>
                <p className="text-xs text-muted-foreground">R$ {TIERS.pro.yearly.amount.toFixed(2).replace(".", ",")} cobrado por ano</p>
              </div>
            ) : (
              <p className="text-elder-2xl font-extrabold text-foreground mb-1">
                R$ 12,90<span className="text-sm text-muted-foreground font-normal">/mês</span>
              </p>
            )}

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
                Assinar PRO {billingCycle === "yearly" ? "Anual" : "Mensal"}
              </Button>
            )}
            {plan === "pro" && (
              <Button
                size="lg"
                variant="outline"
                className="w-full rounded-2xl text-elder-base font-bold"
                onClick={handleManageSubscription}
                disabled={loadingPortal}
              >
                {loadingPortal ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Settings className="h-5 w-5 mr-2" />}
                Gerenciar assinatura
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
              {billingCycle === "yearly" && plan !== "premium" && (
                <span className="text-xs font-extrabold text-success bg-success/10 px-2 py-0.5 rounded-full">
                  Economize {premiumSavings}%
                </span>
              )}
              {plan === "premium" && (
                <span className="text-xs font-bold text-amber-600 bg-amber-500/10 px-2.5 py-1 rounded-full ml-auto">Atual</span>
              )}
            </div>

            {billingCycle === "yearly" ? (
              <div className="mb-1">
                <div className="flex items-baseline gap-2">
                  <p className="text-elder-2xl font-extrabold text-foreground">
                    R$ {TIERS.premium.yearly.monthly_equiv.toFixed(2).replace(".", ",")}
                    <span className="text-sm text-muted-foreground font-normal">/mês</span>
                  </p>
                  <span className="text-sm text-muted-foreground line-through">R$ 34,90</span>
                </div>
                <p className="text-xs text-muted-foreground">R$ {TIERS.premium.yearly.amount.toFixed(2).replace(".", ",")} cobrado por ano</p>
              </div>
            ) : (
              <p className="text-elder-2xl font-extrabold text-foreground mb-1">
                R$ 34,90<span className="text-sm text-muted-foreground font-normal">/mês</span>
              </p>
            )}

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
                Assinar Premium {billingCycle === "yearly" ? "Anual" : "Mensal"}
              </Button>
            )}
            {plan === "premium" && (
              <Button
                size="lg"
                variant="outline"
                className="w-full rounded-2xl text-elder-base font-bold"
                onClick={handleManageSubscription}
                disabled={loadingPortal}
              >
                {loadingPortal ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Settings className="h-5 w-5 mr-2" />}
                Gerenciar assinatura
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
