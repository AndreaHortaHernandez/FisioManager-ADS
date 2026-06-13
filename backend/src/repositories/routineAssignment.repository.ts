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
    startDate: Date;
    endDate?: Date;
    frequency: string;
  }) {
    return prisma.routineAssignment.create({ data });
  },

  updateStatus(id: string, status: string) {
    return prisma.routineAssignment.update({ where: { id }, data: { status } });
  },

  findById(id: string) {
    return prisma.routineAssignment.findUnique({ where: { id } });
  },
};
