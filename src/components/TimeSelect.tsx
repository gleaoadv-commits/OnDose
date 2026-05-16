import { cn } from "../lib/utils";

interface TimeSelectProps {
  value: string; // "HH:MM"
  onChange: (value: string) => void;
  className?: string;
}

export default function TimeSelect({ value, onChange, className }: TimeSelectProps) {
  return (
    <input
      type="time"
      value={value || "08:00"}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "h-13 w-full max-w-[140px] rounded-2xl border border-border/60 bg-background px-3 text-elder-base font-bold text-center outline-none focus:ring-2 focus:ring-primary/30",
        className
      )}
      aria-label="Horário"
    />
  );
}
