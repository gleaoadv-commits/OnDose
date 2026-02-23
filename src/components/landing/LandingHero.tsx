import { Button } from "../ui/button";
import heroImage from "../../assets/landing-hero-lifestyle.jpg";

interface LandingHeroProps {
  onSignup: () => void;
}

export default function LandingHero({ onSignup }: LandingHeroProps) {
  return (
    <header className="max-w-7xl mx-auto px-6 pt-12 pb-24 grid md:grid-cols-2 gap-12 items-center text-left">
      <div className="space-y-8">
        <div className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-bold tracking-wide uppercase">
          Grátis para sempre (até 2 remédios)
        </div>
        <h1 className="text-5xl md:text-6xl font-black leading-tight text-foreground">
          Seus medicamentos <br /> sob controle.
        </h1>
        <p className="text-xl text-muted-foreground max-w-lg leading-relaxed font-medium">
          Gerencie remédios, receba lembretes e cuide de quem você ama — tudo em um só app.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <Button
            onClick={onSignup}
            className="text-lg px-10 h-16 bg-[#1a8e8e] hover:bg-[#157a7a] text-white font-bold rounded-2xl shadow-lg transition-all hover:scale-105"
          >
            Começar Agora — É Grátis
          </Button>
        </div>
      </div>
      <div className="relative flex justify-center">
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl opacity-30 -z-10 animate-pulse-soft"></div>
        <div className="relative group perspective-1000">
          <img
            src="/screenshot-3.png"
            alt="OnDose App Dashboard"
            className="w-full max-w-[320px] rounded-[3rem] shadow-2xl border-[8px] border-slate-900 transform transition-transform duration-700 group-hover:scale-105 group-hover:rotate-1"
          />
          {/* Subtle gloss effect over the screen */}
          <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
        </div>
      </div>
    </header>
  );
}
