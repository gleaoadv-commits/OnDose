import { Shield, Bell } from "lucide-react";

const stats = [
  { icon: Shield, value: "98%", label: "Adesão ao tratamento" },
  { icon: Bell, value: "24/7", label: "Lembretes ativos" },
];

export default function LandingStats() {
  return (
    <section className="py-14 px-4">
      <div className="max-w-3xl mx-auto flex justify-center gap-16 flex-wrap">
        {stats.map((s) => (
          <div key={s.label} className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <s.icon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-black text-foreground">{s.value}</div>
              <div className="text-sm text-muted-foreground font-medium">{s.label}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
