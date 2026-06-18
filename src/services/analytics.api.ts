import { api } from './api';

export interface ClinicOverview {
  activePatients: number;
  sessionsCompleted: number;
  avgAdherence: number | null;
}

export interface TherapistComparisonRow {
  therapistId: string;
  therapistName: string;
  activePatients: number;
  sessionsCompleted: number;
  avgAdherence: number | null;
}

export const analyticsApi = {
  getOverview: () => api.get<ClinicOverview>('/admin/analytics/overview'),
  getTherapistComparison: () => api.get<TherapistComparisonRow[]>('/admin/analytics/therapists'),
};
