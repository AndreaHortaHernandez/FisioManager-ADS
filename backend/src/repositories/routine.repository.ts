import { prisma } from '../lib/prisma';

const include = { activities: { orderBy: { order: 'asc' as const } } } as const;

export const routineRepository = {
  findAll() {
    return prisma.routine.findMany({ include, orderBy: { createdAt: 'desc' } });
  },

  findByPatientId(patientId: string) {
    return prisma.routine.findMany({
      where: { patientId },
      include,
      orderBy: { createdAt: 'desc' },
    });
  },

  findLibrary() {
    return prisma.routine.findMany({
      where: { patientId: null },
      include,
      orderBy: { createdAt: 'desc' },
    });
  },

  findById(id: string) {
    return prisma.routine.findUnique({ where: { id }, include });
  },

  create(data: {
    title: string;
    type: string;
    patientId?: string | null;
    assignedDate?: Date;
    activities: {
      templateId?: string;
      title: string;
      description: string;
      durationMinutes: number;
      restSeconds?: number;
      repetitions: number;
      type: string;
      order: number;
      videoUrl?: string;
    }[];
  }) {
    const { activities, ...routineData } = data;
    return prisma.routine.create({
      data: {
        ...routineData,
        activities: { createMany: { data: activities } },
      },
      include,
    });
  },

  markComplete(id: string) {
    return prisma.routine.update({
      where: { id },
      data: { completed: true },
      include,
    });
  },

  async update(id: string, data: {
    title: string;
    type: string;
    activities: {
      templateId?: string;
      title: string;
      description: string;
      durationMinutes: number;
      restSeconds?: number;
      repetitions: number;
      type: string;
      order: number;
      videoUrl?: string;
    }[];
  }) {
    const { activities, ...routineData } = data;
    await prisma.activity.deleteMany({ where: { routineId: id } });
    return prisma.routine.update({
      where: { id },
      data: {
        ...routineData,
        activities: { createMany: { data: activities } },
      },
      include,
    });
  },

  delete(id: string) {
    return prisma.routine.delete({ where: { id } });
  },
};
