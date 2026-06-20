import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Play, Pause, ChevronRight, CheckCircle2, SkipForward } from 'lucide-react';
import { cn } from '../../utils/cn';
import { sessionApi } from '../../services/session.api';

export function RoutinePlayer() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const allRoutines = useStore(state => state.routines);
  const markRoutineComplete = useStore(state => state.markRoutineComplete);
  const markRoutineCompletedLocally = useStore(state => state.markRoutineCompletedLocally);

  const routine = allRoutines.find(r => r.id === id);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentRepetition, setCurrentRepetition] = useState(1);
  const [phase, setPhase] = useState<'EXERCISE' | 'REST'>('EXERCISE');
  const [timeLeft, setTimeLeft] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRoutineFinished, setIsRoutineFinished] = useState(false);

  const sessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!routine) return;
    sessionApi.start(routine.id)
      .then(s => { sessionIdRef.current = s.id; })
      .catch(() => {});

  }, [routine?.id]);

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

  useEffect(() => {
    let interval: number;

    if (isPlaying && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (isPlaying && timeLeft === 0) {
      // eslint-disable-next-line
      handlePhaseComplete('COMPLETED');
    }

    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, [isPlaying, timeLeft]);

  const recordExercise = (status: 'COMPLETED' | 'SKIPPED' | 'NOT_COMPLETED') => {
    if (!routine || !sessionIdRef.current) return;
    const activity = routine.activities[currentIndex];
    sessionApi.trackExercise(sessionIdRef.current, {
      activityId: activity.id,
      order:      currentIndex,
      status,
    }).catch(() => {});
  };

  const moveToNextActivity = (status: 'COMPLETED' | 'SKIPPED' | 'NOT_COMPLETED') => {
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

  const handleOmitir = () => {
    if (!routine) return;
    const currentActivity = routine.activities[currentIndex];
    const fullDuration = phase === 'EXERCISE'
      ? currentActivity.durationMinutes * 60
      : (currentActivity.restSeconds || 0);
    const status: 'SKIPPED' | 'NOT_COMPLETED' = timeLeft < fullDuration ? 'NOT_COMPLETED' : 'SKIPPED';
    handlePhaseComplete(status);
  };

  const handlePhaseComplete = (trigger: 'COMPLETED' | 'SKIPPED' | 'NOT_COMPLETED' = 'COMPLETED') => {
    if (!routine) return;
    setIsPlaying(false);

    const currentActivity = routine.activities[currentIndex];

    if (phase === 'EXERCISE') {
      if (trigger !== 'COMPLETED') {
        moveToNextActivity(trigger);
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

      setCurrentRepetition(prev => prev + 1);
      setPhase('EXERCISE');
    }
  };

  const handleFinishRoutine = async () => {
    if (!routine) return;
    try {
      if (sessionIdRef.current) {
        await sessionApi.finalize(sessionIdRef.current);
        markRoutineCompletedLocally(routine.id);
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
        <p className="text-on-surface-variant">{t('patient.player.notFound')}</p>
        <Button onClick={() => navigate('/patient')} className="mt-4">{t('patient.player.goBack')}</Button>
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
      <div className="mb-6">
        <div className="flex justify-between items-end mb-2">
           <p className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">
             {phase === 'EXERCISE' ? t('patient.player.activeExercise') : t('patient.player.resting')}
           </p>
           <p className="text-xs font-bold text-primary">
             {t('patient.player.stepOf', { current: currentIndex + 1, total: routine.activities.length })}
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
             <h1 className="text-3xl font-display font-bold text-on-surface mb-2">{t('patient.player.complete')}</h1>
             <p className="text-on-surface-variant mb-8">{t('patient.player.completeDesc')}</p>
             <Button fullWidth onClick={handleFinishRoutine}>
                {t('patient.player.claimProgress')}
             </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className={cn(
              "w-full aspect-video rounded-3xl overflow-hidden flex items-center justify-center transition-colors duration-1000",
              phase === 'REST' ? "bg-secondary-container" : "bg-surface-container-lowest border border-ghost shadow-ambient"
            )}>
              {phase === 'REST' ? (
                 <div className="text-center animate-pulse">
                   <p className="text-secondary font-display font-bold text-2xl mb-2">{t('patient.player.relax')}</p>
                   <p className="text-on-secondary-container text-sm">{t('patient.player.breatheDeeply')}</p>
                 </div>
              ) : (
                 <div className="text-center">
                   <span className="text-6xl mb-2 block opacity-20">🎥</span>
                   <p className="text-on-surface-variant text-sm font-bold opacity-50">{t('patient.player.instructorVideo')}</p>
                 </div>
              )}
            </div>

            <Card className="text-center py-6 shadow-ambient">
              <h2 className="text-2xl font-display font-bold text-on-surface mb-2">
                {currentActivity.title}
              </h2>
              <p className="text-sm text-on-surface-variant mb-6 px-4">
                {currentActivity.description}
              </p>

              <div className="flex flex-col items-center justify-center mb-2">
                <p className={cn(
                  "text-6xl font-display font-black font-variant-numeric tracking-tight transition-colors duration-300",
                  phase === 'REST' ? "text-secondary" : "text-primary"
                )}>
                  {formatTime(timeLeft)}
                </p>
                <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mt-2">
                  {t('patient.player.timeRemaining')}
                </p>
              </div>
            </Card>

            {phase === 'EXERCISE' && (
              <div className="flex gap-4 px-2">
                <div className="flex-1 bg-surface-container-low rounded-2xl p-4 text-center border-ghost">
                   <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wider mb-1">{t('patient.player.setReps')}</p>
                   <p className="text-xl font-display font-bold">{t('patient.player.repsOf', { current: currentRepetition, total: currentActivity.repetitions })}</p>
                </div>
                <div className="flex-1 bg-surface-container-low rounded-2xl p-4 text-center border-ghost">
                   <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wider mb-1">{t('patient.player.duration')}</p>
                   <p className="text-xl font-display font-bold">{t('patient.player.minutes', { count: currentActivity.durationMinutes })}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {!isRoutineFinished && (
        <div className="fixed bottom-24 left-4 right-4 bg-surface/80 backdrop-blur-md p-4 rounded-3xl shadow-ambient border-ghost border flex gap-3 items-center animate-slide-up z-40">
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
                {isPlaying ? t('patient.player.active') : t('patient.player.paused')}
             </p>
           </div>

           <button
             onClick={handleOmitir}
             className="flex items-center gap-1 text-xs font-bold text-on-surface-variant hover:text-error transition-colors px-2"
           >
             <SkipForward size={16} />
             {t('patient.player.skip')}
           </button>

           <Button
             onClick={() => handlePhaseComplete('COMPLETED')}
             disabled={timeLeft > 0}
             className="flex items-center gap-1 rounded-full px-5"
           >
             {t('patient.player.next')} <ChevronRight size={18} />
           </Button>
        </div>
      )}
    </div>
  );
}
