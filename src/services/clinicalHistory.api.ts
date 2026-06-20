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

export interface ClinicalDocument {
  id: string;
  patientId: string;
  uploaderId: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  sizeBytes: number;
  category: string;
  isVisible: boolean;
  createdAt: string;
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

  listDocuments: (patientId: string) =>
    api.get<ClinicalDocument[]>(`/pacientes/${patientId}/documentos`),

  uploadDocument: (patientId: string, file: File, category: string, isVisible: boolean) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('category', category);
    fd.append('isVisible', String(isVisible));
    return api.postForm<ClinicalDocument>(`/pacientes/${patientId}/documentos`, fd);
  },

  deleteDocument: (id: string) =>
    api.delete<{ message: string }>(`/documentos/${id}`),
};
