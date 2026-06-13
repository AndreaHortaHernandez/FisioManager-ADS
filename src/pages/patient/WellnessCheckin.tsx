import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Mic, Square, CheckCircle, Loader2, ArrowRight, AlertCircle, Phone, Heart, BookOpen } from 'lucide-react';
import { useStore } from '../../store/useStore';
import type { Feedback } from '../../types';

type EmotionOption = { value: Feedback['emotionalState']; label: string; emoji: string; color: string };

const EMOTIONS: EmotionOption[] = [
  { value: 'GREAT',    label: 'Excelente', emoji: '😄', color: 'bg-secondary/10 border-secondary/30 text-secondary' },
  { value: 'GOOD',     label: 'Bien',      emoji: '🙂', color: 'bg-primary/10 border-primary/30 text-primary' },
  { value: 'OK',       label: 'Regular',   emoji: '😐', color: 'bg-tertiary/10 border-tertiary/30 text-tertiary' },
  { value: 'BAD',      label: 'Mal',       emoji: '😟', color: 'bg-error/10 border-error/30 text-error' },
];

const RESOURCES = [
  { icon: Phone, title: 'Línea de apoyo emocional', desc: 'SAPTEL: 55 5259-8121 — 24 horas, todos los días.', color: 'text-secondary' },
  { icon: Heart, title: 'Respiración de emergencia', desc: 'Inhala 4s, sostén 4s, exhala 6s. Repite 5 veces.', color: 'text-primary' },
  { icon: BookOpen, title: 'Diario de gratitud', desc: 'Escribe 3 cosas por las que estés agradecido hoy.', color: 'text-tertiary' },
];

type RecordState = 'IDLE' | 'RECORDING' | 'PROCESSING' | 'DONE';
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';

export function WellnessCheckin() {
  const navigate       = useNavigate();
  const addFeedback    = useStore(state => state.addFeedback);
  const currentUserId  = useStore(state => state.currentUser);
  const token          = useStore(state => state.token);

  const [emotion, setEmotion]         = useState<Feedback['emotionalState']>('GOOD');
  const [discomfort, setDiscomfort]   = useState(3);
  const [notes, setNotes]             = useState('');
  const [recordState, setRecordState] = useState<RecordState>('IDLE');
  const [transcript, setTranscript]   = useState('');
  const [audioUrl, setAudioUrl]       = useState('');
  const [micError, setMicError]       = useState('');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [done, setDone]               = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef        = useRef<Blob[]>([]);

  const startRecording = async () => {
    setMicError('');
    chunksRef.current = [];
    try {
      const stream   = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await processAudio(blob);
      };
      recorder.start();
      setRecordState('RECORDING');
    } catch {
      setMicError('No se pudo acceder al micrófono.');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecordState('PROCESSING');
  };

  const processAudio = async (blob: Blob) => {
    const fd = new FormData();
    fd.append('audio', blob, 'wellness.webm');
    try {
      const res  = await fetch(`${BASE_URL}/feedback/audio`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      const json = await res.json();
      if (res.ok && json.data) {
        setAudioUrl(json.data.audioUrl ?? '');
        setTranscript(json.data.transcript ?? '');
        if (json.data.transcript) setNotes(prev => prev ? `${prev}\n${json.data.transcript}` : json.data.transcript);
      }
    } catch {
      // silently ignore AI failures
    } finally {
      setRecordState('DONE');
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      await addFeedback({
        patientId:      currentUserId!,
        painLevel:      discomfort,
        emotionalState: emotion,
        audioRecordUrl: audioUrl  || undefined,
        transcript:     transcript || notes || undefined,
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-6 animate-fade-in text-center">
        <div className="w-20 h-20 rounded-full bg-secondary/20 flex items-center justify-center">
          <CheckCircle size={44} className="text-secondary" />
        </div>
        <h2 className="text-2xl font-display font-bold text-on-surface">¡Registrado!</h2>
        <p className="text-on-surface-variant text-sm">Tu check-in de bienestar ha sido guardado.</p>
        <Button onClick={() => navigate('/patient')}>Volver al inicio</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <header>
        <h1 className="text-3xl font-display font-bold text-on-surface mb-1">Check-in de Bienestar</h1>
        <p className="text-on-surface-variant font-body text-sm">¿Cómo estás hoy? Tómate un momento.</p>
      </header>

      {/* 2x2 emotional state grid */}
      <Card className="space-y-4">
        <h2 className="text-lg font-display font-bold">¿Cómo te sientes ahora?</h2>
        <div className="grid grid-cols-2 gap-3">
          {EMOTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setEmotion(opt.value)}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                emotion === opt.value
                  ? `${opt.color} border-current scale-[1.03] shadow-ambient`
                  : 'border-surface-container-high hover:bg-surface-container'
              }`}
            >
              <span className="text-3xl">{opt.emoji}</span>
              <span className="text-sm font-bold">{opt.label}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Discomfort level */}
      <Card className="space-y-4">
        <h2 className="text-lg font-display font-bold">Nivel de malestar</h2>
        <p className="text-sm text-on-surface-variant">Del 1 (ninguno) al 10 (severo).</p>
        <input
          type="range" min="1" max="10"
          value={discomfort}
          onChange={e => setDiscomfort(parseInt(e.target.value))}
          className="w-full accent-primary bg-surface-container h-2 rounded-full outline-none appearance-none cursor-pointer"
        />
        <div className="text-center">
          <span className="text-4xl font-display font-bold text-primary">{discomfort}</span>
        </div>
      </Card>

      {/* Journal textarea */}
      <Card level={2} className="space-y-4">
        <h2 className="text-lg font-display font-bold">Diario personal</h2>
        <p className="text-sm text-on-surface-variant">Escribe cómo te sientes o graba una nota de voz.</p>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={4}
          placeholder="Hoy me siento…"
          className="w-full bg-surface-container rounded-xl p-3 text-sm text-on-surface resize-none outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-on-surface-variant/50"
        />

        {/* Voice recording */}
        <div className="flex flex-col items-center gap-3 py-2">
          {recordState === 'IDLE' && (
            <button
              onClick={startRecording}
              className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center shadow-ambient hover:scale-105 transition-transform"
            >
              <Mic size={28} />
            </button>
          )}
          {recordState === 'RECORDING' && (
            <button
              onClick={stopRecording}
              className="w-16 h-16 rounded-full bg-error text-white flex items-center justify-center shadow-ambient animate-pulse"
            >
              <Square size={28} />
            </button>
          )}
          {recordState === 'PROCESSING' && (
            <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center">
              <Loader2 size={28} className="text-primary animate-spin" />
            </div>
          )}
          {recordState === 'DONE' && (
            <div className="w-16 h-16 rounded-full bg-secondary/10 text-secondary flex items-center justify-center">
              <CheckCircle size={28} />
            </div>
          )}
          <p className="text-xs text-on-surface-variant text-center">
            {recordState === 'IDLE'       && 'Toca el micrófono para grabar una nota de voz'}
            {recordState === 'RECORDING'  && 'Grabando… toca para detener'}
            {recordState === 'PROCESSING' && 'Transcribiendo con IA…'}
            {recordState === 'DONE'       && 'Nota de voz añadida al diario'}
          </p>
          {micError && (
            <p className="flex items-center gap-1 text-xs text-error">
              <AlertCircle size={12} /> {micError}
            </p>
          )}
        </div>
      </Card>

      {/* Support resources */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant">Recursos de apoyo</h2>
        {RESOURCES.map(r => {
          const Icon = r.icon;
          return (
            <Card key={r.title} level={2} className="flex items-start gap-4 border-ghost py-3">
              <div className={`w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center shrink-0 ${r.color}`}>
                <Icon size={20} />
              </div>
              <div>
                <p className="font-bold text-on-surface text-sm">{r.title}</p>
                <p className="text-xs text-on-surface-variant mt-0.5">{r.desc}</p>
              </div>
            </Card>
          );
        })}
      </section>

      {error && (
        <p className="text-sm text-error bg-error-container/30 px-4 py-2 rounded-lg">{error}</p>
      )}

      <Button
        fullWidth
        className="flex justify-center gap-2 items-center"
        onClick={handleSubmit}
        disabled={recordState === 'RECORDING' || recordState === 'PROCESSING' || loading}
      >
        {loading ? 'Guardando...' : 'Guardar check-in'} <ArrowRight size={20} />
      </Button>
    </div>
  );
}
