import { prisma } from '../lib/prisma';

export interface PainPointInput {
  feedbackId?: string;
  patientId: string;
  bodyPart: string;
  side?: string;
  intensity: number;
  note?: string;
}

export const painPointRepository = {
  createMany(points: PainPointInput[]) {
    return prisma.painPoint.createMany({ data: points });
  },

  findByPatient(patientId: string) {
    return prisma.painPoint.findMany({ where: { patientId }, orderBy: { createdAt: 'desc' } });
  },
};
