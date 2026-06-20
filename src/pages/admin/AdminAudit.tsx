import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, RefreshCw } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { auditApi, type AuditLogEntry } from '../../services/audit.api';

const ACTION_KEYS = ['LOGIN', 'LOGOUT', 'VIEW_CLINICAL_HISTORY', 'UPLOAD_DOCUMENT', 'DELETE_DOCUMENT'];

export function AdminAudit() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [actionFilter, setActionFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function load() {
    setLoading(true);
    setError('');
    auditApi
      .list({ action: actionFilter || undefined, limit: 200 })
      .then(setLogs)
      .catch(e => setError((e as Error).message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionFilter]);

  const actionLabel = (action: string) =>
    ACTION_KEYS.includes(action) ? t(`admin.audit.actions.${action}`) : action;

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-3">
            <ShieldCheck className="text-primary" /> {t('admin.audit.title')}
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            {t('admin.audit.subtitle')}
          </p>
        </div>
        <Button variant="tertiary" onClick={load} aria-label={t('admin.audit.reload')}>
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </Button>
      </header>

      <div className="flex gap-2 flex-wrap">
        {['', 'LOGIN', 'VIEW_CLINICAL_HISTORY', 'UPLOAD_DOCUMENT'].map(a => (
          <button
            key={a || 'ALL'}
            onClick={() => setActionFilter(a)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              actionFilter === a
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            {a ? actionLabel(a) : t('admin.audit.all')}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-error">{error}</p>}

      <Card level={2} className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-container-high text-left text-on-surface-variant">
              <th className="px-4 py-3 font-medium">{t('admin.audit.colDate')}</th>
              <th className="px-4 py-3 font-medium">{t('admin.audit.colAction')}</th>
              <th className="px-4 py-3 font-medium">{t('admin.audit.colEntity')}</th>
              <th className="px-4 py-3 font-medium">{t('admin.audit.colUser')}</th>
              <th className="px-4 py-3 font-medium">{t('admin.audit.colIp')}</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id} className="border-b border-surface-container last:border-0">
                <td className="px-4 py-3 whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleString('es-MX')}
                </td>
                <td className="px-4 py-3 font-medium">{actionLabel(log.action)}</td>
                <td className="px-4 py-3 text-on-surface-variant">
                  {log.entity}
                  {log.entityId ? <span className="opacity-60"> · {log.entityId.slice(0, 8)}</span> : ''}
                </td>
                <td className="px-4 py-3 text-on-surface-variant">{log.userId?.slice(0, 8) ?? '—'}</td>
                <td className="px-4 py-3 text-on-surface-variant">{log.ip ?? '—'}</td>
              </tr>
            ))}
            {!loading && logs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-on-surface-variant">
                  {t('admin.audit.empty')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
