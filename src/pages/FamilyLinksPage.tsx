import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Check, X, UserX, Clock, ArrowLeft, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface FamilyLink {
  id: string;
  caregiver_user_id: string;
  status: string;
  created_at: string;
  caregiver_name?: string;
  caregiver_whatsapp?: string;
}

export default function FamilyLinksPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [links, setLinks] = useState<FamilyLink[]>([]);
  const [loading, setLoading] = useState(true);

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
            .select("display_name, whatsapp_number")
            .eq("user_id", link.caregiver_user_id)
            .single();
          return {
            ...link,
            caregiver_name: profile?.display_name || "Sem nome",
            caregiver_whatsapp: profile?.whatsapp_number || null,
          };
        })
      );
      setLinks(enriched);
    }
    setLoading(false);
  };

  const updateLinkStatus = async (linkId: string, status: string) => {
    const { error } = await supabase
      .from("family_links")
      .update({ status })
      .eq("id", linkId);

    if (error) { toast.error("Erro ao atualizar vínculo"); return; }
    toast.success(status === "active" ? "Vínculo ativado!" : "Vínculo desativado.");
    loadLinks();
  };

  const deleteLink = async (linkId: string) => {
    const { error } = await supabase.from("family_links").delete().eq("id", linkId);
    if (error) { toast.error("Erro ao remover vínculo"); return; }
    toast.success("Vínculo removido");
    setLinks((prev) => prev.filter((l) => l.id !== linkId));
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

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-xl">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="section-header mb-0">
          <Users className="h-5 w-5 text-primary" />
          Vínculos Familiares
        </h2>
      </div>

      <p className="text-sm text-muted-foreground">
        Familiares vinculados recebem um relatório semanal de adesão via WhatsApp (quando disponível).
      </p>

      {loading ? (
        <div className="text-center py-8">
          <div className="h-6 w-6 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : links.length === 0 ? (
        <Card className="p-8 text-center rounded-2xl border-dashed border-2 border-border/50">
          <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-bold text-foreground">Nenhum vínculo solicitado</p>
          <p className="text-xs text-muted-foreground mt-1">
            Compartilhe seu ID com familiares para que eles possam solicitar vínculo.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {links.map((link) => (
            <Card key={link.id} className="p-4 rounded-2xl border-border/40">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 rounded-xl p-2">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground">{link.caregiver_name}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {statusBadge(link.status)}
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(link.created_at).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  {/* WhatsApp info (read-only) */}
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                    {link.caregiver_whatsapp ? (
                      <span className="text-xs text-muted-foreground font-mono">{link.caregiver_whatsapp}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">WhatsApp não cadastrado pelo familiar</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {link.status === "pending" && (
                    <>
                      <Button variant="ghost" size="icon" onClick={() => updateLinkStatus(link.id, "active")} className="h-8 w-8 rounded-lg text-success hover:bg-success/10" title="Aprovar">
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => updateLinkStatus(link.id, "inactive")} className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10" title="Rejeitar">
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  {link.status === "active" && (
                    <Button variant="ghost" size="icon" onClick={() => updateLinkStatus(link.id, "inactive")} className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10" title="Desativar">
                      <UserX className="h-4 w-4" />
                    </Button>
                  )}
                  {link.status === "inactive" && (
                    <Button variant="ghost" size="icon" onClick={() => updateLinkStatus(link.id, "active")} className="h-8 w-8 rounded-lg text-success hover:bg-success/10" title="Reativar">
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
