import { Bell, Users, FileBarChart } from "lucide-react";

const features = [
  {
    icon: Bell,
    title: "Lembretes Inteligentes",
    desc: "Nunca perca uma dose. Horários precisos e alertas personalizados.",
    bg: "bg-primary",
  },
  {
    icon: Users,
    title: "Rede Familiar",
    desc: "Compartilhe o progresso e receba apoio de quem você ama.",
    bg: "bg-sky-500",
  },
  {
    icon: FileBarChart,
    title: "Relatórios de Adesão",
    desc: "Visualize seu histórico e leve para suas consultas.",
    bg: "bg-amber-500",
  },
];

export default function LandingFeatures() {
  return (
    <section className="py-14 px-4">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-black text-center mb-10 text-foreground">
          Tudo para sua Tranquilidade
        </h2>
        <div className="grid sm:grid-cols-3 gap-5">
          {features.map((f) => (
            <div
              key={f.title}
              className={`${f.bg} rounded-2xl p-6 text-white shadow-md text-center space-y-3`}
            >
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto">
                <f.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-lg">{f.title}</h3>
              <p className="text-sm text-white/90 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
