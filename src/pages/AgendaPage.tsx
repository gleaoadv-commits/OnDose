import { useMemo, useState } from "react";
import { useApp } from "@/context/AppContext";
import { Card } from "@/components/ui/card";
import { Check, ChevronLeft, ChevronRight, CalendarDays, Circle, Trash2, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function AgendaPage() {
  const { schedule, medications, markDoseTaken, unmarkDoseTaken, deleteScheduleEvent, updateScheduleEventTime } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editingTime, setEditingTime] = useState("");

  const dateRaw = currentDate.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const dateStr = dateRaw.charAt(0).toUpperCase() + dateRaw.slice(1).replace(/ De /gi, " de ");

  const activeMedIds = useMemo(
    () => new Set(medications.filter(m => m.status === "ativo").map(m => m.id)),
    [medications]
  );

  const dayEvents = useMemo(() => {
    const start = new Date(currentDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    return schedule
      .filter(e => {
        const d = new Date(e.scheduledTime);
        return d >= start && d < end && activeMedIds.has(e.medicationId);
      })
      .sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime());
  }, [schedule, activeMedIds, currentDate]);

  const changeDay = (delta: number) => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() + delta);
      return d;
    });
  };

  const isToday = new Date().toDateString() === currentDate.toDateString();
  const taken = dayEvents.filter(e => e.taken).length;
  const total = dayEvents.length;
  const now = new Date();

  const startEdit = (event: typeof dayEvents[0]) => {
    const t = new Date(event.scheduledTime);
    setEditingTime(`${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`);
    setEditingEventId(event.id);
  };

  const saveEdit = async (event: typeof dayEvents[0]) => {
    const [h, m] = editingTime.split(":").map(Number);
    const newDt = new Date(event.scheduledTime);
    newDt.setHours(h, m, 0, 0);
    await updateScheduleEventTime(event.id, newDt.toISOString());
    setEditingEventId(null);
  };

  const handleDelete = async (event: typeof dayEvents[0]) => {
    const med = medications.find(m => m.id === event.medicationId);
    await deleteScheduleEvent(event.id);
    if (med && med.stockTotal != null && event.taken) {
      const takenCount = schedule.filter(e => e.medicationId === med.id && e.taken && e.id !== event.id).length;
      const newStock = Math.max(0, med.stockTotal - takenCount * med.quantity);
      toast.success(`Dose excluída`, {
        description: `Estoque de ${med.name} atualizado: ~${newStock} comprimido(s) restante(s).`,
      });
    } else {
      toast.success(`Dose excluída com sucesso.`);
    }
  };

  return (
    <div className="space-y-5">
      <h2 className="section-header">
        <CalendarDays className="h-5 w-5 text-primary" />
        Agenda
      </h2>

      <Card className="p-4 rounded-2xl border-0 shadow-card">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => changeDay(-1)} className="rounded-xl">
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <div className="text-center">
            <p className="text-elder-base font-bold text-foreground">{dateStr}</p>
            <div className="flex items-center justify-center gap-2 mt-1">
              {isToday && (
                <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">Hoje</span>
              )}
              {total > 0 && (
                <span className="text-xs font-bold text-muted-foreground">{taken}/{total} doses</span>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => changeDay(1)} className="rounded-xl">
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>
      </Card>

      {dayEvents.length === 0 ? (
        <Card className="p-10 text-center rounded-2xl border-dashed border-2 border-border/60">
          <CalendarDays className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-elder-base text-muted-foreground">Nenhuma dose programada.</p>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {dayEvents.map((event, i) => {
            const time = new Date(event.scheduledTime);
            const isPast = time < now && !event.taken;
            const timeStr = time.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
            const isEditing = editingEventId === event.id;

            return (
              <Card
                key={event.id}
                className={`p-0 overflow-hidden border-0 shadow-card animate-slide-up transition-all duration-300 ${
                  event.taken ? "opacity-60" : isPast ? "ring-2 ring-destructive/30" : ""
                }`}
                style={{ animationDelay: `${i * 50}ms`, animationFillMode: "both" }}
              >
                <div className="flex items-center">
                  <div className="w-1.5 self-stretch rounded-l-lg" style={{ backgroundColor: event.color }} />
                  
                  <div className="flex items-center gap-3 flex-1 p-4">
                    <button
                      onClick={() => event.taken ? unmarkDoseTaken(event.id) : markDoseTaken(event.id)}
                      className="shrink-0 transition-all duration-300 active:scale-90"
                    >
                      {event.taken ? (
                        <div className="h-10 w-10 rounded-full bg-success flex items-center justify-center shadow-md">
                          <Check className="h-5 w-5 text-white stroke-[3]" />
                        </div>
                      ) : (
                        <div className={`h-10 w-10 rounded-full border-2 flex items-center justify-center transition-colors ${
                          isPast ? "border-destructive/50 bg-destructive/5" : "border-border hover:border-primary hover:bg-primary/5"
                        }`}>
                          <Circle className="h-5 w-5 text-muted-foreground/30" />
                        </div>
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <p className={`text-elder-sm font-bold truncate ${event.taken ? "line-through text-muted-foreground" : "text-foreground"}`}>
                        {event.medicationName}
                      </p>
                      {isEditing ? (
                        <div className="flex items-center gap-2 mt-1">
                          <Input
                            type="time"
                            value={editingTime}
                            onChange={e => setEditingTime(e.target.value)}
                            className="h-8 w-28 text-sm"
                          />
                          <Button size="sm" className="h-8 px-3 text-xs" onClick={() => saveEdit(event)}>
                            Salvar
                          </Button>
                          <button
                            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                            onClick={() => setEditingEventId(null)}
                          >
                            <X className="h-4 w-4 text-muted-foreground" />
                          </button>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">{event.dosage}</p>
                      )}
                    </div>

                    {!isEditing && (
                      <div className="flex items-center gap-1 shrink-0">
                        <div className="text-right">
                          <p className="text-elder-base font-extrabold" style={{ color: event.taken ? "hsl(var(--muted-foreground))" : event.color }}>
                            {timeStr}
                          </p>
                          {isPast && !event.taken && (
                            <p className="text-xs font-bold text-destructive animate-pulse">Atrasado</p>
                          )}
                          {event.taken && event.takenAt && (
                            <p className="text-xs text-success font-semibold">
                              ✓ {new Date(event.takenAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col gap-1 ml-2">
                          <button
                            onClick={() => startEdit(event)}
                            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                            title="Editar horário"
                          >
                            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>
                          <button
                            onClick={() => handleDelete(event)}
                            className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
                            title="Excluir dose"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
