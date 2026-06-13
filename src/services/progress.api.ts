import { api } from './api';

export interface AdherenceDay {
  day: string;
  date: string;
  count: number;
}

export interface PatientProgress {
  streak: number;
  weeklyGoal: { completed: number; target: number };
  adherenceByDay: AdherenceDay[];
  avgPain: number | null;
  totalCompleted: number;
  aiInsight: string | null;
}

export interface ProximaCita {
  id: string;
  dateTime: string;
  therapist: { id: string; name: string };
  notes: string | null;
}

export const progressApi = {
  getProgreso: () => api.get<PatientProgress>('/me/progreso'),
  getProximaCita: () => api.get<ProximaCita | null>('/me/proxima-cita'),
};
