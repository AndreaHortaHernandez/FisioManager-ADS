import { prisma } from '../lib/prisma';

export const routineAssignmentRepository = {
  findAll(therapistId: string) {
    return prisma.routineAssignment.findMany({
      where: { therapistId },
      include: {
        routine:  { select: { id: true, title: true, type: true } },
        patient:  { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  findByPatient(patientId: string) {
    return prisma.routineAssignment.findMany({
      where: { patientId },
      include: { routine: { select: { id: true, title: true, type: true } } },
      orderBy: { startDate: 'asc' },
    });
  },

  create(data: {
    routineId: string;
    patientId: string;
    therapistId: string;
    phaseId?: string;
    startDate: Date;
    endDate?: Date;
    frequency: string;
  }) {
    return prisma.routineAssignment.create({ data });
  },

  update(id: string, data: { status?: string; phaseId?: string | null }) {
    return prisma.routineAssignment.update({ where: { id }, data });
  },

  findById(id: string) {
    return prisma.routineAssignment.findUnique({ where: { id } });
  },

  findByPhase(phaseId: string) {
    return prisma.routineAssignment.findMany({
      where: { phaseId },
      include: {
        routine: { select: { id: true, title: true, type: true } },
        patient: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  findActiveForReminders() {
    const now = new Date();
    return prisma.routineAssignment.findMany({
      where: {
        status: 'ACTIVE',
        startDate: { lte: now },
        OR: [{ endDate: null }, { endDate: { gte: now } }],
      },
      include: {
        routine:  { select: { title: true } },
        patient:  { select: { id: true, name: true, email: true } },
      },
    });
  },

  markReminded(id: string, when: Date) {
    return prisma.routineAssignment.update({ where: { id }, data: { lastReminderAt: when } });
  },
};
