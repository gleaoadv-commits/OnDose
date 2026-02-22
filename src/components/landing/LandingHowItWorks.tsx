import { ClipboardCheck, BellRing, HeartHandshake } from "lucide-react";

const steps = [
  {
    num: 1,
    icon: ClipboardCheck,
    title: "Cadastre:",
    desc: "Insira seus medicamentos e horários.",
  },
  {
    num: 2,
    icon: BellRing,
    title: "Receba Alertas:",
    desc: "O OnDose te lembra na hora certa.",
  },
  {
    num: 3,
    icon: HeartHandshake,
    title: "Viva Melhor:",
    desc: "Cuide da sua saúde com menos estresse.",
  },
];

export default function LandingHowItWorks() {
  return (
    <section className="py-14 px-4 bg-muted/40">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-black text-center mb-10 text-foreground">
          Como Funciona
        </h2>

        {/* Timeline connector */}
        <div className="relative flex justify-center mb-8">
          <div className="flex items-center gap-0 w-full max-w-sm">
            {steps.map((s, i) => (
              <div key={s.num} className="flex items-center flex-1">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-black text-sm shrink-0 z-10">
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
        <div className="grid sm:grid-cols-3 gap-6 text-center">
          {steps.map((s) => (
            <div key={s.num} className="space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <s.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-bold text-base text-foreground">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
