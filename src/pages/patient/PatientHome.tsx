import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { useStore } from '../../store/useStore';
import { PlayCircle, Calendar, ShieldCheck, Flame, Clock, Stethoscope } from 'lucide-react';
import { progressApi, type PatientProgress, type ProximaCita } from '../../services/progress.api';
import { resolveUploadUrl } from '../../utils/url';

export function PatientHome() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const allPatients    = useStore(state => state.patients);
  const currentUserId  = useStore(state => state.currentUser);
  const authUser       = useStore(state => state.authUser);
  const allRoutines    = useStore(state => state.routines);

  const currentUser   = allPatients.find(p => p.id === currentUserId);
  const displayName   = currentUser?.name ?? authUser?.name ?? '';
  const routines      = allRoutines.filter(r => r.patientId === currentUserId);
  const activeRoutines = routines.filter(r => !r.completed);

  const [progress, setProgress]   = useState<PatientProgress | null>(null);
  const [progressError, setProgressError] = useState('');
  const [proxCita, setProxCita]   = useState<ProximaCita | null | undefined>(undefined);

  function loadProgress() {
    setProgressError('');
    progressApi.getProgreso().then(setProgress).catch(e => setProgressError((e as Error).message));
  }

  useEffect(() => {
    loadProgress();
    progressApi.getProximaCita().then(setProxCita).catch(() => setProxCita(null));
  }, []);

  const weekly   = progress?.weeklyGoal;
  const pct      = weekly ? Math.round((weekly.completed / weekly.target) * 100) : 0;
  const streak   = progress?.streak ?? 0;

  const formatCita = (iso: string) =>
    new Date(iso).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center mt-4">
        <div>
          <p className="text-sm font-body text-on-surface-variant mb-1">{t('patient.home.greeting')}</p>
          <h1 className="text-3xl font-display font-bold text-on-surface">
            {displayName.split(' ')[0]}
          </h1>
        </div>
        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-surface-container-lowest shadow-ambient">
          {resolveUploadUrl(authUser?.avatarUrl) ? (
            <img src={resolveUploadUrl(authUser?.avatarUrl)} alt={t('patient.home.avatarAlt')} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-primary-container flex items-center justify-center font-bold text-primary">
              {displayName.charAt(0)}
            </div>
          )}
        </div>
      </div>

      <Card className="flex items-center justify-between shadow-ambient relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-secondary-container rounded-full filter blur-2xl opacity-20 group-hover:scale-110 transition-transform duration-500" />
        <div className="z-10 flex-1">
          <h2 className="text-xl font-display font-semibold mb-1">{t('patient.home.weeklyGoal')}</h2>
          <p className="text-sm text-on-surface-variant mb-3">
            {weekly
              ? t('patient.home.sessionsThisWeek', { completed: weekly.completed, target: weekly.target })
              : progressError
                ? <button onClick={loadProgress} className="underline">{t('patient.home.loadFailedRetry')}</button>
                : t('common.loading')}
          </p>
          <div className="flex gap-2 flex-wrap">
            <span className="bg-tertiary-fixed text-on-tertiary-fixed px-3 py-1 rounded-full text-xs font-bold">
              {weekly ? t('patient.home.sessionsBadge', { completed: weekly.completed, target: weekly.target }) : '—'}
            </span>
            {streak > 0 && (
              <span className="flex items-center gap-1 bg-error/10 text-error px-3 py-1 rounded-full text-xs font-bold">
                <Flame size={12} /> {t('patient.home.streakDays', { count: streak })}
              </span>
            )}
          </div>
        </div>
        <div className="z-10 w-20 h-20 rounded-full border-8 border-secondary-container flex items-center justify-center bg-surface-container-lowest shadow-inner shrink-0">
          <span className="font-display font-bold text-xl text-secondary">{pct}%</span>
        </div>
      </Card>

      {proxCita && (
        <Card level={2} className="flex items-center gap-4 border-ghost">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Calendar size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-0.5">{t('patient.home.nextAppointment')}</p>
            <p className="font-bold text-on-surface truncate">{formatCita(proxCita.dateTime)}</p>
            <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
              <Stethoscope size={11} /> {proxCita.therapist.name}
            </p>
          </div>
          <Clock size={16} className="text-on-surface-variant shrink-0" />
        </Card>
      )}

      <div>
        <h3 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
          <Calendar size={20} className="text-primary" />
          {t('patient.home.dayPlan')}
        </h3>

        {activeRoutines.length > 0 ? (
          <div className="space-y-4">
            {activeRoutines.map(routine => (
              <Card
                key={routine.id}
                level={2}
                className="relative overflow-hidden cursor-pointer hover:bg-surface-container transition-colors"
                onClick={() => navigate(`/patient/routines/${routine.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-bold text-primary tracking-wider uppercase mb-1 block">{routine.type}</span>
                    <h4 className="text-lg font-display font-semibold mb-2">{routine.title}</h4>
                    <p className="text-sm text-on-surface-variant flex items-center gap-1">
                      <PlayCircle size={14} /> {t('patient.home.activitiesCount', { count: routine.activities.length })}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white shadow-ambient">
                    <PlayCircle size={20} className="fill-white/20" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card level={2} className="flex flex-col items-center justify-center py-8 text-center border-ghost">
            <ShieldCheck size={48} className="text-secondary mb-4 opacity-50" />
            <p className="font-display font-semibold text-on-surface mb-1">{t('patient.home.allCaughtUp')}</p>
            <p className="text-sm text-on-surface-variant">{t('patient.home.allCaughtUpDesc')}</p>
          </Card>
        )}
      </div>
    </div>
  );
}
