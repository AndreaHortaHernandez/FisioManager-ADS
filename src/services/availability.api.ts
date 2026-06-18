import { api } from './api';

export interface AvailabilitySlot {
  id?: string;
  dayOfWeek: number; 
  startTime: string; 
  endTime: string;   
}

export const availabilityApi = {
  get: (therapistId: string) =>
    api.get<AvailabilitySlot[]>(`/disponibilidad/${therapistId}`),

  set: (therapistId: string, slots: { dayOfWeek: number; startTime: string; endTime: string }[]) =>
    api.put<AvailabilitySlot[]>(`/disponibilidad/${therapistId}`, { slots }),
};
