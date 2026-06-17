import { useEffect, useState } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { FileText, Stethoscope, NotebookPen, Plus, CheckCircle2, RotateCcw, Loader2 } from 'lucide-react';
import {
  clinicalHistoryApi,
  type ClinicalHistory,
  type Diagnosis,
} from '../services/clinicalHistory.api';

type SubTab = 'historial' | 'diagnosticos' | 'notas';

const inputCls =
  'w-full px-4 py-2.5 rounded-xl bg-surface-container border border-outline-variant/40 text-sm ' +
  'text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function ClinicalHistorySection({ patientId }: { patientId: string }) {
  const [history, setHistory] = useState<ClinicalHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<SubTab>('historial');

  // Form historial
  const [bloodType, setBloodType]   = useState('');
  const [allergies, setAllergies]   = useState('');
  const [background, setBackground] = useState('');
  const [savingInfo, setSavingInfo] = useState(false);

  // Form diagnóstico
  const [cie10, setCie10]           = useState('');
  const [dxDesc, setDxDesc]         = useState('');
  const [addingDx, setAddingDx]     = useState(false);

  // Form nota
  const [noteText, setNoteText]     = useState('');
  const [addingNote, setAddingNote] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    clinicalHistoryApi
      .get(patientId)
      .then(h => {
        if (!active) return;
        setHistory(h);
        if (h) {
          setBloodType(h.bloodType ?? '');
          setAllergies(h.allergies ?? '');
          setBackground(h.background ?? '');
        }
      })
      .catch(e => active && setError(e.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [patientId]);

  async function saveInfo() {
    setSavingInfo(true);
    setError('');
    try {
      const updated = await clinicalHistoryApi.upsert(patientId, { bloodType, allergies, background });
      setHistory(prev => ({ ...updated, diagnoses: prev?.diagnoses ?? updated.diagnoses, notes: prev?.notes ?? updated.notes }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSavingInfo(false);
    }
  }

  async function addDiagnosis() {
    if (!cie10.trim() || !dxDesc.trim() || !history) return;
    setAddingDx(true);
    try {
      const dx = await clinicalHistoryApi.addDiagnosis(history.id, { cie10Code: cie10.trim(), description: dxDesc.trim() });
      setHistory({ ...history, diagnoses: [dx, ...history.diagnoses] });
      setCie10(''); setDxDesc('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setAddingDx(false);
    }
  }

  async function toggleDx(dx: Diagnosis) {
    if (!history) return;
    const next = dx.status === 'ACTIVE' ? 'RESOLVED' : 'ACTIVE';
    try {
      const updated = await clinicalHistoryApi.updateDiagnosis(dx.id, { status: next });
      setHistory({ ...history, diagnoses: history.diagnoses.map(d => (d.id === dx.id ? updated : d)) });
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function addNote() {
    if (!noteText.trim() || !history) return;
    setAddingNote(true);
    try {
      const note = await clinicalHistoryApi.addNote(history.id, noteText.trim());
      setHistory({ ...history, notes: [note, ...history.notes] });
      setNoteText('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setAddingNote(false);
    }
  }

  if (loading) {
    return (
      <Card className="flex items-center justify-center py-12 border-ghost">
        <Loader2 className="animate-spin text-primary" />
      </Card>
    );
  }

  // Sin historial todavía → ofrecer crearlo.
  if (!history) {
    return (
      <Card className="space-y-4 border-ghost">
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-primary" />
          <h3 className="font-display font-bold">Crear historial clínico</h3>
        </div>
        <p className="text-sm text-on-surface-variant">Este paciente aún no tiene historial clínico. Crea uno para registrar diagnósticos y notas.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input className={inputCls} placeholder="Tipo de sangre (ej. O+)" value={bloodType} onChange={e => setBloodType(e.target.value)} />
          <input className={inputCls} placeholder="Alergias" value={allergies} onChange={e => setAllergies(e.target.value)} />
          <input className={inputCls} placeholder="Antecedentes" value={background} onChange={e => setBackground(e.target.value)} />
        </div>
        {error && <p className="text-sm text-error">{error}</p>}
        <Button onClick={saveInfo} disabled={savingInfo}>{savingInfo ? 'Creando…' : 'Crear historial'}</Button>
      </Card>
    );
  }

  const TABS: { key: SubTab; label: string; icon: typeof FileText }[] = [
    { key: 'historial',    label: 'Historial',    icon: FileText },
    { key: 'diagnosticos', label: 'Diagnósticos', icon: Stethoscope },
    { key: 'notas',        label: 'Notas',        icon: NotebookPen },
  ];

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 bg-surface-container-low rounded-2xl p-1 w-fit">
        {TABS.map(t => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                active ? 'bg-primary text-white shadow-ambient' : 'text-on-surface-variant hover:bg-surface-variant'
              }`}
            >
              <Icon size={15} />
              {t.label}
              {t.key === 'diagnosticos' && history.diagnoses.length > 0 && (
                <span className={`text-[10px] px-1.5 rounded-full ${active ? 'bg-white/25' : 'bg-primary/10 text-primary'}`}>{history.diagnoses.length}</span>
              )}
              {t.key === 'notas' && history.notes.length > 0 && (
                <span className={`text-[10px] px-1.5 rounded-full ${active ? 'bg-white/25' : 'bg-primary/10 text-primary'}`}>{history.notes.length}</span>
              )}
            </button>
          );
        })}
      </div>

      {error && <p className="text-sm text-error">{error}</p>}

      {/* Historial general */}
      {tab === 'historial' && (
        <Card className="space-y-4 border-ghost">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">Tipo de sangre</label>
              <input className={`${inputCls} mt-1`} value={bloodType} onChange={e => setBloodType(e.target.value)} placeholder="—" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">Alergias</label>
              <input className={`${inputCls} mt-1`} value={allergies} onChange={e => setAllergies(e.target.value)} placeholder="—" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">Antecedentes</label>
              <input className={`${inputCls} mt-1`} value={background} onChange={e => setBackground(e.target.value)} placeholder="—" />
            </div>
          </div>
          <Button onClick={saveInfo} disabled={savingInfo}>{savingInfo ? 'Guardando…' : 'Guardar cambios'}</Button>
        </Card>
      )}

      {/* Diagnósticos */}
      {tab === 'diagnosticos' && (
        <div className="space-y-4">
          <Card className="space-y-3 border-ghost">
            <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">Agregar diagnóstico (CIE-10)</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input className={`${inputCls} sm:w-40`} placeholder="Código (ej. M17.1)" value={cie10} onChange={e => setCie10(e.target.value)} />
              <input className={`${inputCls} flex-1`} placeholder="Descripción del diagnóstico" value={dxDesc} onChange={e => setDxDesc(e.target.value)} />
              <Button onClick={addDiagnosis} disabled={addingDx} className="flex items-center gap-1.5">
                <Plus size={16} /> {addingDx ? '…' : 'Agregar'}
              </Button>
            </div>
          </Card>

          {history.diagnoses.length === 0 ? (
            <Card level={2} className="py-8 text-center border-ghost">
              <Stethoscope size={28} className="text-outline-variant mx-auto mb-2" />
              <p className="text-sm text-on-surface-variant">Sin diagnósticos registrados.</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {history.diagnoses.map(dx => (
                <Card key={dx.id} level={2} className="flex items-center gap-3 border-ghost py-3">
                  <span className="font-mono text-xs font-bold bg-primary/10 text-primary px-2 py-1 rounded-lg">{dx.cie10Code}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold truncate ${dx.status === 'RESOLVED' ? 'line-through text-on-surface-variant' : 'text-on-surface'}`}>{dx.description}</p>
                    <p className="text-xs text-on-surface-variant">{formatDate(dx.createdAt)}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${dx.status === 'ACTIVE' ? 'bg-tertiary/15 text-tertiary' : 'bg-secondary/15 text-secondary'}`}>
                    {dx.status === 'ACTIVE' ? 'Activo' : 'Resuelto'}
                  </span>
                  <button onClick={() => toggleDx(dx)} title={dx.status === 'ACTIVE' ? 'Marcar resuelto' : 'Reactivar'} className="text-on-surface-variant hover:text-primary transition-colors">
                    {dx.status === 'ACTIVE' ? <CheckCircle2 size={18} /> : <RotateCcw size={16} />}
                  </button>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Notas */}
      {tab === 'notas' && (
        <div className="space-y-4">
          <Card className="space-y-3 border-ghost">
            <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">Nueva nota clínica</p>
            <textarea className={`${inputCls} min-h-[80px] resize-y`} placeholder="Escribe una nota de seguimiento…" value={noteText} onChange={e => setNoteText(e.target.value)} />
            <Button onClick={addNote} disabled={addingNote} className="flex items-center gap-1.5">
              <Plus size={16} /> {addingNote ? 'Guardando…' : 'Agregar nota'}
            </Button>
          </Card>

          {history.notes.length === 0 ? (
            <Card level={2} className="py-8 text-center border-ghost">
              <NotebookPen size={28} className="text-outline-variant mx-auto mb-2" />
              <p className="text-sm text-on-surface-variant">Sin notas registradas.</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {history.notes.map(n => (
                <Card key={n.id} level={2} className="border-ghost space-y-1">
                  <p className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap">{n.content}</p>
                  <p className="text-xs text-on-surface-variant">
                    {n.author?.name ?? 'Profesional'} · {formatDate(n.createdAt)}
                  </p>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
