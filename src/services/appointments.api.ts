import { api } from './api';
import type { Appointment } from '../types';

export const appointmentsApi = {
  getAll(params?: { date?: string; therapistId?: string; patientId?: string; status?: string }) {
    const query = new URLSearchParams();
    if (params?.date)        query.set('date',        params.date);
    if (params?.therapistId) query.set('therapistId', params.therapistId);
    if (params?.patientId)   query.set('patientId',   params.patientId);
    if (params?.status)      query.set('status',      params.status);
    const qs = query.toString();
    return api.get<Appointment[]>(`/appointments${qs ? `?${qs}` : ''}`);
  },

  create(data: {
    patientId: string; therapistId: string; dateTime: string;
    roomId?: string; treatmentPlanId?: string; notes?: string;
    recurrence?: { frequency: 'WEEKLY' | 'BIWEEKLY'; count: number };
  }) {
    return api.post<Appointment>('/appointments', data);
  },

  update(id: string, data: { dateTime?: string; status?: string; roomId?: string | null; treatmentPlanId?: string | null; notes?: string }) {
    return api.patch<Appointment>(`/appointments/${id}`, data);
  },

  cancel(id: string, scope?: 'one' | 'series') {
    return api.patch<Appointment>(`/appointments/${id}/cancel${scope === 'series' ? '?scope=series' : ''}`, {});
  },

  confirm(id: string) {
    return api.patch<Appointment>(`/appointments/${id}/confirm`, {});
  },

  sendReminder(id: string) {
    return api.post<{ messageId: string; preview: string | null }>(`/appointments/${id}/reminder`, {});
  },
};
