import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Ana P.",
    text: "O OnDose mudou minha rotina, não esqueço mais!",
    rating: 5,
  },
  {
    name: "Carlos R.",
    text: "Cuido da medicação da minha mãe à distância. Incrível!",
    rating: 5,
  },
  {
    name: "Maria S.",
    text: "Muito fácil de usar, recomendo para toda a família.",
    rating: 5,
  },
];

export default function LandingTestimonials() {
  return (
    <section className="py-14 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="bg-card rounded-2xl border-2 border-primary/20 p-6 shadow-sm space-y-3"
            >
              <div className="flex gap-0.5">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm text-foreground leading-relaxed font-medium">
                "{t.text}"
              </p>
              <p className="text-sm font-bold text-muted-foreground">— {t.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
