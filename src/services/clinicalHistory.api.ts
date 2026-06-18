import { api } from './api';

export interface Diagnosis {
  id: string;
  cie10Code: string;
  description: string;
  status: 'ACTIVE' | 'RESOLVED';
  createdAt: string;
}

export interface ClinicalNote {
  id: string;
  content: string;
  isVisible: boolean;
  createdAt: string;
  author?: { id: string; name: string; role: string };
}

export interface ClinicalHistory {
  id: string;
  patientId: string;
  bloodType?: string | null;
  allergies?: string | null;
  background?: string | null;
  diagnoses: Diagnosis[];
  notes: ClinicalNote[];
  createdAt: string;
  updatedAt: string;
}

interface HistoryInput {
  bloodType?: string;
  allergies?: string;
  background?: string;
}

export const clinicalHistoryApi = {
  get: (patientId: string) =>
    api.get<ClinicalHistory | null>(`/pacientes/${patientId}/historial`),

  upsert: (patientId: string, data: HistoryInput) =>
    api.post<ClinicalHistory>(`/pacientes/${patientId}/historial`, data),

  addDiagnosis: (historyId: string, data: { cie10Code: string; description: string }) =>
    api.post<Diagnosis>(`/historial/${historyId}/diagnosticos`, data),

  updateDiagnosis: (id: string, data: { status?: 'ACTIVE' | 'RESOLVED'; description?: string; cie10Code?: string }) =>
    api.patch<Diagnosis>(`/diagnosticos/${id}`, data),

  addNote: (historyId: string, content: string, isVisible?: boolean) =>
    api.post<ClinicalNote>(`/historial/${historyId}/notas`, { content, isVisible }),

  updateNoteVisibility: (id: string, isVisible: boolean) =>
    api.patch<ClinicalNote>(`/notas/${id}/visibilidad`, { isVisible }),
};
