import { api } from './api';
import type { Routine, Activity } from '../types';

interface CreateRoutinePayload {
  title: string;
  type: 'TREATMENT' | 'RELAXATION';
  patientId?: string | null;
  activities: Omit<Activity, 'id'>[];
}

export const routinesApi = {
  getAll: () => api.get<Routine[]>('/routines'),
  getLibrary: () => api.get<Routine[]>('/routines/library'),
  getById: (id: string) => api.get<Routine>(`/routines/${id}`),
  create: (data: CreateRoutinePayload) => api.post<Routine>('/routines', data),
  markComplete: (id: string) => api.patch<Routine>(`/routines/${id}/complete`),
  assignToPatients: (id: string, patientIds: string[]) =>
    api.post<Routine[]>(`/routines/${id}/assign`, { patientIds }),
};
