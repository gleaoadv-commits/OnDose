import { Button } from "@/components/ui/button";
import heroImage from "@/assets/landing-hero-lifestyle.jpg";

interface LandingHeroProps {
  onSignup: () => void;
}

export default function LandingHero({ onSignup }: LandingHeroProps) {
  return (
    <section className="relative">
      {/* Hero image - right aligned on desktop, full width on mobile */}
      <div className="max-w-6xl mx-auto px-4 pt-6 md:pt-12 pb-12 md:pb-20">
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
          {/* Text */}
          <div className="flex-1 space-y-5 text-center md:text-left order-2 md:order-1">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-[1.1] text-foreground">
              <span className="text-primary">OnDose:</span>
              <br />
              Medicamentos e Saúde, Sob Controle.
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-md mx-auto md:mx-0">
              Gerencie sua medicação com facilidade, receba lembretes inteligentes e compartilhe com sua família.
            </p>
            <Button
              onClick={onSignup}
              size="lg"
              className="gradient-primary text-primary-foreground font-bold rounded-full shadow-glow text-base px-8 py-6"
            >
              Começar Agora — É Grátis
            </Button>
          </div>

          {/* Image */}
          <div className="flex-1 order-1 md:order-2">
            <img
              src={heroImage}
              alt="Mulher sorrindo usando o app OnDose"
              className="w-full max-w-md mx-auto rounded-3xl object-cover aspect-[4/3] shadow-elevated"
              loading="eager"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
