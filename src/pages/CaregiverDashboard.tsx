import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  AlertTriangle, Clock, Heart, User, LogOut, CheckCircle2, Shield,
  Copy, Share2, X, Pill, BarChart3, FileText, Phone, Save, Bell,
  Check, TrendingUp, TrendingDown, Minus, FileDown, History,
  ChevronRight, Activity,
} from "lucide-react";
import { toast } from "sonner";
import OnDoseLogo from "@/components/OnDoseLogo";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────
interface LinkedProfile {
  display_name: string | null;
  user_code: string;
  user_id: string;
}

interface LinkInfo {
  id: string;
  status: string;
  primary_user_id: string;
}

interface MyProfile {
  display_name: string | null;
  user_code: string;
  whatsapp_number: string | null;
}

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  color: string;
  times: string[];
  status: string;
}

interface ScheduleEvent {
  id: string;
  medication_id: string;
  medication_name: string;
  scheduled_time: string;
  taken: boolean;
  taken_at: string | null;
  color: string;
  dosage: string;
}

interface ExamResult {
  id: string;
  exam_name: string;
  exam_date: string;
  notes: string | null;
}

interface ExamIndicator {
  id: string;
  exam_result_id: string;
  indicator_name: string;
  value: number;
  unit: string;
  reference_min: number | null;
  reference_max: number | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const CAREGIVER_GRADIENT = "linear-gradient(135deg, hsl(152, 60%, 32%), hsl(168, 55%, 42%))";
const CAREGIVER_BG = "hsl(152, 40%, 94%)";

const frequencyLabel = (f: string) => {
  const map: Record<string, string> = {
    daily: "1x ao dia",
    twice_daily: "2x ao dia",
    three_times_daily: "3x ao dia",
    every_8_hours: "A cada 8h",
    every_12_hours: "A cada 12h",
    weekly: "Semanal",
    custom: "Personalizado",
  };
  return map[f] || f;
};

const adherenceColor = (r: number) =>
  r >= 80 ? "text-success" : r >= 50 ? "text-amber-500" : "text-destructive";

// ─── Main Component ────────────────────────────────────────────────────────────
export default function CaregiverDashboard() {
  const { user, signOut } = useAuth();

  // Link & profiles
  const [link, setLink] = useState<LinkInfo | null | undefined>(undefined);
  const [primaryProfile, setPrimaryProfile] = useState<LinkedProfile | null>(null);
  const [myProfile, setMyProfile] = useState<MyProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Patient data
  const [medications, setMedications] = useState<Medication[]>([]);
  const [scheduleEvents, setScheduleEvents] = useState<ScheduleEvent[]>([]);
  const [exams, setExams] = useState<ExamResult[]>([]);
  const [indicators, setIndicators] = useState<ExamIndicator[]>([]);

  // Profile edit
  const [editName, setEditName] = useState("");
  const [editWhatsapp, setEditWhatsapp] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [notifyApp, setNotifyApp] = useState(true);
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(false);

  useEffect(() => {
    if (user) loadAll();
  }, [user]);

  const loadAll = async () => {
    if (!user) return;
    setLoading(true);

    // Own profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("display_name, user_code, whatsapp_number")
      .eq("user_id", user.id)
      .single();
    if (profileData) {
      const p = profileData as any;
      setMyProfile(p);
      setEditName(p.display_name || "");
      setEditWhatsapp(p.whatsapp_number || "");
    }

    // Family link
    const { data: linkData } = await supabase
      .from("family_links")
      .select("*")
      .eq("caregiver_user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (!linkData || linkData.length === 0) {
      setLink(null);
      setLoading(false);
      return;
    }

    const myLink = linkData[0] as any;
    setLink(myLink);

    // Primary user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, user_code, user_id")
      .eq("user_id", myLink.primary_user_id)
      .single();
    if (profile) setPrimaryProfile(profile as any);

    // Patient data (only if active)
    if (myLink.status === "active") {
      const pid = myLink.primary_user_id;
      const [medsRes, eventsRes, examsRes, indRes] = await Promise.all([
        supabase.from("medications").select("*").eq("user_id", pid).eq("status", "ativo"),
        supabase.from("schedule_events").select("*").eq("user_id", pid).order("scheduled_time", { ascending: false }),
        supabase.from("exam_results").select("*").eq("user_id", pid).order("exam_date", { ascending: false }),
        supabase.from("exam_indicators").select("*").eq("user_id", pid),
      ]);
      if (medsRes.data) setMedications(medsRes.data as any);
      if (eventsRes.data) setScheduleEvents(eventsRes.data as any);
      if (examsRes.data) setExams(examsRes.data as any);
      if (indRes.data) setIndicators(indRes.data as any);
    }

    setLoading(false);
  };

  // ── Adherence calculations ──
  const adherenceByPeriod = useMemo(() => {
    const now = new Date();
    const calc = (days: number) => {
      const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      const events = scheduleEvents.filter(e => {
        const t = new Date(e.scheduled_time);
        return t >= from && t <= now;
      });
      const total = events.length;
      const taken = events.filter(e => e.taken).length;
      return { total, taken, rate: total > 0 ? Math.round((taken / total) * 100) : 0 };
    };
    return { d7: calc(7), d15: calc(15), d30: calc(30) };
  }, [scheduleEvents]);

  const dailyChartData = useMemo(() => {
    const now = new Date();
    const from = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const map = new Map<string, { date: string; taken: number; missed: number; ts: number }>();
    scheduleEvents.forEach(e => {
      const t = new Date(e.scheduled_time);
      if (t < from || t > now) return;
      const label = t.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      const entry = map.get(label) || { date: label, taken: 0, missed: 0, ts: t.getTime() };
      if (e.taken) entry.taken++;
      else entry.missed++;
      map.set(label, entry);
    });
    // Sort chronologically (oldest → newest = left → right)
    return Array.from(map.values()).sort((a, b) => a.ts - b.ts);
  }, [scheduleEvents]);

  // ── Profile save ──
  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: editName, whatsapp_number: editWhatsapp || null } as any)
      .eq("user_id", user.id);
    if (error) toast.error("Erro ao salvar perfil");
    else {
      toast.success("Perfil atualizado!");
      setMyProfile(prev => prev ? { ...prev, display_name: editName, whatsapp_number: editWhatsapp } : prev);
    }
    setSaving(false);
  };

  const copyCode = () => {
    if (!myProfile?.user_code) return;
    navigator.clipboard.writeText(myProfile.user_code);
    setCopied(true);
    toast.success("Código copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareCode = async () => {
    if (!myProfile?.user_code) return;
    const text = `Olá! Meu código de familiar no OnDose é: ${myProfile.user_code}\n\nAcesse o app, vá em Familiares e insira este código para me vincular.`;
    if (navigator.share) await navigator.share({ text });
    else {
      navigator.clipboard.writeText(text);
      toast.success("Texto copiado!");
    }
  };

  // ── PDF export ──
  const handleExportPDF = () => {
    const window30 = scheduleEvents.filter(e => {
      const t = new Date(e.scheduled_time);
      const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return t >= from && t <= new Date();
    });
    const taken = window30.filter(e => e.taken).length;
    const total = window30.length;
    const rate = total > 0 ? Math.round((taken / total) * 100) : 0;

    const rows = window30
      .sort((a, b) => new Date(b.scheduled_time).getTime() - new Date(a.scheduled_time).getTime())
      .map(e => `
        <tr>
          <td>${e.medication_name}</td>
          <td>${new Date(e.scheduled_time).toLocaleDateString("pt-BR")}</td>
          <td>${new Date(e.scheduled_time).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</td>
          <td style="color:${e.taken ? "#2a9d6f" : "#e74c3c"}">${e.taken ? "✅ Tomado" : "❌ Perdido"}</td>
        </tr>`).join("");

    const medRows = medications.map(m => {
      const evs = window30.filter(e => e.medication_id === m.id);
      const tk = evs.filter(e => e.taken).length;
      const r = evs.length > 0 ? Math.round((tk / evs.length) * 100) : 0;
      return `<tr><td>${m.name}</td><td>${m.dosage}</td><td>${frequencyLabel(m.frequency)}</td><td style="font-weight:bold;color:${r >= 80 ? "#2a9d6f" : r >= 50 ? "#e67e22" : "#e74c3c"}">${r}%</td></tr>`;
    }).join("");

    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>Relatório OnDose — ${primaryProfile?.display_name}</title>
    <style>body{font-family:Arial,sans-serif;padding:40px;color:#333}h1{color:#1a7a4a}table{width:100%;border-collapse:collapse;margin:16px 0}th{text-align:left;padding:8px;background:#f0f9f4;border-bottom:2px solid #c5e8d5}td{padding:8px;border-bottom:1px solid #eee}.stat{display:inline-block;background:#f5f5f5;padding:16px 24px;border-radius:8px;margin:8px;text-align:center}.stat h3{margin:0;font-size:28px}.stat p{margin:4px 0 0;font-size:11px;color:#888}</style>
    </head><body>
    <h1>📊 Relatório OnDose — ${primaryProfile?.display_name || "Paciente"}</h1>
    <p>Período: últimos 30 dias &nbsp;|&nbsp; Gerado em ${new Date().toLocaleString("pt-BR")}</p>
    <div><span class="stat"><h3>${rate}%</h3><p>Adesão Geral</p></span><span class="stat"><h3>${taken}</h3><p>Tomadas</p></span><span class="stat"><h3>${total - taken}</h3><p>Perdidas</p></span></div>
    <h2>Medicamentos cadastrados</h2>
    <table><thead><tr><th>Medicamento</th><th>Dosagem</th><th>Frequência</th><th>Adesão 30d</th></tr></thead><tbody>${medRows}</tbody></table>
    <h2>Histórico de doses (últimos 30 dias)</h2>
    <table><thead><tr><th>Medicamento</th><th>Data</th><th>Horário</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>
    <p style="font-size:11px;color:#aaa;margin-top:40px">Este relatório é apenas informativo. OnDose © ${new Date().getFullYear()}</p>
    <script>window.print();</script></body></html>`);
    w.document.close();
  };

  // ────────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: CAREGIVER_BG }}>
        <div className="h-8 w-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: "hsl(152,60%,32%)" }} />
      </div>
    );
  }

  const caregiverName = myProfile?.display_name || user?.email?.split("@")[0] || "Familiar";

  // ── Header compartilhado ──
  const Header = ({ onlyLogo = false }: { onlyLogo?: boolean }) => (
    <div className="px-5 pt-10 pb-6 sticky top-0 z-10 shadow-md" style={{ background: CAREGIVER_GRADIENT }}>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
          <OnDoseLogo size="md" theme="light" />
          <Button variant="ghost" size="icon" onClick={signOut}
            className="text-white/80 hover:text-white hover:bg-white/10 rounded-xl">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
        {!onlyLogo && (
          <div className="mt-4 flex items-center gap-3">
            <div className="bg-white/20 rounded-full p-1.5">
              <User className="h-4 w-4 text-white/90" />
            </div>
            <div>
              <p className="text-sm text-white/80 font-semibold">
                Olá, <span className="text-white font-bold">{caregiverName}</span> 👋
              </p>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white mt-0.5 inline-block">
                👨‍👩‍👧 Conta Familiar
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ── SEM VÍNCULO ──────────────────────────────────────────────────────────────
  if (!link) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: CAREGIVER_BG }}>
        <Header onlyLogo />
        <div className="flex-1 flex flex-col items-center justify-center px-4 pb-10 gap-4 pt-6">
          <Card className="p-7 rounded-3xl max-w-sm w-full text-center space-y-5 shadow-lg" style={{ borderColor: "hsl(152,60%,32%,0.2)" }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ background: "hsl(152,60%,32%,0.1)" }}>
              <Share2 className="h-8 w-8" style={{ color: "hsl(152,60%,32%)" }} />
            </div>
            <div>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Seu código de familiar</p>
              <div className="bg-muted/60 rounded-2xl px-5 py-4 font-mono text-2xl font-extrabold tracking-widest text-foreground border border-border/40">
                {myProfile?.user_code || "—"}
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Compartilhe este código com o <strong className="text-foreground">Usuário Principal</strong>. Ele deve acessar <strong className="text-foreground">Familiares → Adicionar Familiar</strong> e inserir seu código.
            </p>
            <div className="flex gap-2">
              <Button onClick={copyCode} variant="outline" className="flex-1 rounded-xl font-bold">
                <Copy className="h-4 w-4 mr-2" /> Copiar
              </Button>
              <Button onClick={shareCode} className="flex-1 rounded-xl font-bold text-white border-0" style={{ background: CAREGIVER_GRADIENT }}>
                <Share2 className="h-4 w-4 mr-2" /> Compartilhar
              </Button>
            </div>
          </Card>
          <Card className="p-4 rounded-2xl max-w-sm w-full border-amber-500/20 bg-amber-500/5">
            <p className="text-xs text-center text-amber-700 leading-relaxed">
              ⏳ Após o Usuário Principal te vincular, esta tela será atualizada. Ele precisa ter o plano <strong>Premium</strong> ativo.
            </p>
          </Card>
          <Button variant="ghost" onClick={signOut} className="rounded-xl text-muted-foreground">
            <LogOut className="h-4 w-4 mr-2" /> Sair
          </Button>
        </div>
      </div>
    );
  }

  // ── PENDENTE ─────────────────────────────────────────────────────────────────
  if (link.status === "pending") {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: CAREGIVER_BG }}>
        <Header onlyLogo />
        <div className="flex-1 flex flex-col items-center justify-center px-4 pb-10 gap-4 pt-6">
          <Card className="p-8 rounded-3xl max-w-sm w-full text-center space-y-5 shadow-lg">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto">
              <Clock className="h-8 w-8 text-amber-500 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Aguardando aprovação</h2>
              {primaryProfile && (
                <p className="text-sm font-semibold mt-1" style={{ color: "hsl(152,60%,32%)" }}>
                  Usuário Principal: {primaryProfile.display_name || "Usuário"} · {primaryProfile.user_code}
                </p>
              )}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              O Usuário Principal ainda não aprovou seu vínculo. Assim que ele aprovar, você terá acesso ao acompanhamento.
            </p>
            {myProfile?.user_code && (
              <div className="bg-muted/50 rounded-xl px-4 py-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Seu código</p>
                <p className="font-mono font-bold text-lg tracking-widest">{myProfile.user_code}</p>
              </div>
            )}
            <Button onClick={() => { loadAll(); toast.info("Verificando status..."); }}
              className="w-full rounded-xl text-white border-0" style={{ background: CAREGIVER_GRADIENT }}>
              Verificar status
            </Button>
            <Button variant="ghost" onClick={signOut} className="rounded-xl text-muted-foreground w-full">
              <LogOut className="h-4 w-4 mr-2" /> Sair
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  // ── INATIVO ───────────────────────────────────────────────────────────────────
  if (link.status === "inactive") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: CAREGIVER_BG }}>
        <Card className="p-8 rounded-3xl max-w-sm w-full text-center space-y-4 border-destructive/20 shadow-lg">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <X className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Acesso desativado</h2>
          <p className="text-sm text-muted-foreground">O Usuário Principal desativou seu vínculo. Entre em contato para solicitar a reativação.</p>
          <Button onClick={signOut} className="w-full rounded-xl text-white border-0" style={{ background: CAREGIVER_GRADIENT }}>
            <LogOut className="h-4 w-4 mr-2" /> Sair
          </Button>
        </Card>
      </div>
    );
  }

  // ── ATIVO: Dashboard principal ─────────────────────────────────────────────────
  const patientName = primaryProfile?.display_name || "Familiar";

  return (
    <div className="min-h-screen flex flex-col" style={{ background: CAREGIVER_BG }}>
      <Header />

      <main className="flex-1 p-4 max-w-2xl mx-auto w-full pt-5 pb-8">
        {/* Card quem acompanha */}
        <button
          className="w-full text-left mb-5"
          onClick={() => {}} // tabs já abaixo
        >
          <Card className="p-5 rounded-3xl shadow-card" style={{ borderColor: "hsl(152,60%,32%,0.2)" }}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "hsl(152,60%,32%,0.12)" }}>
                <Heart className="h-6 w-6" style={{ color: "hsl(152,60%,32%)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Você acompanha</p>
                <p className="text-base font-extrabold text-foreground mt-0.5 truncate">{patientName}</p>
                <p className="text-xs text-muted-foreground font-mono tracking-widest">{primaryProfile?.user_code}</p>
              </div>
              <span className="flex items-center gap-1 text-xs font-bold text-success bg-success/10 px-2 py-1 rounded-full shrink-0">
                <CheckCircle2 className="h-3 w-3" />
                Ativo
              </span>
            </div>
          </Card>
        </button>

        <Tabs defaultValue="meds" className="space-y-4">
          <TabsList className="w-full rounded-2xl grid grid-cols-4 h-auto p-1 gap-0.5">
            {([
              { value: "meds", icon: <Pill className="h-4 w-4" />, label: "Remédios" },
              { value: "adherence", icon: <Activity className="h-4 w-4" />, label: "Adesão" },
              { value: "exams", icon: <FileText className="h-4 w-4" />, label: "Exames" },
              { value: "profile", icon: <User className="h-4 w-4" />, label: "Perfil" },
            ] as const).map(tab => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex flex-col items-center justify-center gap-1 py-2.5 px-1 rounded-xl text-[10px] font-bold leading-none"
              >
                {tab.icon}
                <span>{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ── ABA: Remédios ─────────────────────────────────────────────────── */}
          <TabsContent value="meds" className="space-y-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {medications.length} medicamento{medications.length !== 1 ? "s" : ""} cadastrado{medications.length !== 1 ? "s" : ""}
            </p>
            {medications.length === 0 ? (
              <Card className="p-8 text-center rounded-2xl border-dashed border-2 border-border/50">
                <Pill className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-bold text-foreground">Nenhum medicamento ativo</p>
                <p className="text-xs text-muted-foreground mt-1">O Usuário Principal ainda não cadastrou medicamentos.</p>
              </Card>
            ) : (
              medications.map(m => (
                <Card key={m.id} className="p-4 rounded-2xl border-border/40">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: m.color + "20" }}>
                      <Pill className="h-5 w-5" style={{ color: m.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{m.name}</p>
                      <p className="text-xs text-muted-foreground">{m.dosage} · {frequencyLabel(m.frequency)}</p>
                      {m.times.length > 0 && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">{m.times.join(" · ")}</p>
                      )}
                    </div>
                    <Badge variant="outline" className="text-[10px] font-bold shrink-0 bg-success/10 text-success border-success/30">
                      Ativo
                    </Badge>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          {/* ── ABA: Adesão ───────────────────────────────────────────────────── */}
          <TabsContent value="adherence" className="space-y-4">
            {/* Resumo 7/15/30 dias */}
            <div className="grid grid-cols-3 gap-3">
              {([["7 dias", adherenceByPeriod.d7], ["15 dias", adherenceByPeriod.d15], ["30 dias", adherenceByPeriod.d30]] as const).map(([label, data]) => (
                <Card key={label} className="p-3 rounded-2xl border-border/40 text-center">
                  <p className={`text-xl font-extrabold ${adherenceColor(data.rate)}`}>{data.rate}%</p>
                  <p className="text-[10px] font-bold text-muted-foreground mt-0.5">{label}</p>
                  <p className="text-[10px] text-muted-foreground">{data.taken}/{data.total}</p>
                </Card>
              ))}
            </div>

            {/* Gráfico 30d */}
            <Card className="p-4 rounded-2xl border-border/40">
              <p className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wider">Últimas 2 semanas</p>
              {dailyChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={dailyChartData} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 9 }} allowDecimals={false} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", fontSize: 11 }} />
                    <Bar dataKey="taken" name="Tomadas" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="missed" name="Perdidas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">Sem dados no período.</p>
              )}
            </Card>

            {/* Botão PDF */}
            <Button onClick={handleExportPDF} variant="outline" size="lg"
              className="w-full rounded-2xl font-bold" disabled={scheduleEvents.length === 0}>
              <FileDown className="h-5 w-5 mr-2" /> Baixar relatório PDF (30 dias)
            </Button>
          </TabsContent>

          {/* ── ABA: Exames ───────────────────────────────────────────────────── */}
          <TabsContent value="exams" className="space-y-3">
            {exams.length === 0 ? (
              <Card className="p-8 text-center rounded-2xl border-dashed border-2 border-border/50">
                <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-bold text-foreground">Nenhum exame registrado</p>
                <p className="text-xs text-muted-foreground mt-1">O Usuário Principal ainda não registrou exames.</p>
              </Card>
            ) : (
              exams.map(exam => {
                const examIndicators = indicators.filter(i => i.exam_result_id === exam.id);
                return (
                  <Card key={exam.id} className="p-4 rounded-2xl border-border/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-foreground">{exam.exam_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(exam.exam_date).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        {examIndicators.length} indicador{examIndicators.length !== 1 ? "es" : ""}
                      </Badge>
                    </div>
                    {examIndicators.length > 0 && (
                      <div className="space-y-1.5">
                        {examIndicators.map(ind => {
                          const isLow = ind.reference_min != null && ind.value < ind.reference_min;
                          const isHigh = ind.reference_max != null && ind.value > ind.reference_max;
                          const isOut = isLow || isHigh;
                          return (
                            <div key={ind.id} className="flex items-center gap-2 text-xs">
                              <span className="flex-1 text-muted-foreground">{ind.indicator_name}</span>
                              <span className={`font-bold ${isOut ? "text-destructive" : "text-success"}`}>
                                {ind.value} {ind.unit}
                              </span>
                              {isOut && <AlertTriangle className="h-3 w-3 text-destructive shrink-0" />}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {exam.notes && (
                      <p className="text-xs text-muted-foreground italic">{exam.notes}</p>
                    )}
                  </Card>
                );
              })
            )}
          </TabsContent>

          {/* ── ABA: Perfil ───────────────────────────────────────────────────── */}
          <TabsContent value="profile" className="space-y-4">
            {/* ID */}
            <Card className="p-5 rounded-2xl space-y-2" style={{ borderColor: "hsl(152,60%,32%,0.25)", background: "hsl(152,60%,32%,0.05)" }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Seu ID Familiar</p>
                  <p className="text-2xl font-extrabold tracking-widest mt-1" style={{ color: "hsl(152,60%,32%)" }}>
                    {myProfile?.user_code}
                  </p>
                </div>
                <Button variant="outline" size="icon" onClick={copyCode} className="rounded-xl h-10 w-10">
                  {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Compartilhe este código com o Usuário Principal que deseja te vincular.
              </p>
              <Badge variant="outline" className="text-xs">Conta Familiar</Badge>
            </Card>

            {/* Dados pessoais */}
            <Card className="p-5 rounded-2xl border-border/40 space-y-4">
              <p className="text-sm font-bold text-foreground">Dados pessoais</p>
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Nome de exibição</Label>
                <Input value={editName} onChange={e => setEditName(e.target.value)}
                  placeholder="Seu nome" className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-success" /> WhatsApp (para notificações)
                </Label>
                <Input value={editWhatsapp} onChange={e => setEditWhatsapp(e.target.value)}
                  placeholder="5511999999999" type="tel" className="rounded-xl" />
                <p className="text-[10px] text-muted-foreground">Formato: código do país + DDD + número</p>
              </div>
              <Button onClick={handleSaveProfile} disabled={saving}
                className="w-full rounded-2xl font-bold text-white border-0" size="lg"
                style={{ background: CAREGIVER_GRADIENT }}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Salvando..." : "Salvar perfil"}
              </Button>
            </Card>

            {/* Notificações */}
            <Card className="p-5 rounded-2xl border-border/40 space-y-4">
              <p className="text-sm font-bold text-foreground flex items-center gap-2">
                <Bell className="h-4 w-4" style={{ color: "hsl(152,60%,32%)" }} />
                Preferências de notificação
              </p>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Notificações no app</p>
                    <p className="text-xs text-muted-foreground">Alertas quando doses forem perdidas</p>
                  </div>
                  <Switch checked={notifyApp} onCheckedChange={setNotifyApp} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Notificações WhatsApp</p>
                    <p className="text-xs text-muted-foreground">Relatório semanal via WhatsApp</p>
                  </div>
                  <Switch
                    checked={notifyWhatsapp}
                    onCheckedChange={v => {
                      if (v && !editWhatsapp) {
                        toast.warning("Cadastre seu WhatsApp primeiro");
                        return;
                      }
                      setNotifyWhatsapp(v);
                    }}
                  />
                </div>
              </div>
            </Card>

            <Button variant="ghost" onClick={signOut}
              className="w-full rounded-2xl text-muted-foreground">
              <LogOut className="h-4 w-4 mr-2" /> Sair da conta
            </Button>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
