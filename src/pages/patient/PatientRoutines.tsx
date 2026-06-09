import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { Card } from '../../components/ui/Card';
import { PlayCircle, CheckCircle2, Calendar } from 'lucide-react';
import { cn } from '../../utils/cn';

export function PatientRoutines() {
  const navigate = useNavigate();
  const currentUserId = useStore(state => state.currentUser);
  const allRoutines = useStore(state => state.routines);

  const routines = allRoutines
    .filter(r => r.patientId === currentUserId)
    .sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return new Date(b.assignedDate ?? 0).getTime() - new Date(a.assignedDate ?? 0).getTime();
    });

  const active = routines.filter(r => !r.completed);
  const completed = routines.filter(r => r.completed);

  const formatDate = (iso?: string) => {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
  };

  const RoutineCard = ({ routine }: { routine: typeof routines[0] }) => (
    <Card
      level={2}
      className={cn(
        'flex items-center justify-between gap-4 cursor-pointer transition-all border-ghost',
        routine.completed
          ? 'opacity-60'
          : 'hover:bg-surface-container hover:shadow-ambient'
      )}
      onClick={() => !routine.completed && navigate(`/patient/routines/${routine.id}`)}
    >
      <div className="flex items-center gap-4">
        <div className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
          routine.completed ? 'bg-secondary/10 text-secondary' : 'bg-primary/10 text-primary'
        )}>
          {routine.completed
            ? <CheckCircle2 size={24} />
            : <PlayCircle size={24} />}
        </div>
        <div>
          <span className="text-[10px] font-bold tracking-wider uppercase text-on-surface-variant block mb-0.5">
            {routine.type}
          </span>
          <h3 className="font-display font-bold text-on-surface">{routine.title}</h3>
          <p className="text-xs text-on-surface-variant mt-0.5">
            {routine.activities.length} actividades
            {routine.assignedDate && (
              <span className="ml-2 inline-flex items-center gap-1">
                <Calendar size={10} /> {formatDate(routine.assignedDate)}
              </span>
            )}
          </p>
        </div>
      </div>
      {!routine.completed && (
        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white flex-shrink-0">
          <PlayCircle size={18} className="fill-white/20" />
        </div>
      )}
    </Card>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <header>
        <h1 className="text-3xl font-display font-bold text-on-surface mb-1">Mis Rutinas</h1>
        <p className="text-on-surface-variant font-body text-sm">
          {active.length} activa{active.length !== 1 ? 's' : ''} · {completed.length} completada{completed.length !== 1 ? 's' : ''}
        </p>
      </header>

      {active.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-primary">Pendientes</h2>
          {active.map(r => <RoutineCard key={r.id} routine={r} />)}
        </section>
      )}

      {completed.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant">Completadas</h2>
          {completed.map(r => <RoutineCard key={r.id} routine={r} />)}
        </section>
      )}

      {routines.length === 0 && (
        <Card level={2} className="flex flex-col items-center py-16 text-center border-ghost">
          <PlayCircle size={48} className="text-outline-variant mb-4" />
          <p className="font-display font-bold text-on-surface">Sin rutinas asignadas</p>
          <p className="text-sm text-on-surface-variant mt-1">Tu terapeuta te asignará rutinas pronto.</p>
        </Card>
      )}
    </div>
  );
}
