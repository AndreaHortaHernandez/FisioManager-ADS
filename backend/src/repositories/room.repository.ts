import { prisma } from '../lib/prisma';

export const roomRepository = {
  findAll() {
    return prisma.room.findMany({ orderBy: { name: 'asc' } });
  },

  findById(id: string) {
    return prisma.room.findUnique({ where: { id } });
  },

  create(data: { name: string; location?: string; capacity?: number; equipment?: string }) {
    return prisma.room.create({ data });
  },

  update(id: string, data: { name?: string; location?: string; capacity?: number; equipment?: string }) {
    return prisma.room.update({ where: { id }, data });
  },

  delete(id: string) {
    return prisma.room.delete({ where: { id } });
  },
};
