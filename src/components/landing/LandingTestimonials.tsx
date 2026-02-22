import { useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

const testimonials = [
  {
    name: "Maria S.",
    text: "Antes eu esquecia meus remédios toda hora. Com o OnDose, não perco mais nenhum horário!",
    rating: 5,
  },
  {
    name: "Carlos R.",
    text: "Cuido da medicação da minha mãe à distância. O vínculo familiar é incrível.",
    rating: 5,
  },
  {
    name: "Ana L.",
    text: "A identificação por foto me ajudou a organizar todos os remédios do meu avô.",
    rating: 5,
  },
];

export default function LandingTestimonials() {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(testimonials.length / 3);

  return (
    <section className="py-16 px-4 bg-primary/[0.03]">
      <div className="max-w-5xl mx-auto">
        <div className="relative">
          {/* Arrows */}
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="absolute -left-4 md:-left-10 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-card border border-border/40 flex items-center justify-center text-muted-foreground hover:text-foreground shadow-sm z-10"
            aria-label="Anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            className="absolute -right-4 md:-right-10 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-card border border-border/40 flex items-center justify-center text-muted-foreground hover:text-foreground shadow-sm z-10"
            aria-label="Próximo"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div className="grid sm:grid-cols-3 gap-5">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-card rounded-2xl border border-border/30 p-6 shadow-sm space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-sm">
                    {t.name.charAt(0)}
                  </div>
                  <span className="font-bold text-sm">{t.name}</span>
                </div>
                <div className="flex gap-0.5">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed italic">"{t.text}"</p>
              </div>
            ))}
          </div>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${i === 0 ? "bg-primary" : "bg-border"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
