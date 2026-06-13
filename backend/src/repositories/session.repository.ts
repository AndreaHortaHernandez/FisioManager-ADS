import { prisma } from '../lib/prisma';

const includeExercises = { exercises: true, routine: { include: { activities: true } } } as const;

export const sessionRepository = {
  create(data: { routineId: string; patientId: string }) {
    return prisma.session.create({ data, include: includeExercises });
  },

  findById(id: string) {
    return prisma.session.findUnique({ where: { id }, include: includeExercises });
  },

  findByPatient(patientId: string) {
    return prisma.session.findMany({
      where: { patientId },
      include: includeExercises,
      orderBy: { startedAt: 'desc' },
    });
  },

  upsertExercise(data: { sessionId: string; activityId: string; order: number; status: string }) {
    return prisma.sessionExercise.upsert({
      where: { sessionId_activityId: { sessionId: data.sessionId, activityId: data.activityId } },
      create: data,
      update: { status: data.status },
    });
  },

  finalize(id: string, completionRate: number) {
    return prisma.session.update({
      where: { id },
      data: { status: 'FINISHED', finishedAt: new Date(), completionRate },
      include: includeExercises,
    });
  },
};
