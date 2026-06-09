import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ArrowLeft, Activity, CheckCircle2, PlayCircle } from 'lucide-react';
import type { Feedback } from '../../types';

const EMOTION_MAP: Record<Feedback['emotionalState'], { emoji: string; label: string }> = {
  GREAT:    { emoji: '😄', label: 'Excelente' },
  GOOD:     { emoji: '🙂', label: 'Bien' },
  OK:       { emoji: '😐', label: 'Regular' },
  BAD:      { emoji: '😟', label: 'Mal' },
  TERRIBLE: { emoji: '😣', label: 'Terrible' },
};

function PainBar({ value }: { value: number }) {
  const color = value >= 8 ? 'bg-error' : value >= 5 ? 'bg-tertiary' : 'bg-secondary';
  return (
    <div className="flex-1 flex flex-col items-center group relative">
      <span className="text-[9px] font-bold text-on-surface-variant opacity-0 group-hover:opacity-100 absolute -top-4 transition-opacity">
        {value}
      </span>
      <div className="w-full rounded-t-sm bg-surface-container-high h-12 flex items-end overflow-hidden">
        <div className={`w-full ${color} opacity-75 group-hover:opacity-100 transition-all rounded-t-sm`}
          style={{ height: `${(value / 10) * 100}%` }} />
      </div>
    </div>
  );
}

export function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const patients = useStore(state => state.patients);
  const allRoutines = useStore(state => state.routines);
  const allFeedbacks = useStore(state => state.feedbacks);

  const patient = patients.find(p => p.id === id);
  const routines = allRoutines
    .filter(r => r.patientId === id)
    .sort((a, b) => new Date(b.assignedDate ?? 0).getTime() - new Date(a.assignedDate ?? 0).getTime());
  const feedbacks = allFeedbacks
    .filter(f => f.patientId === id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const activeRoutines = routines.filter(r => !r.completed);
  const completedRoutines = routines.filter(r => r.completed);
  const lastFeedbacks = [...feedbacks].reverse().slice(-10);

  const avgPain = feedbacks.length
    ? Math.round((feedbacks.reduce((s, f) => s + f.painLevel, 0) / feedbacks.length) * 10) / 10
    : null;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <p className="text-on-surface-variant mb-4">Paciente no encontrado.</p>
        <Button onClick={() => navigate('/therapist/patients')}>Volver</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate('/therapist/patients')}
          className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft size={16} /> Todos los pacientes
        </button>

        <Card className="flex items-center gap-6 border-ghost">
          <img
            src={patient.avatarUrl ?? `https://i.pravatar.cc/100?u=${patient.id}`}
            alt={patient.name}
            className="w-20 h-20 rounded-2xl flex-shrink-0"
          />
          <div className="flex-1">
            <h1 className="text-2xl font-display font-bold text-on-surface">{patient.name}</h1>
            <p className="text-on-surface-variant">{patient.condition}</p>
            <div className="flex gap-4 mt-3">
              <div className="text-center">
                <p className="text-xl font-display font-bold text-primary">{routines.length}</p>
                <p className="text-xs text-on-surface-variant uppercase tracking-wide font-bold">Rutinas</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-display font-bold text-secondary">{completedRoutines.length}</p>
                <p className="text-xs text-on-surface-variant uppercase tracking-wide font-bold">Completadas</p>
              </div>
              <div className="text-center">
                <p className={`text-xl font-display font-bold ${avgPain && avgPain >= 7 ? 'text-error' : 'text-tertiary'}`}>
                  {avgPain ?? '—'}
                </p>
                <p className="text-xs text-on-surface-variant uppercase tracking-wide font-bold">Dolor Prom.</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Routines column */}
        <div className="space-y-4">
          <h2 className="text-lg font-display font-bold">Rutinas Asignadas</h2>

          {activeRoutines.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-primary">Activas</p>
              {activeRoutines.map(r => (
                <Card key={r.id} level={2} className="flex items-center gap-3 border-ghost py-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <PlayCircle size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-on-surface truncate">{r.title}</p>
                    <p className="text-xs text-on-surface-variant">{r.activities.length} actividades</p>
                  </div>
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    {r.type}
                  </span>
                </Card>
              ))}
            </div>
          )}

          {completedRoutines.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Completadas</p>
              {completedRoutines.slice(0, 5).map(r => (
                <Card key={r.id} level={2} className="flex items-center gap-3 border-ghost py-3 opacity-60">
                  <div className="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
                    <CheckCircle2 size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-on-surface truncate">{r.title}</p>
                    <p className="text-xs text-on-surface-variant">{r.activities.length} actividades</p>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {routines.length === 0 && (
            <Card level={2} className="py-8 text-center border-ghost">
              <Activity size={32} className="text-outline-variant mx-auto mb-2" />
              <p className="text-sm text-on-surface-variant">Sin rutinas asignadas.</p>
            </Card>
          )}
        </div>

        {/* Feedback column */}
        <div className="space-y-4">
          <h2 className="text-lg font-display font-bold">Historial de Feedback</h2>

          {lastFeedbacks.length > 0 && (
            <Card className="space-y-2 border-ghost">
              <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wide mb-2">
                Tendencia de Dolor
              </p>
              <div className="flex items-end gap-1 h-12">
                {lastFeedbacks.map(f => <PainBar key={f.id} value={f.painLevel} />)}
              </div>
            </Card>
          )}

          {feedbacks.length === 0 ? (
            <Card level={2} className="py-8 text-center border-ghost">
              <p className="text-sm text-on-surface-variant">Sin feedback registrado.</p>
            </Card>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {feedbacks.map(fb => {
                const emo = EMOTION_MAP[fb.emotionalState];
                return (
                  <Card key={fb.id} level={2} className="flex items-center gap-3 border-ghost py-3">
                    <span className="text-2xl">{emo.emoji}</span>
                    <div className="flex-1">
                      <p className="font-bold text-sm">{emo.label}</p>
                      <p className="text-xs text-on-surface-variant">{formatDate(fb.date)}</p>
                    </div>
                    <p className={`text-lg font-display font-bold ${fb.painLevel >= 8 ? 'text-error' : fb.painLevel >= 5 ? 'text-tertiary' : 'text-secondary'}`}>
                      {fb.painLevel}
                    </p>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
