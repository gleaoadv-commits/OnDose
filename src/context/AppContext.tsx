import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { Medication, ScheduleEvent, AppNotification, UserPlan, MEDICATION_COLORS, MedicationFrequency, getFrequencyDayStep } from "@/types/medication";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

interface AppState {
  medications: Medication[];
  schedule: ScheduleEvent[];
  notifications: AppNotification[];
  plan: UserPlan;
  subscriptionEnd: string | null;
  isAdmin: boolean;
  loading: boolean;
  devPlanOverride: UserPlan | null;
  setDevPlanOverride: (plan: UserPlan | null) => void;
  refreshSubscription: () => Promise<void>;
  addMedication: (med: Omit<Medication, "id" | "status" | "color">) => Promise<string | false>;
  updateMedication: (id: string, updates: Partial<Medication>) => void;
  pauseMedication: (id: string) => void;
  resumeMedication: (id: string) => void;
  stopMedication: (id: string) => void;
  deleteMedication: (id: string) => void;
  markDoseTaken: (eventId: string) => void;
  unmarkDoseTaken: (eventId: string) => void;
  deleteScheduleEvent: (eventId: string) => Promise<void>;
  updateScheduleEventTime: (eventId: string, newTime: string) => Promise<void>;
  markNotificationRead: (id: string) => void;
  canAddMedication: () => boolean;
  markAllPastDosesTaken: (medicationId: string) => Promise<void>;
}

const AppContext = createContext<AppState | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

function generateScheduleForMedication(med: Medication, userId: string): Omit<ScheduleEvent, "id">[] {
  const events: Omit<ScheduleEvent, "id">[] = [];
  const start = new Date(med.startDate);
  const end = med.endDate ? new Date(med.endDate) : new Date(start.getTime() + 90 * 24 * 60 * 60 * 1000);
  const dayStep = getFrequencyDayStep(med.frequency);
  const dosageLabel = `${med.dosage} — ${med.quantity} comp.`;

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + dayStep)) {
    for (const time of med.times) {
      const [h, m] = time.split(":").map(Number);
      const dt = new Date(d);
      dt.setHours(h, m, 0, 0);
      events.push({
        medicationId: med.id,
        medicationName: med.name,
        dosage: dosageLabel,
        scheduledTime: dt.toISOString(),
        taken: false,
        color: med.color,
      });
    }
  }
  return events;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [schedule, setSchedule] = useState<ScheduleEvent[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [plan, setPlan] = useState<UserPlan>("free");
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [devPlanOverride, setDevPlanOverride] = useState<UserPlan | null>(null);

  const effectivePlan = devPlanOverride ?? plan;

  const refreshSubscription = useCallback(async () => {
    if (!user) return;
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.access_token) return;

      const { data, error } = await supabase.functions.invoke("check-subscription", {
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
      });

      if (error) {
        console.error("Error checking subscription:", error);
        return;
      }
      if (data?.plan) {
        const newPlan = data.plan as UserPlan;
        setPlan(newPlan);
        setSubscriptionEnd(data.subscription_end ?? null);

        // Auto-reactivate medications disabled due to free plan limit
        if (newPlan !== "free") {
          const inactivePlanMeds = medications.filter(m => m.status === "inativo_plano");
          for (const med of inactivePlanMeds) {
            await supabase.from("medications").update({ status: "ativo" }).eq("id", med.id).eq("user_id", user.id);
          }
          if (inactivePlanMeds.length > 0) {
            setMedications(prev => prev.map(m =>
              m.status === "inativo_plano" ? { ...m, status: "ativo" as const } : m
            ));
          }
        }
      }
    } catch (err) {
      console.error("Error refreshing subscription:", err);
    }
  }, [user, medications]);

  // Load data from DB on mount
  useEffect(() => {
    if (!user) return;
    
    const loadData = async () => {
      setLoading(true);
      try {
        const [medsRes, eventsRes, rolesRes] = await Promise.all([
          supabase.from("medications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
          supabase.from("schedule_events").select("*").eq("user_id", user.id),
          supabase.from("user_roles").select("role").eq("user_id", user.id),
        ]);

        // Admin users get PRO plan
        if (rolesRes.data?.some((r: any) => r.role === "admin")) {
          setIsAdmin(true);
          setPlan("pro");
        }

        // Check Stripe subscription in parallel (non-blocking for UI)
        refreshSubscription();

        const loadedMeds: Medication[] = (medsRes.data ?? []).map((row: any) => ({
          id: row.id,
          name: row.name,
          dosage: row.dosage,
          quantity: row.quantity,
          frequency: row.frequency as MedicationFrequency,
          customFrequencyHours: row.custom_frequency_hours ?? undefined,
          startDate: row.start_date,
          endDate: row.end_date ?? undefined,
          times: row.times,
          status: row.status as Medication["status"],
          notes: row.notes ?? undefined,
          color: row.color,
          stockTotal: row.stock_total ?? undefined,
          stockCurrent: row.stock_current ?? undefined,
          pauseUntil: row.pause_until ?? undefined,
          addedByName: (row as any).added_by_name ?? null,
        }));

        const loadedEvents: ScheduleEvent[] = (eventsRes.data ?? []).map(row => ({
          id: row.id,
          medicationId: row.medication_id,
          medicationName: row.medication_name,
          dosage: row.dosage,
          scheduledTime: row.scheduled_time,
          taken: row.taken,
          takenAt: row.taken_at ?? undefined,
          color: row.color,
        }));

        // Recalculate stockCurrent based on actual taken events for each medication
        const recalcMeds = loadedMeds.map(med => {
          if (med.stockTotal == null) return med;
          const takenCount = loadedEvents.filter(e => e.medicationId === med.id && e.taken).length;
          const newStock = Math.max(0, med.stockTotal - takenCount * med.quantity);
          return { ...med, stockCurrent: newStock };
        });

        // Persist recalculated values if they differ
        for (const med of recalcMeds) {
          const orig = loadedMeds.find(m => m.id === med.id);
          if (orig && orig.stockTotal != null && orig.stockCurrent !== med.stockCurrent) {
            supabase.from("medications").update({ stock_current: med.stockCurrent } as any).eq("id", med.id).eq("user_id", user.id);
          }
        }

        setMedications(recalcMeds);
        setSchedule(loadedEvents);
      } catch (err) {
        console.error("Error loading data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const canAddMedication = useCallback(() => {
    if (effectivePlan === "pro" || effectivePlan === "premium") return true;
    return medications.filter(m => m.status !== "encerrado").length < 2;
  }, [medications, effectivePlan]);

  const addMedication = useCallback(async (med: Omit<Medication, "id" | "status" | "color">): Promise<string | false> => {
    if (!canAddMedication() || !user) return false;

    const color = MEDICATION_COLORS[medications.length % MEDICATION_COLORS.length];

    // Insert medication
    const { data: medRow, error: medError } = await supabase.from("medications").insert({
      user_id: user.id,
      name: med.name,
      dosage: med.dosage,
      quantity: med.quantity,
      frequency: med.frequency,
      custom_frequency_hours: med.customFrequencyHours ?? null,
      start_date: med.startDate,
      end_date: med.endDate ?? null,
      times: med.times,
      status: "ativo",
      notes: med.notes ?? null,
      color,
      stock_total: med.stockTotal ?? null,
      stock_current: med.stockCurrent ?? null,
    } as any).select().single();

    if (medError || !medRow) {
      console.error("Error adding medication:", medError);
      return false;
    }

    const newMed: Medication = {
      id: medRow.id,
      name: med.name,
      dosage: med.dosage,
      quantity: med.quantity,
      frequency: med.frequency,
      customFrequencyHours: med.customFrequencyHours,
      startDate: med.startDate,
      endDate: med.endDate,
      times: med.times,
      status: "ativo",
      notes: med.notes,
      color,
      stockTotal: med.stockTotal,
      stockCurrent: med.stockCurrent,
    };

    setMedications(prev => [newMed, ...prev]);

    // Generate and insert schedule events
    const eventRows = generateScheduleForMedication(newMed, user.id);
    const toInsert = eventRows.map(e => ({
      user_id: user.id,
      medication_id: newMed.id,
      medication_name: e.medicationName,
      dosage: e.dosage,
      scheduled_time: e.scheduledTime,
      taken: false,
      color: e.color,
    }));

    // Insert in batches of 500
    const inserted: ScheduleEvent[] = [];
    for (let i = 0; i < toInsert.length; i += 500) {
      const batch = toInsert.slice(i, i + 500);
      const { data } = await supabase.from("schedule_events").insert(batch).select();
      if (data) {
        inserted.push(...data.map(row => ({
          id: row.id,
          medicationId: row.medication_id,
          medicationName: row.medication_name,
          dosage: row.dosage,
          scheduledTime: row.scheduled_time,
          taken: row.taken,
          takenAt: row.taken_at ?? undefined,
          color: row.color,
        })));
      }
    }

    setSchedule(prev => [...prev, ...inserted]);

    // Create in-app notification
    setNotifications(prev => [
      {
        id: crypto.randomUUID(),
        medicationId: newMed.id,
        message: `✅ ${med.name} cadastrado! ${med.times.length} dose(s) por dia.`,
        time: new Date().toISOString(),
        read: false,
        type: "info",
      },
      ...prev,
    ]);

    // Create dose reminder notifications for today
    const todayEvents = inserted.filter(e => {
      const d = new Date(e.scheduledTime);
      return d.toDateString() === new Date().toDateString();
    });

    const doseNotifs: AppNotification[] = todayEvents.map(e => ({
      id: crypto.randomUUID(),
      medicationId: newMed.id,
      eventId: e.id,
      message: `💊 Hora de tomar ${med.name} (${med.dosage})`,
      time: e.scheduledTime,
      read: false,
      type: "dose_reminder" as const,
    }));

    if (doseNotifs.length > 0) {
      setNotifications(prev => [...doseNotifs, ...prev]);
    }

    return newMed.id;
  }, [canAddMedication, medications.length, user]);

  const updateMedicationStatus = useCallback(async (id: string, status: string) => {
    if (!user) return;
    await supabase.from("medications").update({ status }).eq("id", id).eq("user_id", user.id);
    setMedications(prev => prev.map(m => m.id === id ? { ...m, status: status as Medication["status"] } : m));
  }, [user]);

  const updateMedication = useCallback(async (id: string, updates: Partial<Medication>) => {
    if (!user) return;
    const dbUpdates: Record<string, any> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.dosage !== undefined) dbUpdates.dosage = updates.dosage;
    if (updates.quantity !== undefined) dbUpdates.quantity = updates.quantity;
    if (updates.frequency !== undefined) dbUpdates.frequency = updates.frequency;
    if (updates.customFrequencyHours !== undefined) dbUpdates.custom_frequency_hours = updates.customFrequencyHours ?? null;
    if (updates.times !== undefined) dbUpdates.times = updates.times;
    if (updates.endDate !== undefined) dbUpdates.end_date = updates.endDate || null;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes || null;
    if (updates.stockTotal !== undefined) dbUpdates.stock_total = updates.stockTotal ?? null;
    if (updates.stockCurrent !== undefined) dbUpdates.stock_current = updates.stockCurrent ?? null;
    if (updates.pauseUntil !== undefined) dbUpdates.pause_until = updates.pauseUntil || null;

    if (Object.keys(dbUpdates).length > 0) {
      await supabase.from("medications").update(dbUpdates).eq("id", id).eq("user_id", user.id);
    }

    // If times changed, regenerate future schedule events
    if (updates.times !== undefined) {
      const currentMed = medications.find(m => m.id === id);
      if (currentMed) {
        const updatedMed: Medication = { ...currentMed, ...updates };
        const now = new Date().toISOString();

        // Delete future untaken events for this medication
        await supabase
          .from("schedule_events")
          .delete()
          .eq("medication_id", id)
          .eq("user_id", user.id)
          .eq("taken", false)
          .gte("scheduled_time", now);

        // Regenerate from today
        const newEvents = generateScheduleForMedication(updatedMed, user.id);
        const futureEvents = newEvents.filter(e => new Date(e.scheduledTime) >= new Date(now));

        const toInsert = futureEvents.map(e => ({
          user_id: user.id,
          medication_id: updatedMed.id,
          medication_name: e.medicationName,
          dosage: e.dosage,
          scheduled_time: e.scheduledTime,
          taken: false,
          color: e.color,
        }));

        const inserted: ScheduleEvent[] = [];
        for (let i = 0; i < toInsert.length; i += 500) {
          const batch = toInsert.slice(i, i + 500);
          const { data } = await supabase.from("schedule_events").insert(batch).select();
          if (data) {
            inserted.push(...data.map(row => ({
              id: row.id,
              medicationId: row.medication_id,
              medicationName: row.medication_name,
              dosage: row.dosage,
              scheduledTime: row.scheduled_time,
              taken: row.taken,
              takenAt: row.taken_at ?? undefined,
              color: row.color,
            })));
          }
        }

        setSchedule(prev => [
          ...prev.filter(e => e.medicationId !== id || e.taken || new Date(e.scheduledTime) < new Date(now)),
          ...inserted,
        ]);
      }
    }

    setMedications(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  }, [user, medications]);

  const pauseMedication = useCallback((id: string) => updateMedicationStatus(id, "pausado"), [updateMedicationStatus]);
  const resumeMedication = useCallback((id: string) => updateMedicationStatus(id, "ativo"), [updateMedicationStatus]);
  const stopMedication = useCallback((id: string) => updateMedicationStatus(id, "encerrado"), [updateMedicationStatus]);

  const deleteMedication = useCallback(async (id: string) => {
    if (!user) return;
    // Delete schedule events first (FK constraint)
    await supabase.from("schedule_events").delete().eq("medication_id", id).eq("user_id", user.id);
    await supabase.from("medications").delete().eq("id", id).eq("user_id", user.id);
    setMedications(prev => prev.filter(m => m.id !== id));
    setSchedule(prev => prev.filter(e => e.medicationId !== id));
    setNotifications(prev => prev.filter(n => n.medicationId !== id));
  }, [user]);

  // Helper: recalculate stockCurrent for a medication based on taken events
  const recalculateStock = useCallback(async (medId: string, updatedSchedule: ScheduleEvent[]) => {
    const med = medications.find(m => m.id === medId);
    if (!med || med.stockTotal == null) return;

    const takenCount = updatedSchedule.filter(
      e => e.medicationId === medId && e.taken
    ).length;

    const newStock = Math.max(0, med.stockTotal - takenCount * med.quantity);
    await supabase.from("medications").update({ stock_current: newStock } as any).eq("id", medId).eq("user_id", user!.id);
    setMedications(prev => prev.map(m => m.id === medId ? { ...m, stockCurrent: newStock } : m));
  }, [medications, user]);

  const markDoseTaken = useCallback(async (eventId: string) => {
    if (!user) return;
    const now = new Date().toISOString();
    await supabase.from("schedule_events").update({ taken: true, taken_at: now }).eq("id", eventId).eq("user_id", user.id);

    const updatedSchedule = schedule.map(e =>
      e.id === eventId ? { ...e, taken: true, takenAt: now } : e
    );
    setSchedule(updatedSchedule);

    // Recalculate stock from total taken doses
    const event = schedule.find(e => e.id === eventId);
    if (event) {
      await recalculateStock(event.medicationId, updatedSchedule);
    }

    setNotifications(prev => prev.map(n =>
      n.eventId === eventId ? { ...n, read: true } : n
    ));
  }, [user, schedule, recalculateStock]);

  const unmarkDoseTaken = useCallback(async (eventId: string) => {
    if (!user) return;
    await supabase.from("schedule_events").update({ taken: false, taken_at: null }).eq("id", eventId).eq("user_id", user.id);

    const updatedSchedule = schedule.map(e =>
      e.id === eventId ? { ...e, taken: false, takenAt: undefined } : e
    );
    setSchedule(updatedSchedule);

    // Recalculate stock from total taken doses
    const event = schedule.find(e => e.id === eventId);
    if (event) {
      await recalculateStock(event.medicationId, updatedSchedule);
    }
  }, [user, schedule, recalculateStock]);

  const deleteScheduleEvent = useCallback(async (eventId: string) => {
    if (!user) return;
    const event = schedule.find(e => e.id === eventId);
    await supabase.from("schedule_events").delete().eq("id", eventId).eq("user_id", user.id);

    const updatedSchedule = schedule.filter(e => e.id !== eventId);
    setSchedule(updatedSchedule);
    setNotifications(prev => prev.filter(n => n.eventId !== eventId));

    // If the deleted event was taken, recalculate stock and notify
    if (event?.taken) {
      const med = medications.find(m => m.id === event.medicationId);
      if (med && med.stockTotal != null) {
        const takenCount = updatedSchedule.filter(e => e.medicationId === event.medicationId && e.taken).length;
        const newStock = Math.max(0, med.stockTotal - takenCount * med.quantity);
        await supabase.from("medications").update({ stock_current: newStock } as any).eq("id", med.id).eq("user_id", user.id);
        setMedications(prev => prev.map(m => m.id === med.id ? { ...m, stockCurrent: newStock } : m));
        // In-app notification informing the updated stock
        setNotifications(prev => [
          {
            id: crypto.randomUUID(),
            medicationId: med.id,
            message: `📦 Dose de ${med.name} excluída. Estoque atualizado: você tem aproximadamente ${newStock} comprimido(s) restante(s).`,
            time: new Date().toISOString(),
            read: false,
            type: "info" as const,
          },
          ...prev,
        ]);
      }
    }
  }, [user, schedule, medications]);

  const updateScheduleEventTime = useCallback(async (eventId: string, newTime: string) => {
    if (!user) return;
    await supabase.from("schedule_events").update({ scheduled_time: newTime }).eq("id", eventId).eq("user_id", user.id);
    setSchedule(prev => prev.map(e => e.id === eventId ? { ...e, scheduledTime: newTime } : e));
  }, [user]);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllPastDosesTaken = useCallback(async (medicationId: string) => {
    if (!user) return;
    const now = new Date().toISOString();

    // Get all past untaken events for this medication
    const pastEvents = schedule.filter(
      e => e.medicationId === medicationId && !e.taken && e.scheduledTime < now
    );
    if (pastEvents.length === 0) return;

    const ids = pastEvents.map(e => e.id);

    // Batch update in DB
    await supabase
      .from("schedule_events")
      .update({ taken: true, taken_at: now })
      .in("id", ids)
      .eq("user_id", user.id);

    const updatedSchedule = schedule.map(e =>
      ids.includes(e.id) ? { ...e, taken: true, takenAt: now } : e
    );
    setSchedule(updatedSchedule);

    // Recalculate stock
    await recalculateStock(medicationId, updatedSchedule);
  }, [user, schedule, recalculateStock]);

  return (
    <AppContext.Provider value={{
      medications, schedule, notifications, plan: effectivePlan, subscriptionEnd, loading, isAdmin,
      devPlanOverride, setDevPlanOverride,
      refreshSubscription,
      addMedication, updateMedication, pauseMedication, resumeMedication,
      stopMedication, deleteMedication, markDoseTaken, unmarkDoseTaken,
      deleteScheduleEvent, updateScheduleEventTime,
      markNotificationRead, canAddMedication, markAllPastDosesTaken,
    }}>
      {children}
    </AppContext.Provider>
  );
}
