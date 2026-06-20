import { prisma } from '../lib/prisma';

export interface AuditLogInput {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: string | null;
  ip?: string | null;
}

export const auditRepository = {
  create(data: AuditLogInput) {
    return prisma.auditLog.create({ data });
  },

  findMany(filters: { userId?: string; entity?: string; action?: string; limit?: number } = {}) {
    const { userId, entity, action, limit = 200 } = filters;
    return prisma.auditLog.findMany({
      where: {
        ...(userId ? { userId } : {}),
        ...(entity ? { entity } : {}),
        ...(action ? { action } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 500),
    });
  },
};
