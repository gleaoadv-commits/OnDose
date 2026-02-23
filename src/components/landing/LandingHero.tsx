import screenshotHome from "../../assets/ondose-screenshot-home.png";

interface LandingHeroProps {
  onSignup: () => void;
}

export default function LandingHero({ onSignup }: LandingHeroProps) {
  return (
    <section className="pt-24 pb-16 md:pt-32 md:pb-24 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        {/* Text */}
        <div className="space-y-6">
          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 leading-[1.1]">
            A revolução no seu{" "}
            <span className="text-[#14B8A6]">cuidado diário</span>
          </h1>
          <p className="text-lg text-slate-500 leading-relaxed max-w-lg">
            Gerencie remédios, receba lembretes e cuide de quem você ama — tudo em um só app.
          </p>
          <button
            onClick={onSignup}
            className="px-8 py-4 rounded-full bg-[#14B8A6] text-white font-bold text-base shadow-lg shadow-teal-200/50 hover:bg-[#0D9488] hover:-translate-y-0.5 transition-all active:scale-95"
          >
            Começar Agora — É Grátis
          </button>
        </div>

        {/* Phone mockup with neon glow */}
        <div className="relative flex justify-center">
          {/* Floating geometric elements */}
          <div className="absolute -top-8 right-12 w-8 h-8 border-2 border-[#14B8A6]/30 rotate-45 rounded-sm animate-pulse" />
          <div className="absolute top-1/4 -left-4 w-5 h-5 bg-[#14B8A6]/20 rotate-12 rounded-sm animate-bounce" style={{ animationDelay: '0.5s' }} />
          <div className="absolute bottom-16 -right-2 w-6 h-6 border-2 border-[#14B8A6]/20 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-8 left-8 w-3 h-3 bg-[#14B8A6]/30 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />

          {/* Neon glow ring */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] md:w-[420px] md:h-[420px] rounded-full opacity-60"
            style={{
              background: 'conic-gradient(from 0deg, transparent 0%, #14B8A6 25%, #5EEAD4 50%, #14B8A6 75%, transparent 100%)',
              filter: 'blur(40px)',
            }}
          />
          {/* Secondary softer glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] md:w-[360px] md:h-[360px] rounded-full bg-[#14B8A6]/10 blur-[60px]" />

          {/* Phone */}
          <div className="relative z-10 transform rotate-[6deg] hover:rotate-[2deg] transition-transform duration-700">
            <div className="w-[260px] md:w-[300px] rounded-[2.5rem] overflow-hidden shadow-2xl border-[8px] border-slate-800 bg-slate-900">
              {/* Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-slate-900 rounded-b-2xl z-20" />
              <img
                src={screenshotHome}
                alt="OnDose App Dashboard"
                className="w-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
