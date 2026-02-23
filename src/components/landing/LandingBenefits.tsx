import { Bell, CalendarCheck, Users, CircleCheckBig, Clock } from "lucide-react";

const benefits = [
  {
    icon: Bell,
    title: "Lembretes Inteligentes",
    description: "Alarmes personalizados que garantem que você tome cada dose no horário certo.",
  },
  {
    icon: CalendarCheck,
    title: "Controle de Estoque",
    description: "Monitore a quantidade de medicamentos e saiba quando é hora de comprar mais.",
  },
  {
    icon: Users,
    title: "Rede Familiar",
    description: "Gerencie a saúde de quem você ama e acompanhe a adesão em tempo real.",
  },
  {
    icon: CircleCheckBig,
    title: "98% Adesão",
    description: "Taxa de adesão ao tratamento entre nossos usuários ativos.",
  },
  {
    icon: Clock,
    title: "24/7 Ativo",
    description: "Lembretes funcionando 24 horas por dia, 7 dias por semana, sem parar.",
  },
];

export default function LandingBenefits() {
  return (
    <section className="py-20 px-6 bg-slate-50/50">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-12 text-center md:text-left">
          Smart Benefits
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {benefits.map((b) => (
            <div
              key={b.title}
              className="p-6 rounded-2xl border border-slate-200/60 bg-white/70 backdrop-blur-sm hover:shadow-lg hover:shadow-teal-500/5 transition-all duration-300 hover:-translate-y-1 group"
            >
              <div className="w-12 h-12 rounded-full bg-[#14B8A6]/10 flex items-center justify-center mb-4 group-hover:bg-[#14B8A6]/20 transition-colors">
                <b.icon className="w-6 h-6 text-[#14B8A6]" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm md:text-base mb-1.5">{b.title}</h3>
              <p className="text-xs md:text-sm text-slate-500 leading-relaxed">{b.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
