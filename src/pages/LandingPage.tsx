import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import OnDoseLogo from "../components/OnDoseLogo";
import LandingHero from "../components/landing/LandingHero";
import LandingFeatures from "../components/landing/LandingFeatures";
import LandingHowItWorks from "../components/landing/LandingHowItWorks";
import LandingTestimonials from "../components/landing/LandingTestimonials";
import LandingCTA from "../components/landing/LandingCTA";
import LandingStats from "../components/landing/LandingStats";
import LandingFooter from "../components/landing/LandingFooter";

export default function LandingPage() {
  const navigate = useNavigate();
  const goToSignup = () => navigate("/auth?mode=signup");

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden font-sans">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/20">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <OnDoseLogo size="sm" />
          <div className="flex items-center gap-4">
            <Button onClick={() => navigate("/auth")} variant="ghost" size="sm" className="font-bold text-foreground hover:text-primary">
              Entrar
            </Button>
            <Button onClick={goToSignup} size="sm" className="gradient-primary text-primary-foreground font-bold rounded-xl shadow-glow px-6">
              Criar Conta Grátis
            </Button>
          </div>
        </div>
      </nav>

      <main>
        <LandingHero onSignup={goToSignup} />
        <LandingFeatures />
        <LandingStats />
        <LandingHowItWorks />
        <LandingTestimonials />
        <LandingCTA onSignup={goToSignup} />
      </main>

      <LandingFooter />
    </div>
  );
}

