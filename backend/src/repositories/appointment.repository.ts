import { prisma } from '../lib/prisma';

const include = {
  patient: { select: { id: true, name: true, email: true, phone: true, avatarUrl: true } },
  therapist: { select: { id: true, name: true, email: true } },
} as const;

export const appointmentRepository = {
  findAll(filters: { date?: string; therapistId?: string; patientId?: string; status?: string }) {
    const where: Record<string, unknown> = {};

    if (filters.status)     where.status     = filters.status;
    if (filters.therapistId) where.therapistId = filters.therapistId;
    if (filters.patientId)   where.patientId   = filters.patientId;

    if (filters.date) {
      const start = new Date(filters.date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(filters.date);
      end.setHours(23, 59, 59, 999);
      where.dateTime = { gte: start, lte: end };
    }

    return prisma.appointment.findMany({ where, include, orderBy: { dateTime: 'asc' } });
  },

  findNextForPatient(patientId: string) {
    return prisma.appointment.findFirst({
      where: { patientId, status: 'SCHEDULED', dateTime: { gte: new Date() } },
      include: { therapist: { select: { id: true, name: true } } },
      orderBy: { dateTime: 'asc' },
    });
  },

  findConflict(therapistId: string, dateTime: Date, excludeId?: string) {
    const ONE_HOUR = 60 * 60 * 1000;
    return prisma.appointment.findFirst({
      where: {
        therapistId,
        status: 'SCHEDULED',
        dateTime: {
          gte: new Date(dateTime.getTime() - ONE_HOUR + 1),
          lte: new Date(dateTime.getTime() + ONE_HOUR - 1),
        },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
  },

  findById(id: string) {
    return prisma.appointment.findUnique({ where: { id }, include });
  },

  create(data: { patientId: string; therapistId: string; dateTime: Date; notes?: string }) {
    return prisma.appointment.create({ data, include });
  },

  update(id: string, data: { dateTime?: Date; status?: string; notes?: string }) {
    return prisma.appointment.update({ where: { id }, data, include });
  },

  delete(id: string) {
    return prisma.appointment.delete({ where: { id } });
  },
};
