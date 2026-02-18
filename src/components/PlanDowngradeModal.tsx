import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Medication } from "@/types/medication";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Pill, AlertTriangle, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface PlanDowngradeModalProps {
  open: boolean;
  activeMeds: Medication[];
  /** How many the free plan allows */
  freeLimit: number;
}

export default function PlanDowngradeModal({ open, activeMeds, freeLimit }: PlanDowngradeModalProps) {
  const { updateMedication } = useApp();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const excess = activeMeds.length - freeLimit;
  const needMore = selected.size < excess;

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleConfirm = async () => {
    if (needMore) return;
    setSaving(true);
    for (const id of selected) {
      await updateMedication(id, { status: "inativo_plano" });
    }
    setSaving(false);
  };

  return (
    <Dialog open={open}>
      <DialogContent
        className="rounded-2xl max-w-md mx-auto"
        // Prevent closing by clicking outside or ESC — user must choose
        onPointerDownOutside={e => e.preventDefault()}
        onEscapeKeyDown={e => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="bg-destructive/10 rounded-xl p-2.5">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <DialogTitle className="text-elder-base">Limite do plano gratuito</DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
            O plano gratuito permite apenas <strong>{freeLimit} medicamentos ativos</strong>. Você tem{" "}
            <strong>{activeMeds.length}</strong>. Selecione{" "}
            <strong>{excess}</strong> medicamento(s) para <strong>inabilitar temporariamente</strong> ou{" "}
            reative sua assinatura.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 my-2 max-h-64 overflow-y-auto pr-1">
          {activeMeds.map(med => {
            const isSelected = selected.has(med.id);
            return (
              <button
                key={med.id}
                onClick={() => toggle(med.id)}
                className={cn(
                  "w-full text-left rounded-xl border-2 p-3 transition-all flex items-center gap-3",
                  isSelected
                    ? "border-destructive bg-destructive/5"
                    : "border-border hover:border-border/80 bg-card"
                )}
              >
                <div
                  className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: med.color + "20", color: med.color }}
                >
                  <Pill className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{med.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{med.dosage} · {med.times.join(", ")}</p>
                </div>
                <div className={cn(
                  "h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                  isSelected ? "border-destructive bg-destructive" : "border-border"
                )}>
                  {isSelected && <Check className="h-3 w-3 text-white stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-2 mt-2">
          <Button
            onClick={handleConfirm}
            disabled={needMore || saving}
            variant="destructive"
            className="w-full rounded-xl font-bold"
          >
            {saving
              ? "Salvando..."
              : needMore
              ? `Selecione mais ${excess - selected.size}`
              : "Confirmar e inabilitar"}
          </Button>
          <Link to="/planos" className="w-full">
            <Button variant="outline" className="w-full rounded-xl font-bold gap-2 border-pro/40 text-pro hover:bg-pro/5">
              <Crown className="h-4 w-4" />
              Reativar plano PRO
            </Button>
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
