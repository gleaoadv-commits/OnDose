import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import OnDoseLogo from "@/components/OnDoseLogo";
import LandingHero from "@/components/landing/LandingHero";
import LandingFeatures from "@/components/landing/LandingFeatures";
import LandingHowItWorks from "@/components/landing/LandingHowItWorks";
import LandingTestimonials from "@/components/landing/LandingTestimonials";
import LandingCTA from "@/components/landing/LandingCTA";
import LandingFooter from "@/components/landing/LandingFooter";

export default function LandingPage() {
  const navigate = useNavigate();
  const goToSignup = () => navigate("/auth?mode=signup");

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden font-sans">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border/30">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <OnDoseLogo size="sm" />
          <div className="flex items-center gap-2">
            <Button onClick={() => navigate("/auth")} variant="ghost" size="sm" className="font-semibold text-foreground">
              Entrar
            </Button>
            <Button onClick={goToSignup} size="sm" className="gradient-primary text-primary-foreground font-bold rounded-xl shadow-glow">
              Criar Conta
            </Button>
          </div>
        </div>
      </nav>

      <LandingHero onSignup={goToSignup} />
      <LandingFeatures />
      <LandingHowItWorks />
      <LandingTestimonials />
      <LandingCTA onSignup={goToSignup} />
      <LandingFooter />
    </div>
  );
}
