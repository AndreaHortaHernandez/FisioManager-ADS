import { auditRepository } from '../repositories/audit.repository';
import { logger } from '../lib/logger';

interface LogParams {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
  ip?: string | null;
}

export const auditService = {
  log(params: LogParams): void {
    auditRepository
      .create({
        userId: params.userId ?? null,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId ?? null,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
        ip: params.ip ?? null,
      })
      .catch(err =>
        logger.error('audit_log_failed', {
          action: params.action,
          entity: params.entity,
          error: err instanceof Error ? err.message : String(err),
        }),
      );
  },

  list(filters: { userId?: string; entity?: string; action?: string; limit?: number }) {
    return auditRepository.findMany(filters);
  },
};
