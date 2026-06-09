import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { Card } from '../../components/ui/Card';
import { Users, ChevronRight, Activity } from 'lucide-react';

export function PatientsList() {
  const navigate = useNavigate();
  const patients = useStore(state => state.patients);
  const allRoutines = useStore(state => state.routines);
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
        <div className="space-y-4">
          {patients.map(patient => {
            const routines = allRoutines.filter(r => r.patientId === patient.id);
            const active = routines.filter(r => !r.completed).length;
            const completed = routines.filter(r => r.completed).length;
            const feedbacks = allFeedbacks.filter(f => f.patientId === patient.id);
            const lastFb = feedbacks.at(-1);

            return (
              <Card
                key={patient.id}
                level={2}
                className="flex items-center gap-4 cursor-pointer hover:shadow-ambient hover:bg-surface-container transition-all border-ghost"
                onClick={() => navigate(`/therapist/patients/${patient.id}`)}
              >
                <img
                  src={patient.avatarUrl ?? `https://i.pravatar.cc/80?u=${patient.id}`}
                  alt={patient.name}
                  className="w-14 h-14 rounded-full flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-on-surface">{patient.name}</h3>
                  <p className="text-sm text-on-surface-variant truncate">{patient.condition}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-primary font-bold flex items-center gap-1">
                      <Activity size={10} /> {active} activa{active !== 1 ? 's' : ''}
                    </span>
                    <span className="text-xs text-on-surface-variant">{completed} completada{completed !== 1 ? 's' : ''}</span>
                    {lastFb && (
                      <span className={`text-xs font-bold ml-auto ${lastFb.painLevel >= 8 ? 'text-error' : lastFb.painLevel >= 5 ? 'text-tertiary' : 'text-secondary'}`}>
                        Dolor {lastFb.painLevel}/10
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight size={20} className="text-outline-variant flex-shrink-0" />
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
