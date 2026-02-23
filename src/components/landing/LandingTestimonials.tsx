import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Maria S.",
    role: "Usuária",
    text: "O OnDose me ajudou a manter meus medicamentos sob controle de uma forma que nenhum outro app conseguiu.",
    rating: 5,
  },
  {
    name: "Carlos R.",
    role: "Familiar",
    text: "O monitoramento familiar é incrível. Agora eu sei exatamente quando minha mãe toma os remédios.",
    rating: 5,
  },
  {
    name: "Ana L.",
    role: "Mãe",
    text: "Meus medicamentos agora estão sempre em dia. O app é super intuitivo e essencial para quem cuida da saúde.",
    rating: 5,
  },
];

export default function LandingTestimonials() {
  return (
    <section className="py-20 px-6 relative overflow-hidden bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div className="space-y-3">
            <h2 className="text-3xl md:text-4xl font-black text-foreground">
              O que nossos usuários dizem
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl">
              Milhares de pessoas já confiam no OnDose para cuidar da sua saúde e de quem amam.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="bg-card rounded-3xl border border-border/50 p-8 shadow-sm hover:shadow-md transition-all duration-300 relative group"
            >
              <Quote className="absolute top-6 right-8 w-10 h-10 text-primary/10 group-hover:text-primary/20 transition-colors" />
              <div className="flex gap-1 mb-6">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-lg text-foreground leading-relaxed italic mb-8 relative z-10">
                "{t.text}"
              </p>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full border-2 border-primary/20 overflow-hidden shadow-sm">
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${t.name}&backgroundColor=d1e9e9`}
                    alt={t.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="font-bold text-foreground text-lg">{t.name}</p>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

