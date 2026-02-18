import { useApp } from "@/context/AppContext";
import { Card } from "@/components/ui/card";
import { Bell, Check, BellRing, Pill, Info } from "lucide-react";

export default function NotificationsPage() {
  const { notifications, markNotificationRead, markDoseTaken, unmarkDoseTaken, schedule } = useApp();

  const getEventStatus = (eventId?: string) => {
    if (!eventId) return false;
    return schedule.find(e => e.id === eventId)?.taken || false;
  };

  const handleDoseToggle = (eventId: string) => {
    const isTaken = getEventStatus(eventId);
    if (isTaken) {
      unmarkDoseTaken(eventId);
    } else {
      markDoseTaken(eventId);
    }
  };

  // Filter out dose_reminder notifications that have already been taken
  const visibleNotifications = notifications.filter(n => {
    if (n.type === "dose_reminder" && n.eventId) {
      return !getEventStatus(n.eventId);
    }
    return true;
  });

  return (
    <div className="space-y-5">
      <h2 className="section-header">
        <BellRing className="h-5 w-5 text-primary" />
        Notificações
      </h2>

      {visibleNotifications.length === 0 ? (
        <Card className="p-10 text-center rounded-2xl border-dashed border-2 border-border/60">
          <div className="bg-primary/8 rounded-3xl p-5 inline-flex mb-3">
            <Bell className="h-10 w-10 text-primary/40 animate-float" />
          </div>
          <p className="text-elder-base text-muted-foreground font-medium">Nenhuma notificação ainda.</p>
          <p className="text-sm text-muted-foreground/60 mt-1">Cadastre um medicamento para receber alertas</p>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {visibleNotifications.map((n, i) => {
            const isDoseReminder = n.type === "dose_reminder" && n.eventId;
            const isTaken = getEventStatus(n.eventId);

            return (
              <Card
                key={n.id}
                className={`p-0 overflow-hidden border-0 shadow-card animate-slide-up transition-all duration-300 ${
                  n.read && !isDoseReminder ? "opacity-40" : ""
                }`}
                style={{ animationDelay: `${i * 40}ms`, animationFillMode: "both" }}
              >
                <div className="flex items-center">
                  {/* Color stripe */}
                  <div className={`w-1.5 self-stretch rounded-l-lg ${
                    isDoseReminder ? "bg-primary" : "bg-accent"
                  }`} />

                  <div className="flex items-start gap-3 flex-1 p-4">
                    {/* Icon or Check toggle */}
                    {isDoseReminder ? (
                      <button
                        onClick={() => handleDoseToggle(n.eventId!)}
                        className="shrink-0 mt-0.5 transition-all duration-300 active:scale-90"
                      >
                        <div className="h-9 w-9 rounded-full border-2 border-primary/40 hover:border-primary hover:bg-primary/5 flex items-center justify-center transition-colors">
                          <Pill className="h-4 w-4 text-primary/50" />
                        </div>
                      </button>
                    ) : (
                      <div className={`rounded-xl p-2 shrink-0 mt-0.5 ${n.read ? "bg-muted" : "bg-accent/10"}`}>
                        <Info className={`h-4 w-4 ${n.read ? "text-muted-foreground" : "text-accent"}`} />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="text-elder-sm text-foreground font-semibold">
                        {n.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <p className="text-xs text-muted-foreground">
                          {new Date(n.time).toLocaleString("pt-BR", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        {isDoseReminder && (
                          <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                            Pendente
                          </span>
                        )}
                      </div>
                    </div>

                    {!n.read && !isDoseReminder && (
                      <button
                        onClick={() => markNotificationRead(n.id)}
                        className="shrink-0 text-muted-foreground hover:text-primary transition-colors p-1"
                      >
                        <Check className="h-4 w-4" />
                      </button>
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
