import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { Card } from '../../components/ui/Card';
import { Users, ChevronRight } from 'lucide-react';

type RecoveryStatus = 'ON_TRACK' | 'DELAYED' | 'ATTENTION';

const STATUS_CONFIG: Record<RecoveryStatus, { label: string; color: string; bar: string }> = {
  ON_TRACK:  { label: 'On Track',  color: 'text-secondary bg-secondary/10',  bar: 'bg-secondary'  },
  DELAYED:   { label: 'Delayed',   color: 'text-tertiary bg-tertiary/10',     bar: 'bg-tertiary'   },
  ATTENTION: { label: 'Attention', color: 'text-error bg-error/10',           bar: 'bg-error'      },
};

function getStatus(avgPain: number | null, completionRate: number, totalRoutines: number): RecoveryStatus {
  if (totalRoutines === 0) return 'ON_TRACK';
  if ((avgPain !== null && avgPain >= 7) || completionRate < 30) return 'ATTENTION';
  if (completionRate < 60) return 'DELAYED';
  return 'ON_TRACK';
}

export function PatientsList() {
  const navigate  = useNavigate();
  const patients  = useStore(state => state.patients);
  const allRoutines  = useStore(state => state.routines);
  const allFeedbacks = useStore(state => state.feedbacks);

  return (
    <div className="space-y-8 animate-fade-in">
      <header>
        <h1 className="text-3xl font-display font-bold text-on-surface mb-1">Pacientes</h1>
        <p className="text-on-surface-variant font-body">{patients.length} paciente{patients.length !== 1 ? 's' : ''} bajo tu cuidado.</p>
      </header>

      {patients.length === 0 ? (
        <Card className="flex flex-col items-center py-20 border-ghost text-center">
          <Users size={48} className="text-outline-variant mb-4" />
          <p className="font-display font-bold text-on-surface">Sin pacientes registrados</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {patients.map(patient => {
            const routines   = allRoutines.filter(r => r.patientId === patient.id);
            const completed  = routines.filter(r => r.completed).length;
            const total      = routines.length;
            const rate       = total > 0 ? Math.round((completed / total) * 100) : 0;
            const feedbacks  = allFeedbacks.filter(f => f.patientId === patient.id);
            const avgPain    = feedbacks.length
              ? Math.round((feedbacks.reduce((s, f) => s + f.painLevel, 0) / feedbacks.length) * 10) / 10
              : null;
            const status     = getStatus(avgPain, rate, total);
            const cfg        = STATUS_CONFIG[status];

            return (
              <Card
                key={patient.id}
                level={2}
                className="cursor-pointer hover:shadow-ambient hover:bg-surface-container transition-all border-ghost"
                onClick={() => navigate(`/therapist/patients/${patient.id}`)}
              >
                <div className="flex items-center gap-4">
                  <img
                    src={patient.avatarUrl ?? `https://i.pravatar.cc/80?u=${patient.id}`}
                    alt={patient.name}
                    className="w-12 h-12 rounded-full flex-shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-bold text-on-surface">{patient.name}</h3>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-sm text-on-surface-variant truncate mb-2">{patient.condition}</p>

                    {/* Barra de progreso */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${cfg.bar}`}
                          style={{ width: `${rate}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-on-surface-variant whitespace-nowrap">
                        {completed}/{total} rutinas
                      </span>
                      {avgPain !== null && (
                        <span className={`text-xs font-bold whitespace-nowrap ${avgPain >= 7 ? 'text-error' : avgPain >= 5 ? 'text-tertiary' : 'text-secondary'}`}>
                          Dolor {avgPain}
                        </span>
                      )}
                    </div>
                  </div>

                  <ChevronRight size={20} className="text-outline-variant flex-shrink-0" />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
