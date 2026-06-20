import { prisma } from '../lib/prisma';

export const conversationRepository = {
  findById(id: string) {
    return prisma.conversation.findUnique({ where: { id } });
  },

  findByParticipants(patientId: string, therapistId: string) {
    return prisma.conversation.findUnique({
      where: { patientId_therapistId: { patientId, therapistId } },
    });
  },

  create(patientId: string, therapistId: string) {
    return prisma.conversation.create({ data: { patientId, therapistId } });
  },

  findForUser(userId: string) {
    return prisma.conversation.findMany({
      where: { OR: [{ patientId: userId }, { therapistId: userId }] },
      orderBy: { lastMessageAt: 'desc' },
    });
  },

  touch(id: string) {
    return prisma.conversation.update({ where: { id }, data: { lastMessageAt: new Date() } });
  },
};
