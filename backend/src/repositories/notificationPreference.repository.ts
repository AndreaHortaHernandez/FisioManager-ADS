import { prisma } from '../lib/prisma';

const DEFAULTS = {
  emailEnabled: true,
  routineReminders: true,
  appointmentReminders: true,
  quietHoursStart: null as string | null,
  quietHoursEnd: null as string | null,
};

export const notificationPreferenceRepository = {
  findByUserId(userId: string) {
    return prisma.notificationPreference.findUnique({ where: { userId } });
  },

  upsert(userId: string, data: Partial<typeof DEFAULTS>) {
    return prisma.notificationPreference.upsert({
      where: { userId },
      update: data,
      create: { userId, ...DEFAULTS, ...data },
    });
  },
};
