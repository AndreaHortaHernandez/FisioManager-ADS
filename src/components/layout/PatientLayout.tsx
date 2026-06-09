
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Home, Activity, Heart, User, LogOut } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useStore } from '../../store/useStore';

export function PatientLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useStore((s) => s.logout);

  const navItems = [
    { label: 'Home', path: '/patient', icon: Home },
    { label: 'Routines', path: '/patient/routines', icon: Activity },
    { label: 'Wellness', path: '/patient/wellness', icon: Heart },
    { label: 'Profile', path: '/patient/progress', icon: User },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto relative overflow-hidden">
      {/* Top ambient decor */}
      <div className="absolute top-[-100px] left-[-100px] w-64 h-64 bg-primary-fixed-dim rounded-full mix-blend-multiply filter blur-3xl opacity-20 pointer-events-none" />
      <div className="absolute top-[50px] right-[-50px] w-48 h-48 bg-secondary-fixed-dim rounded-full mix-blend-multiply filter blur-3xl opacity-20 pointer-events-none" />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-24 relative z-10 p-6 space-y-8">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
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
