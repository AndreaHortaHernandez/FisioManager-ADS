import { api } from './api';

export interface AvailabilitySlot {
  id?: string;
  dayOfWeek: number; // 0=Dom ... 6=Sáb
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
}

export const availabilityApi = {
  get: (therapistId: string) =>
    api.get<AvailabilitySlot[]>(`/disponibilidad/${therapistId}`),

  set: (therapistId: string, slots: { dayOfWeek: number; startTime: string; endTime: string }[]) =>
    api.put<AvailabilitySlot[]>(`/disponibilidad/${therapistId}`, { slots }),
};
