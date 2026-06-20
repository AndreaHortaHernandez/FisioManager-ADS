import { feedbackRepository } from '../repositories/feedback.repository';
import { painPointRepository } from '../repositories/painPoint.repository';
import { notificationService } from './notification.service';
import { AppError } from '../errors/AppError';
import { logger } from '../lib/logger';

interface PainPoint {
  bodyPart: string;
  side?: string;
  intensity: number;
  note?: string;
}

export const feedbackService = {
  async getForUser(userId: string, role: string) {
    if (role === 'THERAPIST') return feedbackRepository.findByTherapistPatients(userId);
    return feedbackRepository.findByPatientId(userId);
  },

  async getAnalisis(feedbackId: string, userId: string, role: string) {
    const feedback = await feedbackRepository.findById(feedbackId);
    if (!feedback) throw new AppError('Feedback no encontrado', 404);

    const authorized =
      role === 'THERAPIST' ||
      (role === 'PATIENT' && feedback.patientId === userId);
    if (!authorized) throw new AppError('Sin permiso', 403);

    return {
      feedbackId: feedback.id,
      date:       feedback.date,
      painLevel:  feedback.painLevel,
      transcript: feedback.transcript ?? null,
      aiSummary:  feedback.aiSummary  ?? null,
    };
  },

  async create(data: {
    routineId?: string;
    patientId: string;
    painLevel: number;
    emotionalState: string;
    audioRecordUrl?: string;
    transcript?: string;
    aiSummary?: string;
    painPoints?: PainPoint[];
  }) {
    if (data.painLevel < 1 || data.painLevel > 10) {
      throw new AppError('El nivel de dolor debe estar entre 1 y 10', 422);
    }
    const { painPoints, ...feedbackData } = data;
    const feedback = await feedbackRepository.create(feedbackData);

    if (painPoints && painPoints.length > 0) {
      await painPointRepository.createMany(
        painPoints.map(p => ({ ...p, feedbackId: feedback.id, patientId: data.patientId })),
      );
    }

    notificationService
      .alertHighPain(data.patientId, data.painLevel, data.emotionalState)
      .catch(err => logger.error('high_pain_alert_failed', { patientId: data.patientId, error: err.message }));

    return feedback;
  },

  getPainPoints(patientId: string) {
    return painPointRepository.findByPatient(patientId);
  },
};
