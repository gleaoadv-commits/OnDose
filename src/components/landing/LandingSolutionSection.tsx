import { Bell, Package, Users } from "lucide-react";

const solutions = [
  {
    icon: Bell,
    title: "Lembretes Inteligentes",
    desc: "Alertas personalizados para cada horário, sem nunca esquecer um medicamento.",
  },
  {
    icon: Package,
    title: "Controle de Estoque",
    desc: "Saiba exatamente quando reabastecer. Sem surpresas.",
  },
  {
    icon: Users,
    title: "Rede Familiar",
    desc: "Conecte cuidadores e familiares para acompanhar o tratamento juntos.",
  },
];

export default function LandingSolutionSection() {
  return (
    <section className="py-16 px-4 bg-primary/[0.03]">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-black mb-10">A Solução</h2>
        <div className="grid sm:grid-cols-3 gap-5">
          {solutions.map((s) => (
            <div key={s.title} className="bg-card rounded-2xl border border-border/30 p-6 shadow-sm text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <s.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-bold text-base">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
