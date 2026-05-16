import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Archive, Pill, Calendar, Trash2, Check, X, ChevronDown, ChevronUp } from "lucide-react";
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

interface DoseEvent {
  id: string;
  scheduled_time: string;
  taken: boolean;
  taken_at: string | null;
}

export default function MedicationHistoryPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [meds, setMeds] = useState<DeletedMed[]>([]);
  const [eventsByMed, setEventsByMed] = useState<Record<string, DoseEvent[]>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: medsData } = await supabase
        .from("medications")
        .select("id,name,dosage,color,created_at,deleted_at")
        .eq("user_id", user.id)
        .not("deleted_at", "is", null)
        .order("deleted_at", { ascending: false });
      const list = (medsData as any) || [];
      setMeds(list);

      if (list.length > 0) {
        const ids = list.map((m: DeletedMed) => m.id);
        const { data: evData } = await supabase
          .from("schedule_events")
          .select("id,medication_id,scheduled_time,taken,taken_at")
          .eq("user_id", user.id)
          .in("medication_id", ids)
          .order("scheduled_time", { ascending: false });
        const grouped: Record<string, DoseEvent[]> = {};
        ((evData as any) || []).forEach((e: any) => {
          if (!grouped[e.medication_id]) grouped[e.medication_id] = [];
          grouped[e.medication_id].push(e);
        });
        setEventsByMed(grouped);
      }
      setLoading(false);
    })();
  }, [user]);

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const fmtTime = (d: string) =>
    new Date(d).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  const groupByDay = (events: DoseEvent[]) => {
    const map: Record<string, DoseEvent[]> = {};
    events.forEach((e) => {
      const key = new Date(e.scheduled_time).toLocaleDateString("pt-BR");
      if (!map[key]) map[key] = [];
      map[key].push(e);
    });
    return Object.entries(map);
  };

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
          <p className="text-xs text-muted-foreground">Medicamentos excluídos — registro permanente das doses</p>
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
          {meds.map((m) => {
            const allEvents = eventsByMed[m.id] || [];
            const deletedAt = new Date(m.deleted_at);
            const events = allEvents.filter((e) => new Date(e.scheduled_time) <= deletedAt);
            const taken = events.filter((e) => e.taken).length;
            const total = events.length;
            const isOpen = expanded[m.id];

            return (
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
                        Cadastrado em <strong className="text-foreground">{fmtDate(m.created_at)}</strong>
                      </span>
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        Excluído em <strong className="text-foreground">{fmtDate(m.deleted_at)}</strong>
                      </span>
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Check className="h-3.5 w-3.5 text-success" />
                        <strong className="text-foreground">{taken}</strong> de <strong className="text-foreground">{total}</strong> doses tomadas
                      </span>
                    </div>
                  </div>
                </div>

                {total > 0 && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full mt-3 h-9"
                      onClick={() => setExpanded((p) => ({ ...p, [m.id]: !p[m.id] }))}
                    >
                      {isOpen ? (
                        <><ChevronUp className="h-4 w-4 mr-1" /> Ocultar histórico de doses</>
                      ) : (
                        <><ChevronDown className="h-4 w-4 mr-1" /> Ver histórico de doses</>
                      )}
                    </Button>

                    {isOpen && (
                      <div className="mt-3 space-y-3 border-t border-border/40 pt-3">
                        {groupByDay(events).map(([day, evs]) => (
                          <div key={day}>
                            <p className="text-xs font-semibold text-muted-foreground mb-1.5">{day}</p>
                            <div className="space-y-1">
                              {evs.map((e) => (
                                <div
                                  key={e.id}
                                  className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-muted/40"
                                >
                                  <span className="text-sm font-medium">{fmtTime(e.scheduled_time)}</span>
                                  {e.taken ? (
                                    <span className="flex items-center gap-1 text-xs font-medium text-success">
                                      <Check className="h-3.5 w-3.5" /> Tomada
                                      {e.taken_at && (
                                        <span className="text-muted-foreground ml-1">
                                          às {fmtTime(e.taken_at)}
                                        </span>
                                      )}
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1 text-xs font-medium text-destructive">
                                      <X className="h-3.5 w-3.5" /> Não tomada
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
