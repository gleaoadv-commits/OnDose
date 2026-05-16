import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../components/ui/alert-dialog";
import { User, Phone, Save, Copy, Check, FileText, Lock, Eye, EyeOff, Trash2, AlertTriangle, Gift, Users, Trophy } from "lucide-react";
import { supabase } from "../integrations/supabase/client";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [userCode, setUserCode] = useState("");
  const [accountType, setAccountType] = useState("primary");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [referralCount, setReferralCount] = useState(0);
  const [referralReward, setReferralReward] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [profileRes, referralsRes, rewardsRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("display_name, whatsapp_number, user_code, account_type")
          .eq("user_id", user.id)
          .single(),
        supabase
          .from("referrals")
          .select("id")
          .eq("referrer_user_id", user.id),
        supabase
          .from("referral_rewards")
          .select("*")
          .eq("user_id", user.id)
          .eq("reward_type", "coupon_5_percent")
          .maybeSingle(),
      ]);

      if (profileRes.data) {
        setDisplayName(profileRes.data.display_name || "");
        setWhatsappNumber((profileRes.data as any).whatsapp_number || "");
        setUserCode((profileRes.data as any).user_code || "");
        setAccountType((profileRes.data as any).account_type || "primary");
      }
      setReferralCount(referralsRes.data?.length ?? 0);
      setReferralReward(rewardsRes.data ?? null);
      setLoading(false);
    };
    load();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName,
        whatsapp_number: whatsappNumber || null,
      } as any)
      .eq("user_id", user.id);

    if (error) {
      toast.error("Erro ao salvar perfil");
      console.error(error);
    } else {
      toast.success("Perfil atualizado!");
    }
    setSaving(false);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(userCode);
    setCopied(true);
    toast.success("Código copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast.error("Erro ao alterar senha");
    } else {
      toast.success("Senha alterada com sucesso!");
      setNewPassword("");
    }
    setSavingPassword(false);
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeletingAccount(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.access_token) {
        toast.error("Sessão expirada. Faça login novamente.");
        return;
      }
      const { data, error } = await supabase.functions.invoke("delete-account", {
        headers: { Authorization: `Bearer ${sessionData.session.access_token}` },
      });
      if (error || data?.error) {
        toast.error("Erro ao excluir conta. Tente novamente.");
        console.error(error || data?.error);
        return;
      }
      await signOut();
      navigate("/auth");
      toast.success("Conta excluída com sucesso.");
    } catch (err) {
      toast.error("Erro inesperado. Tente novamente.");
      console.error(err);
    } finally {
      setDeletingAccount(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h2 className="section-header">
        <User className="h-5 w-5 text-primary" />
        Meu Perfil
      </h2>

      {/* User Code Card */}
      <Card className="p-5 rounded-2xl border-primary/20 bg-primary/5 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Seu ID OnDose</p>
            <p className="text-elder-2xl font-extrabold text-primary tracking-widest mt-1">{userCode}</p>
          </div>
          <Button variant="outline" size="icon" onClick={copyCode} className="rounded-xl h-10 w-10">
            {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Compartilhe este código com familiares que desejam acompanhar seus medicamentos.
        </p>
        <Badge variant="outline" className="text-xs">
          {accountType === "primary" ? "Conta Principal" : "Conta Familiar"}
        </Badge>
      </Card>

      {/* Referral Program Card */}
      <Card className="p-5 rounded-2xl border-accent/30 bg-accent/5 space-y-4">
        <div className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-accent" />
          <p className="text-sm font-bold text-foreground">Programa de Indicação</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Indicações confirmadas</span>
            <span className="font-bold text-foreground">{referralCount}/3</span>
          </div>
          <Progress value={Math.min((referralCount / 3) * 100, 100)} className="h-2.5" />
        </div>

        {/* Referral avatars/icons */}
        <div className="flex items-center gap-2">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${i < referralCount
                  ? "bg-accent text-white shadow-md"
                  : "bg-muted/60 text-muted-foreground border border-border/40"
                }`}
            >
              {i < referralCount ? (
                <Users className="h-4 w-4" />
              ) : (
                <span className="text-xs">?</span>
              )}
            </div>
          ))}
          {referralCount >= 3 && (
            <div className="ml-2 flex items-center gap-1.5 bg-amber-400/20 text-amber-700 px-3 py-1.5 rounded-full">
              <Trophy className="h-4 w-4" />
              <span className="text-xs font-bold">Meta alcançada!</span>
            </div>
          )}
        </div>

        {referralReward ? (
          <div className="p-3 rounded-xl bg-accent/10 border border-accent/30 space-y-1">
            <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
              🎉 Parabéns! Você ganhou um cupom de 5% de desconto!
            </p>
            <p className="text-xs text-muted-foreground">
              {referralReward.coupon_code
                ? `Cupom: ${referralReward.coupon_code}`
                : "Seu cupom será enviado em breve via WhatsApp."}
            </p>
            <p className="text-xs text-muted-foreground">
              Válido até: {referralReward.expires_at ? new Date(referralReward.expires_at).toLocaleDateString("pt-BR") : "—"}
              {" · "}Apenas planos Premium
            </p>
            {referralReward.used && (
              <Badge className="bg-muted text-muted-foreground text-[10px]">Utilizado</Badge>
            )}
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-muted/40 border border-border/40 space-y-1">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Indique <strong className="text-foreground">3 amigos</strong> usando seu ID <strong className="text-primary">{userCode}</strong> e ganhe um
              <strong className="text-foreground"> cupom de 5%</strong> na assinatura Premium!
            </p>
            <p className="text-[10px] text-muted-foreground">
              O cupom é válido por 30 dias após ser concedido e aplicável apenas em assinaturas Premium.
            </p>
          </div>
        )}
      </Card>

      <Card className="p-5 rounded-2xl border-border/40 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-elder-sm font-semibold text-foreground">
            Nome de exibição
          </Label>
          <Input
            id="name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Seu nome"
            className="rounded-xl text-elder-base"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="whatsapp" className="text-elder-sm font-semibold text-foreground flex items-center gap-2">
            <Phone className="h-4 w-4 text-success" />
            WhatsApp (para lembretes PRO)
          </Label>
          <Input
            id="whatsapp"
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            placeholder="5511999999999"
            className="rounded-xl text-elder-base"
            type="tel"
          />
          <p className="text-xs text-muted-foreground">
            Formato: código do país + DDD + número (ex: 5511999999999)
          </p>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-2xl text-elder-base font-bold"
          size="lg"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Salvando..." : "Salvar perfil"}
        </Button>
      </Card>

      {/* Change Password Card */}
      <Card className="p-5 rounded-2xl border-border/40 space-y-4">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-primary" />
          <p className="text-elder-sm font-bold text-foreground">Alterar senha</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-password" className="text-elder-sm font-semibold text-foreground">
            Nova senha
          </Label>
          <div className="relative">
            <Input
              id="new-password"
              type={showPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="rounded-xl text-elder-base pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <Button
          onClick={handleChangePassword}
          disabled={savingPassword || newPassword.length < 6}
          variant="outline"
          className="w-full rounded-2xl text-elder-base font-bold"
          size="lg"
        >
          <Lock className="h-4 w-4 mr-2" />
          {savingPassword ? "Salvando..." : "Alterar senha"}
        </Button>
      </Card>

      {/* Medication history */}
      <Card className="p-4 rounded-2xl border-border/40">
        <Link to="/historico" className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors">
          <FileText className="h-5 w-5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground">Histórico de Medicamentos</p>
            <p className="text-xs text-muted-foreground">Veja medicamentos excluídos e suas datas</p>
          </div>
        </Link>
      </Card>

      {/* Terms link */}
      <Card className="p-4 rounded-2xl border-border/40">
        <Link to="/termos" className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors">
          <FileText className="h-5 w-5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground">Termos e Condições de Uso</p>
            <p className="text-xs text-muted-foreground">Leia os termos do OnDose</p>
          </div>
        </Link>
      </Card>


      {/* Delete Account Card */}
      <Card className="p-5 rounded-2xl border-destructive/30 bg-destructive/5 space-y-3">
        <div className="flex items-center gap-2">
          <Trash2 className="h-4 w-4 text-destructive" />
          <p className="text-sm font-bold text-destructive">Excluir conta</p>
        </div>
        <p className="text-xs text-muted-foreground">
          A exclusão é <strong className="text-foreground">permanente e irreversível</strong>. Todos os seus medicamentos, agenda, exames e dados serão apagados.
        </p>
        <div className="flex items-start gap-2 bg-destructive/10 rounded-xl p-3">
          <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
          <p className="text-xs text-destructive font-medium">
            Mesmo que você possua um plano ativo (PRO ou Premium), perderá o acesso imediatamente. Nenhum reembolso será realizado.
          </p>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="w-full rounded-xl text-sm font-semibold border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir minha conta
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-destructive flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Confirmar exclusão de conta
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-3 text-left">
                <span className="block">
                  Esta ação é <strong>permanente e irreversível</strong>. Serão excluídos:
                </span>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Todos os seus medicamentos e agenda</li>
                  <li>Histórico de doses tomadas</li>
                  <li>Exames e indicadores de saúde</li>
                  <li>Vínculos com familiares</li>
                  <li>Seu acesso ao plano (PRO/Premium), sem reembolso</li>
                </ul>
                <span className="block mt-2">
                  Digite <strong>EXCLUIR</strong> para confirmar:
                </span>
                <input
                  className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background text-foreground mt-1"
                  placeholder="Digite EXCLUIR"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                />
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                className="rounded-xl"
                onClick={() => setDeleteConfirmText("")}
              >
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={deleteConfirmText !== "EXCLUIR" || deletingAccount}
                onClick={handleDeleteAccount}
              >
                {deletingAccount ? "Excluindo..." : "Excluir conta definitivamente"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Card>
    </div>
  );
}
