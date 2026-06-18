import { api } from './api';

export interface Room {
  id: string;
  name: string;
  location?: string | null;
  capacity: number;
  equipment?: string | null;
  createdAt: string;
}

export const roomsApi = {
  getAll: () => api.get<Room[]>('/admin/salas'),

  create: (data: { name: string; location?: string; capacity?: number; equipment?: string }) =>
    api.post<Room>('/admin/salas', data),

  update: (id: string, data: { name?: string; location?: string; capacity?: number; equipment?: string }) =>
    api.patch<Room>(`/admin/salas/${id}`, data),

  delete: (id: string) => api.delete<{ message: string }>(`/admin/salas/${id}`),
};
