import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  ArrowLeft,
  BarChart3,
  History,
  FileDown,
  CheckCircle2,
  XCircle,
  Sparkles,
  TrendingUp,
  Calendar,
  Pill,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export default function ReportsPage() {
  const { plan, schedule, medications } = useApp();
  const navigate = useNavigate();
  const [period, setPeriod] = useState<"7d" | "30d" | "all">("7d");

  const now = new Date();
  const periodStart = useMemo(() => {
    if (period === "7d") return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    if (period === "30d") return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return new Date(0);
  }, [period]);

  // Build a map of medication start dates
  const medStartDates = useMemo(() => {
    const map = new Map<string, Date>();
    medications.forEach((m) => map.set(m.id, new Date(m.startDate)));
    return map;
  }, [medications]);

  const filteredEvents = useMemo(() => {
    return schedule.filter((e) => {
      const d = new Date(e.scheduledTime);
      // Only include events within the selected period AND up to now (future events aren't missed)
      if (d < periodStart || d > now) return false;
      // Only count as relevant if the scheduled time is >= the medication's start date
      const medStart = medStartDates.get(e.medicationId);
      if (medStart && d < medStart) return false;
      return true;
    });
  }, [schedule, periodStart, medStartDates]);

  const totalDoses = filteredEvents.length;
  const takenDoses = filteredEvents.filter((e) => e.taken).length;
  const missedDoses = totalDoses - takenDoses;
  const adherenceRate = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 0;

  // Per-medication adherence
  const perMedication = useMemo(() => {
    const map = new Map<string, { name: string; total: number; taken: number; color: string }>();
    filteredEvents.forEach((e) => {
      const entry = map.get(e.medicationId) || { name: e.medicationName, total: 0, taken: 0, color: e.color };
      entry.total++;
      if (e.taken) entry.taken++;
      map.set(e.medicationId, entry);
    });
    return Array.from(map.values()).map((m) => ({
      ...m,
      rate: m.total > 0 ? Math.round((m.taken / m.total) * 100) : 0,
    }));
  }, [filteredEvents]);

  // Daily adherence for chart
  const dailyData = useMemo(() => {
    const map = new Map<string, { date: string; taken: number; missed: number }>();
    filteredEvents.forEach((e) => {
      const dateStr = new Date(e.scheduledTime).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      const entry = map.get(dateStr) || { date: dateStr, taken: 0, missed: 0 };
      if (e.taken) entry.taken++;
      else entry.missed++;
      map.set(dateStr, entry);
    });
    return Array.from(map.values());
  }, [filteredEvents]);

  // Sorted history (most recent first)
  const historyEvents = useMemo(() => {
    return [...filteredEvents].sort(
      (a, b) => new Date(b.scheduledTime).getTime() - new Date(a.scheduledTime).getTime()
    );
  }, [filteredEvents]);

  if (plan !== "pro" && plan !== "premium") {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-xl">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="section-header mb-0">
            <BarChart3 className="h-5 w-5 text-pro" />
            Relatórios
          </h2>
        </div>
        <Card className="p-6 rounded-2xl border-border/40 text-center space-y-3">
          <Sparkles className="h-10 w-10 text-pro mx-auto" />
          <p className="text-elder-base font-bold text-foreground">Recurso exclusivo PRO</p>
          <p className="text-sm text-muted-foreground">
            Assine o plano PRO para acessar relatórios de adesão e histórico completo.
          </p>
          <Button onClick={() => navigate("/planos")} className="gradient-pro text-white border-0 rounded-2xl font-bold">
            Ver planos
          </Button>
        </Card>
      </div>
    );
  }

  const handleExportPDF = () => {
    // Generate a printable HTML report and trigger print
    const reportWindow = window.open("", "_blank");
    if (!reportWindow) return;

    const rows = historyEvents
      .map(
        (e) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee">${e.medicationName}</td>
        <td style="padding:8px;border-bottom:1px solid #eee">${e.dosage}</td>
        <td style="padding:8px;border-bottom:1px solid #eee">${new Date(e.scheduledTime).toLocaleDateString("pt-BR")}</td>
        <td style="padding:8px;border-bottom:1px solid #eee">${new Date(e.scheduledTime).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;color:${e.taken ? "#2a9d6f" : "#e74c3c"}">${e.taken ? "✅ Tomado" : "❌ Não tomado"}${e.takenAt ? ` às ${new Date(e.takenAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}` : ""}</td>
      </tr>`
      )
      .join("");

    const medRows = perMedication
      .map(
        (m) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee">${m.name}</td>
        <td style="padding:8px;border-bottom:1px solid #eee">${m.taken}/${m.total}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;color:${m.rate >= 80 ? "#2a9d6f" : m.rate >= 50 ? "#e67e22" : "#e74c3c"}">${m.rate}%</td>
      </tr>`
      )
      .join("");

    reportWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Relatório OnDose</title>
        <style>body{font-family:Arial,sans-serif;padding:40px;color:#333}h1{color:#2a9d6f}table{width:100%;border-collapse:collapse;margin:20px 0}th{text-align:left;padding:8px;background:#f5f5f5;border-bottom:2px solid #ddd}.summary{display:flex;gap:20px;margin:20px 0}.stat{background:#f9f9f9;padding:16px;border-radius:8px;flex:1;text-align:center}.stat h3{margin:0;font-size:24px}.stat p{margin:4px 0 0;font-size:12px;color:#888}</style>
      </head>
      <body>
        <h1>📊 Relatório de Adesão — OnDose</h1>
        <p>Período: ${periodStart.toLocaleDateString("pt-BR")} a ${now.toLocaleDateString("pt-BR")}</p>
        
        <div class="summary">
          <div class="stat"><h3>${adherenceRate}%</h3><p>Taxa de Adesão</p></div>
          <div class="stat"><h3>${takenDoses}</h3><p>Doses Tomadas</p></div>
          <div class="stat"><h3>${missedDoses}</h3><p>Doses Perdidas</p></div>
        </div>

        <h2>Por Medicamento</h2>
        <table>
          <thead><tr><th>Medicamento</th><th>Doses</th><th>Adesão</th></tr></thead>
          <tbody>${medRows}</tbody>
        </table>

        <h2>Histórico Completo</h2>
        <table>
          <thead><tr><th>Medicamento</th><th>Dosagem</th><th>Data</th><th>Horário</th><th>Status</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>

        <p style="margin-top:40px;font-size:11px;color:#aaa">Gerado por OnDose em ${new Date().toLocaleString("pt-BR")}. Este relatório é apenas informativo.</p>
        <script>window.print();</script>
      </body>
      </html>
    `);
    reportWindow.document.close();
  };

  const rateColor = (r: number) =>
    r >= 80 ? "text-success" : r >= 50 ? "text-accent" : "text-destructive";

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-xl">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="section-header mb-0">
          <BarChart3 className="h-5 w-5 text-primary" />
          Relatórios
        </h2>
      </div>

      {/* Period selector */}
      <div className="flex gap-2">
        {([["7d", "7 dias"], ["30d", "30 dias"], ["all", "Tudo"]] as const).map(([key, label]) => (
          <Button
            key={key}
            size="sm"
            variant={period === key ? "default" : "outline"}
            onClick={() => setPeriod(key)}
            className="rounded-2xl text-xs font-bold flex-1"
          >
            {label}
          </Button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 rounded-2xl border-border/40 text-center">
          <p className={`text-2xl font-extrabold ${rateColor(adherenceRate)}`}>{adherenceRate}%</p>
          <p className="text-[10px] font-bold text-muted-foreground mt-0.5">Adesão</p>
        </Card>
        <Card className="p-3 rounded-2xl border-border/40 text-center">
          <p className="text-2xl font-extrabold text-success">{takenDoses}</p>
          <p className="text-[10px] font-bold text-muted-foreground mt-0.5">Tomadas</p>
        </Card>
        <Card className="p-3 rounded-2xl border-border/40 text-center">
          <p className="text-2xl font-extrabold text-destructive">{missedDoses}</p>
          <p className="text-[10px] font-bold text-muted-foreground mt-0.5">Perdidas</p>
        </Card>
      </div>

      <Tabs defaultValue="chart" className="space-y-4">
        <TabsList className="w-full rounded-2xl">
          <TabsTrigger value="chart" className="flex-1 rounded-xl text-xs font-bold">
            <TrendingUp className="h-3.5 w-3.5 mr-1" /> Gráfico
          </TabsTrigger>
          <TabsTrigger value="meds" className="flex-1 rounded-xl text-xs font-bold">
            <Pill className="h-3.5 w-3.5 mr-1" /> Por remédio
          </TabsTrigger>
          <TabsTrigger value="history" className="flex-1 rounded-xl text-xs font-bold">
            <History className="h-3.5 w-3.5 mr-1" /> Histórico
          </TabsTrigger>
        </TabsList>

        {/* Chart */}
        <TabsContent value="chart">
          <Card className="p-4 rounded-2xl border-border/40">
            {dailyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={dailyData} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid hsl(var(--border))",
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="taken" name="Tomadas" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="missed" name="Perdidas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum dado para o período selecionado.
              </p>
            )}
          </Card>
        </TabsContent>

        {/* Per medication */}
        <TabsContent value="meds">
          <div className="space-y-3">
            {perMedication.length === 0 ? (
              <Card className="p-6 rounded-2xl border-border/40 text-center">
                <p className="text-sm text-muted-foreground">Nenhum dado disponível.</p>
              </Card>
            ) : (
              perMedication.map((m) => (
                <Card key={m.name} className="p-4 rounded-2xl border-border/40">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="rounded-xl p-2" style={{ backgroundColor: m.color + "20", color: m.color }}>
                      <Pill className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-foreground">{m.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {m.taken}/{m.total} doses tomadas
                      </p>
                    </div>
                    <span className={`text-lg font-extrabold ${rateColor(m.rate)}`}>{m.rate}%</span>
                  </div>
                  {/* Progress bar */}
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${m.rate}%`,
                        backgroundColor: m.rate >= 80 ? "hsl(var(--success))" : m.rate >= 50 ? "hsl(var(--accent))" : "hsl(var(--destructive))",
                      }}
                    />
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* History */}
        <TabsContent value="history">
          <div className="space-y-2">
            {historyEvents.length === 0 ? (
              <Card className="p-6 rounded-2xl border-border/40 text-center">
                <p className="text-sm text-muted-foreground">Nenhum evento no período.</p>
              </Card>
            ) : (
              historyEvents.slice(0, 50).map((e) => (
                <Card key={e.id} className="p-3 rounded-xl border-border/40 flex items-center gap-3">
                  {e.taken ? (
                    <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{e.medicationName}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(e.scheduledTime).toLocaleDateString("pt-BR")} às{" "}
                      {new Date(e.scheduledTime).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-bold shrink-0 ${
                      e.taken
                        ? "bg-success/10 text-success border-success/30"
                        : "bg-destructive/10 text-destructive border-destructive/30"
                    }`}
                  >
                    {e.taken ? "Tomado" : "Perdido"}
                  </Badge>
                </Card>
              ))
            )}
            {historyEvents.length > 50 && (
              <p className="text-xs text-muted-foreground text-center">
                Mostrando 50 de {historyEvents.length} eventos. Exporte o PDF para ver tudo.
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Export button */}
      <Button
        onClick={handleExportPDF}
        variant="outline"
        size="lg"
        className="w-full rounded-2xl text-elder-base font-bold"
        disabled={totalDoses === 0}
      >
        <FileDown className="h-5 w-5 mr-2" /> Exportar relatório (PDF)
      </Button>
    </div>
  );
}
