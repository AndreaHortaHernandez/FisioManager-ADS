import { api } from './api';

export type PlanStatus = 'ACTIVE' | 'COMPLETED' | 'SUSPENDED';

export interface TreatmentPhase {
  id: string;
  planId: string;
  name: string;
  order: number;
  durationWeeks: number;
  objectives?: string | null;
  createdAt: string;
  assignments: {
    id: string;
    routine?: { id: string; title: string; type: string };
    patient?: { id: string; name: string; avatarUrl?: string };
    status: string;
  }[];
}

export interface TreatmentPlan {
  id: string;
  patientId: string;
  therapistId: string;
  name: string;
  clinicalGoal?: string | null;
  startDate: string;
  endDate?: string | null;
  status: PlanStatus;
  createdAt: string;
  updatedAt: string;
  phases: TreatmentPhase[];
}

export const treatmentPlanApi = {
  getByPatient: (patientId: string) =>
    api.get<TreatmentPlan[]>(`/pacientes/${patientId}/planes`),

  create: (patientId: string, data: { name: string; clinicalGoal?: string; startDate: string; endDate?: string; status?: PlanStatus }) =>
    api.post<TreatmentPlan>(`/pacientes/${patientId}/planes`, data),

  update: (id: string, data: { name?: string; clinicalGoal?: string; startDate?: string; endDate?: string | null; status?: PlanStatus }) =>
    api.patch<TreatmentPlan>(`/planes/${id}`, data),

  addPhase: (planId: string, data: { name: string; order: number; durationWeeks: number; objectives?: string }) =>
    api.post<TreatmentPhase>(`/planes/${planId}/fases`, data),

  updatePhase: (id: string, data: { name?: string; order?: number; durationWeeks?: number; objectives?: string }) =>
    api.patch<TreatmentPhase>(`/fases/${id}`, data),

  deletePhase: (id: string) =>
    api.delete<{ message: string }>(`/fases/${id}`),
};
