import { useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { CalendarClock, Check, Loader2 } from 'lucide-react';
import { availabilityApi } from '../../services/availability.api';

const DAYS = [
  { dow: 1, label: 'Lunes' },
  { dow: 2, label: 'Martes' },
  { dow: 3, label: 'Miércoles' },
  { dow: 4, label: 'Jueves' },
  { dow: 5, label: 'Viernes' },
  { dow: 6, label: 'Sábado' },
  { dow: 0, label: 'Domingo' },
];

interface DayState {
  enabled: boolean;
  startTime: string;
  endTime: string;
}

const inputCls =
  'px-3 py-2 rounded-xl bg-surface-container border border-outline-variant/40 text-sm ' +
  'text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-40';

export function SettingsView() {
  const authUser = useStore(state => state.authUser);
  const therapistId = authUser?.id ?? '';

  const [days, setDays] = useState<Record<number, DayState>>(() =>
    Object.fromEntries(DAYS.map(d => [d.dow, { enabled: false, startTime: '09:00', endTime: '17:00' }])),
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedOk, setSavedOk] = useState(false);

  useEffect(() => {
    if (!therapistId) return;
    let active = true;
    availabilityApi
      .get(therapistId)
      .then(slots => {
        if (!active) return;
        setDays(prev => {
          const next = { ...prev };
          slots.forEach(s => {
            next[s.dayOfWeek] = { enabled: true, startTime: s.startTime, endTime: s.endTime };
          });
          return next;
        });
      })
      .catch(e => active && setError((e as Error).message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [therapistId]);

  function update(dow: number, patch: Partial<DayState>) {
    setSavedOk(false);
    setDays(prev => ({ ...prev, [dow]: { ...prev[dow], ...patch } }));
  }

  async function save() {
    setSaving(true);
    setError('');
    setSavedOk(false);
    try {
      const slots = DAYS.filter(d => days[d.dow].enabled).map(d => ({
        dayOfWeek: d.dow,
        startTime: days[d.dow].startTime,
        endTime: days[d.dow].endTime,
      }));
      const invalid = slots.find(s => s.startTime >= s.endTime);
      if (invalid) throw new Error('La hora de inicio debe ser anterior a la de fin en todos los días activos.');

      await availabilityApi.set(therapistId, slots);
      setSavedOk(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-on-surface">Configuración</h1>
        <p className="text-on-surface-variant">Define tu horario de atención semanal.</p>
      </div>

      <Card className="space-y-4 border-ghost">
        <div className="flex items-center gap-2">
          <CalendarClock size={18} className="text-primary" />
          <h2 className="font-display font-bold">Horario disponible</h2>
        </div>
        <p className="text-sm text-on-surface-variant">
          Las citas solo podrán agendarse dentro de las franjas que actives aquí.
        </p>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-2">
            {DAYS.map(d => {
              const st = days[d.dow];
              return (
                <div key={d.dow} className="flex items-center gap-3 py-1.5">
                  <label className="flex items-center gap-2 w-32 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={st.enabled}
                      onChange={e => update(d.dow, { enabled: e.target.checked })}
                      className="w-4 h-4 accent-primary"
                    />
                    <span className={`text-sm font-bold ${st.enabled ? 'text-on-surface' : 'text-on-surface-variant'}`}>{d.label}</span>
                  </label>
                  <input
                    type="time"
                    value={st.startTime}
                    disabled={!st.enabled}
                    onChange={e => update(d.dow, { startTime: e.target.value })}
                    className={inputCls}
                  />
                  <span className="text-on-surface-variant text-sm">—</span>
                  <input
                    type="time"
                    value={st.endTime}
                    disabled={!st.enabled}
                    onChange={e => update(d.dow, { endTime: e.target.value })}
                    className={inputCls}
                  />
                </div>
              );
            })}
          </div>
        )}

        {error && <p className="text-sm text-error">{error}</p>}

        <div className="flex items-center gap-3 pt-2">
          <Button onClick={save} disabled={saving || loading}>
            {saving ? 'Guardando…' : 'Guardar horario'}
          </Button>
          {savedOk && (
            <span className="flex items-center gap-1 text-sm text-secondary font-bold">
              <Check size={16} /> Guardado
            </span>
          )}
        </div>
      </Card>
    </div>
  );
}
