import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Archive, Pill, Calendar, Trash2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { supabase } from "../integrations/supabase/client";
import { useAuth } from "../context/AuthContext";

interface DeletedMed {
  id: string;
  name: string;
  dosage: string;
  color: string;
  created_at: string;
  deleted_at: string;
}

export default function MedicationHistoryPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [meds, setMeds] = useState<DeletedMed[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("medications")
        .select("id,name,dosage,color,created_at,deleted_at")
        .eq("user_id", user.id)
        .not("deleted_at", "is", null)
        .order("deleted_at", { ascending: false });
      setMeds((data as any) || []);
      setLoading(false);
    })();
  }, [user]);

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-24">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-elder-lg font-bold flex items-center gap-2">
            <Archive className="h-5 w-5" /> Histórico de Medicamentos
          </h1>
          <p className="text-xs text-muted-foreground">Medicamentos excluídos — registro permanente</p>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-8">Carregando…</p>
      ) : meds.length === 0 ? (
        <Card className="p-8 text-center rounded-2xl border-border/40">
          <Archive className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-elder-sm text-muted-foreground">
            Nenhum medicamento excluído ainda.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {meds.map((m) => (
            <Card key={m.id} className="p-4 rounded-2xl border-border/40">
              <div className="flex items-start gap-3">
                <div
                  className="h-11 w-11 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: m.color }}
                >
                  <Pill className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-elder-base truncate">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{m.dosage}</p>
                  <div className="mt-2 grid grid-cols-1 gap-1 text-xs">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5 text-success" />
                      Cadastrado em <strong className="text-foreground">{fmt(m.created_at)}</strong>
                    </span>
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      Excluído em <strong className="text-foreground">{fmt(m.deleted_at)}</strong>
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
