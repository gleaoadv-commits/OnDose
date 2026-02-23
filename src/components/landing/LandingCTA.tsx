import { ShieldCheck } from "lucide-react";
import { Button } from "../ui/button";

interface LandingCTAProps {
  onSignup: () => void;
}

export default function LandingCTA({ onSignup }: LandingCTAProps) {
  return (
    <section className="py-24 px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-primary/5 -z-10" />
      <div className="max-w-4xl mx-auto text-center space-y-10">
        <h2 className="text-3xl md:text-5xl font-black text-foreground leading-tight">
          Pronto para ter total <br />
          <span className="text-primary italic">paz de espírito?</span>
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Junte-se a milhares de famílias que já usam o OnDose para garantir que nenhum medicamento seja esquecido.
        </p>
        <div className="max-w-md mx-auto space-y-6">
          <Button
            onClick={onSignup}
            size="lg"
            className="w-full h-16 gradient-primary text-primary-foreground font-black rounded-2xl shadow-glow text-xl py-7 hover:scale-105 transition-transform"
          >
            Começar Agora — É Grátis
          </Button>
          <div className="flex items-center justify-center gap-3 text-muted-foreground bg-background/50 py-3 px-6 rounded-full border border-border/40 inline-block mx-auto">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <p className="text-xs font-medium">
              Dados protegidos com criptografia de ponta a ponta.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
