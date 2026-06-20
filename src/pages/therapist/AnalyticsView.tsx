import { useTranslation } from 'react-i18next';
import { useStore } from '../../store/useStore';
import { Card } from '../../components/ui/Card';
import { Users, Activity, TrendingDown, CheckCircle2 } from 'lucide-react';
import type { Feedback } from '../../types';
import { resolveUploadUrl } from '../../utils/url';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const EMOTION_MAP: Record<Feedback['emotionalState'], string> = {
  GREAT: '😄', GOOD: '🙂', OK: '😐', BAD: '😟', TERRIBLE: '😣',
};

export function AnalyticsView() {
  const { t } = useTranslation();
  const patients  = useStore(state => state.patients);
  const routines  = useStore(state => state.routines);
  const feedbacks = useStore(state => state.feedbacks);

  const assignedRoutines  = routines.filter(r => r.patientId !== null);
  const completedRoutines = assignedRoutines.filter(r => r.completed);
  const completionRate    = assignedRoutines.length
    ? Math.round((completedRoutines.length / assignedRoutines.length) * 100)
    : 0;
  const avgPain = feedbacks.length
    ? Math.round((feedbacks.reduce((s, f) => s + f.painLevel, 0) / feedbacks.length) * 10) / 10
    : null;

  const recentFeedbacks = [...feedbacks]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-20);

  const vasData = recentFeedbacks.map(f => ({
    fecha: new Date(f.date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }),
    dolor: f.painLevel,
    paciente: patients.find(p => p.id === f.patientId)?.name ?? '',
  }));

  const adherenceData = patients.map(p => {
    const pRoutines   = assignedRoutines.filter(r => r.patientId === p.id);
    const pCompleted  = pRoutines.filter(r => r.completed).length;
    const rate        = pRoutines.length ? Math.round((pCompleted / pRoutines.length) * 100) : 0;
    return { nombre: p.name.split(' ')[0], adherencia: rate, total: pRoutines.length };
  });

  const patientStats = patients.map(p => {
    const pFeedbacks = feedbacks.filter(f => f.patientId === p.id);
    const pRoutines  = assignedRoutines.filter(r => r.patientId === p.id);
    const pCompleted = pRoutines.filter(r => r.completed);
    const pAvgPain   = pFeedbacks.length
      ? Math.round((pFeedbacks.reduce((s, f) => s + f.painLevel, 0) / pFeedbacks.length) * 10) / 10
      : null;
    return { patient: p, avgPain: pAvgPain, routines: pRoutines.length, completed: pCompleted.length };
  });

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });

  return (
    <div className="space-y-8 animate-fade-in">
      <header>
        <h1 className="text-3xl font-display font-bold text-on-surface mb-1">{t('therapist.analytics.title')}</h1>
        <p className="text-on-surface-variant font-body">{t('therapist.analytics.subtitle')}</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Users,        labelKey: 'therapist.analytics.stat.patients',        value: patients.length,         color: 'text-primary',   bg: 'bg-primary/10'   },
          { icon: Activity,     labelKey: 'therapist.analytics.stat.routinesAssigned', value: assignedRoutines.length, color: 'text-secondary', bg: 'bg-secondary/10' },
          { icon: CheckCircle2, labelKey: 'therapist.analytics.stat.adherence',        value: `${completionRate}%`,    color: 'text-tertiary',  bg: 'bg-tertiary/10'  },
          { icon: TrendingDown, labelKey: 'therapist.analytics.stat.avgPain',          value: avgPain ?? '—',          color: 'text-error',     bg: 'bg-error/10'     },
        ].map(({ icon: Icon, labelKey, value, color, bg }) => (
          <Card key={labelKey} className="flex items-center gap-3 border-ghost">
            <div className={`w-10 h-10 rounded-xl ${bg} ${color} flex items-center justify-center flex-shrink-0`}>
              <Icon size={20} />
            </div>
            <div>
              <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wide leading-tight">{t(labelKey)}</p>
              <p className="text-2xl font-display font-bold">{value}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        <Card className="border-ghost">
          <h2 className="text-lg font-display font-bold mb-1">{t('therapist.analytics.painEvolution')}</h2>
          <p className="text-xs text-on-surface-variant mb-4">{t('therapist.analytics.lastSessions', { count: vasData.length })}</p>
          {vasData.length < 2 ? (
            <div className="h-48 flex items-center justify-center text-on-surface-variant text-sm">
              {t('therapist.analytics.needTwoFeedbacks')}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={vasData}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.1} />
                <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, fontSize: 12 }}
                  formatter={(v) => [`${v}/10`, t('therapist.analytics.painLabel')]}
                />
                <Line
                  type="monotone"
                  dataKey="dolor"
                  stroke="#e57373"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="border-ghost">
          <h2 className="text-lg font-display font-bold mb-1">{t('therapist.analytics.adherenceByPatient')}</h2>
          <p className="text-xs text-on-surface-variant mb-4">{t('therapist.analytics.completedRoutinesPct')}</p>
          {adherenceData.filter(d => d.total > 0).length === 0 ? (
            <div className="h-48 flex items-center justify-center text-on-surface-variant text-sm">
              {t('therapist.analytics.noRoutinesYet')}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={adherenceData.filter(d => d.total > 0)}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.1} />
                <XAxis dataKey="nombre" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, fontSize: 12 }}
                  formatter={(v) => [`${v}%`, t('therapist.analytics.adherenceLabel')]}
                />
                <Bar dataKey="adherencia" fill="#81c784" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-4">
          <h2 className="text-lg font-display font-bold">{t('therapist.analytics.byPatient')}</h2>
          <Card level={2} className="overflow-hidden border-ghost p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-container-high">
                  <th className="text-left p-4 text-xs uppercase tracking-wider text-on-surface-variant font-bold">{t('therapist.analytics.table.patient')}</th>
                  <th className="text-center p-4 text-xs uppercase tracking-wider text-on-surface-variant font-bold">{t('therapist.analytics.table.routines')}</th>
                  <th className="text-right p-4 text-xs uppercase tracking-wider text-on-surface-variant font-bold">{t('therapist.analytics.table.avgPain')}</th>
                </tr>
              </thead>
              <tbody>
                {patientStats.map(({ patient, avgPain: ap, routines: rt, completed: cp }) => (
                  <tr key={patient.id} className="border-b border-surface-container-high last:border-0 hover:bg-surface-container/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img src={resolveUploadUrl(patient.avatarUrl) ?? `https://i.pravatar.cc/40?u=${patient.id}`}
                          alt={patient.name} className="w-8 h-8 rounded-full" />
                        <div>
                          <p className="font-bold text-on-surface">{patient.name}</p>
                          <p className="text-xs text-on-surface-variant truncate max-w-[140px]">{patient.condition}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <p className="font-bold">{cp}/{rt}</p>
                      <p className="text-xs text-on-surface-variant">{t('therapist.analytics.table.completed')}</p>
                    </td>
                    <td className="p-4 text-right">
                      <p className={`font-display font-bold text-lg ${!ap ? 'text-outline' : ap >= 7 ? 'text-error' : ap >= 4 ? 'text-tertiary' : 'text-secondary'}`}>
                        {ap ?? '—'}
                      </p>
                    </td>
                  </tr>
                ))}
                {patientStats.length === 0 && (
                  <tr><td colSpan={3} className="p-8 text-center text-on-surface-variant">{t('therapist.analytics.noPatients')}</td></tr>
                )}
              </tbody>
            </table>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-display font-bold">{t('therapist.analytics.recentFeedback')}</h2>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {[...feedbacks].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8).length === 0 ? (
              <Card level={2} className="py-8 text-center border-ghost">
                <p className="text-sm text-on-surface-variant">{t('therapist.analytics.noFeedbackYet')}</p>
              </Card>
            ) : (
              [...feedbacks].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8).map(fb => (
                <Card key={fb.id} level={2} className="flex items-center gap-3 border-ghost py-3">
                  <span className="text-2xl">{EMOTION_MAP[fb.emotionalState]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{patients.find(p => p.id === fb.patientId)?.name ?? t('therapist.analytics.patientFallback')}</p>
                    <p className="text-xs text-on-surface-variant">{formatDate(fb.date)}</p>
                  </div>
                  <p className={`text-lg font-display font-bold flex-shrink-0 ${fb.painLevel >= 8 ? 'text-error' : fb.painLevel >= 5 ? 'text-tertiary' : 'text-secondary'}`}>
                    {fb.painLevel}
                  </p>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
