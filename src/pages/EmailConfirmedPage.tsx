import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../integrations/supabase/client";
import { CheckCircle2 } from "lucide-react";
import { Button } from "../components/ui/button";
import OnDoseLogo from "../components/OnDoseLogo";

export default function EmailConfirmedPage() {
  const navigate = useNavigate();
  const [confirmed, setConfirmed] = useState(false);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Verifica se há uma sessão ativa (confirmação bem-sucedida)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setConfirmed(true);
      } else {
        // Aguarda o evento de sign_in que ocorre após confirmação
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if ((event === "SIGNED_IN" || event === "USER_UPDATED") && session) {
            setConfirmed(true);
            subscription.unsubscribe();
          }
        });
        return () => subscription.unsubscribe();
      }
    });
  }, []);

  useEffect(() => {
    if (!confirmed) return;
    if (countdown <= 0) {
      navigate("/");
      return;
    }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [confirmed, countdown, navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="fixed top-[-120px] right-[-80px] w-72 h-72 rounded-full bg-primary/8 blur-3xl" />
      <div className="fixed bottom-[-100px] left-[-60px] w-64 h-64 rounded-full bg-accent/6 blur-3xl" />

      <div className="w-full max-w-md flex flex-col items-center space-y-8 relative z-10 text-center">
        <OnDoseLogo size="xl" variant="full" />

        <div className="bg-card border border-border/30 rounded-3xl p-8 shadow-elevated space-y-5 w-full animate-scale-in">
          <div className="flex justify-center">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-primary" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              E-mail confirmado! 🎉
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Sua conta foi criada com sucesso. Você já pode começar a gerenciar seus medicamentos com o OnDose.
            </p>
          </div>

          {confirmed ? (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Redirecionando em <span className="font-bold text-primary">{countdown}s</span>...
              </p>
              <Button
                className="w-full h-12 font-bold rounded-2xl shadow-glow"
                onClick={() => navigate("/")}
              >
                Acessar o OnDose agora
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Verificando confirmação...
              </p>
              <Button
                className="w-full h-12 font-bold rounded-2xl"
                variant="outline"
                onClick={() => navigate("/auth")}
              >
                Ir para o login
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
