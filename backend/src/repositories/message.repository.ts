import { prisma } from '../lib/prisma';

export const messageRepository = {
  create(conversationId: string, senderId: string, content: string) {
    return prisma.message.create({ data: { conversationId, senderId, content } });
  },

  findByConversation(conversationId: string, limit = 100) {
    return prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: Math.min(limit, 300),
    });
  },

  findLast(conversationId: string) {
    return prisma.message.findFirst({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
    });
  },

  countUnread(conversationId: string, readerId: string) {
    return prisma.message.count({
      where: { conversationId, readAt: null, senderId: { not: readerId } },
    });
  },

  markRead(conversationId: string, readerId: string) {
    return prisma.message.updateMany({
      where: { conversationId, readAt: null, senderId: { not: readerId } },
      data: { readAt: new Date() },
    });
  },
};
