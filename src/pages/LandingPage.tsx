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
      {/* Nav - only logo, minimal */}
      <nav className="absolute top-0 left-0 z-50 px-4 pt-4">
        <OnDoseLogo size="sm" />
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
