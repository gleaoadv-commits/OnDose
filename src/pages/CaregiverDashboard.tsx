import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, Heart, User, LogOut, CheckCircle2, Shield, Copy, Share2, X } from "lucide-react";
import { toast } from "sonner";
import OnDoseLogo from "@/components/OnDoseLogo";

interface LinkedProfile {
  display_name: string | null;
  user_code: string;
}

interface LinkInfo {
  id: string;
  status: string;
  primary_user_id: string;
}

interface MyProfile {
  display_name: string | null;
  user_code: string;
}

export default function CaregiverDashboard() {
  const { user, signOut } = useAuth();
  const [link, setLink] = useState<LinkInfo | null | undefined>(undefined); // undefined = loading
  const [primaryProfile, setPrimaryProfile] = useState<LinkedProfile | null>(null);
  const [myProfile, setMyProfile] = useState<MyProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadLinkData();
  }, [user]);

  const loadLinkData = async () => {
    if (!user) return;
    setLoading(true);

    // Load own profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("display_name, user_code")
      .eq("user_id", user.id)
      .single();
    if (profileData) setMyProfile(profileData as MyProfile);

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

    // Load primary user's profile (allowed by RLS for linked caregivers)
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, user_code")
      .eq("user_id", myLink.primary_user_id)
      .single();

    if (profile) setPrimaryProfile(profile as any);

    setLoading(false);
  };

  const copyCode = () => {
    if (!myProfile?.user_code) return;
    navigator.clipboard.writeText(myProfile.user_code);
    toast.success("Código copiado!");
  };

  const shareCode = async () => {
    if (!myProfile?.user_code) return;
    const text = `Olá! Meu código de familiar no OnDose é: ${myProfile.user_code}\n\nAcesse o app, vá em Familiares e insira este código para me vincular.`;
    if (navigator.share) {
      await navigator.share({ text });
    } else {
      navigator.clipboard.writeText(text);
      toast.success("Texto copiado para compartilhar!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-caregiver-muted flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-caregiver border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const caregiverName = myProfile?.display_name || user?.email?.split("@")[0] || "Familiar";

  // === SEM VÍNCULO: mostrar código e instruções ===
  if (!link) {
    return (
      <div className="min-h-screen bg-caregiver-muted flex flex-col">
        {/* Header */}
        <div className="px-5 pt-10 pb-6 flex flex-col items-center gap-3" style={{ background: "var(--gradient-caregiver)" }}>
          <OnDoseLogo size="md" theme="light" />
          <div className="mt-2 text-center">
            <p className="text-caregiver-foreground/80 font-semibold text-sm">
              Olá, <span className="text-caregiver-foreground font-bold">{caregiverName}</span> 👋
            </p>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-caregiver-foreground mt-1 inline-block">
              👨‍👩‍👧 Conta Familiar
            </span>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-4 pb-10 gap-4 pt-6">
          {/* Código do familiar */}
          <Card className="p-7 rounded-3xl max-w-sm w-full text-center space-y-5 border-caregiver/20 shadow-lg">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Share2 className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Seu código de familiar</p>
              <div className="bg-muted/60 rounded-2xl px-5 py-4 font-mono text-2xl font-extrabold tracking-widest text-foreground border border-border/40">
                {myProfile?.user_code || "—"}
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Compartilhe este código com o <strong className="text-foreground">paciente</strong>. Ele deve acessar <strong className="text-foreground">Familiares → Adicionar Familiar</strong> e inserir seu código para criar o vínculo.
            </p>
            <div className="flex gap-2">
              <Button
                onClick={copyCode}
                variant="outline"
                className="flex-1 rounded-xl font-bold border-border/60"
              >
                <Copy className="h-4 w-4 mr-2" /> Copiar
              </Button>
              <Button
                onClick={shareCode}
                className="flex-1 rounded-xl font-bold bg-caregiver text-caregiver-foreground hover:opacity-90"
              >
                <Share2 className="h-4 w-4 mr-2" /> Compartilhar
              </Button>
            </div>
          </Card>

          <Card className="p-4 rounded-2xl max-w-sm w-full border-amber-500/20 bg-amber-500/5">
            <p className="text-xs text-center text-amber-700 leading-relaxed">
              ⏳ Após o paciente te vincular, esta tela será atualizada automaticamente. O paciente precisa ter o plano <strong>Premium</strong> ativo.
            </p>
          </Card>

          <Button variant="ghost" onClick={signOut} className="rounded-xl text-muted-foreground">
            <LogOut className="h-4 w-4 mr-2" /> Sair
          </Button>
        </div>
      </div>
    );
  }

  // === PENDENTE: aguardando aprovação ===
  if (link.status === "pending") {
    return (
      <div className="min-h-screen bg-caregiver-muted flex flex-col">
        <div className="px-5 pt-10 pb-6 flex flex-col items-center gap-3" style={{ background: "var(--gradient-caregiver)" }}>
          <OnDoseLogo size="md" theme="light" />
          <div className="mt-2 text-center">
            <p className="text-caregiver-foreground/80 font-semibold text-sm">
              Olá, <span className="text-caregiver-foreground font-bold">{caregiverName}</span> 👋
            </p>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-caregiver-foreground mt-1 inline-block">
              👨‍👩‍👧 Conta Familiar
            </span>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-4 pb-10 gap-4 pt-6">
          <Card className="p-8 rounded-3xl max-w-sm w-full text-center space-y-5 border-caregiver/20 shadow-lg">
            <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mx-auto">
              <Clock className="h-8 w-8 text-warning animate-pulse" />
            </div>
            <div>
              <h2 className="text-elder-xl font-bold text-foreground">Aguardando aprovação</h2>
              {primaryProfile && (
                <p className="text-sm text-caregiver font-semibold mt-1">
                  Paciente: {primaryProfile.display_name || "Usuário"} · {primaryProfile.user_code}
                </p>
              )}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              O paciente ainda não aprovou seu vínculo. Assim que ele aprovar, você terá acesso ao acompanhamento de medicamentos.
            </p>

            {/* Mostrar código caso o paciente precise reenviar */}
            {myProfile?.user_code && (
              <div className="bg-muted/50 rounded-xl px-4 py-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Seu código</p>
                <p className="font-mono font-bold text-lg tracking-widest">{myProfile.user_code}</p>
              </div>
            )}

            <Button
              onClick={() => { loadLinkData(); toast.info("Verificando status..."); }}
              className="w-full rounded-xl bg-caregiver text-caregiver-foreground hover:opacity-90"
            >
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

  // === INATIVO: acesso revogado ===
  if (link.status === "inactive") {
    return (
      <div className="min-h-screen bg-caregiver-muted flex flex-col items-center justify-center px-4">
        <Card className="p-8 rounded-3xl max-w-sm w-full text-center space-y-4 border-destructive/20 shadow-lg">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <X className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-elder-xl font-bold text-foreground">Acesso desativado</h2>
          <p className="text-sm text-muted-foreground">O paciente desativou seu vínculo. Entre em contato para solicitar a reativação.</p>
          <Button onClick={signOut} className="w-full rounded-xl bg-caregiver text-caregiver-foreground hover:opacity-90">
            <LogOut className="h-4 w-4 mr-2" /> Sair
          </Button>
        </Card>
      </div>
    );
  }

  // === ATIVO: dashboard principal ===
  return (
    <div className="min-h-screen bg-caregiver-muted flex flex-col">
      <header className="px-5 pt-10 pb-6 sticky top-0 z-10 shadow-elevated" style={{ background: "var(--gradient-caregiver)" }}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            <OnDoseLogo size="md" theme="light" />
            <Button
              variant="ghost"
              size="icon"
              onClick={signOut}
              className="text-caregiver-foreground/70 hover:text-caregiver-foreground hover:bg-white/10 rounded-xl"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <div className="bg-white/20 rounded-full p-1.5">
              <User className="h-4 w-4 text-caregiver-foreground/90" />
            </div>
            <div>
              <p className="text-sm text-caregiver-foreground/80 font-semibold">
                Olá, <span className="text-caregiver-foreground font-bold">{caregiverName}</span> 👋
              </p>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-caregiver-foreground mt-0.5 inline-block">
                👨‍👩‍👧 Conta Familiar
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 max-w-2xl mx-auto w-full space-y-4 pt-5">
        {primaryProfile && (
          <Card className="p-5 rounded-3xl border-caregiver/20 bg-card shadow-card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-caregiver/10 flex items-center justify-center shrink-0">
                <Heart className="h-6 w-6 text-caregiver" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-caregiver-muted-foreground uppercase tracking-wider">Você acompanha</p>
                <p className="text-base font-extrabold text-foreground mt-0.5 truncate">
                  {primaryProfile.display_name || "Usuário"}
                </p>
                <p className="text-xs text-muted-foreground font-mono tracking-widest">{primaryProfile.user_code}</p>
              </div>
              <div className="shrink-0">
                <span className="flex items-center gap-1 text-xs font-bold text-success bg-success/10 px-2 py-1 rounded-full">
                  <CheckCircle2 className="h-3 w-3" />
                  Ativo
                </span>
              </div>
            </div>
          </Card>
        )}

        <Card className="p-6 rounded-3xl border-caregiver/20 bg-card shadow-card text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-caregiver/10 flex items-center justify-center mx-auto">
            <Shield className="h-7 w-7 text-caregiver" />
          </div>
          <div>
            <p className="text-base font-bold text-foreground">Vínculo familiar ativo</p>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              Você receberá relatórios semanais sobre a adesão ao tratamento de{" "}
              <strong className="text-foreground">{primaryProfile?.display_name || "seu familiar"}</strong> no WhatsApp.
            </p>
          </div>
        </Card>

        <p className="text-center text-xs text-caregiver-muted-foreground pb-6">
          Para desativar este vínculo, peça ao paciente que acesse a tela de Familiares.
        </p>
      </main>
    </div>
  );
}
