import { useMemo, useState } from "react";
import { useApp } from "@/context/AppContext";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, CalendarDays, Lock, Crown, Check, Circle, Trash2, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";

export default function CalendarPage() {
  const { schedule, medications, markDoseTaken, unmarkDoseTaken, deleteScheduleEvent, updateScheduleEventTime, plan } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editingTime, setEditingTime] = useState("");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const activeMedIds = useMemo(
    () => new Set(medications.filter(m => m.status === "ativo").map(m => m.id)),
    [medications]
  );

  const dayDots = useMemo(() => {
    const map: Record<string, { color: string; taken: boolean; isPast: boolean }[]> = {};
    const now = new Date();
    schedule.forEach(e => {
      if (!activeMedIds.has(e.medicationId)) return;
      const d = new Date(e.scheduledTime);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map[key]) map[key] = [];
      map[key].push({ color: e.color, taken: e.taken, isPast: d < now && !e.taken });
    });
    return map;
  }, [schedule, activeMedIds]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startWeekday = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [currentMonth, currentYear]);

  const changeMonth = (delta: number) => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  const monthLabel = currentDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const selectedDateStr = selectedDate.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  const dayEvents = useMemo(() => {
    const start = new Date(selectedDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return schedule
      .filter(e => {
        const d = new Date(e.scheduledTime);
        return d >= start && d < end && activeMedIds.has(e.medicationId);
      })
      .sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime());
  }, [schedule, activeMedIds, selectedDate]);

  const isSelectedToday = today.toDateString() === selectedDate.toDateString();
  const taken = dayEvents.filter(e => e.taken).length;
  const total = dayEvents.length;
  const now = new Date();
  const weekDays = ["D", "S", "T", "Q", "Q", "S", "S"];
  const isFree = plan === "free";

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

  return (
    <div className="space-y-5">
      <h2 className="section-header">
        <CalendarDays className="h-5 w-5 text-primary" />
        Agenda
      </h2>

      {/* Month Calendar */}
      <div className="relative">
        <Card className={`p-4 rounded-2xl border-0 shadow-card ${isFree ? "select-none" : ""}`}>
          <div className={isFree ? "blur-sm pointer-events-none" : ""}>
            <div className="flex items-center justify-between mb-3">
              <Button variant="ghost" size="icon" onClick={() => changeMonth(-1)} className="rounded-xl h-8 w-8">
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <p className="text-elder-base font-bold text-foreground capitalize">{monthLabel}</p>
              <Button variant="ghost" size="icon" onClick={() => changeMonth(1)} className="rounded-xl h-8 w-8">
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-1">
              {weekDays.map((d, i) => (
                <div key={i} className="text-center text-xs font-bold text-muted-foreground py-1">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, idx) => {
                if (day === null) return <div key={idx} />;
                const cellDate = new Date(currentYear, currentMonth, day);
                const key = `${currentYear}-${currentMonth}-${day}`;
                const dots = dayDots[key] || [];
                const isToday = cellDate.toDateString() === today.toDateString();
                const isSelected = cellDate.toDateString() === selectedDate.toDateString();

                const uniqueDots: { color: string; status: "taken" | "overdue" | "pending" }[] = [];
                const seen = new Set<string>();
                dots.forEach(dot => {
                  const status = dot.taken ? "taken" : dot.isPast ? "overdue" : "pending";
                  const dotKey = `${dot.color}-${status}`;
                  if (!seen.has(dotKey)) { seen.add(dotKey); uniqueDots.push({ color: dot.color, status }); }
                });

                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDate(cellDate)}
                    className={`flex flex-col items-center justify-center rounded-xl py-1.5 min-h-[48px] transition-all ${
                      isSelected ? "bg-primary text-primary-foreground font-bold shadow-md"
                      : isToday ? "bg-primary/10 text-primary font-bold"
                      : "hover:bg-muted/50 text-foreground"
                    }`}
                  >
                    <span className="text-sm leading-none">{day}</span>
                    {uniqueDots.length > 0 && (
                      <div className="flex gap-0.5 mt-1">
                        {uniqueDots.slice(0, 4).map((dot, i) => (
                          <span
                            key={i}
                            className={`block rounded-full ${
                              dot.status === "taken" ? "h-1.5 w-1.5 opacity-50"
                              : dot.status === "overdue" ? "h-2 w-2 animate-pulse ring-1 ring-destructive/40"
                              : "h-1.5 w-1.5"
                            }`}
                            style={{
                              backgroundColor: dot.status === "overdue" ? "hsl(var(--destructive))"
                                : isSelected ? "hsl(var(--primary-foreground))"
                                : dot.color,
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-border/30">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="block h-2 w-2 rounded-full bg-primary" />Pendente
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="block h-2 w-2 rounded-full bg-primary opacity-50" />Tomado
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="block h-2 w-2 rounded-full bg-destructive animate-pulse" />Atrasado
              </div>
            </div>
          </div>
        </Card>

        {isFree && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
            <div className="bg-background/80 backdrop-blur-sm rounded-2xl p-6 text-center shadow-elevated border border-border/40 mx-4">
              <div className="gradient-pro rounded-full p-3 w-fit mx-auto mb-3">
                <Lock className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-elder-base font-bold text-foreground mb-1">Calendário Visual</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Acompanhe suas doses de forma visual com o calendário completo.
              </p>
              <Link to="/planos">
                <Button className="gradient-pro text-white border-0 rounded-xl font-bold gap-2 shadow-md hover:opacity-90 transition-opacity">
                  <Crown className="h-4 w-4" />
                  Adquirir versão PRO
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Selected day detail - only for paid users */}
      {!isFree && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-elder-sm font-bold text-foreground capitalize">{selectedDateStr}</p>
            <div className="flex items-center gap-1.5">
              {isSelectedToday && (
                <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">Hoje</span>
              )}
              {total > 0 && (
                <span className="text-xs font-bold text-muted-foreground">{taken}/{total} doses</span>
              )}
            </div>
          </div>

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
                                onClick={() => deleteScheduleEvent(event.id)}
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
        </>
      )}
    </div>
  );
}
