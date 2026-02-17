import { useApp } from "@/context/AppContext";
import { Link } from "react-router-dom";
import { Plus, Pill, Pause, Play, Square, Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FREQUENCY_LABELS, Medication } from "@/types/medication";
import TodaySchedule from "@/components/TodaySchedule";

function MedicationCard({ med, index }: { med: Medication; index: number }) {
  const { pauseMedication, resumeMedication, stopMedication } = useApp();

  const statusConfig = {
    ativo: { label: "Ativo", className: "bg-success/15 text-success border-success/20" },
    pausado: { label: "Pausado", className: "bg-warning/15 text-warning border-warning/20" },
    encerrado: { label: "Encerrado", className: "bg-muted text-muted-foreground border-border" },
  };

  const status = statusConfig[med.status];

  return (
    <Card
      className="p-4 card-hover border-border/40 animate-slide-up"
      style={{ animationDelay: `${index * 60}ms`, animationFillMode: "both" }}
    >
      <div className="flex items-start gap-3">
        <div
          className="pill-icon"
          style={{ backgroundColor: med.color + "18", color: med.color }}
        >
          <Pill className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link to={`/medicamento/${med.id}`} className="text-elder-base font-bold text-foreground hover:text-primary transition-colors">
              {med.name}
            </Link>
            <Badge variant="outline" className={status.className + " text-xs font-bold"}>{status.label}</Badge>
          </div>
          <p className="text-elder-sm text-muted-foreground mt-0.5">{med.dosage}</p>
          <div className="flex items-center gap-1.5 mt-1.5 text-sm text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>{FREQUENCY_LABELS[med.frequency]}</span>
            <span className="text-border">•</span>
            <span className="font-semibold text-foreground/70">{med.times.join(", ")}</span>
          </div>
        </div>
      </div>
      {med.status !== "encerrado" && (
        <div className="flex gap-2 mt-3 ml-[60px]">
          {med.status === "ativo" ? (
            <Button variant="outline" size="sm" onClick={() => pauseMedication(med.id)} className="text-sm rounded-xl border-border/60">
              <Pause className="h-3.5 w-3.5 mr-1" /> Pausar
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => resumeMedication(med.id)} className="text-sm rounded-xl border-border/60">
              <Play className="h-3.5 w-3.5 mr-1" /> Retomar
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => stopMedication(med.id)} className="text-sm rounded-xl text-destructive border-destructive/20 hover:bg-destructive/5">
            <Square className="h-3.5 w-3.5 mr-1" /> Encerrar
          </Button>
        </div>
      )}
    </Card>
  );
}

export default function Dashboard() {
  const { medications, canAddMedication } = useApp();
  const activeMeds = medications.filter(m => m.status !== "encerrado");
  const endedMeds = medications.filter(m => m.status === "encerrado");

  return (
    <div className="space-y-8">
      {/* Today's schedule */}
      <TodaySchedule />

      {/* Medications */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-header">
            <Sparkles className="h-5 w-5 text-primary" />
            Meus Medicamentos
          </h2>
          <Link to="/novo-medicamento">
            <Button
              size="lg"
              disabled={!canAddMedication()}
              className="rounded-2xl text-sm font-bold shadow-glow px-5"
            >
              <Plus className="h-4 w-4 mr-1" /> Novo
            </Button>
          </Link>
        </div>

        {!canAddMedication() && (
          <Card className="p-4 mb-4 bg-warning/8 border-warning/20 rounded-2xl">
            <p className="text-elder-sm text-foreground">
              ⚠️ Limite de 3 medicamentos no plano gratuito.{" "}
              <Link to="/planos" className="text-primary font-bold underline underline-offset-2">Fazer upgrade</Link>
            </p>
          </Card>
        )}

        {activeMeds.length === 0 ? (
          <Card className="p-10 text-center rounded-2xl border-dashed border-2 border-border/60">
            <div className="bg-primary/8 rounded-3xl p-5 inline-flex mb-4">
              <Pill className="h-10 w-10 text-primary animate-float" />
            </div>
            <p className="text-elder-base text-muted-foreground font-medium">Nenhum medicamento cadastrado.</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Comece adicionando seu primeiro medicamento</p>
            <Link to="/novo-medicamento">
              <Button className="mt-5 text-sm font-bold rounded-2xl shadow-glow px-6" size="lg">
                <Plus className="h-4 w-4 mr-1.5" /> Cadastrar Medicamento
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-3">
            {activeMeds.map((med, i) => (
              <MedicationCard key={med.id} med={med} index={i} />
            ))}
          </div>
        )}

        {endedMeds.length > 0 && (
          <div className="mt-8">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Encerrados</h3>
            <div className="space-y-2 opacity-50">
              {endedMeds.map((med, i) => (
                <MedicationCard key={med.id} med={med} index={i} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
