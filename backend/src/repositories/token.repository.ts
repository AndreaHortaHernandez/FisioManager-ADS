import { prisma } from '../lib/prisma';

export const tokenRepository = {
  revoke(token: string, expiresAt: Date) {
    return prisma.revokedToken.upsert({
      where: { token },
      update: {},
      create: { token, expiresAt },
    });
  },

  async isRevoked(token: string): Promise<boolean> {
    const found = await prisma.revokedToken.findUnique({ where: { token } });
    return Boolean(found);
  },

  deleteExpired() {
    return prisma.revokedToken.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  },
};
