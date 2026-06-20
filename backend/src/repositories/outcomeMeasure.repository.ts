import { prisma } from '../lib/prisma';

export interface OutcomeMeasureInput {
  patientId: string;
  therapistId: string;
  type: string;
  label?: string;
  value: number;
  unit?: string;
  measuredAt?: Date;
}

export const outcomeMeasureRepository = {
  create(data: OutcomeMeasureInput) {
    return prisma.outcomeMeasure.create({ data });
  },

  findByPatient(patientId: string, type?: string) {
    return prisma.outcomeMeasure.findMany({
      where: { patientId, ...(type ? { type } : {}) },
      orderBy: { measuredAt: 'asc' },
    });
  },

  findById(id: string) {
    return prisma.outcomeMeasure.findUnique({ where: { id } });
  },

  delete(id: string) {
    return prisma.outcomeMeasure.delete({ where: { id } });
  },
};
