import { api } from './api';
import type { RoutineAssignment, AssignmentFrequency, AssignmentStatus } from '../types';

export const routineAssignmentsApi = {
  getAll: () =>
    api.get<RoutineAssignment[]>('/routine-assignments'),

  getByPatient: (patientId: string) =>
    api.get<RoutineAssignment[]>(`/routine-assignments/patient/${patientId}`),

  create: (data: {
    routineId:  string;
    patientId:  string;
    phaseId?:   string;
    startDate:  string;
    endDate?:   string;
    frequency:  AssignmentFrequency;
  }) => api.post<RoutineAssignment>('/routine-assignments', data),

  updateStatus: (id: string, status: AssignmentStatus) =>
    api.patch<RoutineAssignment>(`/routine-assignments/${id}`, { status }),

  updatePhase: (id: string, phaseId: string | null) =>
    api.patch<RoutineAssignment>(`/routine-assignments/${id}`, { phaseId }),
};
