import { prisma } from '../lib/prisma';

export const refreshTokenRepository = {
  create(userId: string, token: string, expiresAt: Date) {
    return prisma.refreshToken.create({ data: { userId, token, expiresAt } });
  },

  findValid(token: string) {
    return prisma.refreshToken.findFirst({
      where: { token, expiresAt: { gt: new Date() } },
    });
  },

  deleteByToken(token: string) {
    return prisma.refreshToken.deleteMany({ where: { token } });
  },

  deleteAllForUser(userId: string) {
    return prisma.refreshToken.deleteMany({ where: { userId } });
  },
};
