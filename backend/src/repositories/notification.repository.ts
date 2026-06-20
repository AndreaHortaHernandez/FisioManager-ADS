import { prisma } from '../lib/prisma';

export interface NotificationInput {
  userId: string;
  type: string;
  title: string;
  body: string;
  linkUrl?: string | null;
}

export const notificationRepository = {
  create(data: NotificationInput) {
    return prisma.notification.create({ data });
  },

  findByUser(userId: string, limit = 50) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 200),
    });
  },

  countUnread(userId: string) {
    return prisma.notification.count({ where: { userId, read: false } });
  },

  markRead(id: string, userId: string) {
    return prisma.notification.updateMany({ where: { id, userId }, data: { read: true } });
  },

  markAllRead(userId: string) {
    return prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
  },
};
