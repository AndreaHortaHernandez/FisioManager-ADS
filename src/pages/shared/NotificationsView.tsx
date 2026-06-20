import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Bell, Calendar, Activity, AlertTriangle, MessageSquare, Info, CheckCheck } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { cn } from '../../utils/cn';
import { notificationsApi, type AppNotification } from '../../services/notifications.api';

const ICONS: Record<AppNotification['type'], typeof Bell> = {
  APPOINTMENT: Calendar,
  ROUTINE: Activity,
  HIGH_PAIN: AlertTriangle,
  MESSAGE: MessageSquare,
  SYSTEM: Info,
};

export function NotificationsView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function load() {
    setLoading(true);
    notificationsApi.list()
      .then(setItems)
      .catch(e => setError((e as Error).message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleClick(n: AppNotification) {
    if (!n.read) {
      await notificationsApi.markRead(n.id).catch(() => {});
      setItems(prev => prev.map(x => (x.id === n.id ? { ...x, read: true } : x)));
    }
    if (n.linkUrl) navigate(n.linkUrl);
  }

  async function markAll() {
    await notificationsApi.markAllRead().catch(() => {});
    setItems(prev => prev.map(x => ({ ...x, read: true })));
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold flex items-center gap-3">
          <Bell className="text-primary" /> {t('shared.notifications.title')}
        </h1>
        {items.some(i => !i.read) && (
          <Button variant="tertiary" onClick={markAll}>
            <CheckCheck size={18} className="mr-1" /> {t('shared.notifications.markAll')}
          </Button>
        )}
      </header>

      {error && <p className="text-sm text-error">{error}</p>}
      {loading && <p className="text-sm text-on-surface-variant">{t('common.loading')}</p>}
      {!loading && items.length === 0 && (
        <Card className="text-center text-on-surface-variant py-10">{t('shared.notifications.empty')}</Card>
      )}

      <div className="space-y-2">
        {items.map(n => {
          const Icon = ICONS[n.type] ?? Info;
          return (
            <button
              key={n.id}
              onClick={() => handleClick(n)}
              className={cn(
                'w-full text-left flex gap-4 p-4 rounded-2xl transition-colors',
                n.read ? 'bg-surface-container-lowest hover:bg-surface-container'
                       : 'bg-primary-fixed/10 hover:bg-primary-fixed/20'
              )}
            >
              <Icon size={22} className={cn('mt-0.5 shrink-0', n.read ? 'text-outline' : 'text-primary')} />
              <div className="min-w-0 flex-1">
                <p className={cn('text-sm', !n.read && 'font-bold')}>{n.title}</p>
                <p className="text-sm text-on-surface-variant">{n.body}</p>
                <p className="text-xs text-outline mt-1">{new Date(n.createdAt).toLocaleString('es-MX')}</p>
              </div>
              {!n.read && <span className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
