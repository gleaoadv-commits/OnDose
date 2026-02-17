import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { Medication, ScheduleEvent, AppNotification, UserPlan, MEDICATION_COLORS, MedicationFrequency } from "@/types/medication";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

interface AppState {
  medications: Medication[];
  schedule: ScheduleEvent[];
  notifications: AppNotification[];
  plan: UserPlan;
  loading: boolean;
  addMedication: (med: Omit<Medication, "id" | "status" | "color">) => Promise<boolean>;
  updateMedication: (id: string, updates: Partial<Medication>) => void;
  pauseMedication: (id: string) => void;
  resumeMedication: (id: string) => void;
  stopMedication: (id: string) => void;
  deleteMedication: (id: string) => void;
  markDoseTaken: (eventId: string) => void;
  unmarkDoseTaken: (eventId: string) => void;
  markNotificationRead: (id: string) => void;
  canAddMedication: () => boolean;
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
  const end = med.endDate ? new Date(med.endDate) : new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);
  const dayStep = med.frequency === "semanal" ? 7 : 1;
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
  const [plan] = useState<UserPlan>("free");
  const [loading, setLoading] = useState(true);

  // Load data from DB on mount
  useEffect(() => {
    if (!user) return;
    
    const loadData = async () => {
      setLoading(true);
      try {
        const [medsRes, eventsRes] = await Promise.all([
          supabase.from("medications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
          supabase.from("schedule_events").select("*").eq("user_id", user.id),
        ]);

        if (medsRes.data) {
          setMedications(medsRes.data.map(row => ({
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
          })));
        }

        if (eventsRes.data) {
          setSchedule(eventsRes.data.map(row => ({
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
      } catch (err) {
        console.error("Error loading data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const canAddMedication = useCallback(() => {
    if (plan === "pro") return true;
    return medications.filter(m => m.status !== "encerrado").length < 3;
  }, [medications, plan]);

  const addMedication = useCallback(async (med: Omit<Medication, "id" | "status" | "color">): Promise<boolean> => {
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
    }).select().single();

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

    return true;
  }, [canAddMedication, medications.length, user]);

  const updateMedicationStatus = useCallback(async (id: string, status: string) => {
    if (!user) return;
    await supabase.from("medications").update({ status }).eq("id", id).eq("user_id", user.id);
    setMedications(prev => prev.map(m => m.id === id ? { ...m, status: status as Medication["status"] } : m));
  }, [user]);

  const updateMedication = useCallback((id: string, updates: Partial<Medication>) => {
    // For now, just update locally. Full edit can be added later.
    setMedications(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  }, []);

  const pauseMedication = useCallback((id: string) => updateMedicationStatus(id, "pausado"), [updateMedicationStatus]);
  const resumeMedication = useCallback((id: string) => updateMedicationStatus(id, "ativo"), [updateMedicationStatus]);
  const stopMedication = useCallback((id: string) => updateMedicationStatus(id, "encerrado"), [updateMedicationStatus]);

  const deleteMedication = useCallback(async (id: string) => {
    if (!user) return;
    await supabase.from("medications").delete().eq("id", id).eq("user_id", user.id);
    setMedications(prev => prev.filter(m => m.id !== id));
    setSchedule(prev => prev.filter(e => e.medicationId !== id));
  }, [user]);

  const markDoseTaken = useCallback(async (eventId: string) => {
    if (!user) return;
    const now = new Date().toISOString();
    await supabase.from("schedule_events").update({ taken: true, taken_at: now }).eq("id", eventId).eq("user_id", user.id);
    setSchedule(prev => prev.map(e =>
      e.id === eventId ? { ...e, taken: true, takenAt: now } : e
    ));
    setNotifications(prev => prev.map(n =>
      n.eventId === eventId ? { ...n, read: true } : n
    ));
  }, [user]);

  const unmarkDoseTaken = useCallback(async (eventId: string) => {
    if (!user) return;
    await supabase.from("schedule_events").update({ taken: false, taken_at: null }).eq("id", eventId).eq("user_id", user.id);
    setSchedule(prev => prev.map(e =>
      e.id === eventId ? { ...e, taken: false, takenAt: undefined } : e
    ));
  }, [user]);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  return (
    <AppContext.Provider value={{
      medications, schedule, notifications, plan, loading,
      addMedication, updateMedication, pauseMedication, resumeMedication,
      stopMedication, deleteMedication, markDoseTaken, unmarkDoseTaken,
      markNotificationRead, canAddMedication,
    }}>
      {children}
    </AppContext.Provider>
  );
}
