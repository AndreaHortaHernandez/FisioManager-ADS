import { prisma } from '../lib/prisma';

const planInclude = {
  phases: {
    orderBy: { order: 'asc' as const },
    include: {
      assignments: {
        include: { routine: { select: { id: true, title: true, type: true } } },
      },
    },
  },
};

export const treatmentPlanRepository = {
  findByPatientId(patientId: string) {
    return prisma.treatmentPlan.findMany({
      where: { patientId },
      include: planInclude,
      orderBy: { createdAt: 'desc' },
    });
  },

  findById(id: string) {
    return prisma.treatmentPlan.findUnique({ where: { id }, include: planInclude });
  },

  create(data: {
    patientId: string;
    therapistId: string;
    name: string;
    clinicalGoal?: string;
    startDate: Date;
    endDate?: Date;
    status?: string;
  }) {
    return prisma.treatmentPlan.create({ data, include: planInclude });
  },

  update(id: string, data: {
    name?: string;
    clinicalGoal?: string;
    startDate?: Date;
    endDate?: Date | null;
    status?: string;
  }) {
    return prisma.treatmentPlan.update({ where: { id }, data, include: planInclude });
  },

  createPhase(planId: string, data: { name: string; order: number; durationWeeks: number; objectives?: string }) {
    return prisma.treatmentPhase.create({ data: { planId, ...data } });
  },

  findPhaseById(id: string) {
    return prisma.treatmentPhase.findUnique({ where: { id } });
  },

  updatePhase(id: string, data: { name?: string; order?: number; durationWeeks?: number; objectives?: string }) {
    return prisma.treatmentPhase.update({ where: { id }, data });
  },

  deletePhase(id: string) {
    return prisma.treatmentPhase.delete({ where: { id } });
  },
};
