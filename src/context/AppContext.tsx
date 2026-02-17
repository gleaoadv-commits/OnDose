import React, { createContext, useContext, useState, useCallback } from "react";
import { Medication, ScheduleEvent, AppNotification, UserPlan, MEDICATION_COLORS, generateTimesForFrequency } from "@/types/medication";

interface AppState {
  medications: Medication[];
  schedule: ScheduleEvent[];
  notifications: AppNotification[];
  plan: UserPlan;
  addMedication: (med: Omit<Medication, "id" | "times" | "status" | "color">) => boolean;
  updateMedication: (id: string, updates: Partial<Medication>) => void;
  pauseMedication: (id: string) => void;
  resumeMedication: (id: string) => void;
  stopMedication: (id: string) => void;
  deleteMedication: (id: string) => void;
  markDoseTaken: (eventId: string) => void;
  markNotificationRead: (id: string) => void;
  canAddMedication: () => boolean;
}

const AppContext = createContext<AppState | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

function generateScheduleForMedication(med: Medication): ScheduleEvent[] {
  const events: ScheduleEvent[] = [];
  const start = new Date(med.startDate);
  const end = med.endDate ? new Date(med.endDate) : new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);
  const dayStep = med.frequency === "semanal" ? 7 : 1;

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + dayStep)) {
    for (const time of med.times) {
      const [h, m] = time.split(":").map(Number);
      const dt = new Date(d);
      dt.setHours(h, m, 0, 0);
      events.push({
        id: `${med.id}-${dt.toISOString()}`,
        medicationId: med.id,
        medicationName: med.name,
        dosage: med.dosage,
        scheduledTime: dt.toISOString(),
        taken: false,
        color: med.color,
      });
    }
  }
  return events;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [schedule, setSchedule] = useState<ScheduleEvent[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [plan] = useState<UserPlan>("free");

  const canAddMedication = useCallback(() => {
    if (plan === "pro") return true;
    return medications.filter(m => m.status !== "encerrado").length < 3;
  }, [medications, plan]);

  const addMedication = useCallback((med: Omit<Medication, "id" | "times" | "status" | "color">): boolean => {
    if (!canAddMedication()) return false;
    const id = crypto.randomUUID();
    const times = generateTimesForFrequency(med.frequency, med.customFrequencyHours);
    const color = MEDICATION_COLORS[medications.length % MEDICATION_COLORS.length];
    const newMed: Medication = { ...med, id, times, status: "ativo", color };
    
    setMedications(prev => [...prev, newMed]);
    const events = generateScheduleForMedication(newMed);
    setSchedule(prev => [...prev, ...events]);
    
    setNotifications(prev => [
      {
        id: crypto.randomUUID(),
        medicationId: id,
        message: `${med.name} cadastrado com sucesso! ${times.length} dose(s) por dia.`,
        time: new Date().toISOString(),
        read: false,
      },
      ...prev,
    ]);
    return true;
  }, [canAddMedication, medications.length]);

  const updateMedication = useCallback((id: string, updates: Partial<Medication>) => {
    setMedications(prev => prev.map(m => {
      if (m.id !== id) return m;
      const updated = { ...m, ...updates };
      if (updates.frequency || updates.customFrequencyHours) {
        updated.times = generateTimesForFrequency(updated.frequency, updated.customFrequencyHours);
      }
      // Regenerate schedule
      setSchedule(s => [
        ...s.filter(e => e.medicationId !== id),
        ...generateScheduleForMedication(updated),
      ]);
      return updated;
    }));
  }, []);

  const pauseMedication = useCallback((id: string) => {
    setMedications(prev => prev.map(m => m.id === id ? { ...m, status: "pausado" as const } : m));
  }, []);

  const resumeMedication = useCallback((id: string) => {
    setMedications(prev => prev.map(m => m.id === id ? { ...m, status: "ativo" as const } : m));
  }, []);

  const stopMedication = useCallback((id: string) => {
    setMedications(prev => prev.map(m => m.id === id ? { ...m, status: "encerrado" as const } : m));
  }, []);

  const deleteMedication = useCallback((id: string) => {
    setMedications(prev => prev.filter(m => m.id !== id));
    setSchedule(prev => prev.filter(e => e.medicationId !== id));
  }, []);

  const markDoseTaken = useCallback((eventId: string) => {
    setSchedule(prev => prev.map(e => 
      e.id === eventId ? { ...e, taken: true, takenAt: new Date().toISOString() } : e
    ));
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  return (
    <AppContext.Provider value={{
      medications, schedule, notifications, plan,
      addMedication, updateMedication, pauseMedication, resumeMedication,
      stopMedication, deleteMedication, markDoseTaken, markNotificationRead,
      canAddMedication,
    }}>
      {children}
    </AppContext.Provider>
  );
}
