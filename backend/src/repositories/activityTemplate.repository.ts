import { prisma } from '../lib/prisma';

export const activityTemplateRepository = {
  findAll() {
    return prisma.activityTemplate.findMany({ orderBy: { createdAt: 'asc' } });
  },

  findById(id: string) {
    return prisma.activityTemplate.findUnique({ where: { id } });
  },

  create(data: {
    title: string;
    description: string;
    type: string;
    bodyPart?: string;
    videoUrl?: string;
    imageUrl?: string;
  }) {
    return prisma.activityTemplate.create({ data });
  },

  delete(id: string) {
    return prisma.activityTemplate.delete({ where: { id } });
  },
};
