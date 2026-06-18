import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ArrowLeft, Activity, CheckCircle2, PlayCircle, Mic, Sparkles, AlertTriangle, LayoutDashboard, ClipboardList, FileDown } from 'lucide-react';
import type { Feedback } from '../../types';
import { ClinicalHistorySection } from '../../components/ClinicalHistorySection';
import { TreatmentPlanSection } from '../../components/TreatmentPlanSection';
import { reportApi } from '../../services/report.api';
import { resolveUploadUrl } from '../../utils/url';

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '') ?? 'http://localhost:3001';

const EMOTION_MAP: Record<Feedback['emotionalState'], { emoji: string; label: string }> = {
  GREAT:    { emoji: '😄', label: 'Excelente' },
  GOOD:     { emoji: '🙂', label: 'Bien' },
  OK:       { emoji: '😐', label: 'Regular' },
  BAD:      { emoji: '😟', label: 'Mal' },
  TERRIBLE: { emoji: '😣', label: 'Terrible' },
};

function PainBar({ value }: { value: number }) {
  const color = value >= 8 ? 'bg-error' : value >= 5 ? 'bg-tertiary' : 'bg-secondary';
  return (
    <div className="flex-1 flex flex-col items-center group relative">
      <span className="text-[9px] font-bold text-on-surface-variant opacity-0 group-hover:opacity-100 absolute -top-4 transition-opacity">
        {value}
      </span>
      <div className="w-full rounded-t-sm bg-surface-container-high h-12 flex items-end overflow-hidden">
        <div className={`w-full ${color} opacity-75 group-hover:opacity-100 transition-all rounded-t-sm`}
          style={{ height: `${(value / 10) * 100}%` }} />
      </div>
    </div>
  );
}

export function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [mainTab, setMainTab] = useState<'resumen' | 'clinico' | 'plan'>('resumen');
  const [downloading, setDownloading] = useState(false);

  async function handleDownloadReport() {
    setDownloading(true);
    try {
      await reportApi.downloadPatientProgress(id!);
    } finally {
      setDownloading(false);
    }
  }

  const patients = useStore(state => state.patients);
  const allRoutines = useStore(state => state.routines);
  const allFeedbacks = useStore(state => state.feedbacks);

  const patient = patients.find(p => p.id === id);
  const routines = allRoutines
    .filter(r => r.patientId === id)
    .sort((a, b) => new Date(b.assignedDate ?? 0).getTime() - new Date(a.assignedDate ?? 0).getTime());
  const feedbacks = allFeedbacks
    .filter(f => f.patientId === id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const activeRoutines = routines.filter(r => !r.completed);
  const completedRoutines = routines.filter(r => r.completed);
  const lastFeedbacks = [...feedbacks].reverse().slice(-10);

  const avgPain = feedbacks.length
    ? Math.round((feedbacks.reduce((s, f) => s + f.painLevel, 0) / feedbacks.length) * 10) / 10
    : null;

  const last5 = feedbacks.slice(0, 5);
  const highPainCount = last5.filter(f => f.painLevel >= 7).length;
  const latestPainHigh = feedbacks[0]?.painLevel >= 7;
  const recurringHighPain = highPainCount >= 3;
  const showAlert = latestPainHigh || recurringHighPain;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <p className="text-on-surface-variant mb-4">Paciente no encontrado.</p>
        <Button onClick={() => navigate('/therapist/patients')}>Volver</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {}
      <div>
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/therapist/patients')}
            className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary transition-colors"
          >
            <ArrowLeft size={16} /> Todos los pacientes
          </button>
          <Button onClick={handleDownloadReport} disabled={downloading} className="flex items-center gap-2 py-2 px-3 text-sm">
            <FileDown size={16} /> {downloading ? 'Generando…' : 'Descargar reporte PDF'}
          </Button>
        </div>

        <Card className="flex items-center gap-6 border-ghost">
          <img
            src={resolveUploadUrl(patient.avatarUrl) ?? `https://i.pravatar.cc/100?u=${patient.id}`}
            alt={patient.name}
            className="w-20 h-20 rounded-2xl flex-shrink-0"
          />
          <div className="flex-1">
            <h1 className="text-2xl font-display font-bold text-on-surface">{patient.name}</h1>
            <p className="text-on-surface-variant">{patient.condition}</p>
            <div className="flex gap-4 mt-3">
              <div className="text-center">
                <p className="text-xl font-display font-bold text-primary">{routines.length}</p>
                <p className="text-xs text-on-surface-variant uppercase tracking-wide font-bold">Rutinas</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-display font-bold text-secondary">{completedRoutines.length}</p>
                <p className="text-xs text-on-surface-variant uppercase tracking-wide font-bold">Completadas</p>
              </div>
              <div className="text-center">
                <p className={`text-xl font-display font-bold ${avgPain && avgPain >= 7 ? 'text-error' : 'text-tertiary'}`}>
                  {avgPain ?? '—'}
                </p>
                <p className="text-xs text-on-surface-variant uppercase tracking-wide font-bold">Dolor Prom.</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {showAlert && (
        <div className="flex items-start gap-3 bg-error/10 border border-error/30 rounded-2xl p-4">
          <AlertTriangle size={20} className="text-error shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm text-error">
              {recurringHighPain
                ? `Dolor elevado recurrente — ${highPainCount} de los últimos ${last5.length} reportes ≥ 7`
                : `Último reporte con dolor elevado — ${feedbacks[0].painLevel}/10`}
            </p>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Se recomienda revisar el plan de tratamiento o contactar al paciente.
            </p>
          </div>
        </div>
      )}

      {}
      <div className="flex gap-1 bg-surface-container-low rounded-2xl p-1 w-fit">
        <button
          onClick={() => setMainTab('resumen')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
            mainTab === 'resumen' ? 'bg-primary text-white shadow-ambient' : 'text-on-surface-variant hover:bg-surface-variant'
          }`}
        >
          <LayoutDashboard size={15} /> Resumen
        </button>
        <button
          onClick={() => setMainTab('clinico')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
            mainTab === 'clinico' ? 'bg-primary text-white shadow-ambient' : 'text-on-surface-variant hover:bg-surface-variant'
          }`}
        >
          <ClipboardList size={15} /> Historial Clínico
        </button>
        <button
          onClick={() => setMainTab('plan')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
            mainTab === 'plan' ? 'bg-primary text-white shadow-ambient' : 'text-on-surface-variant hover:bg-surface-variant'
          }`}
        >
          <ClipboardList size={15} /> Plan de Tratamiento
        </button>
      </div>

      {mainTab === 'clinico' && <ClinicalHistorySection patientId={id!} />}
      {mainTab === 'plan' && <TreatmentPlanSection patientId={id!} />}

      {mainTab === 'resumen' && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {}
        <div className="space-y-4">
          <h2 className="text-lg font-display font-bold">Rutinas Asignadas</h2>

          {activeRoutines.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-primary">Activas</p>
              {activeRoutines.map(r => (
                <Card key={r.id} level={2} className="flex items-center gap-3 border-ghost py-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <PlayCircle size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-on-surface truncate">{r.title}</p>
                    <p className="text-xs text-on-surface-variant">{r.activities.length} actividades</p>
                  </div>
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    {r.type}
                  </span>
                </Card>
              ))}
            </div>
          )}

          {completedRoutines.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Completadas</p>
              {completedRoutines.slice(0, 5).map(r => (
                <Card key={r.id} level={2} className="flex items-center gap-3 border-ghost py-3 opacity-60">
                  <div className="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
                    <CheckCircle2 size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-on-surface truncate">{r.title}</p>
                    <p className="text-xs text-on-surface-variant">{r.activities.length} actividades</p>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {routines.length === 0 && (
            <Card level={2} className="py-8 text-center border-ghost">
              <Activity size={32} className="text-outline-variant mx-auto mb-2" />
              <p className="text-sm text-on-surface-variant">Sin rutinas asignadas.</p>
            </Card>
          )}
        </div>

        {}
        <div className="space-y-4">
          <h2 className="text-lg font-display font-bold">Historial de Feedback</h2>

          {lastFeedbacks.length > 0 && (
            <Card className="space-y-2 border-ghost">
              <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wide mb-2">
                Tendencia de Dolor
              </p>
              <div className="flex items-end gap-1 h-12">
                {lastFeedbacks.map(f => <PainBar key={f.id} value={f.painLevel} />)}
              </div>
            </Card>
          )}

          {feedbacks.length === 0 ? (
            <Card level={2} className="py-8 text-center border-ghost">
              <p className="text-sm text-on-surface-variant">Sin feedback registrado.</p>
            </Card>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {feedbacks.map(fb => {
                const emo = EMOTION_MAP[fb.emotionalState];
                return (
                  <Card key={fb.id} level={2} className="border-ghost space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{emo.emoji}</span>
                      <div className="flex-1">
                        <p className="font-bold text-sm">{emo.label}</p>
                        <p className="text-xs text-on-surface-variant">{formatDate(fb.date)}</p>
                      </div>
                      <p className={`text-lg font-display font-bold ${fb.painLevel >= 8 ? 'text-error' : fb.painLevel >= 5 ? 'text-tertiary' : 'text-secondary'}`}>
                        {fb.painLevel}/10
                      </p>
                    </div>
                    {fb.audioRecordUrl && (
                      <div className="space-y-1.5">
                        <p className="flex items-center gap-1.5 text-xs font-bold text-on-surface-variant">
                          <Mic size={12} /> Nota de voz
                        </p>
                        <audio controls src={`${BACKEND_URL}${fb.audioRecordUrl}`} className="w-full h-8" />
                      </div>
                    )}
                    {fb.transcript && (
                      <div className="bg-surface-container rounded-xl p-3">
                        <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1">Transcript</p>
                        <p className="text-xs text-on-surface leading-relaxed">{fb.transcript}</p>
                      </div>
                    )}
                    {fb.aiSummary && (
                      <div className="bg-primary/8 rounded-xl p-3 flex gap-2">
                        <Sparkles size={14} className="text-primary shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-primary uppercase tracking-wide mb-1">Resumen clínico IA</p>
                          <p className="text-xs text-on-surface leading-relaxed">{fb.aiSummary}</p>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
