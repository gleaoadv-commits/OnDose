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
    <section className="py-24 px-6 bg-muted/30">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-black text-center mb-16 text-foreground">
          Como Funciona
        </h2>

        {/* Steps with integrated timeline */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 max-w-sm sm:max-w-none mx-auto relative">
          {steps.map((s, i) => (
            <div key={s.num} className="flex flex-col items-center text-center group">
              {/* Number + connector */}
              <div className="relative flex items-center justify-center w-full mb-8">
                {i > 0 && (
                  <div className="absolute right-1/2 w-full h-0.5 bg-primary/20 hidden sm:block" />
                )}
                {i < steps.length - 1 && (
                  <div className="absolute left-1/2 w-full h-0.5 bg-primary/20 hidden sm:block" />
                )}
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-black text-lg shadow-glow z-10 group-hover:scale-110 transition-transform">
                  {s.num}
                </div>
              </div>
              {/* Icon + text */}
              <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
                <s.icon className="w-10 h-10 text-primary" />
              </div>
              <h3 className="font-bold text-xl text-foreground mb-3">{s.title}</h3>
              <p className="text-muted-foreground leading-relaxed italic">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
