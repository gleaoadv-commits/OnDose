import { Button } from "@/components/ui/button";
import heroImage from "@/assets/landing-hero-lifestyle.jpg";
import OnDoseLogo from "@/components/OnDoseLogo";

interface LandingHeroProps {
  onSignup: () => void;
}

export default function LandingHero({ onSignup }: LandingHeroProps) {
  return (
    <section className="relative bg-background">
      {/* Mobile: image top-right, logo overlaid top-left */}
      <div className="relative md:hidden">
        <div className="flex">
          {/* Spacer left */}
          <div className="w-1/3" />
          {/* Image right */}
          <div className="w-2/3">
            <img
              src={heroImage}
              alt="Mulher sorrindo usando o app OnDose"
              className="w-full h-64 object-cover object-top rounded-bl-[2rem]"
              loading="eager"
            />
          </div>
        </div>
      </div>

      {/* Desktop hero */}
      <div className="hidden md:block max-w-6xl mx-auto px-4 pt-12 pb-20">
        <div className="flex items-center gap-12">
          <div className="flex-1 space-y-5">
            <h1 className="text-4xl lg:text-5xl font-black tracking-tight leading-[1.1] text-foreground">
              <span className="text-primary">OnDose:</span>
              <br />
              Medicamentos e Saúde, Sob Controle.
            </h1>
            <p className="text-lg text-muted-foreground max-w-md">
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
          <div className="flex-1">
            <img
              src={heroImage}
              alt="Mulher sorrindo usando o app OnDose"
              className="w-full max-w-lg rounded-3xl object-cover aspect-[4/3] shadow-elevated"
              loading="eager"
            />
          </div>
        </div>
      </div>

      {/* Mobile text content */}
      <div className="md:hidden px-6 pt-10 pb-10 space-y-5">
        <h1 className="text-3xl font-black tracking-tight leading-[1.1] text-foreground">
          <span className="text-primary">OnDose:</span>
          <br />
          Medicamentos e Saúde, Sob Controle.
        </h1>
        <p className="text-base text-muted-foreground">
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
    </section>
  );
}
