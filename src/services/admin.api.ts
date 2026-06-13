import { api } from './api';
import type { Patient, Therapist } from '../types';

export const adminApi = {
  getTherapists() {
    return api.get<Therapist[]>('/admin/therapists');
  },

  registerTherapist(data: { name: string; email: string; password: string; phone?: string; cedula?: string; especialidad?: string }) {
    return api.post<Therapist>('/admin/therapists', data);
  },

  toggleActive(userId: string) {
    return api.patch<{ id: string; isActive: boolean }>(`/admin/users/${userId}/toggle-active`, {});
  },

  getPatients() {
    return api.get<(Patient & { phone?: string })[]>('/admin/patients');
  },

  registerPatient(data: {
    name: string; email: string; password: string; phone?: string;
    age: number; condition: string; therapistId: string;
  }) {
    return api.post<Patient>('/admin/patients', data);
  },

  assignPatient(patientId: string, therapistId: string) {
    return api.patch<{ message: string }>(`/admin/patients/${patientId}/assign`, { therapistId });
  },
};
