import { Request, Response } from 'express';
import { auditService } from '../services/audit.service';
import { catchAsync } from '../utils/catchAsync';
import { ok } from '../utils/response';

export const listAuditLogs = catchAsync(async (req: Request, res: Response) => {
  const { userId, entity, action, limit } = req.query;
  const logs = await auditService.list({
    userId: typeof userId === 'string' ? userId : undefined,
    entity: typeof entity === 'string' ? entity : undefined,
    action: typeof action === 'string' ? action : undefined,
    limit: typeof limit === 'string' ? Number(limit) : undefined,
  });
  ok(res, logs);
});
