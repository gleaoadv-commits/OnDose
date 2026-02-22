import { Button } from "@/components/ui/button";
import LandingHeroMockup from "@/components/landing/LandingHeroMockup";

interface LandingHeroProps {
  onSignup: () => void;
}

export default function LandingHero({ onSignup }: LandingHeroProps) {
  return (
    <section className="py-12 md:py-20 px-4">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-8 md:gap-14">
        <div className="flex-1 text-center md:text-left space-y-5">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-[1.1] text-foreground">
            Seus medicamentos{" "}
            <span className="text-primary">sob controle.</span>
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-md mx-auto md:mx-0">
            Gerencie remédios, receba lembretes e cuide de quem você ama — tudo em um só app.
          </p>
          <Button
            onClick={onSignup}
            size="lg"
            className="gradient-primary text-primary-foreground font-bold rounded-full shadow-glow text-base px-8 py-6"
          >
            Começar Agora — É Grátis
          </Button>
        </div>
        <div className="flex-1 flex justify-center">
          <LandingHeroMockup />
        </div>
      </div>
    </section>
  );
}
