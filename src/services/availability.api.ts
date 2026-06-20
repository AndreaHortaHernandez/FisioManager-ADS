import { api } from './api';

export interface AvailabilitySlot {
  id?: string;
  dayOfWeek: number; 
  startTime: string; 
  endTime: string;   
}

export interface FreeSlot {
  dateTime: string;
}

export const availabilityApi = {
  get: (therapistId: string) =>
    api.get<AvailabilitySlot[]>(`/disponibilidad/${therapistId}`),

  set: (therapistId: string, slots: { dayOfWeek: number; startTime: string; endTime: string }[]) =>
    api.put<AvailabilitySlot[]>(`/disponibilidad/${therapistId}`, { slots }),

  slots: (therapistId: string, from: string, to: string) =>
    api.get<FreeSlot[]>(`/disponibilidad/${therapistId}/slots?from=${from}&to=${to}`),
};
