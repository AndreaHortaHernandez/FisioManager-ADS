import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../store/useStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Plus, BookMarked, Users, Check, Copy, Calendar, Pause, XCircle, PlayCircle, Pencil, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { AssignmentFrequency, AssignmentStatus, RoutineAssignment } from '../../types';
import { toLocalDateString } from '../../utils/date';

const FREQUENCY_LABEL_KEYS: Record<AssignmentFrequency, string> = {
  DAILY:           'therapist.routines.frequency.daily',
  EVERY_OTHER_DAY: 'therapist.routines.frequency.everyOtherDay',
  WEEKLY:          'therapist.routines.frequency.weekly',
};

const STATUS_LABEL_KEYS: Record<AssignmentStatus, string> = {
  ACTIVE:    'therapist.routines.assignmentStatus.active',
  PAUSED:    'therapist.routines.assignmentStatus.paused',
  CANCELLED: 'therapist.routines.assignmentStatus.cancelled',
};

const STATUS_COLORS: Record<AssignmentStatus, string> = {
  ACTIVE:    'text-green-600 bg-green-50',
  PAUSED:    'text-yellow-600 bg-yellow-50',
  CANCELLED: 'text-red-500 bg-red-50',
};

export function RoutineLibrary() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const allRoutines          = useStore(state => state.routines);
  const patients             = useStore(state => state.patients);
  const routineAssignments   = useStore(state => state.routineAssignments);
  const cloneRoutine         = useStore(state => state.cloneRoutine);
  const deleteRoutine        = useStore(state => state.deleteRoutine);
  const createAssignment     = useStore(state => state.createAssignment);
  const updateAssignmentStatus = useStore(state => state.updateAssignmentStatus);
  const loadAssignments      = useStore(state => state.loadAssignments);

  const libraryRoutines = allRoutines.filter(r => r.patientId === null);

  const [modalOpen, setModalOpen]               = useState(false);
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [startDate, setStartDate]               = useState('');
  const [endDate, setEndDate]                   = useState('');
  const [frequency, setFrequency]               = useState<AssignmentFrequency>('DAILY');
  const [assignmentsTab, setAssignmentsTab]     = useState(false);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  const handleOpenAssign = (routineId: string) => {
    setSelectedRoutineId(routineId);
    setSelectedPatientId('');
    setStartDate(toLocalDateString(new Date()));
    setEndDate('');
    setFrequency('DAILY');
    setModalOpen(true);
  };

  const handleConfirmAssign = async () => {
    if (!selectedRoutineId || !selectedPatientId || !startDate) return;
    await createAssignment({
      routineId: selectedRoutineId,
      patientId: selectedPatientId,
      startDate,
      endDate: endDate || undefined,
      frequency,
    });
    setModalOpen(false);
    setAssignmentsTab(true);
  };

  const handleClone = async (routineId: string) => {
    await cloneRoutine(routineId);
  };

  const handleDelete = async (routineId: string) => {
    if (!window.confirm(t('therapist.routines.confirmDelete'))) return;
    await deleteRoutine(routineId);
  };

  const activeAssignments   = routineAssignments.filter(a => a.status === 'ACTIVE');
  const inactiveAssignments = routineAssignments.filter(a => a.status !== 'ACTIVE');

  const AssignmentRow = ({ a }: { a: RoutineAssignment }) => (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-ghost bg-surface">
      <div className="flex-1 min-w-0">
        <p className="font-bold text-on-surface truncate">{a.routine?.title ?? '—'}</p>
        <p className="text-xs text-on-surface-variant">
          {a.patient?.name ?? '—'} · {t(FREQUENCY_LABEL_KEYS[a.frequency])} · {t('therapist.routines.from', { date: a.startDate.split('T')[0] })}
          {a.endDate ? ` ${t('therapist.routines.until', { date: a.endDate.split('T')[0] })}` : ''}
        </p>
      </div>
      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[a.status]}`}>
        {t(STATUS_LABEL_KEYS[a.status])}
      </span>
      {a.status === 'ACTIVE' && (
        <div className="flex gap-2">
          <button
            title={t('therapist.routines.action.pause')}
            onClick={() => updateAssignmentStatus(a.id, 'PAUSED')}
            className="p-1.5 rounded-lg text-yellow-600 hover:bg-yellow-50 transition-colors"
          >
            <Pause size={16} />
          </button>
          <button
            title={t('common.cancel')}
            onClick={() => updateAssignmentStatus(a.id, 'CANCELLED')}
            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
          >
            <XCircle size={16} />
          </button>
        </div>
      )}
      {a.status === 'PAUSED' && (
        <button
          title={t('therapist.routines.action.reactivate')}
          onClick={() => updateAssignmentStatus(a.id, 'ACTIVE')}
          className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors"
        >
          <PlayCircle size={16} />
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-on-surface mb-2">{t('therapist.routines.title')}</h1>
          <p className="text-on-surface-variant font-body">{t('therapist.routines.subtitle')}</p>
        </div>
        <Button onClick={() => navigate('/therapist/routines/builder')} className="flex items-center gap-2">
          <Plus size={20} /> {t('therapist.routines.buildNew')}
        </Button>
      </header>

      <div className="flex gap-2 border-b border-surface-container-high pb-0">
        {['therapist.routines.tab.templates', 'therapist.routines.tab.assignments'].map((tabKey, i) => (
          <button
            key={tabKey}
            onClick={() => setAssignmentsTab(i === 1)}
            className={`px-5 py-2.5 text-sm font-bold transition-colors border-b-2 -mb-px ${
              assignmentsTab === (i === 1)
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {t(tabKey)}
          </button>
        ))}
      </div>

      {!assignmentsTab && (
        libraryRoutines.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-20 bg-surface-container-lowest rounded-2xl border-ghost">
            <BookMarked size={64} className="text-outline-variant mb-4" />
            <p className="text-xl font-display font-bold text-on-surface">{t('therapist.routines.emptyLibrary')}</p>
            <p className="text-on-surface-variant mt-2 mb-6 text-center max-w-sm">
              {t('therapist.routines.emptyLibraryHint')}
            </p>
            <Button onClick={() => navigate('/therapist/routines/builder')} variant="secondary">
              {t('therapist.routines.startBuilding')}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {libraryRoutines.map(routine => (
              <Card key={routine.id} level={2} className="flex flex-col justify-between hover:shadow-ambient transition-shadow border-ghost">
                <div className="mb-6">
                  <span className="text-xs font-bold text-primary tracking-wider uppercase mb-2 block">{routine.type}</span>
                  <h2 className="text-xl font-display font-bold text-on-surface mb-1">{routine.title}</h2>
                  <p className="text-sm text-on-surface-variant">{t('therapist.routines.activitiesCount', { count: routine.activities.length })}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      className="flex items-center justify-center gap-2 flex-1"
                      onClick={() => navigate(`/therapist/routines/builder/${routine.id}`)}
                    >
                      <Pencil size={16} /> {t('therapist.routines.edit')}
                    </Button>
                    <Button
                      variant="secondary"
                      className="flex items-center justify-center gap-2 flex-1"
                      onClick={() => handleClone(routine.id)}
                    >
                      <Copy size={16} /> {t('therapist.routines.clone')}
                    </Button>
                    <button
                      onClick={() => handleDelete(routine.id)}
                      className="p-2 rounded-lg text-error hover:bg-error/10 transition-colors"
                      title={t('therapist.routines.deleteRoutine')}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <Button
                    fullWidth
                    className="flex items-center justify-center gap-2"
                    onClick={() => handleOpenAssign(routine.id)}
                  >
                    <Users size={16} /> {t('therapist.routines.assignToPatient')}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )
      )}

      {assignmentsTab && (
        <div className="space-y-6">
          {routineAssignments.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-20 bg-surface-container-lowest rounded-2xl border-ghost">
              <Calendar size={64} className="text-outline-variant mb-4" />
              <p className="text-xl font-display font-bold text-on-surface">{t('therapist.routines.noAssignments')}</p>
              <p className="text-on-surface-variant mt-2 mb-6 text-center max-w-sm">
                {t('therapist.routines.noAssignmentsHint')}
              </p>
            </div>
          ) : (
            <>
              {activeAssignments.length > 0 && (
                <section>
                  <h2 className="font-display font-bold text-lg mb-3">{t('therapist.routines.activeSection')}</h2>
                  <div className="space-y-2">
                    {activeAssignments.map(a => <AssignmentRow key={a.id} a={a} />)}
                  </div>
                </section>
              )}
              {inactiveAssignments.length > 0 && (
                <section>
                  <h2 className="font-display font-bold text-lg mb-3 text-on-surface-variant">{t('therapist.routines.inactiveSection')}</h2>
                  <div className="space-y-2">
                    {inactiveAssignments.map(a => <AssignmentRow key={a.id} a={a} />)}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={t('therapist.routines.assignModalTitle')}>
        <div className="space-y-4 mb-6">
          <div>
            <label className="text-sm font-bold text-on-surface-variant mb-1 block">{t('therapist.routines.form.patient')}</label>
            <select
              value={selectedPatientId}
              onChange={e => setSelectedPatientId(e.target.value)}
              className="w-full bg-surface-container text-on-surface rounded-t-lg px-4 py-3 border-b-2 border-transparent outline-none focus:bg-surface-container-lowest focus:border-primary"
            >
              <option value="">{t('therapist.routines.form.selectPatient')}</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-bold text-on-surface-variant mb-1 block">{t('therapist.routines.form.startDate')}</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full bg-surface-container text-on-surface rounded-t-lg px-4 py-3 border-b-2 border-transparent outline-none focus:bg-surface-container-lowest focus:border-primary"
              />
            </div>
            <div>
              <label className="text-sm font-bold text-on-surface-variant mb-1 block">{t('therapist.routines.form.endDate')}</label>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full bg-surface-container text-on-surface rounded-t-lg px-4 py-3 border-b-2 border-transparent outline-none focus:bg-surface-container-lowest focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-bold text-on-surface-variant mb-1 block">{t('therapist.routines.form.frequency')}</label>
            <div className="flex gap-2">
              {(['DAILY', 'EVERY_OTHER_DAY', 'WEEKLY'] as AssignmentFrequency[]).map(f => (
                <button
                  key={f}
                  onClick={() => setFrequency(f)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-bold transition-colors border ${
                    frequency === f
                      ? 'bg-primary text-white border-primary'
                      : 'border-ghost text-on-surface-variant hover:border-primary hover:text-primary'
                  }`}
                >
                  {t(FREQUENCY_LABEL_KEYS[f])}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-4 justify-end">
          <Button variant="tertiary" onClick={() => setModalOpen(false)}>{t('common.cancel')}</Button>
          <Button
            onClick={handleConfirmAssign}
            disabled={!selectedPatientId || !startDate}
            className="flex items-center gap-2"
          >
            <Check size={16} /> {t('therapist.routines.confirmAssign')}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
