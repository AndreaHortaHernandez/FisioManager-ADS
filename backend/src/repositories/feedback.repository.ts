import { prisma } from '../lib/prisma';

const include = { routine: true } as const;

export const feedbackRepository = {
  findAll() {
    return prisma.feedback.findMany({ include, orderBy: { date: 'desc' } });
  },

  findByPatientId(patientId: string) {
    return prisma.feedback.findMany({
      where: { patientId },
      include,
      orderBy: { date: 'desc' },
    });
  },

  findByTherapistPatients(therapistId: string) {
    return prisma.feedback.findMany({
      where: { patient: { patientProfile: { therapistId } } },
      include,
      orderBy: { date: 'desc' },
    });
  },

  create(data: {
    routineId: string;
    patientId: string;
    painLevel: number;
    emotionalState: string;
    audioRecordUrl?: string;
    aiSummary?: string;
  }) {
    return prisma.feedback.create({ data, include });
  },
};
