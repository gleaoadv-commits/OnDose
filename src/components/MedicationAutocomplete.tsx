import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface MedicationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function MedicationAutocomplete({
  value,
  onChange,
  placeholder = "Ex: Losartana",
  className = "",
}: MedicationAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("suggest-medication", {
        body: { query },
      });
      if (!error && data?.suggestions?.length > 0) {
        setSuggestions(data.suggestions);
        setOpen(true);
      } else {
        setSuggestions([]);
        setOpen(false);
      }
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 500);
  };

  const handleSelect = (suggestion: string) => {
    onChange(suggestion);
    setSuggestions([]);
    setOpen(false);
  };

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          value={value}
          onChange={handleChange}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className={className}
          autoComplete="off"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-background border border-border/60 rounded-2xl shadow-lg overflow-hidden animate-fade-in">
          <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border/40">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Sugestões IA</span>
          </div>
          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              onMouseDown={() => handleSelect(s)}
              className="w-full text-left px-4 py-3 text-sm font-medium text-foreground hover:bg-primary/5 hover:text-primary transition-colors border-b border-border/20 last:border-0"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
