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
        <Button variant="outline" className="mt-4" onClick={() => navigate("/")}>Voltar</Button>
      </div>
    );
  }

  const statusConfig = {
    ativo: { label: "Ativo", className: "bg-success text-success-foreground" },
    pausado: { label: "Pausado", className: "bg-warning text-warning-foreground" },
    encerrado: { label: "Encerrado", className: "bg-muted text-muted-foreground" },
  };

  const handleDelete = () => {
    deleteMedication(med.id);
    toast.success(`${med.name} removido.`);
    navigate("/");
  };

  return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={() => navigate(-1)} className="text-elder-sm font-bold">
        <ArrowLeft className="h-5 w-5 mr-1" /> Voltar
      </Button>

      <Card className="p-5">
        <div className="flex items-start gap-4">
          <div className="rounded-xl p-4" style={{ backgroundColor: med.color + "22", color: med.color }}>
            <Pill className="h-8 w-8" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-elder-2xl font-bold text-foreground">{med.name}</h2>
              <Badge className={statusConfig[med.status].className}>{statusConfig[med.status].label}</Badge>
            </div>
            <p className="text-elder-lg text-muted-foreground mt-1">{med.dosage}</p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-3 text-elder-base">
            <Clock className="h-5 w-5 text-primary" />
            <div>
              <p className="font-bold">{FREQUENCY_LABELS[med.frequency]}</p>
              <p className="text-muted-foreground">Horários: {med.times.join(" • ")}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-elder-base">
            <Calendar className="h-5 w-5 text-primary" />
            <div>
              <p className="font-bold">Início: {new Date(med.startDate).toLocaleDateString("pt-BR")}</p>
              {med.endDate && <p className="text-muted-foreground">Término: {new Date(med.endDate).toLocaleDateString("pt-BR")}</p>}
            </div>
          </div>
          {med.notes && (
            <div className="bg-secondary rounded-xl p-3 text-elder-sm">
              <p className="font-bold text-secondary-foreground mb-1">Observações:</p>
              <p className="text-foreground">{med.notes}</p>
            </div>
          )}
        </div>
      </Card>

      {med.status !== "encerrado" && (
        <Card className="p-4 space-y-3">
          <h3 className="text-elder-base font-bold text-foreground">Ações</h3>
          <div className="flex flex-col gap-2">
            {med.status === "ativo" ? (
              <Button variant="outline" size="lg" className="justify-start text-elder-sm rounded-xl" onClick={() => pauseMedication(med.id)}>
                <Pause className="h-5 w-5 mr-2" /> Pausar Medicamento
              </Button>
            ) : (
              <Button variant="outline" size="lg" className="justify-start text-elder-sm rounded-xl" onClick={() => resumeMedication(med.id)}>
                <Play className="h-5 w-5 mr-2" /> Retomar Medicamento
              </Button>
            )}
            <Button variant="outline" size="lg" className="justify-start text-elder-sm rounded-xl text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => stopMedication(med.id)}>
              <Square className="h-5 w-5 mr-2" /> Encerrar Tratamento
            </Button>
          </div>
        </Card>
      )}

      <Button variant="outline" size="lg" className="w-full text-destructive border-destructive/30 hover:bg-destructive/10 rounded-xl text-elder-sm" onClick={handleDelete}>
        <Trash2 className="h-5 w-5 mr-2" /> Excluir Medicamento
      </Button>
    </div>
  );
}
