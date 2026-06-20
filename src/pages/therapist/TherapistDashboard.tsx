import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/ui/Card';
import { useStore } from '../../store/useStore';
import { Users, Activity, HeartPulse } from 'lucide-react';
import { resolveUploadUrl } from '../../utils/url';

export function TherapistDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const currentTherapist = useStore(state => state.role === 'THERAPIST' ? 'Dr. Sarah Jenkins' : '');
  const patients = useStore(state => state.patients);
  const totalPatients = patients.length;
  const recentFeedbacks = useStore(state => state.feedbacks);

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="mb-10">
        <h1 className="text-4xl font-display font-bold text-on-surface mb-2">{t('therapist.dashboard.welcome', { name: currentTherapist.split(' ')[1] })}</h1>
        <p className="text-on-surface-variant font-body">{t('therapist.dashboard.overview')}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="flex items-center gap-4 border-ghost">
            <div className="p-4 bg-primary-container/10 rounded-xl text-primary">
               <Users size={32} />
            </div>
            <div>
               <p className="text-sm text-on-surface-variant font-bold uppercase tracking-wider">{t('therapist.dashboard.activePatients')}</p>
               <p className="text-3xl font-display font-semibold">{totalPatients}</p>
            </div>
         </Card>

         <Card className="flex items-center gap-4 border-ghost">
            <div className="p-4 bg-secondary-container/20 rounded-xl text-secondary">
               <Activity size={32} />
            </div>
            <div>
               <p className="text-sm text-on-surface-variant font-bold uppercase tracking-wider">{t('therapist.dashboard.routinesAssigned')}</p>
               <p className="text-3xl font-display font-semibold">12</p>
            </div>
         </Card>

         <Card className="flex items-center gap-4 border-ghost">
            <div className="p-4 bg-tertiary-container/10 rounded-xl text-tertiary">
               <HeartPulse size={32} />
            </div>
            <div>
               <p className="text-sm text-on-surface-variant font-bold uppercase tracking-wider">{t('therapist.dashboard.newFeedbacks')}</p>
               <p className="text-3xl font-display font-semibold">{recentFeedbacks.length}</p>
            </div>
         </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-display font-bold text-on-surface">{t('therapist.dashboard.recentPatients')}</h2>
          <Card level={2}>
            <div className="space-y-4">
              {patients.map(patient => (
                <div
                  key={patient.id}
                  onClick={() => navigate(`/therapist/patients/${patient.id}`)}
                  className="flex items-center justify-between p-4 bg-surface-container-lowest rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer border-ghost"
                >
                  <div className="flex items-center gap-4">
                     <img src={resolveUploadUrl(patient.avatarUrl) ?? `https://i.pravatar.cc/48?u=${patient.id}`} alt={patient.name} className="w-12 h-12 rounded-full" />
                     <div>
                       <h3 className="font-bold text-on-surface">{patient.name}</h3>
                       <p className="text-sm text-on-surface-variant">{patient.condition}</p>
                     </div>
                  </div>
                  <div className="text-right">
                     <span className="text-xs bg-surface-container px-3 py-1 rounded-full font-bold text-primary">{t('therapist.dashboard.viewDetail')} →</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-display font-bold text-on-surface">{t('therapist.dashboard.quickActions')}</h2>
          <Card level={2} className="space-y-3">
             <button
               onClick={() => navigate('/therapist/routines/builder')}
               className="w-full text-left p-4 bg-surface-container-lowest rounded-xl font-bold text-on-surface hover:text-primary transition-colors flex justify-between items-center group"
             >
               {t('therapist.dashboard.buildNewRoutine')}
               <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
             </button>
             <button
               onClick={() => navigate('/therapist/routines')}
               className="w-full text-left p-4 bg-surface-container-lowest rounded-xl font-bold text-on-surface hover:text-primary transition-colors flex justify-between items-center group"
             >
               {t('therapist.dashboard.browseLibrary')}
               <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
             </button>
             <button
               onClick={() => navigate('/therapist/patients')}
               className="w-full text-left p-4 bg-surface-container-lowest rounded-xl font-bold text-on-surface hover:text-primary transition-colors flex justify-between items-center group"
             >
               {t('therapist.dashboard.reviewFeedback')}
               <div className="bg-error w-2 h-2 rounded-full"></div>
             </button>
          </Card>
        </div>
      </div>
    </div>
  );
}
