import { useApp } from "@/context/AppContext";
import { Card } from "@/components/ui/card";
import { Check, Clock, CalendarClock, Circle } from "lucide-react";
import { useMemo } from "react";

export default function TodaySchedule() {
  const { schedule, medications, markDoseTaken, unmarkDoseTaken } = useApp();

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
        <div className="flex items-center gap-1.5 text-sm font-bold bg-primary/10 text-primary px-3 py-1.5 rounded-full">
          <Check className="h-3.5 w-3.5" />
          {taken}/{total}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-muted rounded-full mb-4 overflow-hidden">
        <div
          className="h-full gradient-primary rounded-full transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="space-y-2.5">
        {todayEvents.map((event, i) => {
          const time = new Date(event.scheduledTime);
          const isPast = time < now && !event.taken;
          const timeStr = time.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

          return (
            <Card
              key={event.id}
              className={`p-0 overflow-hidden transition-all duration-300 animate-slide-up border-0 shadow-card ${
                event.taken ? "opacity-60" : isPast ? "ring-2 ring-destructive/30" : ""
              }`}
              style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}
            >
              <div className="flex items-center">
                {/* Color stripe */}
                <div className="w-1.5 self-stretch rounded-l-lg" style={{ backgroundColor: event.color }} />
                
                <div className="flex items-center gap-3 flex-1 p-3.5">
                  {/* Check circle */}
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
                    <p className={`text-elder-sm font-bold ${event.taken ? "line-through text-muted-foreground" : "text-foreground"}`}>
                      {event.medicationName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {event.dosage}
                    </p>
                  </div>

                  <div className={`text-right shrink-0 ${isPast && !event.taken ? "text-destructive" : ""}`}>
                    <p className={`text-elder-sm font-extrabold ${event.taken ? "text-muted-foreground" : ""}`} style={{ color: event.taken ? undefined : event.color }}>
                      {timeStr}
                    </p>
                    {isPast && !event.taken && (
                      <p className="text-xs font-bold text-destructive animate-pulse-soft">Atrasado</p>
                    )}
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
    </div>
  );
}
