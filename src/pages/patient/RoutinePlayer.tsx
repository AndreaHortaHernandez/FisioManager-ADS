import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Play, Pause, ChevronRight, CheckCircle2, SkipForward } from 'lucide-react';
import { cn } from '../../utils/cn';
import { sessionApi } from '../../services/session.api';

export function RoutinePlayer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const allRoutines = useStore(state => state.routines);
  const markRoutineComplete = useStore(state => state.markRoutineComplete);

  const routine = allRoutines.find(r => r.id === id);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentRepetition, setCurrentRepetition] = useState(1);
  const [phase, setPhase] = useState<'EXERCISE' | 'REST'>('EXERCISE');
  const [timeLeft, setTimeLeft] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRoutineFinished, setIsRoutineFinished] = useState(false);

  const sessionIdRef = useRef<string | null>(null);

  // Crear sesión al montar
  useEffect(() => {
    if (!routine) return;
    sessionApi.start(routine.id)
      .then(s => { sessionIdRef.current = s.id; })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routine?.id]);

  // Initialize timer when activity or phase changes
  useEffect(() => {
    if (!routine) return;
    const currentActivity = routine.activities[currentIndex];
    if (!currentActivity) return;

    if (phase === 'EXERCISE') {
      setTimeLeft(currentActivity.durationMinutes * 60);
    } else if (phase === 'REST') {
      setTimeLeft(currentActivity.restSeconds || 0);
    }
  }, [currentIndex, currentRepetition, phase, routine]);

  // Main countdown logic
  useEffect(() => {
    let interval: number;

    if (isPlaying && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (isPlaying && timeLeft === 0) {
      handlePhaseComplete('COMPLETED');
    }

    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, [isPlaying, timeLeft]);

  const recordExercise = (status: 'COMPLETED' | 'SKIPPED') => {
    if (!routine || !sessionIdRef.current) return;
    const activity = routine.activities[currentIndex];
    sessionApi.trackExercise(sessionIdRef.current, {
      activityId: activity.id,
      order:      currentIndex,
      status,
    }).catch(() => {});
  };

  const moveToNextActivity = (status: 'COMPLETED' | 'SKIPPED') => {
    if (!routine) return;
    recordExercise(status);

    if (currentIndex < routine.activities.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setCurrentRepetition(1);
      setPhase('EXERCISE');
    } else {
      setIsRoutineFinished(true);
    }
  };

  const handlePhaseComplete = (trigger: 'COMPLETED' | 'SKIPPED' = 'COMPLETED') => {
    if (!routine) return;
    setIsPlaying(false);

    const currentActivity = routine.activities[currentIndex];

    if (phase === 'EXERCISE') {
      if (trigger === 'SKIPPED') {
        moveToNextActivity('SKIPPED');
      } else if (currentRepetition < currentActivity.repetitions) {
        if (currentActivity.restSeconds && currentActivity.restSeconds > 0) {
          setPhase('REST');
        } else {
          setCurrentRepetition(prev => prev + 1);
          setPhase('EXERCISE');
        }
      } else {
        moveToNextActivity('COMPLETED');
      }
    } else if (phase === 'REST') {
      // Saltar descanso: avanzar al siguiente rep sin registrar
      setCurrentRepetition(prev => prev + 1);
      setPhase('EXERCISE');
    }
  };

  const handleFinishRoutine = async () => {
    if (!routine) return;
    try {
      if (sessionIdRef.current) {
        await sessionApi.finalize(sessionIdRef.current);
      } else {
        await markRoutineComplete(routine.id);
      }
    } catch {
      await markRoutineComplete(routine.id).catch(() => {});
    }
    navigate('/patient/feedback');
  };

  if (!routine) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <p className="text-on-surface-variant">Routine not found.</p>
        <Button onClick={() => navigate('/patient')} className="mt-4">Go Back</Button>
      </div>
    );
  }

  const currentActivity = routine.activities[currentIndex];
  const totalSteps = routine.activities.length * 2;
  const currentStep = (currentIndex * 2) + (phase === 'REST' ? 1 : 0);
  const progressPercent = (currentStep / totalSteps) * 100;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col pt-4 animate-fade-in">
      {/* Progress Bar Header */}
      <div className="mb-6">
        <div className="flex justify-between items-end mb-2">
           <p className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">
             {phase === 'EXERCISE' ? 'Active Exercise' : 'Resting'}
           </p>
           <p className="text-xs font-bold text-primary">
             Step {currentIndex + 1} of {routine.activities.length}
           </p>
        </div>
        <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
           <div
             className="bg-primary h-full transition-all duration-500 ease-out"
             style={{ width: `${progressPercent}%` }}
           />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        {isRoutineFinished ? (
          <div className="h-full flex flex-col items-center justify-center text-center animate-fade-in p-6">
             <div className="w-24 h-24 bg-primary rounded-full text-white flex items-center justify-center shadow-ambient mb-6 scale-in">
                <CheckCircle2 size={48} />
             </div>
             <h1 className="text-3xl font-display font-bold text-on-surface mb-2">Routine Complete!</h1>
             <p className="text-on-surface-variant mb-8">You're one step closer to your weekly goal.</p>
             <Button fullWidth onClick={handleFinishRoutine}>
                Claim Progress & Return
             </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Video Placeholder */}
            <div className={cn(
              "w-full aspect-video rounded-3xl overflow-hidden flex items-center justify-center transition-colors duration-1000",
              phase === 'REST' ? "bg-secondary-container" : "bg-surface-container-lowest border border-ghost shadow-ambient"
            )}>
              {phase === 'REST' ? (
                 <div className="text-center animate-pulse">
                   <p className="text-secondary font-display font-bold text-2xl mb-2">Relax</p>
                   <p className="text-on-secondary-container text-sm">Breathe deeply</p>
                 </div>
              ) : (
                 <div className="text-center">
                   <span className="text-6xl mb-2 block opacity-20">🎥</span>
                   <p className="text-on-surface-variant text-sm font-bold opacity-50">Instructor Video</p>
                 </div>
              )}
            </div>

            {/* Title Card */}
            <Card className="text-center py-6 shadow-ambient">
              <h2 className="text-2xl font-display font-bold text-on-surface mb-2">
                {currentActivity.title}
              </h2>
              <p className="text-sm text-on-surface-variant mb-6 px-4">
                {currentActivity.description}
              </p>

              {/* Giant Timer */}
              <div className="flex flex-col items-center justify-center mb-2">
                <p className={cn(
                  "text-6xl font-display font-black font-variant-numeric tracking-tight transition-colors duration-300",
                  phase === 'REST' ? "text-secondary" : "text-primary"
                )}>
                  {formatTime(timeLeft)}
                </p>
                <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mt-2">
                  Time Remaining
                </p>
              </div>
            </Card>

            {/* Badges / Metrics */}
            {phase === 'EXERCISE' && (
              <div className="flex gap-4 px-2">
                <div className="flex-1 bg-surface-container-low rounded-2xl p-4 text-center border-ghost">
                   <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wider mb-1">Set / Reps</p>
                   <p className="text-xl font-display font-bold">{currentRepetition} of {currentActivity.repetitions}</p>
                </div>
                <div className="flex-1 bg-surface-container-low rounded-2xl p-4 text-center border-ghost">
                   <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wider mb-1">Duration</p>
                   <p className="text-xl font-display font-bold">{currentActivity.durationMinutes}m</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Float Controls */}
      {!isRoutineFinished && (
        <div className="fixed bottom-24 left-4 right-4 bg-surface/80 backdrop-blur-md p-4 rounded-3xl shadow-ambient border-ghost border flex gap-3 items-center animate-slide-up z-40">
           {/* Play/Pause */}
           <button
             onClick={() => setIsPlaying(!isPlaying)}
             className={cn(
               "w-14 h-14 rounded-full flex items-center justify-center shadow-md transition-transform active:scale-95 shrink-0",
               isPlaying ? "bg-error text-white" : "bg-primary text-white"
             )}
           >
             {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
           </button>

           <div className="flex-1 text-center">
             <p className="text-xs text-on-surface-variant font-bold tracking-wider">
                {isPlaying ? 'ACTIVE' : 'PAUSED'}
             </p>
           </div>

           {/* Omitir */}
           <button
             onClick={() => handlePhaseComplete('SKIPPED')}
             className="flex items-center gap-1 text-xs font-bold text-on-surface-variant hover:text-error transition-colors px-2"
           >
             <SkipForward size={16} />
             Omitir
           </button>

           {/* Siguiente — solo cuando el timer llega a 0 */}
           <Button
             onClick={() => handlePhaseComplete('COMPLETED')}
             disabled={timeLeft > 0}
             className="flex items-center gap-1 rounded-full px-5"
           >
             Next <ChevronRight size={18} />
           </Button>
        </div>
      )}
    </div>
  );
}
