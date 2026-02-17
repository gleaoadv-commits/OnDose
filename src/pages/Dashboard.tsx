import { useApp } from "@/context/AppContext";
import { Link } from "react-router-dom";
import { Plus, Pill, Pause, Play, Square, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FREQUENCY_LABELS, Medication } from "@/types/medication";
import TodaySchedule from "@/components/TodaySchedule";

function MedicationCard({ med }: { med: Medication }) {
  const { pauseMedication, resumeMedication, stopMedication } = useApp();

  const statusConfig = {
    ativo: { label: "Ativo", className: "bg-success text-success-foreground" },
    pausado: { label: "Pausado", className: "bg-warning text-warning-foreground" },
    encerrado: { label: "Encerrado", className: "bg-muted text-muted-foreground" },
  };

  const status = statusConfig[med.status];

  return (
    <Card className="p-4 animate-slide-up shadow-card border-border/50 hover:shadow-elevated transition-shadow duration-300">
      <div className="flex items-start gap-3">
        <div
          className="rounded-xl p-3 shrink-0"
          style={{ backgroundColor: med.color + "22", color: med.color }}
        >
          <Pill className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link to={`/medicamento/${med.id}`} className="text-elder-base font-bold text-foreground hover:text-primary transition-colors">
              {med.name}
            </Link>
            <Badge className={status.className}>{status.label}</Badge>
          </div>
          <p className="text-elder-sm text-muted-foreground mt-1">{med.dosage}</p>
          <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{FREQUENCY_LABELS[med.frequency]}</span>
            <span className="mx-1">•</span>
            <span>{med.times.join(", ")}</span>
          </div>
        </div>
      </div>
      {med.status !== "encerrado" && (
        <div className="flex gap-2 mt-3 ml-14">
          {med.status === "ativo" ? (
            <Button variant="outline" size="sm" onClick={() => pauseMedication(med.id)} className="text-elder-sm">
              <Pause className="h-4 w-4 mr-1" /> Pausar
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => resumeMedication(med.id)} className="text-elder-sm">
              <Play className="h-4 w-4 mr-1" /> Retomar
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => stopMedication(med.id)} className="text-elder-sm text-destructive border-destructive/30 hover:bg-destructive/10">
            <Square className="h-4 w-4 mr-1" /> Encerrar
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
    <div className="space-y-6">
      {/* Today's schedule */}
      <TodaySchedule />

      {/* Medications */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-elder-xl font-bold text-foreground">Meus Medicamentos</h2>
          <Link to="/novo-medicamento">
            <Button
              size="lg"
              disabled={!canAddMedication()}
              className="rounded-xl text-elder-sm font-bold"
            >
              <Plus className="h-5 w-5 mr-1" /> Adicionar
            </Button>
          </Link>
        </div>

        {!canAddMedication() && (
          <Card className="p-3 mb-3 bg-warning/10 border-warning/30">
            <p className="text-elder-sm text-foreground">
              ⚠️ Limite de 3 medicamentos atingido no plano gratuito.{" "}
              <Link to="/planos" className="text-primary font-bold underline">Upgrade para PRO</Link>
            </p>
          </Card>
        )}

        {activeMeds.length === 0 ? (
          <Card className="p-8 text-center">
            <Pill className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-elder-base text-muted-foreground">Nenhum medicamento cadastrado ainda.</p>
            <Link to="/novo-medicamento">
              <Button className="mt-4 text-elder-sm font-bold rounded-xl" size="lg">
                <Plus className="h-5 w-5 mr-1" /> Cadastrar Medicamento
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-3">
            {activeMeds.map(med => (
              <MedicationCard key={med.id} med={med} />
            ))}
          </div>
        )}

        {endedMeds.length > 0 && (
          <div className="mt-6">
            <h3 className="text-elder-base font-bold text-muted-foreground mb-2">Encerrados</h3>
            <div className="space-y-2 opacity-60">
              {endedMeds.map(med => (
                <MedicationCard key={med.id} med={med} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
