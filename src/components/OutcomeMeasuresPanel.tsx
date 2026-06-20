import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Activity, Plus, Trash2 } from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { BodyMap } from './BodyMap';
import {
  metricsApi, type OutcomeMeasure, type OutcomeType, type PainPoint, type PainPointInput,
} from '../services/metrics.api';

const OUTCOME_TYPES: OutcomeType[] = ['ROM', 'STRENGTH', 'FUNCTIONAL', 'VAS'];

export function OutcomeMeasuresPanel({ patientId }: { patientId: string }) {
  const { t } = useTranslation();
  const typeLabel = (type: OutcomeType) => t(`shared.outcomes.types.${type}`);
  const [measures, setMeasures] = useState<OutcomeMeasure[]>([]);
  const [painPoints, setPainPoints] = useState<PainPoint[]>([]);
  const [type, setType] = useState<OutcomeType>('ROM');
  const [form, setForm] = useState({ label: '', value: '', unit: '' });
  const [error, setError] = useState('');

  function load() {
    metricsApi.listOutcomes(patientId).then(setMeasures).catch(() => {});
    metricsApi.listPainPoints(patientId).then(setPainPoints).catch(() => {});
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [patientId]);

  async function addMeasure() {
    if (!form.value) { setError(t('shared.outcomes.enterValue')); return; }
    setError('');
    try {
      await metricsApi.createOutcome({
        patientId, type,
        label: form.label || undefined,
        value: Number(form.value),
        unit: form.unit || undefined,
      });
      setForm({ label: '', value: '', unit: '' });
      load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function removeMeasure(id: string) {
    await metricsApi.deleteOutcome(id).catch(() => {});
    load();
  }

  const chartData = measures
    .filter(m => m.type === type)
    .map(m => ({
      date: new Date(m.measuredAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }),
      value: m.value,
    }));

  const latestByZone = new Map<string, PainPointInput>();
  for (const p of painPoints) {
    const k = `${p.bodyPart}_${p.side ?? 'CENTER'}`;
    if (!latestByZone.has(k)) latestByZone.set(k, { bodyPart: p.bodyPart, side: p.side, intensity: p.intensity });
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-4 border-ghost">
        <div className="flex items-center gap-2">
          <Activity size={18} className="text-primary" />
          <h3 className="font-display font-bold">{t('shared.outcomes.title')}</h3>
        </div>

        <div className="flex gap-1 bg-surface-container-low rounded-2xl p-1 w-fit flex-wrap">
          {OUTCOME_TYPES.map(ot => (
            <button key={ot} onClick={() => setType(ot)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                type === ot ? 'bg-primary text-white' : 'text-on-surface-variant hover:bg-surface-variant'
              }`}>
              {typeLabel(ot)}
            </button>
          ))}
        </div>

        {chartData.length > 0 ? (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="date" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="var(--color-primary, #6750a4)" strokeWidth={2} dot />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm text-on-surface-variant text-center py-6">{t('shared.outcomes.noMeasurements', { type: typeLabel(type) })}</p>
        )}

        <div className="flex flex-wrap gap-2 items-center border-t border-surface-container-high pt-3">
          <input className="bg-surface-container rounded-lg px-3 py-2 text-sm flex-1 min-w-32" placeholder={t('shared.outcomes.labelPlaceholder')}
            value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} />
          <input className="bg-surface-container rounded-lg px-3 py-2 text-sm w-24" placeholder={t('shared.outcomes.valuePlaceholder')} type="number"
            value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} />
          <input className="bg-surface-container rounded-lg px-3 py-2 text-sm w-24" placeholder={t('shared.outcomes.unitPlaceholder')}
            value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} />
          <Button onClick={addMeasure} className="px-3 py-2 text-sm flex items-center gap-1"><Plus size={15} /> {t('shared.outcomes.record')}</Button>
        </div>
        {error && <p className="text-sm text-error">{error}</p>}

        {measures.filter(m => m.type === type).length > 0 && (
          <div className="space-y-1">
            {measures.filter(m => m.type === type).slice().reverse().map(m => (
              <div key={m.id} className="flex items-center justify-between text-sm border-b border-surface-container last:border-0 py-1.5">
                <span>{m.label ?? typeLabel(m.type)}: <b>{m.value}{m.unit ? ` ${m.unit}` : ''}</b></span>
                <span className="flex items-center gap-3">
                  <span className="text-xs text-on-surface-variant">{new Date(m.measuredAt).toLocaleDateString('es-MX')}</span>
                  <button onClick={() => removeMeasure(m.id)} className="text-on-surface-variant hover:text-error"><Trash2 size={14} /></button>
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {latestByZone.size > 0 && (
        <Card className="space-y-3 border-ghost">
          <h3 className="font-display font-bold">{t('shared.outcomes.painMapTitle')}</h3>
          <BodyMap value={[...latestByZone.values()]} onChange={() => {}} readOnly />
        </Card>
      )}
    </div>
  );
}
