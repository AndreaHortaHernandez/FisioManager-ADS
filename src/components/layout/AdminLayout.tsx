import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Calendar, Users, UserPlus, Stethoscope, LogOut } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useStore } from '../../store/useStore';

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useStore(state => state.logout);
  const authUser = useStore(state => state.authUser);

  const navItems = [
    { label: 'Agenda del Día', path: '/admin', icon: LayoutDashboard },
    { label: 'Citas', path: '/admin/citas', icon: Calendar },
    { label: 'Pacientes', path: '/admin/pacientes', icon: Users },
    { label: 'Doctores', path: '/admin/doctores', icon: Stethoscope },
    { label: 'Asignaciones', path: '/admin/asignaciones', icon: UserPlus },
    { label: 'Usuarios', path: '/admin/usuarios', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-background flex text-on-surface">
      <aside className="w-64 bg-surface-container-lowest border-r border-surface-container-high flex flex-col pt-8 pb-4">
        <div className="px-8 mb-8">
          <h1 className="text-xl font-display font-bold text-primary flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-white opacity-80 mix-blend-overlay" />
            </div>
            FisioManager
          </h1>
          <p className="text-xs text-on-surface-variant mt-1 ml-10">Panel Admin</p>
        </div>

        {authUser && (
          <div className="mx-4 mb-6 px-4 py-3 rounded-xl bg-surface-container">
            <p className="text-sm font-bold truncate">{authUser.name}</p>
            <p className="text-xs text-on-surface-variant truncate">{authUser.email}</p>
          </div>
        )}

        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.path === '/admin'
                ? location.pathname === '/admin'
                : location.pathname.startsWith(item.path);

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
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-surface-bright relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-container rounded-full mix-blend-multiply filter blur-[100px] opacity-5 pointer-events-none" />
        <div className="p-10 max-w-7xl mx-auto relative z-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
