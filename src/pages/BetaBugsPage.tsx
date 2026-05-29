import { useEffect, useRef, useState } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Bug, Plus, Trash2, CheckCircle2, RotateCcw, ImagePlus, X, Mic, Square } from "lucide-react";
import { supabase } from "../integrations/supabase/client";
import { useAuth } from "../context/AuthContext";
import { useIsBeta } from "../hooks/useIsBeta";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";

type BugReport = {
  id: string;
  title: string;
  description: string | null;
  page: string | null;
  severity: string;
  status: string;
  created_at: string;
  screenshot_url?: string | null;
  audio_url?: string | null;
};

const SEVERITIES = [
  { value: "low", label: "Baixa", color: "bg-blue-500/15 text-blue-700" },
  { value: "medium", label: "Média", color: "bg-amber-500/15 text-amber-700" },
  { value: "high", label: "Alta", color: "bg-orange-500/15 text-orange-700" },
  { value: "critical", label: "Crítica", color: "bg-red-500/15 text-red-700" },
];

export default function BetaBugsPage() {
  const { user } = useAuth();
  const { isBeta, loading: loadingRole } = useIsBeta();
  const [bugs, setBugs] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [page, setPage] = useState("");
  const [severity, setSeverity] = useState("medium");
  const [saving, setSaving] = useState(false);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioPreview, setAudioPreview] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("bug_reports" as any)
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setBugs((data as any) || []);
    setLoading(false);
  };

  useEffect(() => {
    if (isBeta) load();
  }, [isBeta, user]);

  if (loadingRole) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isBeta) return <Navigate to="/" replace />;

  const handleCreate = async () => {
    if (!user || !title.trim()) {
      toast.error("Informe ao menos um título");
      return;
    }
    setSaving(true);
    let screenshot_url: string | null = null;
    if (screenshot) {
      setUploading(true);
      const ext = screenshot.name.split(".").pop() || "png";
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("bug-screenshots")
        .upload(path, screenshot, { upsert: false, contentType: screenshot.type });
      setUploading(false);
      if (upErr) {
        toast.error("Erro ao enviar imagem");
        console.error(upErr);
        setSaving(false);
        return;
      }
      const { data: pub } = supabase.storage.from("bug-screenshots").getPublicUrl(path);
      screenshot_url = pub.publicUrl;
    }
    let audio_url: string | null = null;
    if (audioBlob) {
      setUploading(true);
      const ext = (audioBlob.type.includes("mp4") || audioBlob.type.includes("aac")) ? "m4a" : "webm";
      const path = `${user.id}/audio-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("bug-screenshots")
        .upload(path, audioBlob, { upsert: false, contentType: audioBlob.type || "audio/webm" });
      setUploading(false);
      if (upErr) {
        toast.error("Erro ao enviar áudio");
        console.error(upErr);
        setSaving(false);
        return;
      }
      const { data: pub } = supabase.storage.from("bug-screenshots").getPublicUrl(path);
      audio_url = pub.publicUrl;
    }
    const { error } = await supabase.from("bug_reports" as any).insert({
      user_id: user.id,
      title: title.trim(),
      description: description.trim() || null,
      page: page.trim() || null,
      severity,
      screenshot_url,
      audio_url,
    } as any);
    if (error) {
      toast.error("Erro ao registrar bug");
      console.error(error);
    } else {
      toast.success("Bug catalogado!");
      setTitle("");
      setDescription("");
      setPage("");
      setSeverity("medium");
      setScreenshot(null);
      setScreenshotPreview(null);
      setAudioBlob(null);
      setAudioPreview(null);
      load();
    }
    setSaving(false);
  };

  const pickMimeType = () => {
    const candidates = [
      "audio/mp4;codecs=mp4a.40.2",
      "audio/mp4",
      "audio/aac",
      "audio/webm;codecs=opus",
      "audio/webm",
    ];
    for (const t of candidates) {
      if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported?.(t)) return t;
    }
    return "";
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = pickMimeType();
      const mr = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      audioChunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const type = mr.mimeType || mimeType || "audio/webm";
        const blob = new Blob(audioChunksRef.current, { type });
        if (blob.size > 10 * 1024 * 1024) {
          toast.error("Áudio muito longo (máx 10MB)");
        } else {
          setAudioBlob(blob);
          setAudioPreview(URL.createObjectURL(blob));
        }
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível acessar o microfone");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const clearAudio = () => {
    setAudioBlob(null);
    setAudioPreview(null);
  };

  const handleFile = (f: File | null) => {
    if (!f) {
      setScreenshot(null);
      setScreenshotPreview(null);
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande (máx 5MB)");
      return;
    }
    setScreenshot(f);
    setScreenshotPreview(URL.createObjectURL(f));
  };

  const toggleStatus = async (bug: BugReport) => {
    const newStatus = bug.status === "open" ? "resolved" : "open";
    await supabase.from("bug_reports" as any).update({ status: newStatus } as any).eq("id", bug.id);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir este registro?")) return;
    await supabase.from("bug_reports" as any).delete().eq("id", id);
    load();
  };

  const open = bugs.filter(b => b.status === "open");
  const resolved = bugs.filter(b => b.status !== "open");

  return (
    <div className="space-y-5">
      <h2 className="section-header">
        <Bug className="h-5 w-5 text-primary" />
        Beta — Catálogo de Bugs
      </h2>

      <Card className="p-5 rounded-2xl border-primary/20 bg-primary/5 space-y-4">
        <div className="flex items-center gap-2">
          <Plus className="h-4 w-4 text-primary" />
          <p className="text-sm font-bold text-foreground">Novo registro</p>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold">Título *</Label>
          <Input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Ex: Botão de salvar não responde"
            className="rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold">Descrição</Label>
          <Textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Passos para reproduzir, comportamento esperado, etc."
            className="rounded-xl min-h-[100px]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Tela / Página</Label>
            <Input
              value={page}
              onChange={e => setPage(e.target.value)}
              placeholder="Ex: /agenda"
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Severidade</Label>
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SEVERITIES.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold">Print da tela (opcional)</Label>
          {screenshotPreview ? (
            <div className="relative rounded-xl overflow-hidden border border-border">
              <img src={screenshotPreview} alt="Preview" className="w-full max-h-64 object-contain bg-muted" />
              <button
                type="button"
                onClick={() => handleFile(null)}
                className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 active:scale-95"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label className="flex items-center justify-center gap-2 w-full rounded-xl border-2 border-dashed border-border bg-muted/40 py-4 cursor-pointer text-sm font-semibold text-muted-foreground hover:bg-muted/60">
              <ImagePlus className="h-4 w-4" />
              Anexar imagem
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] || null)}
              />
            </label>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold">Áudio (opcional)</Label>
          {audioPreview ? (
            <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 p-2">
              <audio src={audioPreview} controls className="flex-1 h-10" />
              <button
                type="button"
                onClick={clearAudio}
                className="bg-black/60 text-white rounded-full p-1.5 active:scale-95 shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : recording ? (
            <button
              type="button"
              onClick={stopRecording}
              className="flex items-center justify-center gap-2 w-full rounded-xl bg-destructive text-destructive-foreground py-4 text-sm font-bold active:scale-[0.98]"
            >
              <Square className="h-4 w-4 fill-current" />
              Parar gravação
              <span className="h-2 w-2 rounded-full bg-white/90 animate-pulse" />
            </button>
          ) : (
            <button
              type="button"
              onClick={startRecording}
              className="flex items-center justify-center gap-2 w-full rounded-xl border-2 border-dashed border-border bg-muted/40 py-4 text-sm font-semibold text-muted-foreground hover:bg-muted/60"
            >
              <Mic className="h-4 w-4" />
              Gravar áudio
            </button>
          )}
        </div>


        <Button
          onClick={handleCreate}
          disabled={saving || uploading}
          className="w-full rounded-2xl font-bold"
          size="lg"
        >
          <Plus className="h-4 w-4 mr-2" />
          {uploading ? "Enviando anexo..." : saving ? "Salvando..." : "Catalogar bug"}
        </Button>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="space-y-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Em aberto ({open.length})
            </p>
            {open.length === 0 && (
              <Card className="p-4 rounded-2xl text-center text-sm text-muted-foreground">
                Nenhum bug em aberto 🎉
              </Card>
            )}
            {open.map(bug => (
              <BugCard key={bug.id} bug={bug} onToggle={toggleStatus} onDelete={remove} />
            ))}
          </div>

          {resolved.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Resolvidos ({resolved.length})
              </p>
              {resolved.map(bug => (
                <BugCard key={bug.id} bug={bug} onToggle={toggleStatus} onDelete={remove} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function BugCard({ bug, onToggle, onDelete }: { bug: BugReport; onToggle: (b: BugReport) => void; onDelete: (id: string) => void }) {
  const sev = SEVERITIES.find(s => s.value === bug.severity) || SEVERITIES[1];
  const isResolved = bug.status !== "open";
  return (
    <Card className={`p-4 rounded-2xl space-y-2 ${isResolved ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold text-foreground ${isResolved ? "line-through" : ""}`}>{bug.title}</p>
          {bug.description && (
            <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{bug.description}</p>
          )}
        </div>
        <Badge className={`${sev.color} border-0 text-[10px] shrink-0`}>{sev.label}</Badge>
      </div>
      {bug.screenshot_url && (
        <a href={bug.screenshot_url} target="_blank" rel="noreferrer" className="block rounded-xl overflow-hidden border border-border">
          <img src={bug.screenshot_url} alt="Print do bug" className="w-full max-h-48 object-contain bg-muted" />
        </a>
      )}
      {bug.audio_url && (
        <div className="space-y-1">
          <audio src={bug.audio_url} controls preload="metadata" className="w-full h-10" />
          <a
            href={bug.audio_url}
            target="_blank"
            rel="noreferrer"
            download
            className="block text-[11px] text-primary underline"
          >
            Não tocou? Abrir/baixar áudio
          </a>
        </div>
      )}
      <div className="flex items-center gap-2 flex-wrap text-[11px] text-muted-foreground">
        {bug.page && <span className="px-2 py-0.5 bg-muted rounded-full">{bug.page}</span>}
        <span>{new Date(bug.created_at).toLocaleDateString("pt-BR")}</span>
      </div>
      <div className="flex gap-2 pt-1">
        <Button variant="outline" size="sm" className="rounded-xl flex-1" onClick={() => onToggle(bug)}>
          {isResolved ? (<><RotateCcw className="h-3.5 w-3.5 mr-1" />Reabrir</>) : (<><CheckCircle2 className="h-3.5 w-3.5 mr-1" />Resolvido</>)}
        </Button>
        <Button variant="outline" size="sm" className="rounded-xl text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => onDelete(bug.id)}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </Card>
  );
}
