import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowLeft, FileText, Plus, Camera, TrendingUp, TrendingDown, Minus,
  Sparkles, Trash2, Loader2, Bell, BellRing,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";

import { toast } from "sonner";

interface ExamReminder {
  id: string;
  exam_name: string;
  interval_months: number;
  last_exam_date: string;
  next_reminder_date: string;
}

interface ExamResult {
  id: string;
  exam_name: string;
  exam_date: string;
  notes: string | null;
  image_url: string | null;
  created_at: string;
}

interface ExamIndicator {
  id: string;
  exam_result_id: string;
  indicator_name: string;
  value: number;
  unit: string;
  reference_min: number | null;
  reference_max: number | null;
  created_at: string;
}

export default function ExamsPage() {
  const { plan } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState<ExamResult[]>([]);
  const [indicators, setIndicators] = useState<ExamIndicator[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  // Form state
  const [examName, setExamName] = useState("");
  const [examDate, setExamDate] = useState("");
  const [manualIndicators, setManualIndicators] = useState<
    { name: string; value: string; unit: string; refMin: string; refMax: string }[]
  >([{ name: "", value: "", unit: "", refMin: "", refMax: "" }]);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    const [examsRes, indicatorsRes] = await Promise.all([
      supabase.from("exam_results").select("*").eq("user_id", user.id).order("exam_date", { ascending: false }),
      supabase.from("exam_indicators").select("*").eq("user_id", user.id).order("created_at"),
    ]);
    if (examsRes.data) setExams(examsRes.data);
    if (indicatorsRes.data) setIndicators(indicatorsRes.data as ExamIndicator[]);
    setLoading(false);
  };

  // Group indicators by name for charts
  const indicatorGroups = useMemo(() => {
    const groups = new Map<string, { name: string; unit: string; refMin: number | null; refMax: number | null; points: { date: string; value: number; examId: string }[] }>();
    
    indicators.forEach((ind) => {
      const exam = exams.find((e) => e.id === ind.exam_result_id);
      if (!exam) return;
      
      const key = ind.indicator_name.toLowerCase();
      if (!groups.has(key)) {
        groups.set(key, {
          name: ind.indicator_name,
          unit: ind.unit,
          refMin: ind.reference_min,
          refMax: ind.reference_max,
          points: [],
        });
      }
      groups.get(key)!.points.push({
        date: new Date(exam.exam_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" }),
        value: Number(ind.value),
        examId: exam.id,
      });
    });

    // Sort points by date
    groups.forEach((g) => g.points.sort((a, b) => a.date.localeCompare(b.date)));
    return Array.from(groups.values()).filter((g) => g.points.length > 0);
  }, [indicators, exams]);

  const extractPdfText = async (file: File): Promise<string> => {
    const pdfjsLib = await import("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
    
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const textParts: string[] = [];
    
    for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map((item: any) => item.str).join(" ");
      textParts.push(pageText);
    }
    
    return textParts.join("\n");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const isPdf = file.type === "application/pdf";
    setAnalyzing(true);
    try {
      let body: any;

      if (isPdf) {
        const pdfText = await extractPdfText(file);
        if (!pdfText.trim()) {
          toast.error("Não foi possível extrair texto do PDF. Tente tirar uma foto do exame.");
          return;
        }
        body = { pdfText };
      } else {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(",")[1]);
          };
          reader.readAsDataURL(file);
        });
        const imageBase64 = await base64Promise;
        body = { imageBase64, mimeType: file.type };
      }

      const { data, error } = await supabase.functions.invoke("read-exam", { body });

      if (error) throw error;

      if (!data.success) {
        toast.error(data.observations || "Não foi possível ler o exame");
        return;
      }

      setExamName(data.exam_name || "");
      if (data.indicators?.length > 0) {
        setManualIndicators(
          data.indicators.map((ind: any) => ({
            name: ind.name,
            value: String(ind.value),
            unit: ind.unit || "",
            refMin: ind.reference_min != null ? String(ind.reference_min) : "",
            refMax: ind.reference_max != null ? String(ind.reference_max) : "",
          }))
        );
      }

      toast.success(`${data.indicators?.length || 0} indicadores detectados!`);
      setDialogOpen(true);
    } catch (err: any) {
      toast.error(err.message || "Erro ao analisar exame");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveExam = async () => {
    if (!user || !examName.trim() || !examDate) {
      toast.error("Preencha nome e data do exame");
      return;
    }

    const validIndicators = manualIndicators.filter(
      (i) => i.name.trim() && i.value.trim()
    );
    if (validIndicators.length === 0) {
      toast.error("Adicione pelo menos um indicador");
      return;
    }

    const { data: examRow, error: examErr } = await supabase
      .from("exam_results")
      .insert({
        user_id: user.id,
        exam_name: examName.trim(),
        exam_date: examDate,
      })
      .select()
      .single();

    if (examErr || !examRow) {
      toast.error("Erro ao salvar exame");
      return;
    }

    const indPayload = validIndicators.map((i) => ({
      user_id: user.id,
      exam_result_id: examRow.id,
      indicator_name: i.name.trim(),
      value: parseFloat(i.value),
      unit: i.unit.trim(),
      reference_min: i.refMin ? parseFloat(i.refMin) : null,
      reference_max: i.refMax ? parseFloat(i.refMax) : null,
    }));

    await supabase.from("exam_indicators").insert(indPayload);

    toast.success("Exame salvo com sucesso!");
    setDialogOpen(false);
    resetForm();
    loadData();
  };

  const resetForm = () => {
    setExamName("");
    setExamDate("");
    setManualIndicators([{ name: "", value: "", unit: "", refMin: "", refMax: "" }]);
  };

  const addIndicatorRow = () => {
    setManualIndicators((prev) => [...prev, { name: "", value: "", unit: "", refMin: "", refMax: "" }]);
  };

  const updateIndicator = (index: number, field: string, value: string) => {
    setManualIndicators((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const removeIndicator = (index: number) => {
    setManualIndicators((prev) => prev.filter((_, i) => i !== index));
  };

  const deleteExam = async (id: string) => {
    await supabase.from("exam_results").delete().eq("id", id);
    toast.success("Exame removido");
    loadData();
  };

  const getTrend = (points: { value: number }[]) => {
    if (points.length < 2) return "stable";
    const last = points[points.length - 1].value;
    const prev = points[points.length - 2].value;
    if (last > prev * 1.05) return "up";
    if (last < prev * 0.95) return "down";
    return "stable";
  };

  if (plan !== "premium") {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-xl">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="section-header mb-0">
            <FileText className="h-5 w-5 text-amber-500" />
            Exames
          </h2>
        </div>
        <Card className="p-6 rounded-2xl border-border/40 text-center space-y-3">
          <Sparkles className="h-10 w-10 text-amber-500 mx-auto" />
          <p className="text-elder-base font-bold text-foreground">Recurso exclusivo Premium</p>
          <p className="text-sm text-muted-foreground">
            Acompanhe seus exames com gráficos de evolução e leitura por IA.
          </p>
          <Button
            onClick={() => navigate("/planos")}
            className="bg-gradient-to-r from-amber-500 to-amber-600 text-white border-0 rounded-2xl font-bold"
          >
            Ver planos
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-xl">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="section-header mb-0">
          <FileText className="h-5 w-5 text-amber-500" />
          Exames
        </h2>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-3 gap-3">
        <label className="cursor-pointer">
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileUpload}
            disabled={analyzing}
          />
          <Card className="p-4 rounded-2xl border-border/40 text-center card-hover h-full flex flex-col items-center justify-center gap-2">
            {analyzing ? (
              <Loader2 className="h-6 w-6 text-amber-500 animate-spin" />
            ) : (
              <Camera className="h-6 w-6 text-amber-500" />
            )}
            <p className="text-xs font-bold text-foreground">
              {analyzing ? "Analisando..." : "Foto do exame"}
            </p>
            <p className="text-[10px] text-muted-foreground">IA lê automaticamente</p>
          </Card>
        </label>

        <label className="cursor-pointer">
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleFileUpload}
            disabled={analyzing}
          />
          <Card className="p-4 rounded-2xl border-border/40 text-center card-hover h-full flex flex-col items-center justify-center gap-2">
            {analyzing ? (
              <Loader2 className="h-6 w-6 text-amber-500 animate-spin" />
            ) : (
              <FileText className="h-6 w-6 text-amber-500" />
            )}
            <p className="text-xs font-bold text-foreground">
              {analyzing ? "Analisando..." : "Importar PDF"}
            </p>
            <p className="text-[10px] text-muted-foreground">IA lê o arquivo</p>
          </Card>
        </label>

        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Card className="p-4 rounded-2xl border-border/40 text-center card-hover cursor-pointer flex flex-col items-center justify-center gap-2">
              <Plus className="h-6 w-6 text-primary" />
              <p className="text-xs font-bold text-foreground">Digitar manualmente</p>
              <p className="text-[10px] text-muted-foreground">Inserir valores</p>
            </Card>
          </DialogTrigger>
          <DialogContent className="rounded-2xl max-w-[400px] max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Novo Exame</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-bold">Nome do exame *</Label>
                  <Input value={examName} onChange={(e) => setExamName(e.target.value)} placeholder="Hemograma" className="rounded-xl mt-1" />
                </div>
                <div>
                  <Label className="text-xs font-bold">Data *</Label>
                  <Input value={examDate} onChange={(e) => setExamDate(e.target.value)} type="date" className="rounded-xl mt-1" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-xs font-bold">Indicadores</Label>
                  <Button type="button" variant="ghost" size="sm" onClick={addIndicatorRow} className="text-xs h-7">
                    <Plus className="h-3 w-3 mr-1" /> Adicionar
                  </Button>
                </div>
                <div className="space-y-3">
                  {manualIndicators.map((ind, idx) => (
                    <Card key={idx} className="p-3 rounded-xl border-border/40 space-y-2">
                      <div className="flex items-center gap-2">
                        <Input
                          value={ind.name}
                          onChange={(e) => updateIndicator(idx, "name", e.target.value)}
                          placeholder="Ex: Glicose"
                          className="rounded-lg text-xs h-8 flex-1"
                        />
                        {manualIndicators.length > 1 && (
                          <Button variant="ghost" size="icon" onClick={() => removeIndicator(idx)} className="h-7 w-7 shrink-0 text-destructive">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        <Input
                          value={ind.value}
                          onChange={(e) => updateIndicator(idx, "value", e.target.value)}
                          placeholder="Valor"
                          type="number"
                          className="rounded-lg text-xs h-8"
                        />
                        <Input
                          value={ind.unit}
                          onChange={(e) => updateIndicator(idx, "unit", e.target.value)}
                          placeholder="Un."
                          className="rounded-lg text-xs h-8"
                        />
                        <Input
                          value={ind.refMin}
                          onChange={(e) => updateIndicator(idx, "refMin", e.target.value)}
                          placeholder="Mín"
                          type="number"
                          className="rounded-lg text-xs h-8"
                        />
                        <Input
                          value={ind.refMax}
                          onChange={(e) => updateIndicator(idx, "refMax", e.target.value)}
                          placeholder="Máx"
                          type="number"
                          className="rounded-lg text-xs h-8"
                        />
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              <Button onClick={handleSaveExam} className="w-full rounded-xl font-bold bg-gradient-to-r from-amber-500 to-amber-600 text-white border-0">
                Salvar exame
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="h-6 w-6 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : (
        <Tabs defaultValue="charts" className="space-y-4">
          <TabsList className="w-full rounded-2xl">
            <TabsTrigger value="charts" className="flex-1 rounded-xl text-xs font-bold">
              <TrendingUp className="h-3.5 w-3.5 mr-1" /> Evolução
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1 rounded-xl text-xs font-bold">
              <FileText className="h-3.5 w-3.5 mr-1" /> Histórico
            </TabsTrigger>
            <TabsTrigger value="reminders" className="flex-1 rounded-xl text-xs font-bold">
              <Bell className="h-3.5 w-3.5 mr-1" /> Lembretes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="charts">
            {indicatorGroups.length === 0 ? (
              <Card className="p-8 text-center rounded-2xl border-dashed border-2 border-border/50">
                <TrendingUp className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-bold text-foreground">Nenhum indicador registrado</p>
                <p className="text-xs text-muted-foreground mt-1">Lance seus exames para ver gráficos de evolução.</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {indicatorGroups.map((group) => {
                  const trend = getTrend(group.points);
                  const lastValue = group.points[group.points.length - 1]?.value;
                  const isOutOfRange =
                    (group.refMin != null && lastValue < group.refMin) ||
                    (group.refMax != null && lastValue > group.refMax);

                  return (
                    <Card key={group.name} className="p-4 rounded-2xl border-border/40">
                      <div className="flex items-center gap-2 mb-3">
                        <p className="text-sm font-bold text-foreground flex-1">{group.name}</p>
                        <div className="flex items-center gap-1.5">
                          <span className="text-lg font-extrabold text-foreground">{lastValue}</span>
                          <span className="text-xs text-muted-foreground">{group.unit}</span>
                          {trend === "up" && <TrendingUp className="h-4 w-4 text-destructive" />}
                          {trend === "down" && <TrendingDown className="h-4 w-4 text-success" />}
                          {trend === "stable" && <Minus className="h-4 w-4 text-muted-foreground" />}
                        </div>
                        {isOutOfRange && (
                          <Badge variant="outline" className="text-[9px] font-bold bg-destructive/10 text-destructive border-destructive/30">
                            Fora da ref.
                          </Badge>
                        )}
                      </div>
                      <ResponsiveContainer width="100%" height={150}>
                        <LineChart data={group.points}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                          <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                          <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" domain={["auto", "auto"]} />
                          <Tooltip
                            contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", fontSize: 11 }}
                            formatter={(val: number) => [`${val} ${group.unit}`, group.name]}
                          />
                          {group.refMin != null && (
                            <ReferenceLine y={group.refMin} stroke="hsl(var(--success))" strokeDasharray="4 4" strokeOpacity={0.6} />
                          )}
                          {group.refMax != null && (
                            <ReferenceLine y={group.refMax} stroke="hsl(var(--destructive))" strokeDasharray="4 4" strokeOpacity={0.6} />
                          )}
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2.5}
                            dot={{ r: 4, fill: "hsl(var(--primary))" }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                      {(group.refMin != null || group.refMax != null) && (
                        <p className="text-[10px] text-muted-foreground mt-2 text-center">
                          Referência: {group.refMin != null ? group.refMin : "—"} ~ {group.refMax != null ? group.refMax : "—"} {group.unit}
                        </p>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history">
            {exams.length === 0 ? (
              <Card className="p-8 text-center rounded-2xl border-dashed border-2 border-border/50">
                <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-bold text-foreground">Nenhum exame registrado</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {exams.map((exam) => {
                  const examInds = indicators.filter((i) => i.exam_result_id === exam.id);
                  return (
                    <Card key={exam.id} className="p-4 rounded-2xl border-border/40">
                      <div className="flex items-center gap-3">
                        <div className="bg-amber-500/10 rounded-xl p-2">
                          <FileText className="h-5 w-5 text-amber-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-foreground">{exam.exam_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(exam.exam_date).toLocaleDateString("pt-BR")} • {examInds.length} indicadores
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteExam(exam.id)}
                          className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/5 shrink-0"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      {examInds.length > 0 && (
                        <div className="mt-3 space-y-1.5">
                          {examInds.map((ind) => {
                            const outOfRange =
                              (ind.reference_min != null && Number(ind.value) < ind.reference_min) ||
                              (ind.reference_max != null && Number(ind.value) > ind.reference_max);
                            return (
                              <div key={ind.id} className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">{ind.indicator_name}</span>
                                <span className={`font-bold ${outOfRange ? "text-destructive" : "text-foreground"}`}>
                                  {Number(ind.value)} {ind.unit}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="reminders" className="space-y-4">
            <ExamRemindersTab user={user} />
          </TabsContent>
        </Tabs>
      )}

      <p className="text-[10px] text-muted-foreground text-center px-4">
        ⚠️ Os dados são apenas informativos e não substituem avaliação médica profissional.
      </p>
    </div>
  );
}

// ---- Exam Reminders sub-component ----
function ExamRemindersTab({ user }: { user: any }) {
  const [reminders, setReminders] = useState<ExamReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [examName, setExamName] = useState("");
  const [intervalMonths, setIntervalMonths] = useState("6");
  const [lastExamDate, setLastExamDate] = useState("");

  useEffect(() => { if (user) loadReminders(); }, [user]);

  const loadReminders = async () => {
    setLoading(true);
    const { data } = await supabase.from("exam_reminders" as any).select("*").eq("user_id", user.id).order("next_reminder_date");
    if (data) setReminders(data as unknown as ExamReminder[]);
    setLoading(false);
  };

  const saveReminder = async () => {
    if (!examName.trim() || !lastExamDate || !intervalMonths) {
      toast.error("Preencha todos os campos"); return;
    }
    const months = Number(intervalMonths);
    const last = new Date(lastExamDate);
    const next = new Date(last);
    next.setMonth(next.getMonth() + months);

    const { error } = await supabase.from("exam_reminders" as any).insert({
      user_id: user.id,
      exam_name: examName.trim(),
      interval_months: months,
      last_exam_date: lastExamDate,
      next_reminder_date: next.toISOString().slice(0, 10),
    });

    if (error) { toast.error("Erro ao salvar lembrete"); return; }
    toast.success("Lembrete criado! 🔔");
    setDialogOpen(false);
    setExamName(""); setLastExamDate(""); setIntervalMonths("6");
    loadReminders();
  };

  const deleteReminder = async (id: string) => {
    await supabase.from("exam_reminders" as any).delete().eq("id", id);
    toast.success("Lembrete removido");
    setReminders(prev => prev.filter(r => r.id !== id));
  };

  const today = new Date();

  if (loading) return <div className="text-center py-8"><div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Alertas para refazer exames periodicamente.</p>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-xl text-xs gap-1">
              <Plus className="h-3.5 w-3.5" /> Novo
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl max-w-[380px]">
            <DialogHeader><DialogTitle>Novo lembrete de exame</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label className="text-xs font-bold">Nome do exame *</Label>
                <Input value={examName} onChange={e => setExamName(e.target.value)} placeholder="Ex: Hemograma completo" className="rounded-xl mt-1" />
              </div>
              <div>
                <Label className="text-xs font-bold">Data do último exame *</Label>
                <Input type="date" value={lastExamDate} onChange={e => setLastExamDate(e.target.value)} className="rounded-xl mt-1" max={today.toISOString().slice(0, 10)} />
              </div>
              <div>
                <Label className="text-xs font-bold">Repetir a cada</Label>
                <Select value={intervalMonths} onValueChange={setIntervalMonths}>
                  <SelectTrigger className="rounded-xl mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 mês</SelectItem>
                    <SelectItem value="2">2 meses</SelectItem>
                    <SelectItem value="3">3 meses</SelectItem>
                    <SelectItem value="6">6 meses</SelectItem>
                    <SelectItem value="12">12 meses (anual)</SelectItem>
                    <SelectItem value="24">24 meses</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={saveReminder} className="w-full rounded-xl font-bold">Criar lembrete</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {reminders.length === 0 ? (
        <Card className="p-8 text-center rounded-2xl border-dashed border-2 border-border/50">
          <BellRing className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-bold text-foreground">Nenhum lembrete cadastrado</p>
          <p className="text-xs text-muted-foreground mt-1">Configure lembretes para não esquecer de refazer exames.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {reminders.map(r => {
            const nextDate = new Date(r.next_reminder_date);
            const daysLeft = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            const isDue = daysLeft <= 0;
            const isSoon = daysLeft > 0 && daysLeft <= 30;

            return (
              <Card key={r.id} className={`p-4 rounded-2xl border ${isDue ? "border-destructive/30 bg-destructive/5" : isSoon ? "border-warning/30 bg-warning/5" : "border-border/40"}`}>
                <div className="flex items-start gap-3">
                  <div className={`rounded-xl p-2 ${isDue ? "bg-destructive/10" : isSoon ? "bg-warning/10" : "bg-primary/10"}`}>
                    <BellRing className={`h-4 w-4 ${isDue ? "text-destructive" : isSoon ? "text-warning" : "text-primary"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground">{r.exam_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      A cada {r.interval_months} {r.interval_months === 1 ? "mês" : "meses"} • Último: {new Date(r.last_exam_date).toLocaleDateString("pt-BR")}
                    </p>
                    <p className={`text-xs font-bold mt-1 ${isDue ? "text-destructive" : isSoon ? "text-warning" : "text-success"}`}>
                      {isDue
                        ? `⚠️ Vencido há ${Math.abs(daysLeft)} ${Math.abs(daysLeft) === 1 ? "dia" : "dias"}!`
                        : isSoon
                        ? `🔔 Vence em ${daysLeft} ${daysLeft === 1 ? "dia" : "dias"}`
                        : `✅ Próximo em ${nextDate.toLocaleDateString("pt-BR")}`}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteReminder(r.id)} className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/5 shrink-0">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
