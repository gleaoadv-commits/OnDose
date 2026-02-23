import { AlarmClock, CalendarDays, Pill, BellRing, PackageCheck, Users } from "lucide-react";

export default function LandingFeatures() {
  return (
    <>
      {/* Problem Section */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-4xl font-black text-foreground">O Problema</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            A rotina de cuidar da saúde pode ser estressante sem o controle correto.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <Card
            icon={AlarmClock}
            title="Esquecer de tomar"
            description="Esquecer de tomar / alarme de tomar um medicamento."
            iconColor="text-emerald-600"
            iconBg="bg-emerald-50"
          />
          <Card
            icon={CalendarDays}
            title="Confusão com horários"
            description="Gerencie remédios, facilidade e controle total com horários."
            iconColor="text-teal-600"
            iconBg="bg-teal-50"
          />
          <Card
            icon={Pill}
            title="Estoque vazio"
            description="Evite ficar sem medicamentos com nosso controle de estoque inteligente."
            iconColor="text-cyan-600"
            iconBg="bg-cyan-50"
          />
        </div>
      </section>

      {/* Solution Section */}
      <section className="bg-[#e9f5f5] py-28 border-y border-teal-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-4xl font-black text-foreground">A Solução</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
              Tecnologia inteligente para que você nunca mais se preocupe com sua medicação.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card
              highlight
              icon={BellRing}
              title="Lembretes Inteligentes"
              description="Receba avisos persistentes que garantem a dose certa no momento exato."
            />
            <Card
              highlight
              icon={PackageCheck}
              title="Controle de Estoque"
              description="Nós monitoramos suas doses e avisamos quando for a hora de comprar mais."
            />
            <Card
              highlight
              icon={Users}
              title="Rede Familiar"
              description="Gerencie quem você ama, cuidando da saúde de sua família em tempo real."
            />
          </div>
        </div>
      </section>
    </>
  );
}

const Card = ({ icon: Icon, title, description, highlight = false, iconColor, iconBg }: any) => (
  <div className={`p-8 rounded-[2.5rem] border transition-all duration-300 group hover:-translate-y-1 ${highlight
    ? 'bg-gradient-to-br from-primary/10 via-primary/[0.05] to-transparent border-primary/20 shadow-glow'
    : 'bg-background border-border shadow-soft hover:shadow-card'
    }`}>
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${highlight
      ? 'bg-primary text-primary-foreground shadow-glow'
      : `${iconBg || 'bg-muted'} ${iconColor || 'text-primary'}`
      }`}>
      <Icon size={28} />
    </div>
    <h3 className="text-xl font-bold text-foreground mb-3">{title}</h3>
    <p className="text-base text-muted-foreground leading-relaxed">{description}</p>
  </div>
);
