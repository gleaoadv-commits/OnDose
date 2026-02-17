export type MedicationFrequency = 
  | "1x-dia" 
  | "2x-dia" 
  | "3x-dia" 
  | "4x-dia" 
  | "6-6h" 
  | "8-8h" 
  | "12-12h" 
  | "semanal" 
  | "personalizado";

export type MedicationStatus = "ativo" | "pausado" | "encerrado";

export type UserPlan = "free" | "pro" | "premium";

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  quantity: number;
  frequency: MedicationFrequency;
  customFrequencyHours?: number;
  startDate: string;
  endDate?: string;
  times: string[];
  status: MedicationStatus;
  notes?: string;
  color: string;
}

export interface ScheduleEvent {
  id: string;
  medicationId: string;
  medicationName: string;
  dosage: string;
  scheduledTime: string;
  taken: boolean;
  takenAt?: string;
  color: string;
}

export interface AppNotification {
  id: string;
  medicationId: string;
  eventId?: string; // linked schedule event for quick mark
  message: string;
  time: string;
  read: boolean;
  type: "info" | "dose_reminder";
}

export const MEDICATION_COLORS = [
  "hsl(168, 55%, 40%)",
  "hsl(210, 60%, 52%)",
  "hsl(265, 65%, 58%)",
  "hsl(340, 60%, 55%)",
  "hsl(38, 85%, 52%)",
  "hsl(152, 50%, 42%)",
];

export const FREQUENCY_LABELS: Record<MedicationFrequency, string> = {
  "1x-dia": "1 vez ao dia",
  "2x-dia": "2 vezes ao dia",
  "3x-dia": "3 vezes ao dia",
  "4x-dia": "4 vezes ao dia",
  "6-6h": "A cada 6 horas",
  "8-8h": "A cada 8 horas",
  "12-12h": "A cada 12 horas",
  "semanal": "1 vez por semana",
  "personalizado": "Personalizado",
};

export function getTimeSlotsCount(freq: MedicationFrequency, customHours?: number): number {
  switch (freq) {
    case "1x-dia": return 1;
    case "2x-dia": return 2;
    case "3x-dia": return 3;
    case "4x-dia": return 4;
    case "6-6h": return 4;
    case "8-8h": return 3;
    case "12-12h": return 2;
    case "semanal": return 1;
    case "personalizado": {
      if (!customHours || customHours <= 0) return 1;
      return Math.max(1, Math.floor(24 / customHours));
    }
  }
}

export function getDefaultTimes(freq: MedicationFrequency, customHours?: number): string[] {
  switch (freq) {
    case "1x-dia": return ["08:00"];
    case "2x-dia": return ["08:00", "20:00"];
    case "3x-dia": return ["08:00", "14:00", "20:00"];
    case "4x-dia": return ["06:00", "12:00", "18:00", "00:00"];
    case "6-6h": return ["06:00", "12:00", "18:00", "00:00"];
    case "8-8h": return ["06:00", "14:00", "22:00"];
    case "12-12h": return ["08:00", "20:00"];
    case "semanal": return ["08:00"];
    case "personalizado": {
      if (!customHours || customHours <= 0) return ["08:00"];
      const times: string[] = [];
      for (let h = 6; h < 24; h += customHours) {
        times.push(`${String(Math.floor(h)).padStart(2, "0")}:00`);
      }
      return times.length > 0 ? times : ["08:00"];
    }
  }
}
