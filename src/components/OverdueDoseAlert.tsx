import { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  Check,
  Clock,
  X,
  Pill,
  Timer,
} from "lucide-react";

export default function OverdueDoseAlert() {
  const { schedule, medications, markDoseTaken, unmarkDoseTaken } = useApp();
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const overdueEvents = useMemo(() => {
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeMedIds = new Set(
      medications.filter((m) => m.status === "ativo").map((m) => m.id)
    );

    return schedule
      .filter((e) => {
        if (e.taken || dismissedIds.has(e.id)) return false;
        const d = new Date(e.scheduledTime);
        return d >= today && d < now && activeMedIds.has(e.medicationId);
      })
      .sort(
        (a, b) =>
          new Date(a.scheduledTime).getTime() -
          new Date(b.scheduledTime).getTime()
      );
  }, [schedule, medications, dismissedIds]);

  if (overdueEvents.length === 0) return null;

  const currentEvent = overdueEvents.find((e) => e.id === selectedEvent) || overdueEvents[0];

  const scheduledTime = new Date(currentEvent.scheduledTime);
  const now = new Date();
  const diffMinutes = Math.round(
    (now.getTime() - scheduledTime.getTime()) / 60000
  );
  const diffLabel =
    diffMinutes < 60
      ? `${diffMinutes} min atrás`
      : `${Math.floor(diffMinutes / 60)}h${diffMinutes % 60 > 0 ? `${diffMinutes % 60}min` : ""} atrás`;

  const handleTomou = () => {
    setSelectedEvent(currentEvent.id);
    setShowTimePicker(true);
  };

  const handleConfirmTaken = (onTime: boolean) => {
    const idToMark = selectedEvent ?? currentEvent.id;
    markDoseTaken(idToMark);
    // Dismiss immediately from the alert so it disappears right away
    setDismissedIds((prev) => new Set(prev).add(idToMark));
    setShowTimePicker(false);
    setSelectedEvent(null);
  };

  const handleAdiou = () => {
    // Dismiss from the alert (user will take it later)
    setDismissedIds((prev) => new Set(prev).add(currentEvent.id));
  };

  const handlePerdeu = () => {
    // Mark as dismissed (lost dose)
    setDismissedIds((prev) => new Set(prev).add(currentEvent.id));
  };

  const scheduledTimeStr = scheduledTime.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const nowTimeStr = now.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <>
      <div className="space-y-3 animate-fade-in">
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5 animate-pulse-soft" />
          <h3 className="text-sm font-bold">
            {overdueEvents.length === 1
              ? "Dose atrasada!"
              : `${overdueEvents.length} doses atrasadas!`}
          </h3>
        </div>

        {overdueEvents.map((event) => {
          const time = new Date(event.scheduledTime);
          const timeStr = time.toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          });
          const mins = Math.round(
            (now.getTime() - time.getTime()) / 60000
          );
          const delay =
            mins < 60
              ? `${mins}min`
              : `${Math.floor(mins / 60)}h${mins % 60 > 0 ? `${mins % 60}m` : ""}`;

          return (
            <Card
              key={event.id}
              className="p-0 overflow-hidden border-0 shadow-card ring-2 ring-destructive/20 animate-slide-up"
            >
              <div className="flex">
                <div
                  className="w-1.5 self-stretch"
                  style={{ backgroundColor: event.color }}
                />
                <div className="flex-1 p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="rounded-xl p-2"
                      style={{
                        backgroundColor: event.color + "15",
                        color: event.color,
                      }}
                    >
                      <Pill className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-elder-sm font-bold text-foreground">
                        {event.medicationName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {event.dosage}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-extrabold text-destructive">
                        {timeStr}
                      </p>
                      <p className="text-[10px] font-bold text-destructive/70 flex items-center gap-0.5 justify-end">
                        <Timer className="h-3 w-3" />
                        {delay}
                      </p>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedEvent(event.id);
                        setShowTimePicker(true);
                      }}
                      className="flex-1 rounded-xl text-xs font-bold h-9 bg-success hover:bg-success/90 text-white"
                    >
                      <Check className="h-3.5 w-3.5 mr-1" />
                      Tomei
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setDismissedIds((prev) =>
                          new Set(prev).add(event.id)
                        )
                      }
                      className="flex-1 rounded-xl text-xs font-bold h-9 border-border/50"
                    >
                      <Clock className="h-3.5 w-3.5 mr-1" />
                      Adiou
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setDismissedIds((prev) =>
                          new Set(prev).add(event.id)
                        )
                      }
                      className="flex-1 rounded-xl text-xs font-bold h-9 text-destructive border-destructive/20 hover:bg-destructive/5"
                    >
                      <X className="h-3.5 w-3.5 mr-1" />
                      Perdeu
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Confirm taken dialog */}
      <Dialog open={showTimePicker} onOpenChange={setShowTimePicker}>
        <DialogContent className="rounded-2xl max-w-[340px]">
          <DialogHeader>
            <DialogTitle className="text-center text-elder-base">
              Quando você tomou?
            </DialogTitle>
          </DialogHeader>

          {selectedEvent && (() => {
            const ev = schedule.find((e) => e.id === selectedEvent);
            if (!ev) return null;
            const evTime = new Date(ev.scheduledTime);
            const evTimeStr = evTime.toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            });
            const delayMins = Math.round(
              (now.getTime() - evTime.getTime()) / 60000
            );

            return (
              <div className="space-y-4 pt-2">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Horário programado:{" "}
                    <span className="font-bold text-foreground">{evTimeStr}</span>
                  </p>
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={() => handleConfirmTaken(true)}
                    className="w-full rounded-xl h-12 text-sm font-bold bg-success hover:bg-success/90 text-white"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Tomei na hora certa ({evTimeStr})
                  </Button>

                  <Button
                    onClick={() => handleConfirmTaken(false)}
                    variant="outline"
                    className="w-full rounded-xl h-12 text-sm font-bold border-warning/30 text-warning hover:bg-warning/5"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Tomei agora — atrasado {delayMins}min ({nowTimeStr})
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </>
  );
}
