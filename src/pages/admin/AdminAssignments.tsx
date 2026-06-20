import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Stethoscope, Check } from 'lucide-react';
import { adminApi } from '../../services/admin.api';
import type { Therapist } from '../../types';

type PatientRow = {
  id: string; name: string; email: string;
  patientProfile?: { age: number; condition: string; therapistId: string } | null;
};

export function AdminAssignments() {
  const { t } = useTranslation();
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [assignments, setAssignments] = useState<Record<string, string>>({});

  useEffect(() => {
    Promise.all([
      adminApi.getPatients(),
      adminApi.getTherapists(),
    ]).then(([pats, thers]) => {
      setPatients(pats as PatientRow[]);
      setTherapists(thers);
      const initial: Record<string, string> = {};
      (pats as PatientRow[]).forEach(p => {
        initial[p.id] = p.patientProfile?.therapistId ?? '';
      });
      setAssignments(initial);
    });
  }, []);

  async function handleAssign(patientId: string, therapistId: string) {
    setSaving(s => ({ ...s, [patientId]: true }));
    setSaved(s => ({ ...s, [patientId]: false }));
    try {
      await adminApi.assignPatient(patientId, therapistId);
      setAssignments(a => ({ ...a, [patientId]: therapistId }));
      setPatients(prev => prev.map(p =>
        p.id === patientId
          ? { ...p, patientProfile: p.patientProfile ? { ...p.patientProfile, therapistId } : { age: 0, condition: '', therapistId } }
          : p
      ));
      setSaved(s => ({ ...s, [patientId]: true }));
      setTimeout(() => setSaved(s => ({ ...s, [patientId]: false })), 2000);
    } finally {
      setSaving(s => ({ ...s, [patientId]: false }));
    }
  }

  const therapistName = (id: string) => therapists.find(t => t.id === id)?.name ?? t('admin.assignments.unassigned');

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold">{t('admin.assignments.title')}</h1>
        <p className="text-on-surface-variant">{t('admin.assignments.subtitle')}</p>
      </div>

      {patients.length === 0 && (
        <div className="bg-surface-container rounded-2xl p-12 text-center text-on-surface-variant">
          {t('admin.assignments.empty')}
        </div>
      )}

      <div className="space-y-3">
        {patients.map(p => {
          const currentTherapistId = assignments[p.id] ?? '';
          return (
            <div key={p.id} className="bg-surface-container rounded-2xl p-5 flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center shrink-0">
                  <User size={18} className="text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold truncate">{p.name}</p>
                  <p className="text-xs text-on-surface-variant truncate">{p.email}</p>
                  {p.patientProfile?.condition && (
                    <p className="text-xs text-on-surface-variant">{p.patientProfile.condition}</p>
                  )}
                </div>
              </div>

              <div className="text-on-surface-variant text-xl hidden sm:block">→</div>

              <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center shrink-0">
                  <Stethoscope size={14} className="text-on-surface-variant" />
                </div>
                <select
                  value={currentTherapistId}
                  onChange={e => handleAssign(p.id, e.target.value)}
                  disabled={saving[p.id]}
                  className="flex-1 bg-surface border border-surface-container-high rounded-xl px-3 py-2 text-sm disabled:opacity-60"
                >
                  <option value="">{t('admin.assignments.unassigned')}</option>
                  {therapists.map(th => (
                    <option key={th.id} value={th.id}>{th.name}</option>
                  ))}
                </select>

                {saved[p.id] && (
                  <div className="flex items-center gap-1 text-xs text-primary shrink-0">
                    <Check size={14} /> {t('admin.assignments.saved')}
                  </div>
                )}
                {saving[p.id] && (
                  <span className="text-xs text-on-surface-variant shrink-0">{t('admin.assignments.saving')}</span>
                )}
              </div>

              {currentTherapistId && (
                <p className="text-xs text-on-surface-variant w-full sm:w-auto">
                  {t('admin.assignments.current')} <span className="text-on-surface font-medium">{therapistName(currentTherapistId)}</span>
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
