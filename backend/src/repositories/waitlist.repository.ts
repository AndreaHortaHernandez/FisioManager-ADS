import { prisma } from '../lib/prisma';

export const waitlistRepository = {
  create(data: { patientId: string; therapistId: string; desiredFrom: Date; desiredTo: Date }) {
    return prisma.waitlist.create({ data });
  },

  findForUser(patientId: string) {
    return prisma.waitlist.findMany({ where: { patientId }, orderBy: { createdAt: 'desc' } });
  },

  findByTherapist(therapistId: string) {
    return prisma.waitlist.findMany({ where: { therapistId }, orderBy: { createdAt: 'asc' } });
  },

  findMatching(therapistId: string, when: Date) {
    return prisma.waitlist.findMany({
      where: {
        therapistId,
        status: 'WAITING',
        desiredFrom: { lte: when },
        desiredTo: { gte: when },
      },
      orderBy: { createdAt: 'asc' },
    });
  },

  updateStatus(id: string, status: string) {
    return prisma.waitlist.update({ where: { id }, data: { status } });
  },

  delete(id: string) {
    return prisma.waitlist.delete({ where: { id } });
  },

  findById(id: string) {
    return prisma.waitlist.findUnique({ where: { id } });
  },
};
