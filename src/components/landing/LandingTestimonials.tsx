import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Ana P.",
    text: "O OnDose mudou minha rotina, não esqueço mais!",
    rating: 5,
  },
  {
    name: "Ana P.",
    text: "O OnDose mudou minha rotina, não esqueço mais!",
    rating: 5,
  },
];

export default function LandingTestimonials() {
  return (
    <section className="py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 gap-4">
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className="bg-card rounded-2xl border-2 border-primary/30 p-5 space-y-2"
            >
              <div className="flex gap-0.5">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-xs sm:text-sm text-foreground leading-relaxed font-medium">
                "{t.text}"
              </p>
              <p className="text-xs font-bold text-foreground">— {t.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
