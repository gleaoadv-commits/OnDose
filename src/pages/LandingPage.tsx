import { useNavigate } from "react-router-dom";
import { Shield, Bell, Camera, Users, Pill, MapPin, FileText, ChevronDown, Star, Heart, Clock, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import OnDoseLogo from "@/components/OnDoseLogo";
import OnDoseIcon from "@/components/OnDoseIcon";

const features = [
  {
    icon: Bell,
    title: "Lembretes Inteligentes",
    desc: "Nunca mais esqueça um medicamento. Alertas personalizados para cada horário.",
  },
  {
    icon: Pill,
    title: "Controle de Estoque",
    desc: "Saiba exatamente quando reabastecer. Sem surpresas na hora de tomar.",
  },
  {
    icon: Camera,
    title: "Identificação por Foto",
    desc: "Fotografe o medicamento e a IA identifica nome, dosagem e indicações.",
  },
  {
    icon: Users,
    title: "Rede Familiar",
    desc: "Conecte cuidadores e familiares para acompanhar o tratamento juntos.",
  },
  {
    icon: FileText,
    title: "Relatórios de Adesão",
    desc: "Visualize seu histórico e compartilhe com seu médico em consultas.",
  },
  {
    icon: MapPin,
    title: "Farmácias Próximas",
    desc: "Encontre a farmácia mais perto de você com um toque.",
  },
];

const testimonials = [
  {
    name: "Maria S.",
    age: 67,
    text: "Antes eu esquecia meus remédios toda hora. Com o OnDose, não perco mais nenhum horário!",
    rating: 5,
  },
  {
    name: "Carlos R.",
    age: 45,
    text: "Cuido da medicação da minha mãe à distância. O vínculo familiar é incrível.",
    rating: 5,
  },
  {
    name: "Ana L.",
    age: 34,
    text: "A identificação por foto me ajudou a organizar todos os remédios do meu avô.",
    rating: 5,
  },
];

const stats = [
  { value: "98%", label: "Adesão ao tratamento" },
  { value: "24/7", label: "Lembretes ativos" },
  { value: "100%", label: "Gratuito para começar" },
];

export default function LandingPage() {
  const navigate = useNavigate();

  const goToSignup = () => navigate("/auth");

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <OnDoseLogo size="sm" />
          <Button onClick={goToSignup} size="sm" className="gradient-primary text-primary-foreground font-bold rounded-xl shadow-glow">
            Criar Conta Grátis
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative py-16 md:py-24 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-10 md:gap-16">
          <div className="flex-1 text-center md:text-left space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold">
              <Heart className="w-4 h-4" />
              Sua saúde em dia
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1]">
              Seus medicamentos,{" "}
              <span className="text-primary">sob controle.</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-lg">
              Gerencie remédios, receba lembretes, controle o estoque e cuide de quem você ama — tudo em um só app.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
              <Button onClick={goToSignup} size="lg" className="gradient-primary text-primary-foreground font-bold rounded-xl shadow-glow text-lg px-8 py-6">
                Começar Agora — É Grátis
              </Button>
            </div>
          </div>
          <div className="flex-1 flex justify-center">
            <div className="relative w-72 md:w-80">
              {/* Decorative app preview */}
              <div className="relative bg-card rounded-3xl shadow-elevated border border-border/30 p-6 space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="gradient-primary rounded-xl p-2 shadow-glow">
                    <OnDoseIcon size={28} />
                  </div>
                  <div>
                    <div className="font-bold text-foreground">OnDose</div>
                    <div className="text-xs text-muted-foreground">Sua saúde em dia</div>
                  </div>
                </div>
                <div className="bg-primary/5 rounded-2xl p-4 space-y-3">
                  <div className="text-sm font-semibold text-foreground">Próximos horários</div>
                  {[
                    { name: "Losartana 50mg", time: "08:00", color: "bg-primary" },
                    { name: "Metformina 500mg", time: "12:00", color: "bg-accent" },
                    { name: "Omeprazol 20mg", time: "20:00", color: "bg-primary" },
                  ].map((med) => (
                    <div key={med.name} className="flex items-center gap-3 bg-card rounded-xl p-3 shadow-soft">
                      <div className={`w-3 h-3 rounded-full ${med.color}`} />
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-foreground">{med.name}</div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {med.time}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 bg-primary/10 rounded-xl p-3 text-center">
                    <BarChart3 className="w-5 h-5 text-primary mx-auto mb-1" />
                    <div className="text-xs font-semibold text-foreground">98%</div>
                    <div className="text-[10px] text-muted-foreground">Adesão</div>
                  </div>
                  <div className="flex-1 bg-accent/10 rounded-xl p-3 text-center">
                    <Bell className="w-5 h-5 text-accent mx-auto mb-1" />
                    <div className="text-xs font-semibold text-foreground">3</div>
                    <div className="text-[10px] text-muted-foreground">Hoje</div>
                  </div>
                  <div className="flex-1 bg-primary/10 rounded-xl p-3 text-center">
                    <Pill className="w-5 h-5 text-primary mx-auto mb-1" />
                    <div className="text-xs font-semibold text-foreground">5</div>
                    <div className="text-[10px] text-muted-foreground">Remédios</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 animate-bounce text-muted-foreground">
          <ChevronDown className="w-6 h-6" />
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-primary/5">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-3 gap-6 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="text-3xl md:text-4xl font-black text-primary">{s.value}</div>
              <div className="text-sm text-muted-foreground font-medium mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black text-center mb-4">
            Tudo que você precisa para{" "}
            <span className="text-primary">cuidar da sua saúde</span>
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Funcionalidades pensadas para facilitar o dia a dia de quem toma medicamentos.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="glass-card p-6 card-hover group"
              >
                <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center mb-4 group-hover:shadow-glow transition-shadow">
                  <f.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-primary/5">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black text-center mb-12">
            Quem usa, <span className="text-primary">recomenda</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="glass-card p-6 space-y-4">
                <div className="flex gap-0.5">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-foreground/80 text-sm leading-relaxed italic">"{t.text}"</p>
                <div className="text-sm font-bold">
                  {t.name}, <span className="text-muted-foreground font-normal">{t.age} anos</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl gradient-primary flex items-center justify-center mx-auto shadow-glow">
            <Shield className="w-8 h-8 text-primary-foreground" />
          </div>
          <h2 className="text-3xl font-black">
            Seus dados estão <span className="text-primary">seguros</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Criptografia de ponta a ponta, conformidade com a LGPD e controle total sobre suas informações. Seus dados de saúde são só seus.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <OnDoseLogo size="xl" className="justify-center" />
          <h2 className="text-3xl md:text-4xl font-black">
            Comece a cuidar da sua saúde{" "}
            <span className="text-primary">agora mesmo</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Crie sua conta gratuita em segundos e tenha seus medicamentos sempre sob controle.
          </p>
          <Button
            onClick={goToSignup}
            size="lg"
            className="gradient-primary text-primary-foreground font-bold rounded-xl shadow-glow text-lg px-10 py-7"
          >
            Criar Minha Conta Grátis
          </Button>
          <p className="text-xs text-muted-foreground">
            Sem cartão de crédito • Cancele quando quiser
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <OnDoseLogo size="sm" />
          <div className="flex gap-4">
            <a href="/termos" className="hover:text-foreground transition-colors">Termos de Uso</a>
            <a href="/privacidade" className="hover:text-foreground transition-colors">Privacidade</a>
          </div>
          <span>© {new Date().getFullYear()} OnDose</span>
        </div>
      </footer>
    </div>
  );
}