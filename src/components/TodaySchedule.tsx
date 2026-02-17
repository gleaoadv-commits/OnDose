import { useApp } from "@/context/AppContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Clock, CalendarClock } from "lucide-react";
import { useMemo } from "react";

export default function TodaySchedule() {
  const { schedule, medications, markDoseTaken } = useApp();

  const todayEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const activeMedIds = new Set(
      medications.filter(m => m.status === "ativo").map(m => m.id)
    );

    return schedule
      .filter(e => {
        const d = new Date(e.scheduledTime);
        return d >= today && d < tomorrow && activeMedIds.has(e.medicationId);
      })
      .sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime());
  }, [schedule, medications]);

  if (todayEvents.length === 0) return null;

  const now = new Date();
  const taken = todayEvents.filter(e => e.taken).length;
  const total = todayEvents.length;
  const progress = total > 0 ? (taken / total) * 100 : 0;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <h2 className="section-header">
          <CalendarClock className="h-5 w-5 text-primary" />
          Hoje
        </h2>
        <span className="text-sm font-bold text-muted-foreground bg-muted px-3 py-1 rounded-full">
          {taken}/{total} doses
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-muted rounded-full mb-4 overflow-hidden">
        <div
          className="h-full gradient-primary rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="space-y-2">
        {todayEvents.map((event, i) => {
          const time = new Date(event.scheduledTime);
          const isPast = time < now && !event.taken;
          const timeStr = time.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

          return (
            <Card
              key={event.id}
              className={`p-3.5 flex items-center gap-3 transition-all duration-300 animate-slide-up border-border/40 ${
                event.taken
                  ? "opacity-40"
                  : isPast
                    ? "border-destructive/40 bg-destructive/5"
                    : "card-hover"
              }`}
              style={{ animationDelay: `${i * 50}ms`, animationFillMode: "both" }}
            >
              <div
                className="rounded-xl p-2.5 shrink-0"
                style={{ backgroundColor: event.color + "15", color: event.color }}
              >
                <Clock className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-elder-sm font-bold text-foreground">{event.medicationName}</p>
                <p className="text-sm text-muted-foreground">
                  {event.dosage} • <span className="font-semibold">{timeStr}</span>
                  {isPast && <span className="text-destructive font-bold"> — Atrasado!</span>}
                </p>
              </div>
              {!event.taken ? (
                <Button
                  size="sm"
                  onClick={() => markDoseTaken(event.id)}
                  className="rounded-xl font-bold shrink-0 shadow-glow"
                >
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
    </div>
  );
}
