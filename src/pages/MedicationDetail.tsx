import { useParams, useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Pill, Pause, Play, Square, Trash2, Clock, Calendar } from "lucide-react";
import { FREQUENCY_LABELS } from "@/types/medication";
import { toast } from "sonner";

export default function MedicationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { medications, pauseMedication, resumeMedication, stopMedication, deleteMedication } = useApp();

  const med = medications.find(m => m.id === id);
  if (!med) {
    return (
      <div className="text-center py-12">
        <p className="text-elder-base text-muted-foreground">Medicamento não encontrado.</p>
        <Button variant="outline" className="mt-4 rounded-xl" onClick={() => navigate("/")}>Voltar</Button>
      </div>
    );
  }

  const statusConfig = {
    ativo: { label: "Ativo", className: "bg-success/15 text-success border-success/20" },
    pausado: { label: "Pausado", className: "bg-warning/15 text-warning border-warning/20" },
    encerrado: { label: "Encerrado", className: "bg-muted text-muted-foreground border-border" },
  };

  const handleDelete = () => {
    deleteMedication(med.id);
    toast.success(`${med.name} removido.`);
    navigate("/");
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <Button variant="ghost" onClick={() => navigate(-1)} className="text-sm font-bold rounded-xl">
        <ArrowLeft className="h-5 w-5 mr-1" /> Voltar
      </Button>

      <Card className="p-6 rounded-2xl border-border/40">
        <div className="flex items-start gap-4">
          <div className="pill-icon p-4" style={{ backgroundColor: med.color + "15", color: med.color }}>
            <Pill className="h-8 w-8" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-elder-2xl font-bold text-foreground">{med.name}</h2>
              <Badge variant="outline" className={statusConfig[med.status].className + " text-xs font-bold"}>
                {statusConfig[med.status].label}
              </Badge>
            </div>
            <p className="text-elder-lg text-muted-foreground mt-1">{med.dosage} — {med.quantity} comprimido(s)</p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-3 text-elder-base bg-muted/50 rounded-2xl p-4">
            <Clock className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="font-bold">{FREQUENCY_LABELS[med.frequency]}</p>
              <p className="text-muted-foreground text-sm">Horários: {med.times.join(" • ")}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-elder-base bg-muted/50 rounded-2xl p-4">
            <Calendar className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="font-bold">Início: {new Date(med.startDate).toLocaleDateString("pt-BR")}</p>
              {med.endDate && <p className="text-muted-foreground text-sm">Término: {new Date(med.endDate).toLocaleDateString("pt-BR")}</p>}
            </div>
          </div>
          {med.notes && (
            <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 text-sm">
              <p className="font-bold text-foreground mb-1">Observações:</p>
              <p className="text-foreground/80">{med.notes}</p>
            </div>
          )}
        </div>
      </Card>

      {med.status !== "encerrado" && (
        <Card className="p-5 space-y-3 rounded-2xl border-border/40">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Ações</h3>
          <div className="flex flex-col gap-2">
            {med.status === "ativo" ? (
              <Button variant="outline" size="lg" className="justify-start text-sm rounded-2xl border-border/60" onClick={() => pauseMedication(med.id)}>
                <Pause className="h-5 w-5 mr-2" /> Pausar Medicamento
              </Button>
            ) : (
              <Button variant="outline" size="lg" className="justify-start text-sm rounded-2xl border-border/60" onClick={() => resumeMedication(med.id)}>
                <Play className="h-5 w-5 mr-2" /> Retomar Medicamento
              </Button>
            )}
            <Button variant="outline" size="lg" className="justify-start text-sm rounded-2xl text-destructive border-destructive/20 hover:bg-destructive/5" onClick={() => stopMedication(med.id)}>
              <Square className="h-5 w-5 mr-2" /> Encerrar Tratamento
            </Button>
          </div>
        </Card>
      )}

      <Button variant="outline" size="lg" className="w-full text-destructive border-destructive/20 hover:bg-destructive/5 rounded-2xl text-sm" onClick={handleDelete}>
        <Trash2 className="h-5 w-5 mr-2" /> Excluir Medicamento
      </Button>
    </div>
  );
}
