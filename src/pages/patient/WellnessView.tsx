import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { cn } from '../../utils/cn';
import { ClipboardCheck } from 'lucide-react';

type Phase = 'idle' | 'inhale' | 'hold-in' | 'exhale' | 'hold-out';

const PHASES: { key: Phase; labelKey: string; duration: number; color: string }[] = [
  { key: 'inhale',   labelKey: 'patient.wellness.inhale',  duration: 4, color: 'text-primary' },
  { key: 'hold-in',  labelKey: 'patient.wellness.hold',  duration: 4, color: 'text-secondary' },
  { key: 'exhale',   labelKey: 'patient.wellness.exhale',  duration: 4, color: 'text-tertiary' },
  { key: 'hold-out', labelKey: 'patient.wellness.hold',  duration: 4, color: 'text-on-surface-variant' },
];

export function WellnessView() {
  const { t } = useTranslation();
  const navigate  = useNavigate();
  const templates = useStore(state => state.activityTemplates);
  const breathing = templates.filter(t => t.type === 'BREATHING');

  const [phase, setPhase] = useState<Phase>('idle');
  const [timeLeft, setTimeLeft] = useState(0);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [running, setRunning] = useState(false);
  const [cycles, setCycles] = useState(0);

  const current = PHASES[phaseIdx];

  const start = useCallback(() => {
    setPhaseIdx(0);
    setTimeLeft(PHASES[0].duration);
    setPhase(PHASES[0].key);
    setRunning(true);
    setCycles(0);
  }, []);

  const stop = useCallback(() => {
    setRunning(false);
    setPhase('idle');
    setTimeLeft(0);
  }, []);

  useEffect(() => {
    if (!running) return;
    if (timeLeft <= 0) {
      const next = (phaseIdx + 1) % PHASES.length;
      if (next === 0) setCycles(c => c + 1);
      setPhaseIdx(next);
      setPhase(PHASES[next].key);
      setTimeLeft(PHASES[next].duration);
      return;
    }
    const timer = window.setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [running, timeLeft, phaseIdx]);

  const isExpanded = phase === 'inhale' || phase === 'hold-in';

  return (
    <div className="space-y-8 animate-fade-in">
      <header>
        <h1 className="text-3xl font-display font-bold text-on-surface mb-1">{t('patient.wellness.title')}</h1>
        <p className="text-on-surface-variant font-body text-sm">{t('patient.wellness.subtitle')}</p>
      </header>

      <Card
        level={2}
        className="flex items-center gap-4 border-ghost cursor-pointer hover:bg-surface-container transition-colors"
        onClick={() => navigate('/patient/wellness-checkin')}
      >
        <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
          <ClipboardCheck size={22} />
        </div>
        <div className="flex-1">
          <p className="font-bold text-on-surface">{t('patient.wellness.checkinCard')}</p>
          <p className="text-xs text-on-surface-variant">{t('patient.wellness.checkinCardDesc')}</p>
        </div>
        <span className="text-on-surface-variant text-lg">›</span>
      </Card>

      <Card className="flex flex-col items-center py-8 gap-6 border-ghost relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

        <div className="relative flex items-center justify-center w-40 h-40">
          <div className={cn(
            'absolute rounded-full border-2 border-primary/20 transition-all duration-1000',
            isExpanded ? 'w-40 h-40 opacity-100' : 'w-24 h-24 opacity-0'
          )} />
          <div className={cn(
            'rounded-full flex items-center justify-center transition-all duration-1000 shadow-ambient',
            isExpanded
              ? 'w-36 h-36 bg-primary/20 border-4 border-primary/40'
              : phase === 'idle'
              ? 'w-24 h-24 bg-surface-container border-4 border-surface-container-high'
              : 'w-20 h-20 bg-primary/10 border-4 border-primary/20'
          )}>
            <p className={cn('text-5xl font-display font-black transition-colors duration-500',
              running ? current.color : 'text-on-surface-variant'
            )}>
              {running ? timeLeft : '∞'}
            </p>
          </div>
        </div>

        <div className="text-center">
          <p className={cn('text-xl font-display font-bold transition-colors duration-500',
            running ? current.color : 'text-on-surface-variant'
          )}>
            {running ? t(current.labelKey) : t('patient.wellness.boxBreathing')}
          </p>
          {running && (
            <p className="text-sm text-on-surface-variant mt-1">
              {t('patient.wellness.cycleStatus', { cycle: cycles + 1, phase: t(current.labelKey), seconds: timeLeft })}
            </p>
          )}
        </div>

        {running && (
          <div className="flex gap-2">
            {PHASES.map((p, i) => (
              <div key={p.key} className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                i === phaseIdx ? 'w-8 bg-primary' : 'w-3 bg-surface-container-high'
              )} />
            ))}
          </div>
        )}

        <Button onClick={running ? stop : start} className="px-8">
          {running ? t('patient.wellness.stop') : t('patient.wellness.startBreathing')}
        </Button>

        {!running && (
          <p className="text-xs text-on-surface-variant text-center px-8">
            {t('patient.wellness.breathingPattern')}
          </p>
        )}
      </Card>

      {breathing.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant">
            {t('patient.wellness.breathingExercises')}
          </h2>
          {breathing.map(t => (
            <Card key={t.id} level={2} className="flex items-start gap-4 border-ghost">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 text-lg">
                🫁
              </div>
              <div>
                <h3 className="font-bold text-on-surface">{t.title}</h3>
                <p className="text-sm text-on-surface-variant mt-0.5">{t.description}</p>
              </div>
            </Card>
          ))}
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant">{t('patient.wellness.tips')}</h2>
        {[
          { icon: '💧', tipKey: 'patient.wellness.tipHydration' },
          { icon: '🛏️', tipKey: 'patient.wellness.tipRest' },
          { icon: '🔥', tipKey: 'patient.wellness.tipWarmup' },
          { icon: '📅', tipKey: 'patient.wellness.tipConsistency' },
        ].map(({ icon, tipKey }) => (
          <Card key={tipKey} level={2} className="flex items-start gap-3 border-ghost py-3">
            <span className="text-xl">{icon}</span>
            <p className="text-sm text-on-surface-variant">{t(tipKey)}</p>
          </Card>
        ))}
      </section>
    </div>
  );
}
