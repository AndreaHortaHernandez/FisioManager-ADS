
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, BookMarked, BarChart3, Settings, LogOut, Dumbbell, MessageSquare } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useStore } from '../../store/useStore';
import { NotificationBell } from '../NotificationBell';
import { ThemeToggle } from '../ThemeToggle';

export function TherapistLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useStore(state => state.logout);

  const navItems = [
    { label: 'Dashboard', path: '/therapist', icon: LayoutDashboard },
    { label: 'Patients', path: '/therapist/patients', icon: Users },
    { label: 'Exercises', path: '/therapist/exercises', icon: Dumbbell },
    { label: 'Routines', path: '/therapist/routines', icon: BookMarked },
    { label: 'Mensajes', path: '/therapist/messages', icon: MessageSquare },
    { label: 'Analytics', path: '/therapist/analytics', icon: BarChart3 },
    { label: 'Settings', path: '/therapist/settings', icon: Settings },
  ];

  return (
    <div className="h-screen bg-background flex text-on-surface overflow-hidden">
      {}
      <aside className="w-64 shrink-0 h-full relative z-20 bg-surface-container-lowest border-r border-surface-container-high flex flex-col pt-8 pb-4">
        <div className="px-4 mb-12 flex items-center justify-between gap-1">
          <h1 className="text-lg font-display font-bold text-primary flex items-center gap-2 min-w-0 truncate">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
              <div className="w-4 h-4 rounded-full bg-white opacity-80 mix-blend-overlay"></div>
            </div>
            FisioManager
          </h1>
          <div className="flex items-center shrink-0">
            <ThemeToggle className="p-1.5" />
            <NotificationBell fullViewPath="/therapist/notifications" align="left" />
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/therapist' && location.pathname.startsWith(item.path));

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  'w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 font-body',
                  isActive 
                    ? 'bg-surface-container text-primary font-bold shadow-ambient' 
                    : 'text-on-surface-variant hover:bg-surface hover:text-on-surface'
                )}
              >
                <Icon size={20} className={cn(isActive ? 'text-primary' : 'text-outline')} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="px-4 mt-auto">
           <button
             onClick={() => { logout(); navigate('/login', { replace: true }); }}
             className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-on-surface-variant hover:bg-error-container hover:text-on-error-container transition-all"
           >
             <LogOut size={20} />
             Sign out
           </button>
        </div>
      </aside>

      {}
      <main className="flex-1 min-w-0 h-full overflow-y-auto overflow-x-hidden bg-surface-bright relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-container rounded-full mix-blend-multiply filter blur-[100px] opacity-5 pointer-events-none" />
        <div className="p-10 max-w-7xl mx-auto relative z-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
