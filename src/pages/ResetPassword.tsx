import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Lock, Pill } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    if (hashParams.get("type") === "recovery") {
      setIsRecovery(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast({ title: "Senha atualizada!", description: "Você já pode fazer login com a nova senha." });
      navigate("/");
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (!isRecovery) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="p-6 text-center max-w-md">
          <p className="text-elder-base text-muted-foreground">Link inválido ou expirado.</p>
          <Button onClick={() => navigate("/auth")} className="mt-4 rounded-xl">Voltar ao login</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="bg-primary rounded-2xl p-4 inline-flex mb-4">
            <Pill className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="text-elder-xl font-extrabold text-foreground">Nova senha</h1>
        </div>
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-elder-sm font-semibold">Nova senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="pl-10 h-12 text-elder-sm rounded-xl"
                  required
                  minLength={6}
                />
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full h-12 text-elder-sm font-bold rounded-xl" size="lg">
              {loading ? "Salvando..." : "Salvar nova senha"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
