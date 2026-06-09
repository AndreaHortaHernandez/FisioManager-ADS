import { useStore } from '../../store/useStore';
import { Card } from '../../components/ui/Card';
import { Users, Activity, TrendingDown, CheckCircle2 } from 'lucide-react';
import type { Feedback } from '../../types';

const EMOTION_MAP: Record<Feedback['emotionalState'], string> = {
  GREAT: '😄', GOOD: '🙂', OK: '😐', BAD: '😟', TERRIBLE: '😣',
};

function PainBar({ value, max = 10 }: { value: number; max?: number }) {
  const color = value >= 8 ? 'bg-error' : value >= 5 ? 'bg-tertiary' : 'bg-secondary';
  return (
    <div className={`h-2 rounded-full ${color} opacity-75`}
      style={{ width: `${(value / max) * 100}%` }} />
  );
}

export function AnalyticsView() {
  const patients  = useStore(state => state.patients);
  const routines  = useStore(state => state.routines);
  const feedbacks = useStore(state => state.feedbacks);

  const assignedRoutines = routines.filter(r => r.patientId !== null);
  const completedRoutines = assignedRoutines.filter(r => r.completed);
  const completionRate = assignedRoutines.length
    ? Math.round((completedRoutines.length / assignedRoutines.length) * 100)
    : 0;

  const avgPain = feedbacks.length
    ? Math.round((feedbacks.reduce((s, f) => s + f.painLevel, 0) / feedbacks.length) * 10) / 10
    : null;

  const recentFeedbacks = [...feedbacks]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });

  // Per-patient stats
  const patientStats = patients.map(p => {
    const pFeedbacks = feedbacks.filter(f => f.patientId === p.id);
    const pRoutines  = assignedRoutines.filter(r => r.patientId === p.id);
    const pCompleted = pRoutines.filter(r => r.completed);
    const pAvgPain   = pFeedbacks.length
      ? Math.round((pFeedbacks.reduce((s, f) => s + f.painLevel, 0) / pFeedbacks.length) * 10) / 10
      : null;
    return { patient: p, avgPain: pAvgPain, routines: pRoutines.length, completed: pCompleted.length };
  });

  return (
    <div className="space-y-8 animate-fade-in">
      <header>
        <h1 className="text-3xl font-display font-bold text-on-surface mb-1">Analítica Clínica</h1>
        <p className="text-on-surface-variant font-body">Resumen de todos tus pacientes.</p>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Users,        label: 'Pacientes',     value: patients.length,           color: 'text-primary',   bg: 'bg-primary/10' },
          { icon: Activity,     label: 'Rutinas asig.', value: assignedRoutines.length,   color: 'text-secondary', bg: 'bg-secondary/10' },
          { icon: CheckCircle2, label: 'Tasa complet.', value: `${completionRate}%`,       color: 'text-tertiary',  bg: 'bg-tertiary/10' },
          { icon: TrendingDown, label: 'Dolor prom.',   value: avgPain ?? '—',            color: 'text-error',     bg: 'bg-error/10' },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <Card key={label} className="flex items-center gap-3 border-ghost">
            <div className={`w-10 h-10 rounded-xl ${bg} ${color} flex items-center justify-center flex-shrink-0`}>
              <Icon size={20} />
            </div>
            <div>
              <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wide leading-tight">{label}</p>
              <p className="text-2xl font-display font-bold">{value}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Patient table */}
        <div className="lg:col-span-3 space-y-4">
          <h2 className="text-lg font-display font-bold">Por Paciente</h2>
          <Card level={2} className="overflow-hidden border-ghost p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-container-high">
                  <th className="text-left p-4 text-xs uppercase tracking-wider text-on-surface-variant font-bold">Paciente</th>
                  <th className="text-center p-4 text-xs uppercase tracking-wider text-on-surface-variant font-bold">Rutinas</th>
                  <th className="text-right p-4 text-xs uppercase tracking-wider text-on-surface-variant font-bold">Dolor prom.</th>
                </tr>
              </thead>
              <tbody>
                {patientStats.map(({ patient, avgPain: ap, routines: rt, completed: cp }) => (
                  <tr key={patient.id} className="border-b border-surface-container-high last:border-0 hover:bg-surface-container/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img src={patient.avatarUrl ?? `https://i.pravatar.cc/40?u=${patient.id}`}
                          alt={patient.name} className="w-8 h-8 rounded-full" />
                        <div>
                          <p className="font-bold text-on-surface">{patient.name}</p>
                          <p className="text-xs text-on-surface-variant truncate max-w-[140px]">{patient.condition}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <p className="font-bold">{cp}/{rt}</p>
                      <p className="text-xs text-on-surface-variant">completadas</p>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col items-end gap-1">
                        <p className={`font-display font-bold text-lg ${!ap ? 'text-outline' : ap >= 7 ? 'text-error' : ap >= 4 ? 'text-tertiary' : 'text-secondary'}`}>
                          {ap ?? '—'}
                        </p>
                        {ap && <PainBar value={ap} />}
                      </div>
                    </td>
                  </tr>
                ))}
                {patientStats.length === 0 && (
                  <tr><td colSpan={3} className="p-8 text-center text-on-surface-variant">Sin pacientes.</td></tr>
                )}
              </tbody>
            </table>
          </Card>
        </div>

        {/* Recent feedback */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-display font-bold">Feedback Reciente</h2>
          <div className="space-y-2 max-h-[460px] overflow-y-auto">
            {recentFeedbacks.length === 0 ? (
              <Card level={2} className="py-8 text-center border-ghost">
                <p className="text-sm text-on-surface-variant">Sin feedback aún.</p>
              </Card>
            ) : (
              recentFeedbacks.map(fb => {
                const patientName = patients.find(p => p.id === fb.patientId)?.name ?? 'Paciente';
                return (
                  <Card key={fb.id} level={2} className="flex items-center gap-3 border-ghost py-3">
                    <span className="text-2xl">{EMOTION_MAP[fb.emotionalState]}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{patientName}</p>
                      <p className="text-xs text-on-surface-variant">{formatDate(fb.date)}</p>
                    </div>
                    <p className={`text-lg font-display font-bold flex-shrink-0 ${fb.painLevel >= 8 ? 'text-error' : fb.painLevel >= 5 ? 'text-tertiary' : 'text-secondary'}`}>
                      {fb.painLevel}
                    </p>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
