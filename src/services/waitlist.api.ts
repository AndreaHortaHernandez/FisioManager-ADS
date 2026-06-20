import { api } from './api';

export interface WaitlistEntry {
  id: string;
  patientId: string;
  therapistId: string;
  desiredFrom: string;
  desiredTo: string;
  status: 'WAITING' | 'NOTIFIED' | 'FULFILLED' | 'CANCELLED';
  createdAt: string;
}

export const waitlistApi = {
  list: (therapistId?: string) =>
    api.get<WaitlistEntry[]>(`/waitlist${therapistId ? `?therapistId=${therapistId}` : ''}`),
  join: (data: { therapistId: string; desiredFrom: string; desiredTo: string }) =>
    api.post<WaitlistEntry>('/waitlist', data),
  leave: (id: string) => api.delete<{ message: string }>(`/waitlist/${id}`),
};
