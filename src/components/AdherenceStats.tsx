import { useMemo } from "react";
import { Card } from "../components/ui/card";
import { Flame, TrendingUp, CheckCircle2, XCircle } from "lucide-react";
import { ScheduleEvent, Medication } from "../types/medication";

interface AdherenceStatsProps {
  schedule: ScheduleEvent[];
  medications?: Medication[];
}

export default function AdherenceStats({ schedule, medications = [] }: AdherenceStatsProps) {
  const { streak, weeklyRate, weekDays } = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Only count doses tied to currently-active medications, and within their active window.
    // Medications that were encerrado (ended/expired) or inativo_plano should NOT contribute
    // to the weekly adherence — their old scheduled events would otherwise show up as missed.
    const medById = new Map(medications.map(m => [m.id, m]));
    const isCountableEvent = (e: ScheduleEvent) => {
      const med = medById.get(e.medicationId);
      if (!med) return false;
      if (med.status === "encerrado" || med.status === "inativo_plano") return false;
      const eDate = new Date(e.scheduledTime);
      if (med.endDate) {
        const end = new Date(med.endDate + "T23:59:59");
        if (eDate > end) return false;
      }
      if (med.startDate) {
        const start = new Date(med.startDate + "T00:00:00");
        if (eDate < start) return false;
      }
      return true;
    };
    const countableSchedule = medications.length > 0 ? schedule.filter(isCountableEvent) : schedule;

    // --- Weekly summary (last 7 days including today) ---
    const weekDays: { label: string; taken: number; total: number; date: Date }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d).toISOString().slice(0, 10);

      const dayEvents = countableSchedule.filter(e => {
        const eDate = new Date(e.scheduledTime);
        return eDate.toISOString().slice(0, 10) === dayStart && new Date(e.scheduledTime) <= now;
      });

      weekDays.push({
        label: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][d.getDay()],
        taken: dayEvents.filter(e => e.taken).length,
        total: dayEvents.length,
        date: d,
      });
    }

    const totalDoses = weekDays.reduce((acc, d) => acc + d.total, 0);
    const takenDoses = weekDays.reduce((acc, d) => acc + d.taken, 0);
    const weeklyRate = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : null;

    // --- Streak: consecutive days with 100% adherence (going backwards from yesterday) ---
    let streak = 0;
    for (let i = 1; i <= 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().slice(0, 10);

      const dayEvents = countableSchedule.filter(e => {
        return new Date(e.scheduledTime).toISOString().slice(0, 10) === dayStr;
      });

      if (dayEvents.length === 0) break;
      const allTaken = dayEvents.every(e => e.taken);
      if (!allTaken) break;
      streak++;
    }

    const todayEvents = countableSchedule.filter(e => {
      const eDate = new Date(e.scheduledTime);
      return eDate.toISOString().slice(0, 10) === today.toISOString().slice(0, 10) && eDate <= now;
    });
    if (todayEvents.length > 0 && todayEvents.every(e => e.taken)) {
      streak++;
    }

    return { streak, weeklyRate, weekDays };
  }, [schedule, medications]);

  if (weeklyRate === null && streak === 0) return null;

  const streakColor =
    streak >= 14 ? "text-amber-500" :
    streak >= 7  ? "text-pro" :
    streak >= 3  ? "text-success" :
                   "text-muted-foreground";

  const rateColor =
    weeklyRate !== null && weeklyRate >= 90 ? "text-success" :
    weeklyRate !== null && weeklyRate >= 70 ? "text-warning" :
                                               "text-destructive";

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Streak */}
      <Card className="p-4 rounded-2xl border-border/40 flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5">
          <Flame className={`h-4 w-4 ${streakColor}`} />
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Sequência</p>
        </div>
        <p className={`text-3xl font-extrabold ${streakColor} leading-none`}>
          {streak}
          <span className="text-sm font-normal text-muted-foreground ml-1">
            {streak === 1 ? "dia" : "dias"}
          </span>
        </p>
        <p className="text-[11px] text-muted-foreground leading-tight">
          {streak === 0
            ? "Tome todas as doses de hoje!"
            : streak >= 7
            ? "🎉 Incrível consistência!"
            : "Continue assim!"}
        </p>
      </Card>

      {/* Weekly adherence */}
      <Card className="p-4 rounded-2xl border-border/40 flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5">
          <TrendingUp className={`h-4 w-4 ${rateColor}`} />
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Esta semana</p>
        </div>
        {weeklyRate !== null ? (
          <p className={`text-3xl font-extrabold ${rateColor} leading-none`}>
            {weeklyRate}
            <span className="text-sm font-normal text-muted-foreground ml-0.5">%</span>
          </p>
        ) : (
          <p className="text-xl font-bold text-muted-foreground">—</p>
        )}
        {/* Mini day-by-day dots */}
        <div className="flex items-center gap-1 mt-0.5">
          {weekDays.map((d, i) => {
            const isToday = i === 6;
            const allTaken = d.total > 0 && d.taken === d.total;
            const partial = d.total > 0 && d.taken > 0 && d.taken < d.total;
            const missed = d.total > 0 && d.taken === 0;
            const noDoses = d.total === 0;

            return (
              <div key={i} className="flex flex-col items-center gap-0.5">
                <div
                  className={`w-4 h-4 rounded-full border ${
                    noDoses
                      ? "bg-muted border-border/30"
                      : allTaken
                      ? "bg-success border-success"
                      : partial
                      ? "bg-warning border-warning"
                      : missed
                      ? "bg-destructive/40 border-destructive/40"
                      : "bg-muted border-border/30"
                  } ${isToday ? "ring-1 ring-offset-1 ring-primary" : ""}`}
                />
                <span className={`text-[9px] font-bold ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                  {d.label[0]}
                </span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
