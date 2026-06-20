import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../store/useStore';
import { Card } from '../../components/ui/Card';
import { TrendingUp, Activity, Award, Flame, Target, Sparkles, FileDown } from 'lucide-react';
import type { Feedback } from '../../types';
import { progressApi, type PatientProgress } from '../../services/progress.api';
import { reportApi } from '../../services/report.api';
import { toLocalDateString } from '../../utils/date';

const EMOTION_MAP: Record<Feedback['emotionalState'], { emoji: string; labelKey: string }> = {
  GREAT:   { emoji: '😄', labelKey: 'patient.emotions.great' },
  GOOD:    { emoji: '🙂', labelKey: 'patient.emotions.good' },
  OK:      { emoji: '😐', labelKey: 'patient.emotions.ok' },
  BAD:     { emoji: '😟', labelKey: 'patient.emotions.bad' },
  TERRIBLE:{ emoji: '😣', labelKey: 'patient.emotions.terrible' },
};

function PainBar({ value }: { value: number }) {
  const pct = (value / 10) * 100;
  const color = value >= 8 ? 'bg-error' : value >= 5 ? 'bg-tertiary' : 'bg-secondary';
  return (
    <div className="flex-1 flex flex-col items-center gap-1 group relative">
      <span className="text-[9px] font-bold text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity absolute -top-4">
        {value}
      </span>
      <div className="w-full rounded-t-sm bg-surface-container-high h-16 flex items-end overflow-hidden">
        <div className={`w-full ${color} opacity-75 group-hover:opacity-100 transition-all rounded-t-sm`}
          style={{ height: `${pct}%` }} />
      </div>
    </div>
  );
}

function AdherenceBar({ count, max, day, date }: { count: number; max: number; day: string; date: string }) {
  const isToday = date === toLocalDateString(new Date());
  const pct     = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="flex-1 flex flex-col items-center gap-1.5">
      <div className="w-full h-16 bg-surface-container-high rounded-lg flex items-end overflow-hidden">
        <div
          className={`w-full rounded-t-lg transition-all ${count > 0 ? 'bg-secondary' : 'bg-transparent'}`}
          style={{ height: `${Math.max(pct, count > 0 ? 10 : 0)}%` }}
        />
      </div>
      <span className={`text-[10px] font-bold ${isToday ? 'text-primary' : 'text-on-surface-variant'}`}>{day}</span>
      {count > 0 && <span className="text-[9px] text-secondary font-bold">{count}</span>}
    </div>
  );
}

export function ProgressView() {
  const { t } = useTranslation();
  const currentUserId = useStore(state => state.currentUser);
  const allFeedbacks  = useStore(state => state.feedbacks);
  const allRoutines   = useStore(state => state.routines);

  const feedbacks = allFeedbacks
    .filter(f => f.patientId === currentUserId)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const completedCount = allRoutines.filter(
    r => r.patientId === currentUserId && r.completed
  ).length;

  const lastFeedbacks = feedbacks.slice(-10);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });

  const [progress, setProgress] = useState<PatientProgress | null>(null);
  const [progressError, setProgressError] = useState('');
  const [downloading, setDownloading] = useState(false);

  function loadProgress() {
    setProgressError('');
    progressApi.getProgreso().then(setProgress).catch(e => setProgressError((e as Error).message));
  }

  useEffect(() => {
    loadProgress();
  }, []);

  async function handleDownloadReport() {
    setDownloading(true);
    try {
      await reportApi.downloadOwnProgress();
    } finally {
      setDownloading(false);
    }
  }

  const adherenceMax = progress
    ? Math.max(...progress.adherenceByDay.map(d => d.count), 1)
    : 1;

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-display font-bold text-on-surface mb-1">{t('patient.progress.title')}</h1>
          <p className="text-on-surface-variant font-body text-sm">{t('patient.progress.subtitle')}</p>
        </div>
        <button onClick={handleDownloadReport} disabled={downloading}
          className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors shrink-0 disabled:opacity-50">
          <FileDown size={14} /> {downloading ? t('patient.progress.generating') : t('patient.progress.pdf')}
        </button>
      </header>

      {progressError && !progress && (
        <button onClick={loadProgress}
          className="w-full text-sm text-error bg-error-container/30 px-4 py-2 rounded-lg text-left underline">
          {t('patient.progress.loadError')}
        </button>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Card className="flex items-center gap-3 border-ghost">
          <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
            <Award size={20} />
          </div>
          <div>
            <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wide">{t('patient.progress.completed')}</p>
            <p className="text-2xl font-display font-bold">{completedCount}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 border-ghost">
          <div className="w-10 h-10 rounded-xl bg-tertiary/10 text-tertiary flex items-center justify-center">
            <Activity size={20} />
          </div>
          <div>
            <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wide">{t('patient.progress.avgPain')}</p>
            <p className="text-2xl font-display font-bold">{progress?.avgPain ?? '—'}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 border-ghost">
          <div className="w-10 h-10 rounded-xl bg-error/10 text-error flex items-center justify-center">
            <Flame size={20} />
          </div>
          <div>
            <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wide">{t('patient.progress.streak')}</p>
            <p className="text-2xl font-display font-bold">{progress?.streak ?? 0} <span className="text-sm font-normal">{t('patient.progress.days')}</span></p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 border-ghost">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Target size={20} />
          </div>
          <div>
            <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wide">{t('patient.progress.thisWeek')}</p>
            <p className="text-2xl font-display font-bold">
              {progress ? `${progress.weeklyGoal.completed}/${progress.weeklyGoal.target}` : '—'}
            </p>
          </div>
        </Card>
      </div>

      {progress && (
        <Card className="space-y-3 border-ghost">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={16} className="text-secondary" />
            <h2 className="font-display font-bold">{t('patient.progress.adherence7Days')}</h2>
          </div>
          <div className="flex items-end gap-2">
            {progress.adherenceByDay.map(d => (
              <AdherenceBar key={d.date} count={d.count} max={adherenceMax} day={d.day} date={d.date} />
            ))}
          </div>
        </Card>
      )}

      {progress?.aiInsight && (
        <Card className="bg-primary/5 border-ghost space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-primary" />
            <h2 className="font-display font-bold text-primary">{t('patient.progress.insight')}</h2>
          </div>
          <p className="text-sm text-on-surface leading-relaxed">{progress.aiInsight}</p>
        </Card>
      )}

      {lastFeedbacks.length > 0 && (
        <Card className="space-y-3 border-ghost">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={16} className="text-primary" />
            <h2 className="font-display font-bold">{t('patient.progress.painLastSessions')}</h2>
          </div>
          <div className="flex items-end gap-1 h-16">
            {lastFeedbacks.map(f => <PainBar key={f.id} value={f.painLevel} />)}
          </div>
          <div className="flex justify-between text-[9px] text-on-surface-variant">
            <span>{formatDate(lastFeedbacks[0].date)}</span>
            <span>{formatDate(lastFeedbacks[lastFeedbacks.length - 1].date)}</span>
          </div>
        </Card>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant">
          {t('patient.progress.feedbackHistory')}
        </h2>

        {feedbacks.length === 0 ? (
          <Card level={2} className="py-10 text-center border-ghost">
            <p className="text-on-surface-variant">{t('patient.progress.noFeedback')}</p>
          </Card>
        ) : (
          [...feedbacks].reverse().map(fb => {
            const emo = EMOTION_MAP[fb.emotionalState];
            return (
              <Card key={fb.id} level={2} className="flex items-center gap-4 border-ghost">
                <span className="text-3xl">{emo.emoji}</span>
                <div className="flex-1">
                  <p className="font-bold text-on-surface">{t(emo.labelKey)}</p>
                  <p className="text-xs text-on-surface-variant">{formatDate(fb.date)}</p>
                  {fb.aiSummary && (
                    <p className="text-xs italic text-on-surface-variant mt-1">"{fb.aiSummary}"</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs text-on-surface-variant uppercase font-bold tracking-wide">{t('patient.progress.pain')}</p>
                  <p className={`text-xl font-display font-bold ${fb.painLevel >= 8 ? 'text-error' : fb.painLevel >= 5 ? 'text-tertiary' : 'text-secondary'}`}>
                    {fb.painLevel}
                  </p>
                </div>
              </Card>
            );
          })
        )}
      </section>
    </div>
  );
}
