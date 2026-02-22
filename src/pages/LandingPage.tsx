import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Package, Users, Clock, LayoutGrid, Pill, Shield, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import OnDoseLogo from "@/components/OnDoseLogo";
import LandingHeroMockup from "@/components/landing/LandingHeroMockup";
import LandingProblemSection from "@/components/landing/LandingProblemSection";
import LandingSolutionSection from "@/components/landing/LandingSolutionSection";
import LandingStats from "@/components/landing/LandingStats";
import LandingTestimonials from "@/components/landing/LandingTestimonials";
import LandingFooter from "@/components/landing/LandingFooter";

export default function LandingPage() {
  const navigate = useNavigate();
  const goToSignup = () => navigate("/auth?mode=signup");

  return (
    <div className="min-h-screen bg-white text-foreground overflow-x-hidden">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-border/30">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <OnDoseLogo size="sm" />
          <div className="flex items-center gap-2">
            <Button onClick={() => navigate("/auth")} variant="ghost" size="sm" className="font-semibold text-foreground">
              Entrar
            </Button>
            <Button onClick={goToSignup} size="sm" className="gradient-primary text-primary-foreground font-bold rounded-xl shadow-glow">
              Criar Conta Grátis
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-10 md:gap-16">
          <div className="flex-1 text-center md:text-left space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1]">
              Seus medicamentos{" "}
              <span className="text-primary">sob controle.</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-md">
              Gerencie remédios, receba lembretes e cuide de quem você ama — tudo em um só app.
            </p>
            <Button onClick={goToSignup} size="lg" className="gradient-primary text-primary-foreground font-bold rounded-full shadow-glow text-base px-8 py-6">
              Começar Agora — É Grátis
            </Button>
          </div>
          <div className="flex-1 flex justify-center">
            <LandingHeroMockup />
          </div>
        </div>
      </section>

      <LandingProblemSection />
      <LandingSolutionSection />
      <LandingStats />
      <LandingTestimonials />
      <LandingFooter />
    </div>
  );
}
