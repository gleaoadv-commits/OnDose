import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LandingCTAProps {
  onSignup: () => void;
}

export default function LandingCTA({ onSignup }: LandingCTAProps) {
  return (
    <section className="py-14 px-4">
      <div className="max-w-md mx-auto text-center space-y-5">
        <Button
          onClick={onSignup}
          size="lg"
          className="w-full gradient-primary text-primary-foreground font-black rounded-full shadow-glow text-lg py-7"
        >
          Começar Agora
        </Button>
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <p className="text-xs leading-snug text-left">
            Seus dados são criptografados e 100% seguros.
            <br />
            Privacidade garantida.
          </p>
        </div>
      </div>
    </section>
  );
}
