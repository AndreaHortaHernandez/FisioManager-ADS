import { prisma } from '../lib/prisma';

interface Slot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export const availabilityRepository = {
  findByTherapist(therapistId: string) {
    return prisma.therapistAvailability.findMany({
      where: { therapistId },
      orderBy: { dayOfWeek: 'asc' },
    });
  },

  async replaceForTherapist(therapistId: string, slots: Slot[]) {
    await prisma.therapistAvailability.deleteMany({ where: { therapistId } });
    if (slots.length > 0) {
      await prisma.therapistAvailability.createMany({
        data: slots.map(s => ({ therapistId, ...s })),
      });
    }
    return prisma.therapistAvailability.findMany({
      where: { therapistId },
      orderBy: { dayOfWeek: 'asc' },
    });
  },
};
