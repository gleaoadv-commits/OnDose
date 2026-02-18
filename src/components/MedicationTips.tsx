import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Lightbulb, AlertTriangle, AlertCircle, X } from "lucide-react";

interface Tip {
  type: "info" | "warning" | "danger";
  message: string;
}

interface Props {
  medicationName: string;
  currentMedications: { name: string; dosage: string; times: string[] }[];
  times: string[];
}

export default function MedicationTips({ medicationName, currentMedications, times }: Props) {
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState<number[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastQueryRef = useRef("");

  const fetchTips = useCallback(async (name: string) => {
    if (name.trim().length < 3) {
      setTips([]);
      return;
    }

    setLoading(true);
    setDismissed([]);

    try {
      const { data, error } = await supabase.functions.invoke("medication-tips", {
        body: {
          medicationName: name,
          currentMedications,
          times,
        },
      });

      if (!error && data?.tips) {
        setTips(data.tips);
      } else {
        setTips([]);
      }
    } catch {
      setTips([]);
    } finally {
      setLoading(false);
    }
  }, [currentMedications, times]);

  useEffect(() => {
    const query = `${medicationName}||${times.join(",")}`;
    if (query === lastQueryRef.current) return;
    lastQueryRef.current = query;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchTips(medicationName), 800);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [medicationName, times, fetchTips]);

  const visibleTips = tips.filter((_, i) => !dismissed.includes(i));

  if (!loading && visibleTips.length === 0) return null;

  const iconMap = {
    info: <Lightbulb className="h-4 w-4 shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />,
    danger: <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />,
  };

  const styleMap = {
    info: "bg-primary/8 border-primary/20 text-primary",
    warning: "bg-warning/10 border-warning/25 text-warning",
    danger: "bg-destructive/10 border-destructive/25 text-destructive",
  };

  return (
    <div className="space-y-2">
      {loading && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Analisando dicas para este medicamento…
        </div>
      )}

      {visibleTips.map((tip, i) => (
        <div
          key={i}
          className={`flex items-start gap-2.5 rounded-2xl border px-3.5 py-3 text-sm animate-fade-in ${styleMap[tip.type]}`}
        >
          {iconMap[tip.type]}
          <span className="flex-1 leading-snug">{tip.message}</span>
          <button
            type="button"
            onClick={() => setDismissed(prev => [...prev, i])}
            className="shrink-0 opacity-60 hover:opacity-100 transition-opacity mt-0.5"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}

      {visibleTips.length > 0 && !loading && (
        <p className="text-[10px] text-muted-foreground/50 leading-relaxed px-1">
          ⚠️ As dicas acima são geradas por IA e têm caráter informativo. O OnDose não se responsabiliza por decisões tomadas com base nelas. Consulte sempre um profissional de saúde.
        </p>
      )}
    </div>
  );
}
