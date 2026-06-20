import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { FileText, Stethoscope, NotebookPen, Plus, CheckCircle2, RotateCcw, Loader2, Eye, EyeOff, Paperclip, Upload, Trash2, Download } from 'lucide-react';
import {
  clinicalHistoryApi,
  type ClinicalHistory,
  type Diagnosis,
  type ClinicalNote,
  type ClinicalDocument,
} from '../services/clinicalHistory.api';
import { resolveUploadUrl } from '../utils/url';

type SubTab = 'historial' | 'diagnosticos' | 'notas' | 'documentos';

const DOC_CATEGORY_CODES = ['XRAY', 'LAB', 'CONSENT', 'REPORT', 'OTHER'];

const inputCls =
  'w-full px-4 py-2.5 rounded-xl bg-surface-container border border-outline-variant/40 text-sm ' +
  'text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function ClinicalHistorySection({ patientId }: { patientId: string }) {
  const { t } = useTranslation();
  const docCategoryLabel = (code: string) =>
    DOC_CATEGORY_CODES.includes(code) ? t(`shared.clinicalHistory.docCategories.${code}`) : code;
  const [history, setHistory] = useState<ClinicalHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<SubTab>('historial');

  const [bloodType, setBloodType]   = useState('');
  const [allergies, setAllergies]   = useState('');
  const [background, setBackground] = useState('');
  const [savingInfo, setSavingInfo] = useState(false);

  const [cie10, setCie10]           = useState('');
  const [dxDesc, setDxDesc]         = useState('');
  const [addingDx, setAddingDx]     = useState(false);

  const [noteText, setNoteText]     = useState('');
  const [noteVisible, setNoteVisible] = useState(false);
  const [addingNote, setAddingNote] = useState(false);

  const [documents, setDocuments]   = useState<ClinicalDocument[]>([]);
  const [docCategory, setDocCategory] = useState('OTHER');
  const [docVisible, setDocVisible] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);

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
    clinicalHistoryApi.listDocuments(patientId).then(d => active && setDocuments(d)).catch(() => {});
    return () => { active = false; };
  }, [patientId]);

  async function uploadDoc(file: File) {
    setUploadingDoc(true);
    setError('');
    try {
      const doc = await clinicalHistoryApi.uploadDocument(patientId, file, docCategory, docVisible);
      setDocuments(prev => [doc, ...prev]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploadingDoc(false);
    }
  }

  async function deleteDoc(id: string) {
    try {
      await clinicalHistoryApi.deleteDocument(id);
      setDocuments(prev => prev.filter(d => d.id !== id));
    } catch (e) {
      setError((e as Error).message);
    }
  }

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
      const note = await clinicalHistoryApi.addNote(history.id, noteText.trim(), noteVisible);
      setHistory({ ...history, notes: [note, ...history.notes] });
      setNoteText('');
      setNoteVisible(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setAddingNote(false);
    }
  }

  async function toggleNoteVisibility(note: ClinicalNote) {
    if (!history) return;
    try {
      const updated = await clinicalHistoryApi.updateNoteVisibility(note.id, !note.isVisible);
      setHistory({ ...history, notes: history.notes.map(n => (n.id === note.id ? updated : n)) });
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

  if (!history) {
    return (
      <Card className="space-y-4 border-ghost">
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-primary" />
          <h3 className="font-display font-bold">{t('shared.clinicalHistory.createTitle')}</h3>
        </div>
        <p className="text-sm text-on-surface-variant">{t('shared.clinicalHistory.createDescription')}</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input className={inputCls} placeholder={t('shared.clinicalHistory.bloodTypePlaceholder')} value={bloodType} onChange={e => setBloodType(e.target.value)} />
          <input className={inputCls} placeholder={t('shared.clinicalHistory.allergies')} value={allergies} onChange={e => setAllergies(e.target.value)} />
          <input className={inputCls} placeholder={t('shared.clinicalHistory.background')} value={background} onChange={e => setBackground(e.target.value)} />
        </div>
        {error && <p className="text-sm text-error">{error}</p>}
        <Button onClick={saveInfo} disabled={savingInfo}>{savingInfo ? t('shared.clinicalHistory.creating') : t('shared.clinicalHistory.createButton')}</Button>
      </Card>
    );
  }

  const TABS: { key: SubTab; label: string; icon: typeof FileText }[] = [
    { key: 'historial',    label: t('shared.clinicalHistory.tabs.history'),     icon: FileText },
    { key: 'diagnosticos', label: t('shared.clinicalHistory.tabs.diagnoses'),   icon: Stethoscope },
    { key: 'notas',        label: t('shared.clinicalHistory.tabs.notes'),       icon: NotebookPen },
    { key: 'documentos',   label: t('shared.clinicalHistory.tabs.documents'),   icon: Paperclip },
  ];

  return (
    <div className="space-y-4">
      {}
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

      {}
      {tab === 'historial' && (
        <Card className="space-y-4 border-ghost">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">{t('shared.clinicalHistory.bloodType')}</label>
              <input className={`${inputCls} mt-1`} value={bloodType} onChange={e => setBloodType(e.target.value)} placeholder="—" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">{t('shared.clinicalHistory.allergies')}</label>
              <input className={`${inputCls} mt-1`} value={allergies} onChange={e => setAllergies(e.target.value)} placeholder="—" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">{t('shared.clinicalHistory.background')}</label>
              <input className={`${inputCls} mt-1`} value={background} onChange={e => setBackground(e.target.value)} placeholder="—" />
            </div>
          </div>
          <Button onClick={saveInfo} disabled={savingInfo}>{savingInfo ? t('shared.clinicalHistory.saving') : t('shared.clinicalHistory.saveChanges')}</Button>
        </Card>
      )}

      {}
      {tab === 'diagnosticos' && (
        <div className="space-y-4">
          <Card className="space-y-3 border-ghost">
            <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">{t('shared.clinicalHistory.addDiagnosis')}</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input className={`${inputCls} sm:w-40`} placeholder={t('shared.clinicalHistory.codePlaceholder')} value={cie10} onChange={e => setCie10(e.target.value)} />
              <input className={`${inputCls} flex-1`} placeholder={t('shared.clinicalHistory.diagnosisDescPlaceholder')} value={dxDesc} onChange={e => setDxDesc(e.target.value)} />
              <Button onClick={addDiagnosis} disabled={addingDx} className="flex items-center gap-1.5">
                <Plus size={16} /> {addingDx ? '…' : t('shared.clinicalHistory.add')}
              </Button>
            </div>
          </Card>

          {history.diagnoses.length === 0 ? (
            <Card level={2} className="py-8 text-center border-ghost">
              <Stethoscope size={28} className="text-outline-variant mx-auto mb-2" />
              <p className="text-sm text-on-surface-variant">{t('shared.clinicalHistory.noDiagnoses')}</p>
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
                    {dx.status === 'ACTIVE' ? t('shared.clinicalHistory.active') : t('shared.clinicalHistory.resolved')}
                  </span>
                  <button onClick={() => toggleDx(dx)} title={dx.status === 'ACTIVE' ? t('shared.clinicalHistory.markResolved') : t('shared.clinicalHistory.reactivate')} className="text-on-surface-variant hover:text-primary transition-colors">
                    {dx.status === 'ACTIVE' ? <CheckCircle2 size={18} /> : <RotateCcw size={16} />}
                  </button>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {}
      {tab === 'notas' && (
        <div className="space-y-4">
          <Card className="space-y-3 border-ghost">
            <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">{t('shared.clinicalHistory.newNote')}</p>
            <textarea className={`${inputCls} min-h-[80px] resize-y`} placeholder={t('shared.clinicalHistory.notePlaceholder')} value={noteText} onChange={e => setNoteText(e.target.value)} />
            <label className="flex items-center gap-2 cursor-pointer text-sm text-on-surface-variant">
              <input type="checkbox" checked={noteVisible} onChange={e => setNoteVisible(e.target.checked)} className="w-4 h-4 accent-primary" />
              {t('shared.clinicalHistory.visibleToPatient')}
            </label>
            <Button onClick={addNote} disabled={addingNote} className="flex items-center gap-1.5">
              <Plus size={16} /> {addingNote ? t('shared.clinicalHistory.saving') : t('shared.clinicalHistory.addNote')}
            </Button>
          </Card>

          {history.notes.length === 0 ? (
            <Card level={2} className="py-8 text-center border-ghost">
              <NotebookPen size={28} className="text-outline-variant mx-auto mb-2" />
              <p className="text-sm text-on-surface-variant">{t('shared.clinicalHistory.noNotes')}</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {history.notes.map(n => (
                <Card key={n.id} level={2} className="border-ghost space-y-1">
                  <p className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap">{n.content}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-on-surface-variant">
                      {n.author?.name ?? t('shared.clinicalHistory.professional')} · {formatDate(n.createdAt)}
                    </p>
                    <button onClick={() => toggleNoteVisibility(n)}
                      title={n.isVisible ? t('shared.clinicalHistory.visibleClickToHide') : t('shared.clinicalHistory.hiddenClickToShow')}
                      className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${
                        n.isVisible ? 'bg-secondary/15 text-secondary' : 'bg-surface-container-high text-on-surface-variant'
                      }`}>
                      {n.isVisible ? <Eye size={12} /> : <EyeOff size={12} />}
                      {n.isVisible ? t('shared.clinicalHistory.visible') : t('shared.clinicalHistory.hidden')}
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {}
      {tab === 'documentos' && (
        <div className="space-y-4">
          <Card className="space-y-3 border-ghost">
            <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">{t('shared.clinicalHistory.uploadDocument')}</p>
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <select className={`${inputCls} sm:w-48`} value={docCategory} onChange={e => setDocCategory(e.target.value)}>
                {DOC_CATEGORY_CODES.map(code => <option key={code} value={code}>{docCategoryLabel(code)}</option>)}
              </select>
              <label className="flex items-center gap-2 cursor-pointer text-sm text-on-surface-variant">
                <input type="checkbox" checked={docVisible} onChange={e => setDocVisible(e.target.checked)} className="w-4 h-4 accent-primary" />
                {t('shared.clinicalHistory.visibleToPatient')}
              </label>
              <label className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-bold cursor-pointer hover:opacity-90 transition-opacity w-fit">
                <Upload size={16} /> {uploadingDoc ? t('shared.clinicalHistory.uploading') : t('shared.clinicalHistory.chooseFile')}
                <input type="file" accept="image/*,application/pdf" className="hidden" disabled={uploadingDoc}
                  onChange={e => { const f = e.target.files?.[0]; if (f) uploadDoc(f); e.target.value = ''; }} />
              </label>
            </div>
          </Card>

          {documents.length === 0 ? (
            <Card level={2} className="py-8 text-center border-ghost">
              <Paperclip size={28} className="text-outline-variant mx-auto mb-2" />
              <p className="text-sm text-on-surface-variant">{t('shared.clinicalHistory.noDocuments')}</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {documents.map(d => (
                <Card key={d.id} level={2} className="flex items-center gap-3 border-ghost py-3">
                  <FileText size={18} className="text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{d.fileName}</p>
                    <p className="text-xs text-on-surface-variant">
                      {docCategoryLabel(d.category)} · {(d.sizeBytes / 1024).toFixed(0)} KB · {formatDate(d.createdAt)}
                      {d.isVisible && <span className="ml-1 text-secondary">· {t('shared.clinicalHistory.visibleTag')}</span>}
                    </p>
                  </div>
                  <a href={resolveUploadUrl(d.fileUrl)} target="_blank" rel="noopener noreferrer"
                    title={t('shared.clinicalHistory.download')} className="text-on-surface-variant hover:text-primary transition-colors">
                    <Download size={16} />
                  </a>
                  <button onClick={() => deleteDoc(d.id)} title={t('common.delete')} className="text-on-surface-variant hover:text-error transition-colors">
                    <Trash2 size={16} />
                  </button>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
