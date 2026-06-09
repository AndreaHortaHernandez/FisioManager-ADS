import { patientRepository } from '../repositories/patient.repository';
import { AppError } from '../errors/AppError';

export const patientService = {
  async getAll(therapistId: string) {
    return patientRepository.findAll(therapistId);
  },

  async getById(id: string) {
    const patient = await patientRepository.findById(id);
    if (!patient) throw new AppError('Paciente no encontrado', 404);
    return patient;
  },
};
