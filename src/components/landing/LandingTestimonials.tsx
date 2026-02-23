import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const testimonials = [
  {
    name: "Maria S.",
    text: "OnDose me ajudou a manter meus medicamentos sob controle de uma forma incrível. Nunca mais esqueci uma dose!",
    avatar: 1,
  },
  {
    name: "Carlos R.",
    text: "O monitoramento familiar é sensacional. Agora acompanho os remédios da minha mãe mesmo de longe.",
    avatar: 2,
  },
  {
    name: "Ana L.",
    text: "Meus medicamentos sempre em dia. O app é super intuitivo e os alertas são impossíveis de ignorar.",
    avatar: 3,
  },
  {
    name: "Ana P.",
    text: "Melhor app de medicamentos que já usei. Simples, bonito e funcional. Recomendo para toda família.",
    avatar: 4,
  },
];

export default function LandingTestimonials() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = 280;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  return (
    <section className="py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900">
            Wall of Love
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => scroll('left')}
              className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors"
              aria-label="Próximo"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none' }}
        >
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="min-w-[240px] max-w-[260px] flex-shrink-0 snap-start p-6 rounded-2xl border border-slate-200/60 bg-white"
            >
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#14B8A6]/20 mb-4">
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${t.avatar}&backgroundColor=d1e9e9`}
                  alt={t.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-sm text-slate-600 leading-relaxed italic mb-4">
                "{t.text}"
              </p>
              <p className="text-sm font-bold text-slate-900">— {t.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
