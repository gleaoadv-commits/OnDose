import { ClipboardCheck, BellRing, HeartHandshake } from "lucide-react";

const steps = [
  {
    num: 1,
    icon: ClipboardCheck,
    title: "Cadastre:",
    desc: "Insira seus medicamentos e horários.",
    color: "text-primary",
    bg: "bg-primary/10",
    numBg: "bg-primary",
  },
  {
    num: 2,
    icon: BellRing,
    title: "Receba Alertas:",
    desc: "O OnDose te lembra na hora certa.",
    color: "text-amber-500",
    bg: "bg-amber-50",
    numBg: "bg-amber-500",
  },
  {
    num: 3,
    icon: HeartHandshake,
    title: "Viva Melhor:",
    desc: "Cuide da sua saúde com menos estresse.",
    color: "text-primary",
    bg: "bg-primary/10",
    numBg: "bg-primary",
  },
];

export default function LandingHowItWorks() {
  return (
    <section className="py-14 px-4 bg-muted/30">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-black text-center mb-10 text-foreground">
          Como Funciona
        </h2>

        {/* Timeline circles */}
        <div className="relative flex justify-center mb-8">
          <div className="flex items-center w-full max-w-xs">
            {steps.map((s, i) => (
              <div key={s.num} className="flex items-center flex-1">
                <div className={`w-9 h-9 rounded-full ${s.numBg} text-white flex items-center justify-center font-black text-sm shrink-0 z-10 ring-4 ring-background`}>
                  {s.num}
                </div>
                {i < steps.length - 1 && (
                  <div className="flex-1 h-0.5 bg-primary/30" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step cards */}
        <div className="grid grid-cols-3 gap-4 text-center">
          {steps.map((s) => (
            <div key={s.num} className="space-y-2">
              <div className={`w-12 h-12 rounded-xl ${s.bg} flex items-center justify-center mx-auto`}>
                <s.icon className={`w-6 h-6 ${s.color}`} />
              </div>
              <h3 className="font-bold text-sm text-foreground">{s.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
