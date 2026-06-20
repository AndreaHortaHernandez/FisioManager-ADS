import { api } from './api';

export interface AuditLogEntry {
  id: string;
  userId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  metadata: string | null;
  ip: string | null;
  createdAt: string;
}

export const auditApi = {
  list(params?: { userId?: string; entity?: string; action?: string; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.userId) query.set('userId', params.userId);
    if (params?.entity) query.set('entity', params.entity);
    if (params?.action) query.set('action', params.action);
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    return api.get<AuditLogEntry[]>(`/audit${qs ? `?${qs}` : ''}`);
  },
};
