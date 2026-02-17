import { useMemo, useState } from "react";
import { useApp } from "@/context/AppContext";
import { Card } from "@/components/ui/card";
import { Check, ChevronLeft, ChevronRight, CalendarDays, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CalendarPage() {
  const { schedule, medications, markDoseTaken, unmarkDoseTaken } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());

  const dateStr = currentDate.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const dayEvents = useMemo(() => {
    const start = new Date(currentDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const activeMedIds = new Set(
      medications.filter(m => m.status === "ativo").map(m => m.id)
    );

    return schedule
      .filter(e => {
        const d = new Date(e.scheduledTime);
        return d >= start && d < end && activeMedIds.has(e.medicationId);
      })
      .sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime());
  }, [schedule, medications, currentDate]);

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
            <p className="text-elder-base font-bold text-foreground capitalize">{dateStr}</p>
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
            const timeStr = time.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

            return (
              <Card
                key={event.id}
                className={`p-0 overflow-hidden border-0 shadow-card animate-slide-up transition-all duration-300 ${
                  event.taken ? "opacity-60" : ""
                }`}
                style={{ animationDelay: `${i * 50}ms`, animationFillMode: "both" }}
              >
                <div className="flex items-center">
                  <div className="w-1.5 self-stretch rounded-l-lg" style={{ backgroundColor: event.color }} />
                  
                  <div className="flex items-center gap-3 flex-1 p-4">
                    {/* Check toggle */}
                    <button
                      onClick={() => event.taken ? unmarkDoseTaken(event.id) : markDoseTaken(event.id)}
                      className="shrink-0 transition-all duration-300 active:scale-90"
                    >
                      {event.taken ? (
                        <div className="h-10 w-10 rounded-full bg-success flex items-center justify-center shadow-md">
                          <Check className="h-5 w-5 text-white stroke-[3]" />
                        </div>
                      ) : (
                        <div className="h-10 w-10 rounded-full border-2 border-border hover:border-primary hover:bg-primary/5 flex items-center justify-center transition-colors">
                          <Circle className="h-5 w-5 text-muted-foreground/30" />
                        </div>
                      )}
                    </button>

                    <div className="flex-1">
                      <p className={`text-elder-sm font-bold ${event.taken ? "line-through text-muted-foreground" : "text-foreground"}`}>
                        {event.medicationName}
                      </p>
                      <p className="text-sm text-muted-foreground">{event.dosage}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-elder-base font-extrabold" style={{ color: event.taken ? "hsl(var(--muted-foreground))" : event.color }}>
                        {timeStr}
                      </p>
                      {event.taken && event.takenAt && (
                        <p className="text-xs text-success font-semibold">
                          ✓ {new Date(event.takenAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      )}
                    </div>
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
