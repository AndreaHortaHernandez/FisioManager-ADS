import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { useStore } from '../../store/useStore';
import { PlayCircle, Calendar, ShieldCheck } from 'lucide-react';

export function PatientHome() {
  const navigate = useNavigate();
  const allPatients = useStore(state => state.patients);
  const currentUserId = useStore(state => state.currentUser);
  const allRoutines = useStore(state => state.routines);

  const currentUser = allPatients.find(p => p.id === currentUserId);
  const routines = allRoutines.filter(r => r.patientId === currentUserId);
  const activeRoutines = routines.filter(r => !r.completed);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center mt-4">
        <div>
          <p className="text-sm font-body text-on-surface-variant mb-1">Good Morning,</p>
          <h1 className="text-3xl font-display font-bold text-on-surface">
            {currentUser?.name.split(' ')[0]}
          </h1>
        </div>
        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-surface-container-lowest shadow-ambient">
          {currentUser?.avatarUrl ? (
             <img src={currentUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
             <div className="w-full h-full bg-primary-container flex items-center justify-center text-white font-bold">
               {currentUser?.name.charAt(0)}
             </div>
          )}
        </div>
      </div>

      {/* Progress Orb (Simplified for mock) */}
      <Card className="flex items-center justify-between shadow-ambient relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-secondary-container rounded-full filter blur-2xl opacity-20 group-hover:scale-110 transition-transform duration-500"></div>
        <div className="z-10 w-2/3">
          <h2 className="text-xl font-display font-semibold mb-2">Weekly Goal</h2>
          <p className="text-sm text-on-surface-variant mb-4">You're doing great! Keep up the momentum.</p>
          <div className="flex gap-2">
             <span className="bg-tertiary-fixed text-on-tertiary-fixed px-3 py-1 rounded-full text-xs font-bold font-body">
               3/5 Sessions
             </span>
          </div>
        </div>
        <div className="z-10 w-20 h-20 rounded-full border-8 border-secondary-container flex items-center justify-center bg-surface-container-lowest shadow-inner">
          <span className="font-display font-bold text-xl text-secondary">60%</span>
        </div>
      </Card>

      {/* Today's Tasks */}
      <div>
        <h3 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
          <Calendar size={20} className="text-primary" />
          Today's Plan
        </h3>

        {activeRoutines.length > 0 ? (
          <div className="space-y-4">
            {activeRoutines.map(routine => (
              <Card key={routine.id} level={2} className="relative overflow-hidden cursor-pointer hover:bg-surface-container transition-colors" onClick={() => navigate(`/patient/routines/${routine.id}`)}>
                 <div className="flex items-start justify-between">
                   <div>
                      <span className="text-xs font-bold text-primary tracking-wider uppercase mb-1 block">{routine.type}</span>
                      <h4 className="text-lg font-display font-semibold mb-2">{routine.title}</h4>
                      <p className="text-sm text-on-surface-variant flex items-center gap-1">
                        <PlayCircle size={14} /> {routine.activities.length} Activities
                      </p>
                   </div>
                   <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white shadow-ambient transition-transform hover:scale-110">
                     <PlayCircle size={20} className="fill-white/20" />
                   </div>
                 </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card level={2} className="flex flex-col items-center justify-center py-8 text-center border-ghost">
            <ShieldCheck size={48} className="text-secondary mb-4 opacity-50" />
            <p className="font-display font-semibold text-on-surface mb-1">All caught up!</p>
            <p className="text-sm text-on-surface-variant">You've completed your assigned routines.</p>
          </Card>
        )}
      </div>

    </div>
  );
}
