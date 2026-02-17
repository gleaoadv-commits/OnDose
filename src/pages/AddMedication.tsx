import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Pill, Calendar } from "lucide-react";
import { MedicationFrequency, FREQUENCY_LABELS, generateTimesForFrequency } from "@/types/medication";
import { toast } from "sonner";

export default function AddMedication() {
  const navigate = useNavigate();
  const { addMedication } = useApp();

  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState<MedicationFrequency>("1x-dia");
  const [customHours, setCustomHours] = useState(4);
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");

  const previewTimes = generateTimesForFrequency(frequency, customHours);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !dosage.trim()) {
      toast.error("Preencha o nome e a dosagem do medicamento.");
      return;
    }
    const success = addMedication({
      name: name.trim(),
      dosage: dosage.trim(),
      frequency,
      customFrequencyHours: frequency === "personalizado" ? customHours : undefined,
      startDate,
      endDate: endDate || undefined,
      notes: notes.trim() || undefined,
    });
    if (success) {
      toast.success(`${name} cadastrado com sucesso!`);
      navigate("/");
    } else {
      toast.error("Limite de medicamentos atingido no plano gratuito.");
    }
  };

  return (
    <div className="space-y-5">
      <Button variant="ghost" onClick={() => navigate(-1)} className="text-sm font-bold rounded-xl">
        <ArrowLeft className="h-5 w-5 mr-1" /> Voltar
      </Button>

      <h2 className="section-header">
        <Pill className="h-5 w-5 text-primary" />
        Novo Medicamento
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card className="p-5 space-y-5 rounded-2xl border-border/40">
          <div>
            <Label className="text-sm font-bold">Nome do Medicamento *</Label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Losartana"
              className="mt-1.5 text-elder-base h-13 rounded-2xl border-border/60"
              required
            />
          </div>
          <div>
            <Label className="text-sm font-bold">Dosagem *</Label>
            <Input
              value={dosage}
              onChange={e => setDosage(e.target.value)}
              placeholder="Ex: 50mg, 1 comprimido"
              className="mt-1.5 text-elder-base h-13 rounded-2xl border-border/60"
              required
            />
          </div>
          <div>
            <Label className="text-sm font-bold">Frequência</Label>
            <Select value={frequency} onValueChange={(v) => setFrequency(v as MedicationFrequency)}>
              <SelectTrigger className="mt-1.5 text-elder-base h-13 rounded-2xl border-border/60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(FREQUENCY_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key} className="text-sm">{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {frequency === "personalizado" && (
            <div>
              <Label className="text-sm font-bold">A cada quantas horas?</Label>
              <Input
                type="number"
                value={customHours}
                onChange={e => setCustomHours(Number(e.target.value))}
                min={1}
                max={24}
                className="mt-1.5 text-elder-base h-13 rounded-2xl border-border/60"
              />
            </div>
          )}

          {/* Preview times */}
          <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Horários gerados</p>
            <p className="text-elder-base font-bold text-primary">{previewTimes.join("  •  ")}</p>
          </div>
        </Card>

        <Card className="p-5 space-y-5 rounded-2xl border-border/40">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold text-foreground">Período</span>
          </div>
          <div>
            <Label className="text-sm font-bold">Data de Início</Label>
            <Input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="mt-1.5 text-elder-base h-13 rounded-2xl border-border/60"
            />
          </div>
          <div>
            <Label className="text-sm font-bold">Data de Término (opcional)</Label>
            <Input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="mt-1.5 text-elder-base h-13 rounded-2xl border-border/60"
            />
          </div>
          <div>
            <Label className="text-sm font-bold">Observações</Label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ex: Tomar em jejum"
              className="mt-1.5 text-elder-base rounded-2xl border-border/60"
              rows={3}
            />
          </div>
        </Card>

        <Button type="submit" size="lg" className="w-full text-elder-base font-bold rounded-2xl h-14 shadow-glow">
          <Save className="h-5 w-5 mr-2" /> Cadastrar Medicamento
        </Button>
      </form>
    </div>
  );
}
