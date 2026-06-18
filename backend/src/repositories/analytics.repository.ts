import { prisma } from '../lib/prisma';

export const analyticsRepository = {
  countActivePatients() {
    return prisma.user.count({ where: { role: 'PATIENT', isActive: true } });
  },

  countFinishedSessions() {
    return prisma.session.count({ where: { status: 'FINISHED' } });
  },

  findFinishedSessionsWithPatient() {
    return prisma.session.findMany({
      where: { status: 'FINISHED' },
      select: { completionRate: true, patientId: true },
    });
  },

  findAllTherapists() {
    return prisma.user.findMany({ where: { role: 'THERAPIST' }, select: { id: true, name: true } });
  },

  findPatientIdsByTherapist(therapistId: string) {
    return prisma.patientProfile.findMany({ where: { therapistId }, select: { userId: true } });
  },

  findFinishedSessionsForPatients(patientIds: string[]) {
    return prisma.session.findMany({
      where: { status: 'FINISHED', patientId: { in: patientIds } },
      select: { completionRate: true },
    });
  },
};
