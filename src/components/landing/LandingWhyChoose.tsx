import { CircleCheckBig } from "lucide-react";

const reasons = [
  "Sem cartão de crédito",
  "2 medicamentos grátis para sempre",
  "Dados criptografados",
];

export default function LandingWhyChoose() {
  return (
    <section className="py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-8">
          Por que escolher OnDose?
        </h2>
        <ul className="space-y-4">
          {reasons.map((r) => (
            <li key={r} className="flex items-center gap-3">
              <CircleCheckBig className="w-6 h-6 text-[#14B8A6] flex-shrink-0" />
              <span className="text-slate-700 font-medium">{r}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
