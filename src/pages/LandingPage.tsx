import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check,
  Bell,
  ShieldCheck,
  Users,
  Plus,
  ArrowRight,
  Star,
  Smartphone,
  CheckCircle2,
  HeartPulse
} from 'lucide-react';

import OnDoseLogo from '../components/OnDoseLogo';

// --- Reusable UI Components ---

const Button = ({ children, variant = 'primary', className = '', ...props }: any) => {
  const baseStyles = "px-6 py-3 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 transform active:scale-95";
  const variants: any = {
    primary: "bg-[#14B8A6] text-white shadow-lg shadow-teal-200/50 hover:bg-[#0D9488] hover:-translate-y-0.5",
    outline: "border-2 border-[#14B8A6] text-[#14B8A6] hover:bg-teal-50",
    secondary: "bg-teal-50 text-[#0D9488] hover:bg-teal-100"
  };
  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

const FeatureCard = ({ icon: Icon, title, description }: any) => (
  <div className="group p-8 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-teal-500/5 transition-all duration-500 hover:-translate-y-2">
    <div className="w-14 h-14 bg-teal-50 text-[#14B8A6] rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#14B8A6] group-hover:text-white transition-colors duration-500">
      <Icon size={28} />
    </div>
    <h3 className="text-xl font-bold text-slate-800 mb-3">{title}</h3>
    <p className="text-slate-500 leading-relaxed text-sm md:text-base">{description}</p>
  </div>
);

// --- Main Page Section ---

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 100);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900">

      {/* Navbar */}
      <nav className="fixed w-full top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
            <OnDoseLogo size="sm" />
          </div>
          <div className="hidden md:flex gap-8 items-center">
            <a href="#funcionalidades" className="text-slate-500 font-medium hover:text-[#14B8A6] transition-colors">Funcionalidades</a>
            <a href="#depoimentos" className="text-slate-500 font-medium hover:text-[#14B8A6] transition-colors">Depoimentos</a>
            <Button variant="outline" className="py-2 px-6 text-sm" onClick={() => navigate('/auth')}>Entrar</Button>
            <Button className="py-2 px-6 text-sm" onClick={() => navigate('/auth?mode=signup')}>Criar Conta</Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 md:pt-48 md:pb-32 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8 animate-in fade-in slide-in-from-left duration-1000">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 border border-teal-100 text-[#0D9488] rounded-full text-xs font-bold uppercase tracking-wider">
              <Check size={14} /> Grátis para sempre (até 2 remédios)
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 leading-[1.1]">
              Sua saúde em dia, via <span className="text-[#14B8A6]">WhatsApp.</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-500 leading-relaxed max-w-xl">
              Esquecer o remédio? Nunca mais. Com o OnDose, você organiza suas medicações e recebe alertas inteligentes direto no seu WhatsApp. Prático, fácil e gratuito.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button className="text-lg px-10 h-16" onClick={() => navigate('/auth?mode=signup')}>
                Começar Grátis Agora <ArrowRight size={20} />
              </Button>
              <div className="flex items-center gap-3 px-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 overflow-hidden shadow-sm">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 10}`} alt="User" />
                    </div>
                  ))}
                </div>
                <div className="text-sm font-medium text-slate-500">
                  Junte-se aos <span className="text-slate-900 font-bold">primeiros usuários</span> e ganhe acesso vitalício gratuito.
                </div>
              </div>
            </div>
          </div>

          <div className="relative flex justify-center animate-in fade-in slide-in-from-right duration-1000">
            {/* Decorative background circle */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-teal-100/40 rounded-full blur-[100px] -z-10"></div>

            <div className="relative w-full max-w-[320px]">
              <div className="absolute -top-6 -right-6 bg-white p-4 rounded-2xl shadow-xl border border-slate-50 animate-bounce delay-700 z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center text-white">
                    <Bell size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Lembrete</p>
                    <p className="text-sm font-bold text-slate-800">Dose das 10:00</p>
                  </div>
                </div>
              </div>
              <div className="relative rounded-[3rem] overflow-hidden border-[10px] border-white shadow-2xl ring-1 ring-slate-200">
                <img
                  src="/premium-mockup.png"
                  alt="OnDose Interface Premium"
                  className="w-full h-full object-cover"
                />
                {/* Anonimização do nome no mockup - Cobertura total ajustada */}
                <div className="absolute top-[10.4%] left-[11%] right-[15%] h-[2.4%] bg-[#14B8A6] rounded-sm opacity-100"></div>
                <div className="absolute top-[10.5%] left-[13%] px-2.5 py-1.0 text-[8px] font-bold text-white/90">Olá! 👋</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Section */}
      <section id="funcionalidades" className="py-24 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
            <h2 className="text-4xl font-extrabold text-slate-900">Por que escolher o OnDose?</h2>
            <p className="text-slate-500 text-lg">Criamos a ferramenta mais simples e poderosa para garantir que sua saúde nunca seja deixada para depois.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={Bell}
              title="Alertas via WhatsApp"
              description="Esqueça notificações que passam despercebidas. Receba lembretes no lugar onde você já passa o dia todo."
            />
            <FeatureCard
              icon={Users}
              title="Cuide de Quem Você Ama"
              description="Acompanhe a medicação de familiares e seja avisado se alguém esquecer de uma dose importante."
            />
            <FeatureCard
              icon={ShieldCheck}
              title="Dados Protegidos"
              description="Sua saúde é assunto privado. Usamos criptografia de ponta a ponta para proteger seus registros."
            />
          </div>
        </div>
      </section>

      {/* Proof/Persuasion Section */}
      <section className="py-20 bg-teal-900 text-white overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Comece hoje sem gastar nada e monitore seus 2 principais remédios.</h2>
            <ul className="space-y-4">
              {[
                "Sem necessidade de cartão de crédito",
                "Suporte a todos os tipos de dosagem",
                "Histórico completo exportável para seu médico",
                "Backup em nuvem automático"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-teal-100">
                  <CheckCircle2 className="text-teal-400" size={24} /> {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white/10 backdrop-blur-lg p-10 rounded-[2.5rem] border border-white/20 text-center">
            <HeartPulse size={64} className="mx-auto mb-6 text-teal-400" />
            <p className="text-4xl font-black mb-2">98%</p>
            <p className="text-teal-100 text-lg">de adesão ao tratamento entre nossos usuários ativos.</p>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="depoimentos" className="py-24 bg-slate-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-4xl font-extrabold text-slate-900">O que dizem nossos usuários</h2>
            <p className="text-slate-500 text-lg">Veja como o OnDose está mudando a rotina de saúde de milhares de pessoas.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Maria S.",
                role: "Usuária",
                text: "O OnDose me ajudou a manter meus medicamentos sob controle de uma forma que nenhum outro app conseguiu. Acabou a confusão dos frascos!",
                rating: 5,
              },
              {
                name: "Carlos R.",
                role: "Familiar",
                text: "O monitoramento familiar é incrível. Agora eu sei exatamente quando minha mãe toma os remédios e posso respirar aliviado, mesmo de longe.",
                rating: 5,
              },
              {
                name: "Ana L.",
                role: "Mãe",
                text: "Meus medicamentos agora estão sempre em dia. O app é super intuitivo e os alertas são impossíveis de ignorar. Recomendo para todos!",
                rating: 5,
              }
            ].map((t, i) => (
              <div key={i} className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-teal-500/5 transition-all duration-300">
                <div className="flex gap-1 text-amber-400 mb-6">
                  {[...Array(t.rating)].map((_, i) => <Star key={i} size={20} fill="currentColor" />)}
                </div>
                <p className="text-slate-600 mb-8 leading-relaxed">"{t.text}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${t.name}`} alt={t.name} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{t.name}</h4>
                    <p className="text-sm text-slate-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Floating CTA Bar */}
      <div className={`fixed bottom-0 left-0 w-full p-4 z-50 transition-all duration-500 ${isScrolled ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
        <div className="max-w-2xl mx-auto bg-white/90 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="hidden sm:block pl-4">
            <p className="text-sm font-bold text-slate-800 leading-tight">Pronto para começar?</p>
            <p className="text-xs text-slate-500">2 remédios grátis para sempre.</p>
          </div>
          <Button className="flex-1 sm:flex-none" onClick={() => navigate('/auth?mode=signup')}>
            Garantir Acesso Grátis <Smartphone size={18} />
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-50 pt-20 pb-10 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center mb-8">
            <OnDoseLogo size="sm" />
          </div>
          <p className="text-slate-400 text-sm mb-8">© 2024 OnDose Healthcare. Transformando vidas através da pontualidade.</p>
          <div className="flex justify-center gap-6 text-slate-400 text-xs font-bold uppercase tracking-widest">
            <a href="#" className="hover:text-teal-600 transition-colors">Termos</a>
            <a href="#" className="hover:text-teal-600 transition-colors">Privacidade</a>
            <a href="#" className="hover:text-teal-600 transition-colors">Ajuda</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
