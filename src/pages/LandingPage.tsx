import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import OnDoseLogo from "@/components/OnDoseLogo";
import LandingHero from "@/components/landing/LandingHero";
import LandingProblemSection from "@/components/landing/LandingProblemSection";
import LandingSolutionSection from "@/components/landing/LandingSolutionSection";
import LandingStats from "@/components/landing/LandingStats";
import LandingTestimonials from "@/components/landing/LandingTestimonials";
import LandingFooter from "@/components/landing/LandingFooter";

export default function LandingPage() {
  const navigate = useNavigate();
  const goToSignup = () => navigate("/auth?mode=signup");

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden font-sans">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border/30">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <OnDoseLogo size="sm" variant="text" />
          <div className="flex items-center gap-2">
            <Button onClick={() => navigate("/auth")} variant="outline" size="sm" className="font-semibold rounded-lg">
              Entrar
            </Button>
            <Button onClick={goToSignup} size="sm" className="gradient-primary text-primary-foreground font-bold rounded-lg shadow-glow">
              Criar Conta Grátis
            </Button>
          </div>
        </div>
      </nav>

      <LandingHero onSignup={goToSignup} />
      <LandingProblemSection />
      <LandingSolutionSection />
      <LandingStats />
      <LandingTestimonials />
      <LandingFooter />
    </div>
  );
}
