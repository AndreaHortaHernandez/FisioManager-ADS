import { api } from './api';

export interface SessionExercise {
  id: string;
  sessionId: string;
  activityId: string;
  order: number;
  status: 'COMPLETED' | 'SKIPPED';
}

export interface Session {
  id: string;
  routineId: string;
  patientId: string;
  status: 'IN_PROGRESS' | 'FINISHED';
  completionRate: number | null;
  startedAt: string;
  finishedAt: string | null;
  exercises: SessionExercise[];
}

export const sessionApi = {
  start: (routineId: string) =>
    api.post<Session>('/sesiones', { routineId }),

  trackExercise: (sessionId: string, data: { activityId: string; order: number; status: 'COMPLETED' | 'SKIPPED' }) =>
    api.patch<SessionExercise>(`/sesiones/${sessionId}/ejercicios`, data),

  finalize: (sessionId: string) =>
    api.post<Session>(`/sesiones/${sessionId}/finalizar`, {}),
};
