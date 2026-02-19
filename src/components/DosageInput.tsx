import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const MG_OPTIONS = ["0,5mg", "1mg", "5mg", "10mg", "15mg", "20mg", "25mg", "50mg", "75mg", "100mg", "150mg", "200mg", "500mg", "750mg", "1000mg"];

interface DosageInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  className?: string;
  inputClassName?: string;
  compact?: boolean;
}

export default function DosageInput({
  value,
  onChange,
  label = "Dosagem *",
  required = true,
  className,
  inputClassName,
  compact = false,
}: DosageInputProps) {
  const [unit, setUnit] = useState<"mg" | "outro">(() => {
    // Detect if current value is an mg value
    if (!value) return "mg";
    if (/^\d+\s*mg$/i.test(value.trim())) return "mg";
    return "outro";
  });

  const isMg = unit === "mg";

  return (
    <div className={className}>
      <Label className={compact ? "text-xs font-semibold" : "text-sm font-bold"}>{label}</Label>

      {/* Unit toggle */}
      <div className="flex gap-1.5 mt-1.5 mb-2">
        <button
          type="button"
          onClick={() => { setUnit("mg"); onChange(""); }}
          className={cn(
            "px-3 py-1 rounded-full text-xs font-bold transition-colors border",
            isMg
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-muted text-muted-foreground border-border/60 hover:bg-accent"
          )}
        >
          mg
        </button>
        <button
          type="button"
          onClick={() => { setUnit("outro"); onChange(""); }}
          className={cn(
            "px-3 py-1 rounded-full text-xs font-bold transition-colors border",
            !isMg
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-muted text-muted-foreground border-border/60 hover:bg-accent"
          )}
        >
          Outro
        </button>
      </div>

      {isMg ? (
        <div className="flex flex-wrap gap-1.5">
          {MG_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-colors border",
                value === opt
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-card text-foreground border-border/60 hover:bg-accent"
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      ) : (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Ex: 5ml, 2 gotas, 1 colher"
          className={cn(
            compact
              ? "rounded-xl text-sm h-10"
              : "text-elder-base h-13 rounded-2xl border-border/60",
            inputClassName
          )}
          required={required}
        />
      )}
    </div>
  );
}
