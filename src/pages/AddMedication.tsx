import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Pill, Calendar, Clock, Plus, X } from "lucide-react";
import { MedicationFrequency, FREQUENCY_LABELS, getDefaultTimes, getTimeSlotsCount } from "@/types/medication";
import { toast } from "sonner";

export default function AddMedication() {
  const navigate = useNavigate();
  const { addMedication } = useApp();

  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [frequency, setFrequency] = useState<MedicationFrequency>("1x-dia");
  const [customHours, setCustomHours] = useState(4);
  const [times, setTimes] = useState<string[]>(["08:00"]);
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");

  // When frequency changes, reset times to defaults
  useEffect(() => {
    const defaults = getDefaultTimes(frequency, customHours);
    setTimes(defaults);
  }, [frequency, customHours]);

  const updateTime = (index: number, value: string) => {
    setTimes(prev => prev.map((t, i) => i === index ? value : t));
  };

  const addTimeSlot = () => {
    setTimes(prev => [...prev, "12:00"]);
  };

  const removeTimeSlot = (index: number) => {
    if (times.length <= 1) return;
    setTimes(prev => prev.filter((_, i) => i !== index));
  };

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !dosage.trim()) {
      toast.error("Preencha o nome e a dosagem do medicamento.");
      return;
    }
    if (times.length === 0) {
      toast.error("Adicione pelo menos um horário.");
      return;
    }
    setSaving(true);
    try {
      const success = await addMedication({
        name: name.trim(),
        dosage: dosage.trim(),
        quantity,
        frequency,
        customFrequencyHours: frequency === "personalizado" ? customHours : undefined,
        times: [...times].sort(),
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
    } finally {
      setSaving(false);
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

          {/* Dosagem + Quantidade side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-bold">Dosagem *</Label>
              <Input
                value={dosage}
                onChange={e => setDosage(e.target.value)}
                placeholder="Ex: 50mg"
                className="mt-1.5 text-elder-base h-13 rounded-2xl border-border/60"
                required
              />
            </div>
            <div>
              <Label className="text-sm font-bold">Quant. comprimidos</Label>
              <Input
                type="number"
                value={quantity}
                onChange={e => setQuantity(Math.max(1, Number(e.target.value)))}
                min={1}
                max={20}
                className="mt-1.5 text-elder-base h-13 rounded-2xl border-border/60"
              />
            </div>
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
        </Card>

        {/* Horários */}
        <Card className="p-5 space-y-4 rounded-2xl border-border/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold text-foreground">Horários das doses</span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addTimeSlot}
              className="rounded-xl text-xs border-border/60"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Horário
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {times.map((time, i) => (
              <div key={i} className="relative">
                <Input
                  type="time"
                  value={time}
                  onChange={e => updateTime(i, e.target.value)}
                  className="text-elder-base h-13 rounded-2xl border-border/60 pr-10 text-center font-bold"
                />
                {times.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTimeSlot(i)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-destructive transition-colors p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">
            Toque para ajustar cada horário. Sugestões preenchidas com base na frequência.
          </p>
        </Card>

        {/* Período */}
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

        <Button type="submit" size="lg" disabled={saving} className="w-full text-elder-base font-bold rounded-2xl h-14 shadow-glow">
          <Save className="h-5 w-5 mr-2" /> {saving ? "Salvando..." : "Cadastrar Medicamento"}
        </Button>
      </form>
    </div>
  );
}
