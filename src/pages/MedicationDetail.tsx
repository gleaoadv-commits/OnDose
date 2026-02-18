import { useParams, useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Pill, Pause, Play, Square, Trash2, Clock, Calendar, Pencil, Check, X, Package, RefreshCw } from "lucide-react";
import { FREQUENCY_LABELS, MedicationFrequency } from "@/types/medication";
import { toast } from "sonner";
import { useState } from "react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function MedicationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { medications, pauseMedication, resumeMedication, stopMedication, deleteMedication, updateMedication } = useApp();

  const med = medications.find(m => m.id === id);

  // Basic info editing
  const [editingInfo, setEditingInfo] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDosage, setEditDosage] = useState("");
  const [editQuantity, setEditQuantity] = useState("");
  const [editFrequency, setEditFrequency] = useState<MedicationFrequency>("1x-dia");

  // Times editing
  const [editingTimes, setEditingTimes] = useState(false);
  const [editTimes, setEditTimes] = useState<string[]>([]);

  // End date editing
  const [editingEndDate, setEditingEndDate] = useState(false);
  const [editEndDate, setEditEndDate] = useState("");

  // Notes editing
  const [editingNotes, setEditingNotes] = useState(false);
  const [editNotes, setEditNotes] = useState("");

  // Stock editing
  const [editingStock, setEditingStock] = useState(false);
  const [editStock, setEditStock] = useState("");

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

  // Basic info editing
  const startEditInfo = () => {
    setEditName(med.name);
    setEditDosage(med.dosage);
    setEditQuantity(String(med.quantity));
    setEditFrequency(med.frequency);
    setEditingInfo(true);
  };
  const saveInfo = async () => {
    if (!editName.trim()) { toast.error("Informe o nome do medicamento."); return; }
    if (!editDosage.trim()) { toast.error("Informe a dosagem."); return; }
    const qty = Number(editQuantity);
    if (isNaN(qty) || qty < 1) { toast.error("Quantidade inválida."); return; }
    await updateMedication(med.id, { name: editName.trim(), dosage: editDosage.trim(), quantity: qty, frequency: editFrequency });
    setEditingInfo(false);
    toast.success("Medicamento atualizado!");
  };

  // Times editing
  const startEditTimes = () => { setEditTimes([...med.times]); setEditingTimes(true); };
  const saveTimes = () => {
    const valid = editTimes.filter(t => /^\d{2}:\d{2}$/.test(t));
    if (valid.length === 0) { toast.error("Informe ao menos um horário válido."); return; }
    updateMedication(med.id, { times: valid.sort() });
    setEditingTimes(false);
    toast.success("Horários atualizados!");
  };
  const updateTime = (idx: number, value: string) => setEditTimes(prev => prev.map((t, i) => i === idx ? value : t));
  const addTime = () => setEditTimes(prev => [...prev, "12:00"]);
  const removeTime = (idx: number) => setEditTimes(prev => prev.filter((_, i) => i !== idx));

  // End date editing
  const startEditEndDate = () => { setEditEndDate(med.endDate || ""); setEditingEndDate(true); };
  const saveEndDate = () => {
    updateMedication(med.id, { endDate: editEndDate || undefined });
    setEditingEndDate(false);
    toast.success("Data de término atualizada!");
  };

  // Notes editing
  const startEditNotes = () => { setEditNotes(med.notes || ""); setEditingNotes(true); };
  const saveNotes = () => {
    updateMedication(med.id, { notes: editNotes || undefined });
    setEditingNotes(false);
    toast.success("Observações atualizadas!");
  };

  // Stock editing
  const startEditStock = () => { setEditStock(String(med.stockCurrent ?? med.stockTotal ?? "")); setEditingStock(true); };
  const saveStock = () => {
    const val = Number(editStock);
    if (isNaN(val) || val < 0) { toast.error("Informe um número válido."); return; }
    updateMedication(med.id, { stockCurrent: val, stockTotal: med.stockTotal ?? val });
    setEditingStock(false);
    toast.success("Estoque atualizado!");
  };
  const handleRestock = () => {
    if (med.stockTotal) {
      updateMedication(med.id, { stockCurrent: med.stockTotal });
      toast.success("Estoque reposto! 🎉");
    }
  };

  const stockPercentage = med.stockTotal && med.stockCurrent != null
    ? (med.stockCurrent / med.stockTotal) * 100
    : null;
  const stockLow = stockPercentage != null && stockPercentage <= 20;

  return (
    <div className="space-y-4 animate-fade-in">
      <Button variant="ghost" onClick={() => navigate(-1)} className="text-sm font-bold rounded-xl">
        <ArrowLeft className="h-5 w-5 mr-1" /> Voltar
      </Button>

      {/* Main info card */}
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
          {!editingInfo && (
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl shrink-0" onClick={startEditInfo}>
              <Pencil className="h-4 w-4 text-muted-foreground" />
            </Button>
          )}
        </div>

        {/* Editable basic info */}
        {editingInfo && (
          <div className="mt-4 space-y-3 border-t border-border/40 pt-4">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1 block">Nome</label>
              <Input value={editName} onChange={e => setEditName(e.target.value)} className="rounded-xl h-10" placeholder="Nome do medicamento" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1 block">Dosagem</label>
                <Input value={editDosage} onChange={e => setEditDosage(e.target.value)} className="rounded-xl h-10" placeholder="Ex: 50mg" />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1 block">Comprimidos/dose</label>
                <Input type="number" value={editQuantity} onChange={e => setEditQuantity(e.target.value)} min={1} className="rounded-xl h-10" />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1 block">Frequência</label>
              <Select value={editFrequency} onValueChange={v => setEditFrequency(v as MedicationFrequency)}>
                <SelectTrigger className="rounded-xl h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(FREQUENCY_LABELS) as MedicationFrequency[]).map(f => (
                    <SelectItem key={f} value={f}>{FREQUENCY_LABELS[f]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-1">
              <Button size="sm" className="rounded-xl text-xs flex-1 gap-1" onClick={saveInfo}>
                <Check className="h-3.5 w-3.5" /> Salvar
              </Button>
              <Button variant="outline" size="sm" className="rounded-xl text-xs" onClick={() => setEditingInfo(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        )}

        <div className="mt-6 space-y-4">
          {/* Times */}
          <div className="bg-muted/50 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-primary shrink-0" />
                <p className="font-bold text-elder-base">{FREQUENCY_LABELS[med.frequency]}</p>
              </div>
              {!editingTimes && (
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={startEditTimes}>
                  <Pencil className="h-4 w-4 text-muted-foreground" />
                </Button>
              )}
            </div>

            {editingTimes ? (
              <div className="mt-3 space-y-2">
                {editTimes.map((t, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input type="time" value={t} onChange={e => updateTime(i, e.target.value)} className="rounded-xl h-10 flex-1" />
                    {editTimes.length > 1 && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-destructive" onClick={() => removeTime(i)}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" className="rounded-xl text-xs w-full" onClick={addTime}>
                  + Adicionar horário
                </Button>
                <div className="flex gap-2 mt-2">
                  <Button size="sm" className="rounded-xl text-xs flex-1 gap-1" onClick={saveTimes}>
                    <Check className="h-3.5 w-3.5" /> Salvar
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-xl text-xs" onClick={() => setEditingTimes(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm ml-8">Horários: {med.times.join(" • ")}</p>
            )}
          </div>

          {/* Dates */}
          <div className="bg-muted/50 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-primary shrink-0" />
                <p className="font-bold text-elder-base">Início: {new Date(med.startDate).toLocaleDateString("pt-BR")}</p>
              </div>
              {!editingEndDate && (
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={startEditEndDate}>
                  <Pencil className="h-4 w-4 text-muted-foreground" />
                </Button>
              )}
            </div>

            {editingEndDate ? (
              <div className="mt-3 space-y-2 ml-8">
                <label className="text-sm font-semibold text-foreground">Data de término</label>
                <Input type="date" value={editEndDate} onChange={e => setEditEndDate(e.target.value)} className="rounded-xl h-10" min={med.startDate} />
                <div className="flex gap-2">
                  <Button size="sm" className="rounded-xl text-xs flex-1 gap-1" onClick={saveEndDate}>
                    <Check className="h-3.5 w-3.5" /> Salvar
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-xl text-xs" onClick={() => setEditingEndDate(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm ml-8">
                {med.endDate ? `Término: ${new Date(med.endDate).toLocaleDateString("pt-BR")}` : "Sem data de término definida"}
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="font-bold text-foreground text-sm">Observações</p>
              {!editingNotes && (
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={startEditNotes}>
                  <Pencil className="h-4 w-4 text-muted-foreground" />
                </Button>
              )}
            </div>

            {editingNotes ? (
              <div className="space-y-2 mt-2">
                <Textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} placeholder="Ex: Tomar com água, após refeição..." className="rounded-xl min-h-[80px] resize-none" />
                <div className="flex gap-2">
                  <Button size="sm" className="rounded-xl text-xs flex-1 gap-1" onClick={saveNotes}>
                    <Check className="h-3.5 w-3.5" /> Salvar
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-xl text-xs" onClick={() => setEditingNotes(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-foreground/80 text-sm">{med.notes || "Nenhuma observação."}</p>
            )}
          </div>

          {/* Stock */}
          {med.stockTotal != null && (
            <div className={`rounded-2xl p-4 ${stockLow ? "bg-destructive/10 border border-destructive/20" : "bg-muted/50"}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <Package className={`h-5 w-5 shrink-0 ${stockLow ? "text-destructive" : "text-primary"}`} />
                  <p className="font-bold text-elder-base">Estoque</p>
                </div>
                <div className="flex gap-1">
                  {!editingStock && (
                    <>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={handleRestock} title="Repor estoque">
                        <RefreshCw className="h-4 w-4 text-primary" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={startEditStock}>
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {editingStock ? (
                <div className="space-y-2 ml-8">
                  <Input type="number" value={editStock} onChange={e => setEditStock(e.target.value)} min={0} className="rounded-xl h-10" placeholder="Quantidade atual" />
                  <div className="flex gap-2">
                    <Button size="sm" className="rounded-xl text-xs flex-1 gap-1" onClick={saveStock}>
                      <Check className="h-3.5 w-3.5" /> Salvar
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-xl text-xs" onClick={() => setEditingStock(false)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="ml-8">
                  <div className="flex items-center gap-2 mb-2">
                    <p className={`text-elder-base font-extrabold ${stockLow ? "text-destructive" : "text-foreground"}`}>
                      {med.stockCurrent ?? 0}
                    </p>
                    <p className="text-sm text-muted-foreground">/ {med.stockTotal} cápsulas</p>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${stockLow ? "bg-destructive" : "bg-primary"}`}
                      style={{ width: `${stockPercentage ?? 0}%` }}
                    />
                  </div>
                  {stockLow && (
                    <p className="text-xs font-bold text-destructive mt-2 animate-pulse">
                      ⚠️ Estoque baixo! Considere comprar mais.
                    </p>
                  )}
                </div>
              )}
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

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="lg" className="w-full text-destructive border-destructive/20 hover:bg-destructive/5 rounded-2xl text-sm">
            <Trash2 className="h-5 w-5 mr-2" /> Excluir Medicamento
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {med.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é irreversível. O medicamento e todo o histórico de doses serão apagados permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction className="rounded-xl bg-destructive hover:bg-destructive/90" onClick={handleDelete}>
              Excluir definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
