
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Home, Activity, Heart, User, Settings, LogOut, MessageSquare, CalendarPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../utils/cn';
import { useStore } from '../../store/useStore';
import { NotificationBell } from '../NotificationBell';
import { ThemeToggle } from '../ThemeToggle';

export function PatientLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useStore((s) => s.logout);
  const { t } = useTranslation();

  const navItems = [
    { label: t('nav.home'), path: '/patient', icon: Home },
    { label: t('nav.routines'), path: '/patient/routines', icon: Activity },
    { label: t('nav.wellness'), path: '/patient/wellness', icon: Heart },
    { label: t('nav.profile'), path: '/patient/progress', icon: User },
    { label: t('nav.settings'), path: '/patient/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto relative overflow-hidden">
      {}
      <div className="absolute top-[-100px] left-[-100px] w-64 h-64 bg-primary-fixed-dim rounded-full mix-blend-multiply filter blur-3xl opacity-20 pointer-events-none" />
      <div className="absolute top-[50px] right-[-50px] w-48 h-48 bg-secondary-fixed-dim rounded-full mix-blend-multiply filter blur-3xl opacity-20 pointer-events-none" />

      {}
      <header className="relative z-20 flex justify-end items-center gap-1 px-6 pt-4">
        <button
          onClick={() => navigate('/patient/book')}
          aria-label="Agendar cita"
          className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container transition-colors"
        >
          <CalendarPlus size={22} />
        </button>
        <button
          onClick={() => navigate('/patient/messages')}
          aria-label="Mensajes"
          className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container transition-colors"
        >
          <MessageSquare size={22} />
        </button>
        <ThemeToggle />
        <NotificationBell fullViewPath="/patient/notifications" align="right" />
      </header>

      {}
      <main className="flex-1 overflow-y-auto pb-24 relative z-10 px-6 pb-6 space-y-8">
        <Outlet />
      </main>

      {}
      <nav className="fixed bottom-0 left-0 right-0 glass z-50">
        <div className="max-w-md mx-auto px-6 py-4 flex justify-between items-center text-on-surface-variant">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/patient' && location.pathname.startsWith(item.path));
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  'flex flex-col items-center gap-1 min-w-[64px] transition-all',
                  isActive ? 'text-primary scale-110' : 'hover:text-primary-container'
                )}
              >
                <div className={cn(
                  'p-2 rounded-full transition-colors',
                  isActive ? 'bg-primary-fixed/30' : ''
                )}>
                  <Icon size={24} />
                </div>
                <span className="text-[10px] font-body font-bold">{item.label}</span>
              </button>
            );
          })}
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="flex flex-col items-center gap-1 min-w-[64px] transition-all hover:text-error"
          >
            <div className="p-2 rounded-full transition-colors">
              <LogOut size={24} />
            </div>
            <span className="text-[10px] font-body font-bold">Sign Out</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
