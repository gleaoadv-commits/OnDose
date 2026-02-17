import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Phone, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function ProfilePage() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, whatsapp_number")
        .eq("user_id", user.id)
        .single();
      if (data) {
        setDisplayName(data.display_name || "");
        setWhatsappNumber((data as any).whatsapp_number || "");
      }
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
    </div>
  );
}
