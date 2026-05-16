import { useEffect, useRef } from "react";
import { cn } from "../lib/utils";

interface TimeSelectProps {
  value: string; // "HH:MM"
  onChange: (value: string) => void;
  className?: string;
}

const ITEM_HEIGHT = 40; // px per item
const VISIBLE = 5; // visible rows (must be odd)
const PAD = Math.floor(VISIBLE / 2);

function Wheel({
  items,
  value,
  onChange,
  ariaLabel,
}: {
  items: string[];
  value: string;
  onChange: (v: string) => void;
  ariaLabel: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<number | null>(null);
  const programmatic = useRef(false);

  // Scroll to current value when mounted / value changes externally
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const idx = items.indexOf(value);
    if (idx < 0) return;
    programmatic.current = true;
    el.scrollTo({ top: idx * ITEM_HEIGHT, behavior: "auto" });
    // release flag next tick
    setTimeout(() => { programmatic.current = false; }, 50);
  }, [value, items]);

  const handleScroll = () => {
    const el = ref.current;
    if (!el || programmatic.current) return;
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      const idx = Math.round(el.scrollTop / ITEM_HEIGHT);
      const clamped = Math.max(0, Math.min(items.length - 1, idx));
      // snap precisely
      programmatic.current = true;
      el.scrollTo({ top: clamped * ITEM_HEIGHT, behavior: "smooth" });
      setTimeout(() => { programmatic.current = false; }, 120);
      const next = items[clamped];
      if (next !== value) onChange(next);
    }, 110);
  };

  return (
    <div className="relative" style={{ height: ITEM_HEIGHT * VISIBLE }}>
      {/* Selection band */}
      <div
        className="pointer-events-none absolute inset-x-0 rounded-xl bg-primary/10 border-y border-primary/20"
        style={{ top: PAD * ITEM_HEIGHT, height: ITEM_HEIGHT }}
      />
      <div
        ref={ref}
        onScroll={handleScroll}
        className="h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar"
        aria-label={ariaLabel}
        style={{ scrollbarWidth: "none" }}
      >
        <div style={{ height: PAD * ITEM_HEIGHT }} />
        {items.map((it) => (
          <div
            key={it}
            className={cn(
              "snap-center flex items-center justify-center text-elder-base font-bold tabular-nums transition-colors",
              it === value ? "text-foreground" : "text-muted-foreground/60"
            )}
            style={{ height: ITEM_HEIGHT }}
            onClick={() => onChange(it)}
          >
            {it}
          </div>
        ))}
        <div style={{ height: PAD * ITEM_HEIGHT }} />
      </div>
    </div>
  );
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

export default function TimeSelect({ value, onChange, className }: TimeSelectProps) {
  const [h = "08", m = "00"] = (value || "08:00").split(":");

  return (
    <div
      className={cn(
        "relative rounded-2xl border border-border/60 bg-background px-3 py-2 w-full max-w-[200px] mx-auto",
        className
      )}
    >
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1">
        <Wheel items={HOURS} value={h} onChange={(nh) => onChange(`${nh}:${m}`)} ariaLabel="Hora" />
        <span className="text-elder-lg font-bold text-foreground px-1">:</span>
        <Wheel items={MINUTES} value={m} onChange={(nm) => onChange(`${h}:${nm}`)} ariaLabel="Minuto" />
      </div>
    </div>
  );
}
