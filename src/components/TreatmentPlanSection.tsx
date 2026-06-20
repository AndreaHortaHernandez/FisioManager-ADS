import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { ClipboardList, Plus, Loader2, Layers, Link2, ChevronDown, ChevronUp } from 'lucide-react';
import {
  treatmentPlanApi, type TreatmentPlan, type PlanStatus,
} from '../services/treatmentPlan.api';
import { routineAssignmentsApi } from '../services/routineAssignments.api';
import type { RoutineAssignment } from '../types';

const inputCls =
  'w-full px-4 py-2.5 rounded-xl bg-surface-container border border-outline-variant/40 text-sm ' +
  'text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40';

const PLAN_STATUSES: PlanStatus[] = ['ACTIVE', 'COMPLETED', 'SUSPENDED'];

function formatDate(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function TreatmentPlanSection({ patientId }: { patientId: string }) {
  const { t } = useTranslation();
  const [plans, setPlans] = useState<TreatmentPlan[]>([]);
  const [unassigned, setUnassigned] = useState<RoutineAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const [showPlanForm, setShowPlanForm] = useState(false);
  const [planForm, setPlanForm] = useState({ name: '', clinicalGoal: '', startDate: '', endDate: '' });
  const [savingPlan, setSavingPlan] = useState(false);

  const [phaseForms, setPhaseForms] = useState<Record<string, { name: string; order: string; durationWeeks: string; objectives: string }>>({});
  const [savingPhase, setSavingPhase] = useState<string | null>(null);

  function load() {
    setLoading(true);
    Promise.all([
      treatmentPlanApi.getByPatient(patientId),
      routineAssignmentsApi.getByPatient(patientId),
    ])
      .then(([p, assignments]) => {
        setPlans(p);
        setUnassigned(assignments.filter(a => !a.phaseId));
      })
      .catch(e => setError((e as Error).message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [patientId]);

  async function createPlan() {
    if (!planForm.name.trim() || !planForm.startDate) return;
    setSavingPlan(true);
    setError('');
    try {
      const created = await treatmentPlanApi.create(patientId, {
        name: planForm.name.trim(),
        clinicalGoal: planForm.clinicalGoal || undefined,
        startDate: planForm.startDate,
        endDate: planForm.endDate || undefined,
      });
      setPlans(prev => [created, ...prev]);
      setShowPlanForm(false);
      setPlanForm({ name: '', clinicalGoal: '', startDate: '', endDate: '' });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSavingPlan(false);
    }
  }

  async function changeStatus(plan: TreatmentPlan, status: PlanStatus) {
    try {
      const updated = await treatmentPlanApi.update(plan.id, { status });
      setPlans(prev => prev.map(p => (p.id === plan.id ? { ...updated, phases: p.phases } : p)));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function phaseFormFor(planId: string) {
    return phaseForms[planId] ?? { name: '', order: String((plans.find(p => p.id === planId)?.phases.length ?? 0) + 1), durationWeeks: '2', objectives: '' };
  }

  async function addPhase(planId: string) {
    const f = phaseFormFor(planId);
    if (!f.name.trim()) return;
    setSavingPhase(planId);
    setError('');
    try {
      const phase = await treatmentPlanApi.addPhase(planId, {
        name: f.name.trim(),
        order: parseInt(f.order) || 1,
        durationWeeks: parseInt(f.durationWeeks) || 1,
        objectives: f.objectives || undefined,
      });
      setPlans(prev => prev.map(p => (p.id === planId ? { ...p, phases: [...p.phases, { ...phase, assignments: [] }].sort((a, b) => a.order - b.order) } : p)));
      setPhaseForms(prev => ({ ...prev, [planId]: { name: '', order: String(f.order ? parseInt(f.order) + 1 : 1), durationWeeks: '2', objectives: '' } }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSavingPhase(null);
    }
  }

  async function attachAssignment(planId: string, phaseId: string, assignmentId: string) {
    if (!assignmentId) return;
    try {
      await routineAssignmentsApi.updatePhase(assignmentId, phaseId);
      const assignment = unassigned.find(a => a.id === assignmentId);
      setUnassigned(prev => prev.filter(a => a.id !== assignmentId));
      setPlans(prev => prev.map(p => (
        p.id !== planId ? p : {
          ...p,
          phases: p.phases.map(ph => ph.id !== phaseId ? ph : {
            ...ph,
            assignments: [...ph.assignments, { id: assignmentId, routine: assignment?.routine, patient: assignment?.patient, status: assignment?.status ?? 'ACTIVE' }],
          }),
        }
      )));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  if (loading) {
    return (
      <Card className="flex items-center justify-center py-12 border-ghost">
        <Loader2 className="animate-spin text-primary" />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList size={18} className="text-primary" />
          <h3 className="font-display font-bold">{t('shared.treatmentPlan.title')}</h3>
        </div>
        <Button onClick={() => setShowPlanForm(v => !v)} className="flex items-center gap-1.5 py-2 px-3 text-sm">
          <Plus size={15} /> {t('shared.treatmentPlan.newPlan')}
        </Button>
      </div>

      {error && <p className="text-sm text-error">{error}</p>}

      {showPlanForm && (
        <Card className="space-y-3 border-ghost">
          <input className={inputCls} placeholder={t('shared.treatmentPlan.planNamePlaceholder')} value={planForm.name}
            onChange={e => setPlanForm(f => ({ ...f, name: e.target.value }))} />
          <input className={inputCls} placeholder={t('shared.treatmentPlan.clinicalGoalPlaceholder')} value={planForm.clinicalGoal}
            onChange={e => setPlanForm(f => ({ ...f, clinicalGoal: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-on-surface-variant">{t('shared.treatmentPlan.startDate')}</label>
              <input type="date" className={inputCls} value={planForm.startDate}
                onChange={e => setPlanForm(f => ({ ...f, startDate: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-on-surface-variant">{t('shared.treatmentPlan.endDate')}</label>
              <input type="date" className={inputCls} value={planForm.endDate}
                onChange={e => setPlanForm(f => ({ ...f, endDate: e.target.value }))} />
            </div>
          </div>
          <Button onClick={createPlan} disabled={savingPlan || !planForm.name.trim() || !planForm.startDate}>
            {savingPlan ? t('shared.treatmentPlan.creating') : t('shared.treatmentPlan.createPlan')}
          </Button>
        </Card>
      )}

      {plans.length === 0 && !showPlanForm && (
        <Card level={2} className="py-8 text-center border-ghost">
          <Layers size={28} className="text-outline-variant mx-auto mb-2" />
          <p className="text-sm text-on-surface-variant">{t('shared.treatmentPlan.empty')}</p>
        </Card>
      )}

      <div className="space-y-3">
        {plans.map(plan => {
          const isOpen = expanded === plan.id;
          const pf = phaseFormFor(plan.id);
          return (
            <Card key={plan.id} className="border-ghost space-y-3">
              <button onClick={() => setExpanded(isOpen ? null : plan.id)} className="w-full flex items-center justify-between text-left">
                <div>
                  <p className="font-bold text-on-surface">{plan.name}</p>
                  <p className="text-xs text-on-surface-variant">
                    {plan.clinicalGoal ?? t('shared.treatmentPlan.noClinicalGoal')} · {formatDate(plan.startDate)} — {formatDate(plan.endDate)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select value={plan.status} onClick={e => e.stopPropagation()}
                    onChange={e => changeStatus(plan, e.target.value as PlanStatus)}
                    className="text-xs font-bold bg-surface-container-high rounded-full px-2 py-1">
                    {PLAN_STATUSES.map(s => <option key={s} value={s}>{t(`shared.treatmentPlan.status.${s}`)}</option>)}
                  </select>
                  {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </button>

              {isOpen && (
                <div className="space-y-3 pt-2 border-t border-surface-container-high">
                  {plan.phases.sort((a, b) => a.order - b.order).map(phase => (
                    <Card key={phase.id} level={2} className="border-ghost space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-sm">{phase.order}. {phase.name}</p>
                        <span className="text-xs text-on-surface-variant">{t('shared.treatmentPlan.weeksShort', { count: phase.durationWeeks })}</span>
                      </div>
                      {phase.objectives && <p className="text-xs text-on-surface-variant">{phase.objectives}</p>}

                      {phase.assignments.length > 0 && (
                        <div className="space-y-1">
                          {phase.assignments.map(a => (
                            <p key={a.id} className="text-xs flex items-center gap-1.5 text-on-surface">
                              <Link2 size={11} className="text-primary" /> {a.routine?.title ?? t('shared.treatmentPlan.routine')}
                            </p>
                          ))}
                        </div>
                      )}

                      {unassigned.length > 0 && (
                        <select defaultValue="" onChange={e => attachAssignment(plan.id, phase.id, e.target.value)}
                          className="text-xs bg-surface-container border border-surface-container-high rounded-lg px-2 py-1.5 w-full">
                          <option value="">{t('shared.treatmentPlan.linkRoutine')}</option>
                          {unassigned.map(a => <option key={a.id} value={a.id}>{a.routine?.title ?? a.id}</option>)}
                        </select>
                      )}
                    </Card>
                  ))}

                  <div className="flex flex-col sm:flex-row gap-2">
                    <input className={`${inputCls} flex-1`} placeholder={t('shared.treatmentPlan.phaseNamePlaceholder')} value={pf.name}
                      onChange={e => setPhaseForms(prev => ({ ...prev, [plan.id]: { ...pf, name: e.target.value } }))} />
                    <input className={`${inputCls} sm:w-24`} type="number" min="1" placeholder={t('shared.treatmentPlan.orderPlaceholder')} value={pf.order}
                      onChange={e => setPhaseForms(prev => ({ ...prev, [plan.id]: { ...pf, order: e.target.value } }))} />
                    <input className={`${inputCls} sm:w-28`} type="number" min="1" placeholder={t('shared.treatmentPlan.weeksPlaceholder')} value={pf.durationWeeks}
                      onChange={e => setPhaseForms(prev => ({ ...prev, [plan.id]: { ...pf, durationWeeks: e.target.value } }))} />
                    <Button onClick={() => addPhase(plan.id)} disabled={savingPhase === plan.id || !pf.name.trim()} className="py-2 px-3 text-sm whitespace-nowrap">
                      <Plus size={15} />
                    </Button>
                  </div>
                  <input className={inputCls} placeholder={t('shared.treatmentPlan.phaseObjectivesPlaceholder')} value={pf.objectives}
                    onChange={e => setPhaseForms(prev => ({ ...prev, [plan.id]: { ...pf, objectives: e.target.value } }))} />
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
