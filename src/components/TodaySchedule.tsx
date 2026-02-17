import { useApp } from "@/context/AppContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Clock } from "lucide-react";
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

  return (
    <div>
      <h2 className="text-elder-xl font-bold text-foreground mb-3">📋 Hoje</h2>
      <div className="space-y-2">
        {todayEvents.map(event => {
          const time = new Date(event.scheduledTime);
          const isPast = time < now && !event.taken;
          const timeStr = time.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

          return (
            <Card
              key={event.id}
              className={`p-3 flex items-center gap-3 transition-all ${
                event.taken ? "opacity-50" : isPast ? "border-destructive/50 bg-destructive/5" : ""
              }`}
            >
              <div
                className="rounded-lg p-2 shrink-0"
                style={{ backgroundColor: event.color + "22", color: event.color }}
              >
                <Clock className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-elder-sm font-bold text-foreground">{event.medicationName}</p>
                <p className="text-sm text-muted-foreground">
                  {event.dosage} • {timeStr}
                  {isPast && " — Atrasado!"}
                </p>
              </div>
              {!event.taken ? (
                <Button
                  size="sm"
                  onClick={() => markDoseTaken(event.id)}
                  className="rounded-xl font-bold shrink-0"
                >
                  <Check className="h-4 w-4 mr-1" /> Tomei
                </Button>
              ) : (
                <span className="text-sm text-success font-bold">✓ Tomado</span>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
