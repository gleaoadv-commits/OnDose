import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Users, Check, X, UserX, Clock, ArrowLeft, Phone, UserPlus, Hash, Sparkles, Crown
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface FamilyLink {
  id: string;
  caregiver_user_id: string;
  status: string;
  created_at: string;
  caregiver_name?: string;
  caregiver_code?: string;
  caregiver_whatsapp?: string;
}

const FREE_CAREGIVERS = 2; // inclusos no premium
const EXTRA_MONTHLY = "R$19,90";

export default function FamilyLinksPage() {
  const { user } = useAuth();
  const { plan } = useApp();
  const navigate = useNavigate();
  const [links, setLinks] = useState<FamilyLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [caregiverCode, setCaregiverCode] = useState("");
  const [adding, setAdding] = useState(false);
  const [deleteDialogId, setDeleteDialogId] = useState<string | null>(null);
  const [extraLinkConfirm, setExtraLinkConfirm] = useState<string | null>(null); // caregiver_id para confirmar cobrança extra

  useEffect(() => {
    if (user) loadLinks();
  }, [user]);

  const loadLinks = async () => {
    if (!user) return;
    setLoading(true);

    const { data } = await supabase
      .from("family_links")
      .select("*")
      .eq("primary_user_id", user.id)
      .order("created_at", { ascending: false });

    if (data) {
      const enriched = await Promise.all(
        data.map(async (link: any) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name, user_code, whatsapp_number")
            .eq("user_id", link.caregiver_user_id)
            .single();
          return {
            ...link,
            caregiver_name: profile?.display_name || "Familiar",
            caregiver_code: profile?.user_code || null,
            caregiver_whatsapp: profile?.whatsapp_number || null,
          };
        })
      );
      setLinks(enriched);
    }
    setLoading(false);
  };

  const activeLinks = links.filter(l => l.status === "active");

  const handleAddByCode = async () => {
    const code = caregiverCode.trim().toUpperCase();
    if (!code) {
      toast.error("Informe o código do familiar");
      return;
    }
    if (!user) return;

    setAdding(true);
    try {
      // Buscar o caregiver pelo código
      const { data: caregiverId, error: rpcError } = await supabase
        .rpc("get_caregiver_id_by_code", { p_user_code: code });

      if (rpcError || !caregiverId) {
        toast.error("Código de familiar não encontrado. Verifique e tente novamente.");
        setAdding(false);
        return;
      }

      // Verificar se já existe vínculo com este familiar
      const alreadyLinked = links.some(l => l.caregiver_user_id === caregiverId);
      if (alreadyLinked) {
        toast.error("Este familiar já está vinculado à sua conta.");
        setAdding(false);
        return;
      }

      // Verificar limite: 2 ativos inclusos, cobrar extra a partir do 3º
      if (activeLinks.length >= FREE_CAREGIVERS) {
        setExtraLinkConfirm(caregiverId as string);
        setAdding(false);
        return;
      }

      await createLink(caregiverId as string);
    } catch (e: any) {
      toast.error("Erro ao adicionar familiar");
    } finally {
      setAdding(false);
    }
  };

  const createLink = async (caregiverId: string, skipCostWarning = false) => {
    if (!user) return;
    const { error } = await supabase.from("family_links").insert({
      primary_user_id: user.id,
      caregiver_user_id: caregiverId,
      status: "active",
    });

    if (error) {
      toast.error("Erro ao criar vínculo. O familiar pode já estar vinculado a outro paciente.");
      return;
    }

    toast.success("Familiar vinculado com sucesso!");
    setCaregiverCode("");
    setExtraLinkConfirm(null);
    loadLinks();
  };

  const updateLinkStatus = async (linkId: string, status: string) => {
    const { error } = await supabase
      .from("family_links")
      .update({ status })
      .eq("id", linkId);

    if (error) { toast.error("Erro ao atualizar vínculo"); return; }
    toast.success(status === "active" ? "Vínculo aprovado!" : "Vínculo desativado.");
    loadLinks();
  };

  const deleteLink = async (linkId: string) => {
    const { error } = await supabase.from("family_links").delete().eq("id", linkId);
    if (error) { toast.error("Erro ao remover vínculo"); return; }
    toast.success("Vínculo removido");
    setLinks(prev => prev.filter(l => l.id !== linkId));
    setDeleteDialogId(null);
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-[10px]"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
      case "active":
        return <Badge className="bg-success/10 text-success border-success/30 text-[10px]"><Check className="h-3 w-3 mr-1" />Ativo</Badge>;
      case "inactive":
        return <Badge className="bg-destructive/10 text-destructive border-destructive/30 text-[10px]"><X className="h-3 w-3 mr-1" />Inativo</Badge>;
      default:
        return null;
    }
  };

  // Guard: apenas premium
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
          <p className="text-sm text-muted-foreground">Vincule familiares para acompanhar seus medicamentos.</p>
          <Button onClick={() => navigate("/planos")} className="bg-gradient-to-r from-amber-500 to-amber-600 text-white border-0 rounded-2xl font-bold">
            Ver planos
          </Button>
        </Card>
      </div>
    );
  }

  const pendingLinks = links.filter(l => l.status === "pending");

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

      {/* Informação de limite */}
      <Card className="p-4 rounded-2xl border-amber-500/20 bg-amber-500/5">
        <div className="flex items-center gap-2">
          <Crown className="h-4 w-4 text-amber-500 shrink-0" />
          <p className="text-xs text-amber-700 leading-relaxed">
            Seu plano Premium inclui <strong>{FREE_CAREGIVERS} familiares</strong>. Familiares adicionais custam <strong>{EXTRA_MONTHLY}/mês</strong> cada.
          </p>
        </div>
      </Card>

      {/* Notificações de pendentes */}
      {pendingLinks.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {pendingLinks.length} solicitação{pendingLinks.length > 1 ? "ões" : ""} pendente{pendingLinks.length > 1 ? "s" : ""}
          </p>
          {pendingLinks.map(link => (
            <Card key={link.id} className="p-4 rounded-2xl border-amber-500/30 bg-amber-500/5">
              <div className="flex items-center gap-3">
                <div className="bg-amber-500/10 rounded-xl p-2">
                  <Users className="h-5 w-5 text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground">{link.caregiver_name}</p>
                  {link.caregiver_code && (
                    <p className="text-[10px] font-mono text-muted-foreground">{link.caregiver_code}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Solicitou em {new Date(link.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => updateLinkStatus(link.id, "active")}
                    className="h-9 w-9 rounded-xl text-success hover:bg-success/10"
                    title="Aprovar"
                  >
                    <Check className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteDialogId(link.id)}
                    className="h-9 w-9 rounded-xl text-destructive hover:bg-destructive/10"
                    title="Recusar"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Adicionar por código */}
      <Card className="p-4 rounded-2xl border-border/40 space-y-3">
        <p className="text-sm font-bold text-foreground flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-primary" />
          Adicionar familiar por código
        </p>
        <p className="text-xs text-muted-foreground">
          Peça ao familiar que abra o aplicativo e compartilhe o código exibido na tela inicial dele.
        </p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={caregiverCode}
              onChange={e => setCaregiverCode(e.target.value.toUpperCase())}
              placeholder="Ex: DC-A1B2C3"
              className="pl-9 rounded-xl font-mono tracking-widest font-bold uppercase"
            />
          </div>
          <Button
            onClick={handleAddByCode}
            disabled={adding || !caregiverCode.trim()}
            className="rounded-xl font-bold px-5 bg-gradient-to-r from-amber-500 to-amber-600 text-white border-0"
          >
            {adding ? "..." : "Vincular"}
          </Button>
        </div>
      </Card>

      {/* Lista de vínculos ativos/inativos */}
      {loading ? (
        <div className="text-center py-8">
          <div className="h-6 w-6 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : (
        <>
          {links.filter(l => l.status !== "pending").length === 0 && (
            <Card className="p-8 text-center rounded-2xl border-dashed border-2 border-border/50">
              <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-bold text-foreground">Nenhum familiar vinculado</p>
              <p className="text-xs text-muted-foreground mt-1">
                Adicione um familiar usando o código acima.
              </p>
            </Card>
          )}

          <div className="space-y-3">
            {links.filter(l => l.status !== "pending").map(link => (
              <Card key={link.id} className="p-4 rounded-2xl border-border/40">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 rounded-xl p-2">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground">{link.caregiver_name}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {statusBadge(link.status)}
                      {link.caregiver_code && (
                        <span className="text-[10px] font-mono text-muted-foreground">{link.caregiver_code}</span>
                      )}
                    </div>
                    {link.caregiver_whatsapp && (
                      <div className="flex items-center gap-1 mt-1">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground font-mono">{link.caregiver_whatsapp}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {link.status === "active" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => updateLinkStatus(link.id, "inactive")}
                        className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10"
                        title="Desativar"
                      >
                        <UserX className="h-4 w-4" />
                      </Button>
                    )}
                    {link.status === "inactive" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => updateLinkStatus(link.id, "active")}
                        className="h-8 w-8 rounded-lg text-success hover:bg-success/10"
                        title="Reativar"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteDialogId(link.id)}
                      className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10"
                      title="Remover"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Dialog confirmar remoção */}
      <AlertDialog open={!!deleteDialogId} onOpenChange={open => !open && setDeleteDialogId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Remover vínculo?</AlertDialogTitle>
            <AlertDialogDescription>
              O familiar perderá o acesso ao acompanhamento. Você poderá adicioná-lo novamente depois.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteDialogId && deleteLink(deleteDialogId)}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog confirmar familiar extra (cobrado) */}
      <AlertDialog open={!!extraLinkConfirm} onOpenChange={open => !open && setExtraLinkConfirm(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              Familiar adicional
            </AlertDialogTitle>
            <AlertDialogDescription className="leading-relaxed">
              Você já tem <strong>{FREE_CAREGIVERS} familiares</strong> inclusos no plano Premium. Adicionar mais um familiar terá um custo de <strong>{EXTRA_MONTHLY}/mês</strong> na sua assinatura.
              <br /><br />
              Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white border-0"
              onClick={() => extraLinkConfirm && createLink(extraLinkConfirm, true)}
            >
              Confirmar e adicionar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
