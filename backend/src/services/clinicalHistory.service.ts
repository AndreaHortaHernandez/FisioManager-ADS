import { clinicalHistoryRepository } from '../repositories/clinicalHistory.repository';
import { userRepository } from '../repositories/user.repository';
import { AppError } from '../errors/AppError';

async function ensurePatient(patientId: string) {
  const patient = await userRepository.findById(patientId);
  if (!patient || patient.role !== 'PATIENT') {
    throw new AppError('Paciente no encontrado', 404);
  }
  return patient;
}

export const clinicalHistoryService = {
  async getByPatient(patientId: string) {
    await ensurePatient(patientId);
    return clinicalHistoryRepository.findByPatientId(patientId);
  },

  async upsertForPatient(
    patientId: string,
    data: { bloodType?: string; allergies?: string; background?: string },
  ) {
    await ensurePatient(patientId);
    return clinicalHistoryRepository.upsert(patientId, data);
  },

  async addDiagnosis(
    historyId: string,
    data: { cie10Code: string; description: string; status?: string },
  ) {
    const history = await clinicalHistoryRepository.findById(historyId);
    if (!history) throw new AppError('Historial clínico no encontrado', 404);
    return clinicalHistoryRepository.createDiagnosis(historyId, data);
  },

  async updateDiagnosis(
    id: string,
    data: { cie10Code?: string; description?: string; status?: string },
  ) {
    const diagnosis = await clinicalHistoryRepository.findDiagnosisById(id);
    if (!diagnosis) throw new AppError('Diagnóstico no encontrado', 404);
    return clinicalHistoryRepository.updateDiagnosis(id, data);
  },

  async addNote(historyId: string, authorId: string, content: string, isVisible?: boolean) {
    const history = await clinicalHistoryRepository.findById(historyId);
    if (!history) throw new AppError('Historial clínico no encontrado', 404);
    return clinicalHistoryRepository.createNote(historyId, authorId, content, isVisible);
  },

  async updateNoteVisibility(id: string, isVisible: boolean) {
    const note = await clinicalHistoryRepository.findNoteById(id);
    if (!note) throw new AppError('Nota no encontrada', 404);
    return clinicalHistoryRepository.updateNoteVisibility(id, isVisible);
  },

  async getOwnHistory(patientId: string) {
    return clinicalHistoryRepository.findByPatientIdForPatient(patientId);
  },
};
