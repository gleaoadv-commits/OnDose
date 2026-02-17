import { useMemo, useState } from "react";
import { useApp } from "@/context/AppContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";

export default function CalendarPage() {
  const { schedule, medications, markDoseTaken } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());

  const dateStr = currentDate.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
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

  return (
    <div className="space-y-5">
      <h2 className="section-header">
        <CalendarDays className="h-5 w-5 text-primary" />
        Agenda
      </h2>

      <Card className="flex items-center justify-between p-4 rounded-2xl border-border/40">
        <Button variant="ghost" size="icon" onClick={() => changeDay(-1)} className="rounded-xl">
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <div className="text-center">
          <p className="text-elder-base font-bold text-foreground capitalize">{dateStr}</p>
          {isToday && (
            <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">Hoje</span>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={() => changeDay(1)} className="rounded-xl">
          <ChevronRight className="h-6 w-6" />
        </Button>
      </Card>

      {dayEvents.length === 0 ? (
        <Card className="p-10 text-center rounded-2xl border-dashed border-2 border-border/60">
          <CalendarDays className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-elder-base text-muted-foreground">Nenhuma dose programada para este dia.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {dayEvents.map((event, i) => {
            const time = new Date(event.scheduledTime);
            const timeStr = time.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

            return (
              <Card
                key={event.id}
                className={`p-4 flex items-center gap-3 border-border/40 animate-slide-up ${event.taken ? "opacity-40" : "card-hover"}`}
                style={{ animationDelay: `${i * 50}ms`, animationFillMode: "both" }}
              >
                <div
                  className="rounded-xl p-2.5 shrink-0 text-elder-base font-extrabold min-w-[56px] text-center"
                  style={{ backgroundColor: event.color + "12", color: event.color }}
                >
                  {timeStr}
                </div>
                <div className="flex-1">
                  <p className="text-elder-sm font-bold text-foreground">{event.medicationName}</p>
                  <p className="text-sm text-muted-foreground">{event.dosage}</p>
                </div>
                {!event.taken ? (
                  <Button size="sm" onClick={() => markDoseTaken(event.id)} className="rounded-xl font-bold shadow-glow">
                    <Check className="h-4 w-4 mr-1" /> Tomei
                  </Button>
                ) : (
                  <div className="bg-success/10 text-success rounded-full p-1.5">
                    <Check className="h-4 w-4 stroke-[3]" />
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
