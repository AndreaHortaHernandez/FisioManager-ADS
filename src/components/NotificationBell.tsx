import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Bell, Calendar, Activity, AlertTriangle, MessageSquare, Info, Check } from 'lucide-react';
import { cn } from '../utils/cn';
import { useStore } from '../store/useStore';
import { connectSocket } from '../services/socket';
import { notificationsApi, type AppNotification } from '../services/notifications.api';

const ICONS: Record<AppNotification['type'], typeof Bell> = {
  APPOINTMENT: Calendar,
  ROUTINE: Activity,
  HIGH_PAIN: AlertTriangle,
  MESSAGE: MessageSquare,
  SYSTEM: Info,
};

const POLL_MS = 30_000;

interface Props {
  fullViewPath: string;
  align?: 'left' | 'right';
}

export function NotificationBell({ fullViewPath, align = 'right' }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const token = useStore(s => s.token);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  function refreshCount() {
    notificationsApi.unreadCount().then(r => setUnread(r.count)).catch(() => {});
  }

  function loadList() {
    notificationsApi.list().then(setItems).catch(() => {});
  }

  useEffect(() => {
    refreshCount();
    const id = setInterval(refreshCount, POLL_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!token) return;
    const socket = connectSocket(token);
    const onNotification = () => setUnread(c => c + 1);
    socket.on('notification:new', onNotification);
    return () => {
      socket.off('notification:new', onNotification);
    };
  }, [token]);

  useEffect(() => {
    if (open) loadList();
  }, [open]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  async function handleItemClick(n: AppNotification) {
    if (!n.read) {
      await notificationsApi.markRead(n.id).catch(() => {});
      setItems(prev => prev.map(x => (x.id === n.id ? { ...x, read: true } : x)));
      setUnread(c => Math.max(0, c - 1));
    }
    setOpen(false);
    if (n.linkUrl) navigate(n.linkUrl);
  }

  async function handleMarkAll() {
    await notificationsApi.markAllRead().catch(() => {});
    setItems(prev => prev.map(x => ({ ...x, read: true })));
    setUnread(0);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={t('shared.notifications.title')}
        className="relative p-1.5 rounded-full text-on-surface-variant hover:bg-surface-container transition-colors"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-error text-on-error text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className={cn(
          'absolute mt-2 w-72 max-w-[calc(100vw-2rem)] bg-surface-container-lowest rounded-2xl shadow-ambient border border-surface-container-high z-50 overflow-hidden',
          align === 'right' ? 'right-0' : 'left-0'
        )}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-surface-container-high">
            <span className="font-bold text-sm">{t('shared.notifications.title')}</span>
            {items.some(i => !i.read) && (
              <button onClick={handleMarkAll} className="text-xs text-primary flex items-center gap-1 hover:underline">
                <Check size={14} /> {t('shared.notifications.markAll')}
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-on-surface-variant">{t('shared.notifications.emptyShort')}</p>
            )}
            {items.slice(0, 8).map(n => {
              const Icon = ICONS[n.type] ?? Info;
              return (
                <button
                  key={n.id}
                  onClick={() => handleItemClick(n)}
                  className={cn(
                    'w-full text-left flex gap-3 px-4 py-3 hover:bg-surface-container transition-colors border-b border-surface-container last:border-0',
                    !n.read && 'bg-primary-fixed/10'
                  )}
                >
                  <Icon size={18} className={cn('mt-0.5 shrink-0', n.read ? 'text-outline' : 'text-primary')} />
                  <div className="min-w-0">
                    <p className={cn('text-sm truncate', !n.read && 'font-bold')}>{n.title}</p>
                    <p className="text-xs text-on-surface-variant line-clamp-2">{n.body}</p>
                    <p className="text-[10px] text-outline mt-1">
                      {new Date(n.createdAt).toLocaleString('es-MX')}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => { setOpen(false); navigate(fullViewPath); }}
            className="w-full py-3 text-sm text-primary font-medium hover:bg-surface-container transition-colors border-t border-surface-container-high"
          >
            {t('shared.notifications.viewAll')}
          </button>
        </div>
      )}
    </div>
  );
}
