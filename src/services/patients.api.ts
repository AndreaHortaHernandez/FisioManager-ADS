import { api } from './api';
import type { Patient } from '../types';

// Estructura real que devuelve el backend
interface ApiPatient {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
  patientProfile?: { userId: string; age: number; condition: string; therapistId: string } | null;
}

function flatten(u: ApiPatient): Patient {
  return {
    id: u.id,
    name: u.name,
    role: 'PATIENT',
    email: u.email,
    isActive: true,
    avatarUrl: u.avatarUrl,
    age: u.patientProfile?.age ?? 0,
    condition: u.patientProfile?.condition ?? '',
    therapistId: u.patientProfile?.therapistId ?? '',
  };
}

export const patientsApi = {
  getAll: async () => {
    const data = await api.get<ApiPatient[]>('/patients');
    return data.map(flatten);
  },
  getById: async (id: string) => {
    const data = await api.get<ApiPatient>(`/patients/${id}`);
    return flatten(data);
  },
};
