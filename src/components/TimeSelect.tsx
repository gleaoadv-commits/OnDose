import { cn } from "../lib/utils";

interface TimeSelectProps {
  value: string; // "HH:MM"
  onChange: (value: string) => void;
  className?: string;
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

export default function TimeSelect({ value, onChange, className }: TimeSelectProps) {
  const [h = "08", m = "00"] = (value || "08:00").split(":");

  // Make sure current minute is shown even if not multiple of 5
  const minuteOptions = MINUTES.includes(m) ? MINUTES : [...MINUTES, m].sort();

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-1 h-13 rounded-2xl border border-border/60 bg-background px-2",
        className
      )}
    >
      <select
        value={h}
        onChange={(e) => onChange(`${e.target.value}:${m}`)}
        className="appearance-none bg-transparent text-elder-base font-bold text-center outline-none cursor-pointer pr-1"
        aria-label="Hora"
      >
        {HOURS.map((hh) => (
          <option key={hh} value={hh}>{hh}</option>
        ))}
      </select>
      <span className="text-elder-base font-bold text-foreground">:</span>
      <select
        value={m}
        onChange={(e) => onChange(`${h}:${e.target.value}`)}
        className="appearance-none bg-transparent text-elder-base font-bold text-center outline-none cursor-pointer pl-1"
        aria-label="Minuto"
      >
        {minuteOptions.map((mm) => (
          <option key={mm} value={mm}>{mm}</option>
        ))}
      </select>
    </div>
  );
}
