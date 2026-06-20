import { api } from './api';

export type BodyPart = 'KNEE' | 'BACK' | 'SHOULDER' | 'NECK' | 'ARM' | 'HIP' | 'ANKLE' | 'OTHER';
export type Side = 'LEFT' | 'RIGHT' | 'CENTER';
export type OutcomeType = 'ROM' | 'STRENGTH' | 'FUNCTIONAL' | 'VAS';

export interface PainPointInput {
  bodyPart: BodyPart;
  side?: Side;
  intensity: number;
  note?: string;
}

export interface PainPoint extends PainPointInput {
  id: string;
  patientId: string;
  feedbackId: string | null;
  createdAt: string;
}

export interface OutcomeMeasure {
  id: string;
  patientId: string;
  therapistId: string;
  type: OutcomeType;
  label: string | null;
  value: number;
  unit: string | null;
  measuredAt: string;
  createdAt: string;
}

export const metricsApi = {
  listOutcomes: (patientId: string, type?: OutcomeType) =>
    api.get<OutcomeMeasure[]>(`/outcome-measures/${patientId}${type ? `?type=${type}` : ''}`),
  createOutcome: (data: { patientId: string; type: OutcomeType; label?: string; value: number; unit?: string; measuredAt?: string }) =>
    api.post<OutcomeMeasure>('/outcome-measures', data),
  deleteOutcome: (id: string) => api.delete<{ message: string }>(`/outcome-measures/${id}`),
  listPainPoints: (patientId: string) => api.get<PainPoint[]>(`/pain-points/${patientId}`),
};
