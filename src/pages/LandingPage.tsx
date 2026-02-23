import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import OnDoseLogo from '../components/OnDoseLogo';
import LandingHero from '../components/landing/LandingHero';
import LandingBenefits from '../components/landing/LandingBenefits';
import LandingWhyChoose from '../components/landing/LandingWhyChoose';
import LandingTestimonials from '../components/landing/LandingTestimonials';
import LandingFooter from '../components/landing/LandingFooter';

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 100);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const goSignup = () => navigate('/auth?mode=signup');

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      {/* Navbar */}
      <nav className="fixed w-full top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
            <OnDoseLogo size="sm" />
          </div>
          <div className="flex gap-3 items-center">
            <button
              onClick={() => navigate('/auth')}
              className="px-5 py-2 rounded-full text-sm font-semibold text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              Entrar
            </button>
            <button
              onClick={goSignup}
              className="px-5 py-2 rounded-full text-sm font-bold bg-[#14B8A6] text-white hover:bg-[#0D9488] transition-colors shadow-sm"
            >
              Criar Conta Grátis
            </button>
          </div>
        </div>
      </nav>

      <LandingHero onSignup={goSignup} />
      <LandingBenefits />
      <LandingWhyChoose />
      <LandingTestimonials />

      {/* Sticky CTA Bar */}
      <div className={`fixed bottom-0 left-0 w-full p-3 z-50 transition-all duration-500 ${isScrolled ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
        <div className="max-w-lg mx-auto bg-[#0D9488] backdrop-blur-xl rounded-2xl px-6 py-3 flex items-center justify-center shadow-2xl">
          <button
            onClick={goSignup}
            className="w-full py-3 rounded-full bg-white text-[#0D9488] font-bold text-sm hover:bg-slate-50 transition-colors"
          >
            Começar Agora — É Grátis
          </button>
        </div>
      </div>

      <LandingFooter />
    </div>
  );
}
