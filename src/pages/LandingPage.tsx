import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check,
  Bell,
  ShieldCheck,
  Users,
  ArrowRight,
  Star,
  Smartphone,
  CheckCircle2,
  HeartPulse,
  Camera,
  Pill,
  Clock,
  AlertTriangle,
  Zap,
  TrendingUp,
  X
} from 'lucide-react';

import OnDoseLogo from '../components/OnDoseLogo';

// --- Reusable UI Components ---

const Button = ({ children, variant = 'primary', className = '', ...props }: any) => {
  const baseStyles = "px-6 py-3 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 transform active:scale-95 cursor-pointer";
  const variants: any = {
    primary: "bg-[#14B8A6] text-white shadow-lg shadow-teal-200/50 hover:bg-[#0D9488] hover:-translate-y-0.5",
    urgency: "bg-gradient-to-r from-[#14B8A6] to-[#0D9488] text-white shadow-xl shadow-teal-300/40 hover:shadow-teal-400/60 hover:-translate-y-1 animate-pulse-subtle",
    outline: "border-2 border-[#14B8A6] text-[#14B8A6] hover:bg-teal-50",
    secondary: "bg-teal-50 text-[#0D9488] hover:bg-teal-100",
    dark: "bg-slate-900 text-white hover:bg-slate-800",
  };
  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

const CountUpNumber = ({ target, suffix = '', prefix = '' }: { target: number; suffix?: string; prefix?: string }) => {
  const [count, setCount] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const duration = 2000;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [visible, target]);

  return (
    <span
      ref={(el) => {
        if (el) {
          const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) setVisible(true);
          }, { threshold: 0.5 });
          observer.observe(el);
        }
      }}
    >
      {prefix}{count.toLocaleString('pt-BR')}{suffix}
    </span>
  );
};

// --- Main Page ---

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showExitPopup, setShowExitPopup] = useState(false);
  const [exitShown, setExitShown] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 200);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Exit intent detection (desktop only)
  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !exitShown) {
        setShowExitPopup(true);
        setExitShown(true);
      }
    };
    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [exitShown]);

  const goSignup = () => navigate('/auth?mode=signup');

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 overflow-x-hidden">

      {/* Exit Intent Popup */}
      {showExitPopup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full relative shadow-2xl animate-in zoom-in-95 duration-300">
            <button onClick={() => setShowExitPopup(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle className="text-red-500" size={32} />
              </div>
              <h3 className="text-2xl font-black text-slate-900">Espera! Não vá embora 😢</h3>
              <p className="text-slate-500">
                <strong className="text-slate-800">50% dos brasileiros</strong> esquecem de tomar medicamentos. 
                Não faça parte dessa estatística.
              </p>
              <Button className="w-full text-lg h-14" onClick={() => { setShowExitPopup(false); goSignup(); }}>
                Criar Conta Grátis Agora <ArrowRight size={18} />
              </Button>
              <p className="text-xs text-slate-400">Sem cartão de crédito • Cancele quando quiser</p>
            </div>
          </div>
        </div>
      )}

      {/* Urgency Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white py-2.5 text-center text-sm font-medium fixed top-0 w-full z-50">
        <span className="animate-pulse inline-block mr-2">🔥</span>
        <span className="hidden sm:inline">Oferta de lançamento:</span> Plano PRO por apenas <strong className="text-teal-400">R$9,90/mês</strong> 
        <span className="hidden sm:inline"> — Primeiros 100 assinantes</span>
        <button onClick={goSignup} className="ml-3 bg-teal-500 text-white px-3 py-0.5 rounded-full text-xs font-bold hover:bg-teal-400 transition-colors">
          GARANTIR →
        </button>
      </div>

      {/* Navbar */}
      <nav className="fixed w-full top-10 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex justify-between items-center">
          <div className="cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
            <OnDoseLogo size="sm" />
          </div>
          <div className="flex gap-3 items-center">
            <Button variant="outline" className="py-2 px-4 text-xs sm:text-sm hidden sm:flex" onClick={() => navigate('/auth')}>Entrar</Button>
            <Button className="py-2 px-4 text-xs sm:text-sm" onClick={goSignup}>Criar Conta Grátis</Button>
          </div>
        </div>
      </nav>

      {/* Hero Section — Problem-focused */}
      <section className="pt-36 sm:pt-40 pb-16 sm:pb-24 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="space-y-6 sm:space-y-8">
            {/* Social proof badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-full text-xs font-bold">
              <Star size={14} fill="currentColor" /> 4.9 ★ — Avaliado por +200 usuários
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-slate-900 leading-[1.05]">
              Esqueceu o remédio <span className="text-red-500">de novo?</span>
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl text-slate-500 leading-relaxed max-w-xl">
              O OnDose te avisa no <strong className="text-slate-800">WhatsApp</strong> na hora certa. 
              Basta responder <strong className="text-teal-600">"1"</strong> para confirmar a dose. 
              Simples assim.
            </p>

            {/* Trust indicators */}
            <div className="flex flex-wrap gap-4 text-xs sm:text-sm text-slate-500 font-medium">
              <span className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-teal-500" /> Grátis para sempre</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-teal-500" /> Sem cartão</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-teal-500" /> Dados protegidos</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Button variant="urgency" className="text-base sm:text-lg px-8 sm:px-10 h-14 sm:h-16" onClick={goSignup}>
                Começar Grátis Agora <ArrowRight size={20} />
              </Button>
            </div>

            {/* Real-time social proof */}
            <div className="flex items-center gap-3 pt-2">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 overflow-hidden shadow-sm">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 20}`} alt="User" />
                  </div>
                ))}
              </div>
              <p className="text-xs sm:text-sm text-slate-500">
                <strong className="text-slate-800">+200 pessoas</strong> já cuidam da saúde com o OnDose
              </p>
            </div>
          </div>

          {/* Hero visual */}
          <div className="relative flex justify-center">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-teal-100/40 rounded-full blur-[100px] -z-10"></div>
            
            <div className="relative w-full max-w-[300px] sm:max-w-[320px]">
              {/* WhatsApp notification mockup */}
              <div className="absolute -top-4 -left-4 sm:-top-6 sm:-left-6 bg-white p-3 sm:p-4 rounded-2xl shadow-xl border border-slate-50 z-10 animate-bounce">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500 rounded-full flex items-center justify-center text-white">
                    <Bell size={16} />
                  </div>
                  <div>
                    <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider">WhatsApp</p>
                    <p className="text-xs sm:text-sm font-bold text-slate-800">💊 Hora do Losartana!</p>
                  </div>
                </div>
              </div>

              {/* Confirmation badge */}
              <div className="absolute -bottom-4 -right-4 sm:-bottom-6 sm:-right-6 bg-teal-500 text-white p-3 sm:p-4 rounded-2xl shadow-xl z-10">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={20} />
                  <div>
                    <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider opacity-80">Respondeu "1"</p>
                    <p className="text-xs sm:text-sm font-bold">Dose Registrada! ✅</p>
                  </div>
                </div>
              </div>

              <div className="relative rounded-[2.5rem] sm:rounded-[3rem] overflow-hidden border-[8px] sm:border-[10px] border-white shadow-2xl ring-1 ring-slate-200">
                <img
                  src="/premium-mockup.png"
                  alt="OnDose Interface"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute top-[10.4%] left-[11%] right-[15%] h-[2.4%] bg-[#14B8A6] rounded-sm"></div>
                <div className="absolute top-[10.5%] left-[13%] px-2.5 py-1.0 text-[8px] font-bold text-white/90">Olá! 👋</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pain Points Section */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl font-black text-center text-slate-900 mb-4">Você se identifica?</h2>
          <p className="text-center text-slate-500 mb-12 sm:mb-16 max-w-2xl mx-auto text-sm sm:text-base">Se alguma dessas situações faz parte do seu dia a dia, o OnDose foi feito pra você.</p>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              { emoji: "😰", pain: "Esquece de tomar o remédio", solution: "Alerta no WhatsApp na hora certa" },
              { emoji: "😵‍💫", pain: "Confunde horários e dosagens", solution: "Agenda visual clara e organizada" },
              { emoji: "😟", pain: "Se preocupa com pais/avós", solution: "Monitoramento familiar em tempo real" },
              { emoji: "🤯", pain: "Toma muitos remédios por dia", solution: "Controle de estoque automático" },
              { emoji: "📸", pain: "Não sabe qual remédio é", solution: "IA identifica pela foto da caixa" },
              { emoji: "💸", pain: "Gasta demais na farmácia", solution: "Encontre farmácias próximas baratas" },
            ].map((item, i) => (
              <div key={i} className="group relative p-6 rounded-2xl border border-slate-100 hover:border-teal-200 hover:shadow-lg transition-all duration-300 bg-white">
                <div className="text-3xl mb-3">{item.emoji}</div>
                <p className="font-bold text-slate-800 mb-2 text-sm sm:text-base line-through decoration-red-300 decoration-2">{item.pain}</p>
                <p className="text-teal-600 font-semibold flex items-center gap-1.5 text-sm">
                  <CheckCircle2 size={16} /> {item.solution}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works — 3 steps */}
      <section className="py-16 sm:py-24 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl font-black text-center text-slate-900 mb-4">Como funciona?</h2>
          <p className="text-center text-slate-500 mb-12 sm:mb-16 text-sm sm:text-base">3 passos. Menos de 2 minutos. Zero complicação.</p>
          
          <div className="grid sm:grid-cols-3 gap-8 sm:gap-12">
            {[
              { step: "1", icon: Smartphone, title: "Cadastre seus remédios", desc: "Nome, dosagem e horários. A IA te ajuda a preencher automaticamente." },
              { step: "2", icon: Bell, title: "Receba alertas no WhatsApp", desc: "Na hora certa, direto no seu WhatsApp. Impossível ignorar." },
              { step: "3", icon: Check, title: "Responda '1' e pronto", desc: "Confirme a dose com um toque. Histórico salvo automaticamente." },
            ].map((item, i) => (
              <div key={i} className="text-center space-y-4">
                <div className="relative mx-auto w-20 h-20">
                  <div className="absolute inset-0 bg-teal-100 rounded-full"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <item.icon size={32} className="text-teal-600" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center text-sm font-black">
                    {item.step}
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-800">{item.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button variant="urgency" className="text-lg px-10 h-14" onClick={goSignup}>
              Quero Começar Agora <Zap size={18} />
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="funcionalidades" className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl font-black text-center text-slate-900 mb-4">Tudo que você precisa</h2>
          <p className="text-center text-slate-500 mb-12 sm:mb-16 text-sm sm:text-base">Funcionalidades que nenhum outro app oferece juntas.</p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              { icon: Bell, title: "Lembretes via WhatsApp", desc: "Receba na hora certa, no app que você já usa.", color: "bg-green-50 text-green-600" },
              { icon: Camera, title: "Identificação por Foto", desc: "Tire uma foto do remédio e a IA identifica tudo.", color: "bg-purple-50 text-purple-600" },
              { icon: Users, title: "Monitoramento Familiar", desc: "Acompanhe a medicação dos seus pais ou avós.", color: "bg-blue-50 text-blue-600" },
              { icon: Pill, title: "Controle de Estoque", desc: "Saiba quando o remédio está acabando.", color: "bg-amber-50 text-amber-600" },
              { icon: TrendingUp, title: "Relatórios de Adesão", desc: "Gráficos e histórico para levar ao médico.", color: "bg-teal-50 text-teal-600" },
              { icon: ShieldCheck, title: "Bula ANVISA Oficial", desc: "Consulte a bula direto da base da ANVISA.", color: "bg-red-50 text-red-600" },
            ].map((f, i) => (
              <div key={i} className="group p-6 sm:p-8 bg-white rounded-2xl border border-slate-100 hover:shadow-xl hover:shadow-teal-500/5 transition-all duration-500 hover:-translate-y-1">
                <div className={`w-12 h-12 ${f.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <f.icon size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof Stats */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-teal-900 via-teal-800 to-slate-900 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center">
            {[
              { value: 200, suffix: "+", label: "Usuários ativos" },
              { value: 98, suffix: "%", label: "Adesão ao tratamento" },
              { value: 5000, suffix: "+", label: "Doses registradas" },
              { value: 4.9, suffix: " ★", label: "Avaliação média" },
            ].map((stat, i) => (
              <div key={i} className="space-y-2">
                <p className="text-3xl sm:text-4xl md:text-5xl font-black text-teal-300">
                  {typeof stat.value === 'number' && stat.value >= 100 
                    ? <CountUpNumber target={stat.value} suffix={stat.suffix} />
                    : <>{stat.value}{stat.suffix}</>
                  }
                </p>
                <p className="text-teal-100 text-xs sm:text-sm font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Teaser */}
      <section className="py-16 sm:py-24 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl font-black text-center text-slate-900 mb-4">Planos para toda necessidade</h2>
          <p className="text-center text-slate-500 mb-12 sm:mb-16 text-sm sm:text-base">Comece grátis. Evolua quando quiser.</p>

          <div className="grid sm:grid-cols-3 gap-6 sm:gap-8">
            {/* Free */}
            <div className="p-6 sm:p-8 bg-white rounded-2xl border border-slate-200 space-y-6">
              <div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Gratuito</p>
                <p className="text-4xl font-black text-slate-900 mt-2">R$0</p>
                <p className="text-sm text-slate-500">Para sempre</p>
              </div>
              <ul className="space-y-3 text-sm text-slate-600">
                {["Até 2 medicamentos", "Agenda e calendário", "Histórico básico"].map((f, i) => (
                  <li key={i} className="flex items-center gap-2"><CheckCircle2 size={16} className="text-teal-500 shrink-0" /> {f}</li>
                ))}
              </ul>
              <Button variant="outline" className="w-full" onClick={goSignup}>Começar Grátis</Button>
            </div>

            {/* PRO — highlighted */}
            <div className="p-6 sm:p-8 bg-white rounded-2xl border-2 border-teal-500 shadow-xl shadow-teal-100/50 space-y-6 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-teal-500 text-white px-4 py-1 rounded-full text-xs font-bold">
                MAIS POPULAR 🔥
              </div>
              <div>
                <p className="text-sm font-bold text-teal-600 uppercase tracking-wider">PRO</p>
                <p className="text-4xl font-black text-slate-900 mt-2">R$9<span className="text-2xl">,90</span></p>
                <p className="text-sm text-slate-500">/mês</p>
              </div>
              <ul className="space-y-3 text-sm text-slate-600">
                {["Medicamentos ilimitados", "Alertas via WhatsApp", "Controle de estoque", "Identificação por foto (IA)", "Monitoramento familiar"].map((f, i) => (
                  <li key={i} className="flex items-center gap-2"><CheckCircle2 size={16} className="text-teal-500 shrink-0" /> {f}</li>
                ))}
              </ul>
              <Button className="w-full text-base h-12" onClick={goSignup}>Assinar PRO <ArrowRight size={16} /></Button>
            </div>

            {/* Premium */}
            <div className="p-6 sm:p-8 bg-white rounded-2xl border border-slate-200 space-y-6">
              <div>
                <p className="text-sm font-bold text-amber-500 uppercase tracking-wider">Premium</p>
                <p className="text-4xl font-black text-slate-900 mt-2">R$18<span className="text-2xl">,90</span></p>
                <p className="text-sm text-slate-500">/mês</p>
              </div>
              <ul className="space-y-3 text-sm text-slate-600">
                {["Tudo do PRO", "Bula ANVISA oficial", "Relatórios avançados", "Suporte prioritário", "Exames e indicadores"].map((f, i) => (
                  <li key={i} className="flex items-center gap-2"><CheckCircle2 size={16} className="text-amber-500 shrink-0" /> {f}</li>
                ))}
              </ul>
              <Button variant="dark" className="w-full" onClick={goSignup}>Assinar Premium</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="depoimentos" className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl font-black text-center text-slate-900 mb-4">Quem usa, recomenda</h2>
          <p className="text-center text-slate-500 mb-12 sm:mb-16 text-sm sm:text-base">Histórias reais de pessoas que transformaram sua rotina.</p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                name: "Maria S.", role: "Paciente crônica", age: "58 anos",
                text: "Tomo 6 remédios por dia. Antes vivia confusa com os horários. Agora o WhatsApp me avisa e eu só respondo '1'. Nunca mais esqueci!",
                rating: 5,
              },
              {
                name: "Carlos R.", role: "Filho cuidador", age: "34 anos",
                text: "Minha mãe mora sozinha e eu ficava preocupado. Com o monitoramento familiar, sei em tempo real se ela tomou os remédios.",
                rating: 5,
              },
              {
                name: "Ana L.", role: "Mãe de 2", age: "41 anos",
                text: "Controlar os remédios dos meus filhos era um caos. O OnDose organizou tudo e o alerta no WhatsApp é genial!",
                rating: 5,
              },
              {
                name: "Roberto M.", role: "Diabético", age: "62 anos",
                text: "A função de controle de estoque me salvou. Agora sei exatamente quando preciso comprar insulina nova.",
                rating: 5,
              },
              {
                name: "Juliana F.", role: "Hipertensa", age: "45 anos",
                text: "Tirei foto da caixa do remédio e o app identificou tudo automaticamente. Tecnologia de ponta e fácil de usar.",
                rating: 5,
              },
              {
                name: "Pedro H.", role: "Cuidador profissional", age: "29 anos",
                text: "Cuido de 3 idosos. O OnDose me ajuda a gerenciar todos os medicamentos sem confusão. Indispensável!",
                rating: 5,
              },
            ].map((t, i) => (
              <div key={i} className="p-6 sm:p-8 bg-slate-50 rounded-2xl border border-slate-100 hover:shadow-lg transition-all duration-300">
                <div className="flex gap-0.5 text-amber-400 mb-4">
                  {[...Array(t.rating)].map((_, j) => <Star key={j} size={16} fill="currentColor" />)}
                </div>
                <p className="text-slate-600 mb-6 leading-relaxed text-sm">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${t.name}`} alt={t.name} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{t.name}</h4>
                    <p className="text-xs text-slate-500">{t.role} • {t.age}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 sm:py-24 bg-gradient-to-br from-teal-600 to-teal-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-30"></div>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center relative z-10 space-y-6 sm:space-y-8">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight">
            Sua saúde não pode esperar.<br />
            <span className="text-teal-200">Comece agora.</span>
          </h2>
          <p className="text-teal-100 text-base sm:text-lg max-w-xl mx-auto">
            Cadastre-se em menos de 1 minuto e nunca mais esqueça de tomar seus medicamentos.
          </p>
          <Button 
            variant="primary" 
            className="!bg-white !text-teal-800 hover:!bg-teal-50 text-base sm:text-lg px-10 sm:px-12 h-14 sm:h-16 shadow-2xl" 
            onClick={goSignup}
          >
            Criar Minha Conta Grátis <ArrowRight size={20} />
          </Button>
          <p className="text-teal-200 text-xs sm:text-sm">✓ Grátis para sempre (até 2 remédios) • ✓ Sem cartão de crédito • ✓ LGPD compliant</p>
        </div>
      </section>

      {/* Floating CTA Bar (mobile-first) */}
      <div className={`fixed bottom-0 left-0 w-full p-3 z-50 transition-all duration-500 ${isScrolled ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
        <div className="max-w-lg mx-auto bg-white/95 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-2xl p-3 flex items-center justify-between gap-3">
          <div className="hidden sm:block pl-3">
            <p className="text-sm font-bold text-slate-800">Não perca mais uma dose</p>
            <p className="text-xs text-slate-500">Crie sua conta grátis agora</p>
          </div>
          <Button className="flex-1 sm:flex-none text-sm h-11" onClick={goSignup}>
            Começar Grátis <ArrowRight size={16} />
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 pt-16 pb-10 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <div className="flex items-center justify-center mb-6">
            <OnDoseLogo size="sm" />
          </div>
          <p className="text-slate-400 text-sm mb-6">© 2025 OnDose Healthcare. Transformando vidas através da pontualidade.</p>
          <div className="flex justify-center gap-6 text-slate-500 text-xs font-bold uppercase tracking-widest">
            <a href="/terms" className="hover:text-teal-400 transition-colors">Termos</a>
            <a href="/privacy" className="hover:text-teal-400 transition-colors">Privacidade</a>
            <a href="/plans" className="hover:text-teal-400 transition-colors">Planos</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
