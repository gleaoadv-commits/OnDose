import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../integrations/supabase/client";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  ArrowLeft,
  Users,
  Plus,
  Mail,
  Phone,
  Monitor,
  Trash2,
  Edit,
  Sparkles,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";

interface Caregiver {
  id: string;
  name: string;
  email: string | null;
  whatsapp: string | null;
  notify_email: boolean;
  notify_whatsapp: boolean;
  notify_app: boolean;
  report_frequency: string;
  active: boolean;
}

export default function CaregiversPage() {
  const { plan } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(false);
  const [notifyApp, setNotifyApp] = useState(false);
  const [reportFrequency, setReportFrequency] = useState("weekly");

  useEffect(() => {
    if (user) loadCaregivers();
  }, [user]);

  const loadCaregivers = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("caregivers")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setCaregivers(data);
    setLoading(false);
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setWhatsapp("");
    setNotifyEmail(true);
    setNotifyWhatsapp(false);
    setNotifyApp(false);
    setReportFrequency("weekly");
    setEditingId(null);
  };

  const openEdit = (c: Caregiver) => {
    setName(c.name);
    setEmail(c.email || "");
    setWhatsapp(c.whatsapp || "");
    setNotifyEmail(c.notify_email);
    setNotifyWhatsapp(c.notify_whatsapp);
    setNotifyApp(c.notify_app);
    setReportFrequency(c.report_frequency);
    setEditingId(c.id);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!user || !name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    const payload = {
      user_id: user.id,
      name: name.trim(),
      email: email.trim() || null,
      whatsapp: whatsapp.trim() || null,
      notify_email: notifyEmail,
      notify_whatsapp: notifyWhatsapp,
      notify_app: notifyApp,
      report_frequency: reportFrequency,
    };

    if (editingId) {
      const { error } = await supabase
        .from("caregivers")
        .update(payload)
        .eq("id", editingId);
      if (error) {
        toast.error("Erro ao atualizar");
        return;
      }
      toast.success("Familiar atualizado!");
    } else {
      const { error } = await supabase
        .from("caregivers")
        .insert(payload);
      if (error) {
        toast.error("Erro ao cadastrar");
        return;
      }
      toast.success("Familiar cadastrado!");
    }

    setDialogOpen(false);
    resetForm();
    loadCaregivers();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("caregivers").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao remover");
      return;
    }
    toast.success("Familiar removido");
    setCaregivers((prev) => prev.filter((c) => c.id !== id));
  };

  const toggleActive = async (c: Caregiver) => {
    await supabase
      .from("caregivers")
      .update({ active: !c.active })
      .eq("id", c.id);
    setCaregivers((prev) =>
      prev.map((x) => (x.id === c.id ? { ...x, active: !x.active } : x))
    );
  };

  if (plan !== "premium") {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-xl">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="section-header mb-0">
            <Users className="h-5 w-5 text-amber-500" />
            Familiares
          </h2>
        </div>
        <Card className="p-6 rounded-2xl border-border/40 text-center space-y-3">
          <Sparkles className="h-10 w-10 text-amber-500 mx-auto" />
          <p className="text-elder-base font-bold text-foreground">Recurso exclusivo Premium</p>
          <p className="text-sm text-muted-foreground">
            Cadastre familiares para acompanhar seus medicamentos.
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
          <Users className="h-5 w-5 text-amber-500" />
          Familiares
        </h2>
      </div>

      <p className="text-sm text-muted-foreground">
        Cadastre familiares para receberem relatórios sobre sua adesão aos medicamentos.
      </p>

      {/* Add button */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
        <DialogTrigger asChild>
          <Button className="w-full rounded-2xl font-bold h-11 bg-gradient-to-r from-amber-500 to-amber-600 text-white border-0">
            <UserPlus className="h-4 w-4 mr-2" /> Adicionar Familiar
          </Button>
        </DialogTrigger>
        <DialogContent className="rounded-2xl max-w-[380px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Familiar" : "Novo Familiar"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-bold">Nome *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do familiar" className="rounded-xl mt-1" />
            </div>
            <div>
              <Label className="text-xs font-bold">E-mail</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.com" type="email" className="rounded-xl mt-1" />
            </div>
            <div>
              <Label className="text-xs font-bold">WhatsApp</Label>
              <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+55 11 99999-9999" className="rounded-xl mt-1" />
            </div>

            <div className="space-y-3 pt-2">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Notificações</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">E-mail</span>
                </div>
                <Switch checked={notifyEmail} onCheckedChange={setNotifyEmail} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">WhatsApp</span>
                </div>
                <Switch checked={notifyWhatsapp} onCheckedChange={setNotifyWhatsapp} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Monitor className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">No app (familiar)</span>
                </div>
                <Switch checked={notifyApp} onCheckedChange={setNotifyApp} />
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold">Frequência dos relatórios</Label>
              <Select value={reportFrequency} onValueChange={setReportFrequency}>
                <SelectTrigger className="rounded-xl mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleSave} className="w-full rounded-xl font-bold bg-gradient-to-r from-amber-500 to-amber-600 text-white border-0">
              {editingId ? "Salvar alterações" : "Cadastrar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="h-6 w-6 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : caregivers.length === 0 ? (
        <Card className="p-8 text-center rounded-2xl border-dashed border-2 border-border/50">
          <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-bold text-foreground">Nenhum familiar cadastrado</p>
          <p className="text-xs text-muted-foreground mt-1">Adicione um familiar para acompanhar seus medicamentos.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {caregivers.map((c) => (
            <Card key={c.id} className={`p-4 rounded-2xl border-border/40 ${!c.active ? "opacity-50" : ""}`}>
              <div className="flex items-center gap-3">
                <div className="bg-amber-500/10 rounded-xl p-2">
                  <Users className="h-5 w-5 text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground">{c.name}</p>
                  <div className="flex gap-1.5 mt-1 flex-wrap">
                    {c.notify_email && <Badge variant="outline" className="text-[9px] px-1.5 py-0"><Mail className="h-2.5 w-2.5 mr-0.5" />E-mail</Badge>}
                    {c.notify_whatsapp && <Badge variant="outline" className="text-[9px] px-1.5 py-0"><Phone className="h-2.5 w-2.5 mr-0.5" />WhatsApp</Badge>}
                    {c.notify_app && <Badge variant="outline" className="text-[9px] px-1.5 py-0"><Monitor className="h-2.5 w-2.5 mr-0.5" />App</Badge>}
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                      {c.report_frequency === "weekly" ? "Semanal" : "Mensal"}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Switch checked={c.active} onCheckedChange={() => toggleActive(c)} />
                  <Button variant="ghost" size="icon" onClick={() => openEdit(c)} className="h-8 w-8 rounded-lg">
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)} className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/5">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
