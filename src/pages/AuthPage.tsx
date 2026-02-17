import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Mail, Lock, User, Eye, EyeOff, Users, Hash, Crown } from "lucide-react";
import OnDoseLogo from "@/components/OnDoseLogo";
import { useToast } from "@/hooks/use-toast";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [isCaregiver, setIsCaregiver] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [primaryCode, setPrimaryCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/");
      } else {
        // If caregiver signup, validate the primary code first
        if (isCaregiver) {
          if (!primaryCode.trim()) {
            toast({ title: "Erro", description: "Informe o ID do usuário principal.", variant: "destructive" });
            setLoading(false);
            return;
          }
          // Verify the code exists
          const { data: primaryProfile } = await supabase
            .from("profiles")
            .select("user_id, user_code")
            .eq("user_code", primaryCode.trim().toUpperCase())
            .single();
          if (!primaryProfile) {
            toast({ title: "Erro", description: "ID do usuário principal não encontrado. Verifique o código.", variant: "destructive" });
            setLoading(false);
            return;
          }
        }

        const redirectUrl = window.location.origin;
        const { data: signUpData, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
              account_type: isCaregiver ? "caregiver" : "primary",
            },
            emailRedirectTo: redirectUrl,
          },
        });
        if (error) throw error;

        // If caregiver, create the family link after signup
        if (isCaregiver && signUpData.user) {
          const { data: primaryProfile } = await supabase
            .from("profiles")
            .select("user_id")
            .eq("user_code", primaryCode.trim().toUpperCase())
            .single();

          if (primaryProfile) {
            await supabase.from("family_links").insert({
              primary_user_id: (primaryProfile as any).user_id,
              caregiver_user_id: signUpData.user.id,
              status: "pending",
            });
          }
        }

        toast({
          title: "Conta criada!",
          description: isCaregiver
            ? "Verifique seu e-mail. Após confirmar, aguarde o usuário principal aprovar o vínculo."
            : "Verifique seu e-mail para confirmar o cadastro.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: "google" | "apple") => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin,
      });
      if (result.error) throw result.error;
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast({ title: "Digite seu e-mail", description: "Informe o e-mail para redefinir a senha.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast({ title: "E-mail enviado!", description: "Verifique sua caixa de entrada para redefinir a senha." });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="fixed top-[-120px] right-[-80px] w-72 h-72 rounded-full bg-primary/8 blur-3xl" />
      <div className="fixed bottom-[-100px] left-[-60px] w-64 h-64 rounded-full bg-accent/6 blur-3xl" />

      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Logo */}
        <div className="text-center animate-scale-in flex flex-col items-center">
          <OnDoseLogo size="xl" variant="full" />
        </div>

        <Card className="p-7 space-y-5 shadow-elevated border-border/30 rounded-3xl animate-slide-up">
          <h2 className="text-elder-lg font-bold text-foreground text-center">
            {isLogin ? "Bem-vindo de volta!" : isCaregiver ? "Criar conta de Familiar" : "Crie sua conta"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                {/* Account type toggle */}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={!isCaregiver ? "default" : "outline"}
                    className="flex-1 rounded-xl text-sm font-bold h-10"
                    onClick={() => setIsCaregiver(false)}
                  >
                    <User className="h-4 w-4 mr-1.5" />
                    Paciente
                  </Button>
                  <Button
                    type="button"
                    variant={isCaregiver ? "default" : "outline"}
                    className="flex-1 rounded-xl text-sm font-bold h-10"
                    onClick={() => setIsCaregiver(true)}
                  >
                    <Users className="h-4 w-4 mr-1.5" />
                    Familiar
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-bold">Nome</Label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
                    <Input
                      id="name"
                      placeholder="Seu nome completo"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="pl-11 h-13 text-elder-sm rounded-2xl border-border/60 focus:border-primary"
                      required
                    />
                  </div>
                </div>

                {isCaregiver && (
                  <div className="space-y-3">
                    <Card className="p-4 border-amber-500/30 bg-amber-500/5 rounded-2xl">
                      <div className="flex items-start gap-2.5">
                        <Crown className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-bold text-foreground">Recurso Premium</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            O paciente principal precisa ter o plano <span className="font-bold text-amber-600">Premium</span> ativo para vincular familiares.
                          </p>
                        </div>
                      </div>
                    </Card>
                    <div className="space-y-2">
                      <Label htmlFor="primaryCode" className="text-sm font-bold">ID do Paciente Principal</Label>
                      <div className="relative">
                        <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
                        <Input
                          id="primaryCode"
                          placeholder="Ex: DC-A1B2C3"
                          value={primaryCode}
                          onChange={e => setPrimaryCode(e.target.value.toUpperCase())}
                          className="pl-11 h-13 text-elder-sm rounded-2xl border-border/60 focus:border-primary uppercase tracking-widest font-bold"
                          required
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Peça ao paciente o código ID que aparece no perfil dele.
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-bold">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="pl-11 h-13 text-elder-sm rounded-2xl border-border/60 focus:border-primary"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-bold">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Sua senha"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="pl-11 pr-11 h-13 text-elder-sm rounded-2xl border-border/60 focus:border-primary"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
            </div>

            {isLogin && (
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-sm text-primary font-semibold hover:underline underline-offset-2"
              >
                Esqueci minha senha
              </button>
            )}

            <Button type="submit" disabled={loading} className="w-full h-13 text-elder-sm font-bold rounded-2xl shadow-glow" size="lg">
              {loading ? "Carregando..." : isLogin ? "Entrar" : "Criar conta"}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-border/60" />
            <span className="text-xs text-muted-foreground font-medium">ou continue com</span>
            <div className="flex-1 h-px bg-border/60" />
          </div>

          {/* Social buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => handleSocialLogin("google")}
              disabled={loading}
              className="h-12 text-sm font-semibold rounded-2xl border-border/60 hover:bg-muted/50"
            >
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSocialLogin("apple")}
              disabled={loading}
              className="h-12 text-sm font-semibold rounded-2xl border-border/60 hover:bg-muted/50"
            >
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              Apple
            </Button>
          </div>

          {/* Toggle */}
          <p className="text-center text-sm text-muted-foreground">
            {isLogin ? "Não tem conta?" : "Já tem conta?"}{" "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary font-bold hover:underline underline-offset-2"
            >
              {isLogin ? "Criar conta" : "Entrar"}
            </button>
          </p>
        </Card>
      </div>
    </div>
  );
}
