import { feedbackRepository } from '../repositories/feedback.repository';
import { AppError } from '../errors/AppError';

export const feedbackService = {
  async getForUser(userId: string, role: string) {
    if (role === 'THERAPIST') return feedbackRepository.findByTherapistPatients(userId);
    return feedbackRepository.findByPatientId(userId);
  },

  async create(data: {
    routineId: string;
    patientId: string;
    painLevel: number;
    emotionalState: string;
    audioRecordUrl?: string;
    aiSummary?: string;
  }) {
    if (data.painLevel < 1 || data.painLevel > 10) {
      throw new AppError('El nivel de dolor debe estar entre 1 y 10', 422);
    }
    return feedbackRepository.create(data);
  },
};
