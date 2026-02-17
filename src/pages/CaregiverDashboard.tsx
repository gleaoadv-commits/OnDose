import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, Pill, User, LogOut } from "lucide-react";
import { toast } from "sonner";

interface LinkedProfile {
  display_name: string | null;
  user_code: string;
}

interface LinkInfo {
  id: string;
  status: string;
  primary_user_id: string;
}

export default function CaregiverDashboard() {
  const { user, signOut } = useAuth();
  const [link, setLink] = useState<LinkInfo | null>(null);
  const [primaryProfile, setPrimaryProfile] = useState<LinkedProfile | null>(null);
  const [medications, setMedications] = useState<any[]>([]);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadLinkData();
  }, [user]);

  const loadLinkData = async () => {
    if (!user) return;
    setLoading(true);

    // Find the family link for this caregiver
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

    if (myLink.status === "active") {
      // Load the primary user's profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, user_code")
        .eq("user_id", myLink.primary_user_id)
        .single();

      if (profile) setPrimaryProfile(profile as any);

      // Load primary user's medications (via RLS bypass won't work - need edge function or different approach)
      // For now, we show that they're linked
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // No link found
  if (!link) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <Card className="p-8 rounded-2xl max-w-sm text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto" />
          <h2 className="text-elder-xl font-bold text-foreground">Nenhum vínculo encontrado</h2>
          <p className="text-sm text-muted-foreground">
            Sua conta de familiar não está vinculada a nenhum usuário principal. Verifique se inseriu o ID correto ao criar a conta.
          </p>
          <Button variant="outline" onClick={signOut} className="rounded-xl">
            <LogOut className="h-4 w-4 mr-2" /> Sair
          </Button>
        </Card>
      </div>
    );
  }

  // Pending approval
  if (link.status === "pending") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <Card className="p-8 rounded-2xl max-w-sm text-center space-y-4">
          <Clock className="h-12 w-12 text-amber-500 mx-auto animate-pulse" />
          <h2 className="text-elder-xl font-bold text-foreground">Aguardando aprovação</h2>
          <p className="text-sm text-muted-foreground">
            O usuário principal ainda não aprovou seu pedido de vínculo. Quando for aprovado, você terá acesso ao acompanhamento de medicamentos.
          </p>
          <Button variant="outline" onClick={() => { loadLinkData(); toast.info("Verificando..."); }} className="rounded-xl">
            Verificar status
          </Button>
          <Button variant="ghost" onClick={signOut} className="rounded-xl text-muted-foreground">
            <LogOut className="h-4 w-4 mr-2" /> Sair
          </Button>
        </Card>
      </div>
    );
  }

  // Inactive/revoked
  if (link.status === "inactive") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <Card className="p-8 rounded-2xl max-w-sm text-center space-y-4 border-destructive/30">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
          <h2 className="text-elder-xl font-bold text-foreground">Acesso desativado</h2>
          <p className="text-sm text-muted-foreground">
            O usuário principal desativou seu acesso. Entre em contato para solicitar a reativação.
          </p>
          <Button variant="outline" onClick={signOut} className="rounded-xl">
            <LogOut className="h-4 w-4 mr-2" /> Sair
          </Button>
        </Card>
      </div>
    );
  }

  // Active - show primary user's info
  return (
    <div className="min-h-screen bg-background p-4 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-elder-xl font-bold text-foreground flex items-center gap-2">
          <Pill className="h-5 w-5 text-primary" />
          Acompanhamento
        </h2>
        <Button variant="ghost" size="icon" onClick={signOut} className="rounded-xl">
          <LogOut className="h-5 w-5" />
        </Button>
      </div>

      {primaryProfile && (
        <Card className="p-5 rounded-2xl border-primary/20 bg-primary/5">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 rounded-xl p-2">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">
                Acompanhando: {primaryProfile.display_name || "Usuário"}
              </p>
              <p className="text-xs text-muted-foreground">ID: {primaryProfile.user_code}</p>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-6 rounded-2xl border-border/40 text-center space-y-3">
        <Pill className="h-10 w-10 text-primary mx-auto" />
        <p className="text-sm font-bold text-foreground">Vínculo ativo!</p>
        <p className="text-xs text-muted-foreground">
          Você receberá notificações sobre os medicamentos do usuário principal conforme configurado.
        </p>
      </Card>
    </div>
  );
}
