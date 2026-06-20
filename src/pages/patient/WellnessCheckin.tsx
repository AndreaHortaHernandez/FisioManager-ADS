import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Mic, Square, CheckCircle, Loader2, ArrowRight, AlertCircle, Phone, Heart, BookOpen } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { BodyMap } from '../../components/BodyMap';
import type { PainPointInput } from '../../services/metrics.api';
import type { Feedback } from '../../types';

type EmotionOption = { value: Feedback['emotionalState']; labelKey: string; emoji: string; color: string };

const EMOTIONS: EmotionOption[] = [
  { value: 'GREAT',    labelKey: 'patient.emotions.great', emoji: '😄', color: 'bg-secondary/10 border-secondary/30 text-secondary' },
  { value: 'GOOD',     labelKey: 'patient.emotions.good',  emoji: '🙂', color: 'bg-primary/10 border-primary/30 text-primary' },
  { value: 'OK',       labelKey: 'patient.emotions.ok',    emoji: '😐', color: 'bg-tertiary/10 border-tertiary/30 text-tertiary' },
  { value: 'BAD',      labelKey: 'patient.emotions.bad',   emoji: '😟', color: 'bg-error/10 border-error/30 text-error' },
];

const RESOURCES = [
  { icon: Phone, titleKey: 'patient.checkin.resourceSupportLine', descKey: 'patient.checkin.resourceSupportLineDesc', color: 'text-secondary' },
  { icon: Heart, titleKey: 'patient.checkin.resourceBreathing', descKey: 'patient.checkin.resourceBreathingDesc', color: 'text-primary' },
  { icon: BookOpen, titleKey: 'patient.checkin.resourceGratitude', descKey: 'patient.checkin.resourceGratitudeDesc', color: 'text-tertiary' },
];

type RecordState = 'IDLE' | 'RECORDING' | 'PROCESSING' | 'DONE';
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';

export function WellnessCheckin() {
  const { t } = useTranslation();
  const navigate         = useNavigate();
  const addFeedback      = useStore(state => state.addFeedback);
  const currentUserId    = useStore(state => state.currentUser);
  const token            = useStore(state => state.token);
  const authUser         = useStore(state => state.authUser);
  const giveAudioConsent = useStore(state => state.giveAudioConsent);
  const [showConsent, setShowConsent] = useState(false);

  const [emotion, setEmotion]         = useState<Feedback['emotionalState']>('GOOD');
  const [discomfort, setDiscomfort]   = useState(3);
  const [painPoints, setPainPoints]   = useState<PainPointInput[]>([]);
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
    if (!authUser?.audioConsentAt) {
      setShowConsent(true);
      return;
    }
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
      setMicError(t('patient.checkin.micError'));
    }
  };

  const acceptConsentAndRecord = async () => {
    await giveAudioConsent();
    setShowConsent(false);
    startRecording();
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
        painPoints:     painPoints.length > 0 ? painPoints : undefined,
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('patient.checkin.saveError'));
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
        <h2 className="text-2xl font-display font-bold text-on-surface">{t('patient.checkin.savedTitle')}</h2>
        <p className="text-on-surface-variant text-sm">{t('patient.checkin.savedDesc')}</p>
        <Button onClick={() => navigate('/patient')}>{t('patient.checkin.backHome')}</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <header>
        <h1 className="text-3xl font-display font-bold text-on-surface mb-1">{t('patient.checkin.title')}</h1>
        <p className="text-on-surface-variant font-body text-sm">{t('patient.checkin.subtitle')}</p>
      </header>

      <Card className="space-y-4">
        <h2 className="text-lg font-display font-bold">{t('patient.checkin.howFeelNow')}</h2>
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
              <span className="text-sm font-bold">{t(opt.labelKey)}</span>
            </button>
          ))}
        </div>
      </Card>

      <Card className="space-y-4">
        <h2 className="text-lg font-display font-bold">{t('patient.checkin.discomfortLevel')}</h2>
        <p className="text-sm text-on-surface-variant">{t('patient.checkin.discomfortRange')}</p>
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

      <Card className="space-y-4">
        <h2 className="text-lg font-display font-bold">{t('patient.checkin.whereHurts')}</h2>
        <p className="text-sm text-on-surface-variant">{t('patient.checkin.whereHurtsDesc')}</p>
        <BodyMap value={painPoints} onChange={setPainPoints} />
      </Card>

      <Card level={2} className="space-y-4">
        <h2 className="text-lg font-display font-bold">{t('patient.checkin.personalDiary')}</h2>
        <p className="text-sm text-on-surface-variant">{t('patient.checkin.personalDiaryDesc')}</p>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={4}
          placeholder={t('patient.checkin.diaryPlaceholder')}
          className="w-full bg-surface-container rounded-xl p-3 text-sm text-on-surface resize-none outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-on-surface-variant/50"
        />

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
            {recordState === 'IDLE'       && t('patient.checkin.recordIdle')}
            {recordState === 'RECORDING'  && t('patient.checkin.recordRecording')}
            {recordState === 'PROCESSING' && t('patient.checkin.recordProcessing')}
            {recordState === 'DONE'       && t('patient.checkin.recordDone')}
          </p>
          {micError && (
            <p className="flex items-center gap-1 text-xs text-error">
              <AlertCircle size={12} /> {micError}
            </p>
          )}
        </div>
      </Card>

      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant">{t('patient.checkin.supportResources')}</h2>
        {RESOURCES.map(r => {
          const Icon = r.icon;
          return (
            <Card key={r.titleKey} level={2} className="flex items-start gap-4 border-ghost py-3">
              <div className={`w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center shrink-0 ${r.color}`}>
                <Icon size={20} />
              </div>
              <div>
                <p className="font-bold text-on-surface text-sm">{t(r.titleKey)}</p>
                <p className="text-xs text-on-surface-variant mt-0.5">{t(r.descKey)}</p>
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
        {loading ? t('patient.checkin.saving') : t('patient.checkin.saveCheckin')} <ArrowRight size={20} />
      </Button>

      {showConsent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-sm space-y-4">
            <h2 className="text-lg font-display font-bold">{t('patient.checkin.consentTitle')}</h2>
            <p className="text-sm text-on-surface-variant">
              {t('patient.checkin.consentBody')}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowConsent(false)}
                className="flex-1 py-2.5 rounded-xl border border-surface-container-high text-sm hover:bg-surface-container transition-colors">
                {t('common.cancel')}
              </button>
              <Button onClick={acceptConsentAndRecord} className="flex-1">{t('patient.checkin.consentAccept')}</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
