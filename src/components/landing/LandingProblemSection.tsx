import { Clock, LayoutGrid, Package } from "lucide-react";

const problems = [
  {
    icon: Clock,
    title: "Esquecer de tomar",
    desc: "Esquecimentos frequentes podem comprometer todo o seu tratamento.",
  },
  {
    icon: LayoutGrid,
    title: "Confusão com horários",
    desc: "Gerenciar múltiplos remédios e horários se torna confuso rapidamente.",
  },
  {
    icon: Package,
    title: "Estoque vazio",
    desc: "Ficar sem medicamentos na hora de tomar é um risco evitável.",
  },
];

export default function LandingProblemSection() {
  return (
    <section className="py-14 px-4">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-black mb-10">O Problema</h2>
        <div className="grid sm:grid-cols-3 gap-5">
          {problems.map((p) => (
            <div key={p.title} className="bg-card rounded-2xl border border-border/30 p-6 shadow-sm text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <p.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-bold text-base">{p.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
