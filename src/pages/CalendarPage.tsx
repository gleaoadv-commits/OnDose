import { useMemo, useState } from "react";
import { useApp } from "@/context/AppContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";

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
    <div className="space-y-4">
      <h2 className="text-elder-2xl font-bold text-foreground">📅 Agenda</h2>

      <div className="flex items-center justify-between bg-card rounded-xl p-3 border border-border">
        <Button variant="ghost" size="icon" onClick={() => changeDay(-1)} className="rounded-xl">
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <div className="text-center">
          <p className="text-elder-base font-bold text-foreground capitalize">{dateStr}</p>
          {isToday && <p className="text-sm text-primary font-bold">Hoje</p>}
        </div>
        <Button variant="ghost" size="icon" onClick={() => changeDay(1)} className="rounded-xl">
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>

      {dayEvents.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-elder-base text-muted-foreground">Nenhuma dose programada para este dia.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {dayEvents.map(event => {
            const time = new Date(event.scheduledTime);
            const timeStr = time.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

            return (
              <Card key={event.id} className={`p-4 flex items-center gap-3 ${event.taken ? "opacity-50" : ""}`}>
                <div
                  className="rounded-lg p-2 shrink-0 text-elder-lg font-bold"
                  style={{ backgroundColor: event.color + "22", color: event.color }}
                >
                  {timeStr}
                </div>
                <div className="flex-1">
                  <p className="text-elder-sm font-bold text-foreground">{event.medicationName}</p>
                  <p className="text-sm text-muted-foreground">{event.dosage}</p>
                </div>
                {!event.taken ? (
                  <Button size="sm" onClick={() => markDoseTaken(event.id)} className="rounded-xl font-bold">
                    <Check className="h-4 w-4 mr-1" /> Tomei
                  </Button>
                ) : (
                  <span className="text-sm text-success font-bold">✓</span>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
