import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Mic, Square, ArrowRight, CheckCircle, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import type { Feedback } from '../../types';

const EMOTIONAL_OPTIONS: { value: Feedback['emotionalState']; labelKey: string; emoji: string }[] = [
  { value: 'GREAT',    labelKey: 'patient.emotions.great', emoji: '😄' },
  { value: 'GOOD',     labelKey: 'patient.emotions.good',  emoji: '🙂' },
  { value: 'OK',       labelKey: 'patient.emotions.ok',    emoji: '😐' },
  { value: 'BAD',      labelKey: 'patient.emotions.bad',   emoji: '😟' },
  { value: 'TERRIBLE', labelKey: 'patient.emotions.terrible', emoji: '😣' },
];

type RecordState = 'IDLE' | 'RECORDING' | 'PROCESSING' | 'DONE';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';

export function FeedbackView() {
  const { t } = useTranslation();
  const navigate        = useNavigate();
  const addFeedback     = useStore(state => state.addFeedback);
  const currentUserId   = useStore(state => state.currentUser);
  const token           = useStore(state => state.token);
  const routines        = useStore(state => state.routines);
  const authUser        = useStore(state => state.authUser);
  const giveAudioConsent = useStore(state => state.giveAudioConsent);
  const [showConsent, setShowConsent] = useState(false);

  const lastCompleted = routines
    .filter(r => r.patientId === currentUserId && r.completed)
    .at(-1);

  const [painLevel, setPainLevel]           = useState(5);
  const [emotionalState, setEmotionalState] = useState<Feedback['emotionalState']>('GOOD');
  const [recordState, setRecordState]       = useState<RecordState>('IDLE');
  const [, setAudioBlob]                    = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl]         = useState<string | null>(null);
  const [transcript, setTranscript]         = useState('');
  const [aiSummary, setAiSummary]           = useState('');
  const [audioRecordUrl, setAudioRecordUrl] = useState('');
  const [micError, setMicError]             = useState('');
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState('');

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
        setAudioBlob(blob);
        setPreviewUrl(URL.createObjectURL(blob));
        await processAudio(blob);
      };

      recorder.start();
      setRecordState('RECORDING');
    } catch {
      setMicError(t('patient.feedback.micError'));
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
    fd.append('audio', blob, 'feedback.webm');

    try {
      const res  = await fetch(`${BASE_URL}/feedback/audio`, {
        method:  'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body:    fd,
      });
      const json = await res.json();
      if (res.ok && json.data) {
        setAudioRecordUrl(json.data.audioUrl ?? '');
        setTranscript(json.data.transcript ?? '');
        setAiSummary(json.data.aiSummary ?? '');
      }
    } catch {

    } finally {
      setRecordState('DONE');
    }
  };

  const handleSubmit = async () => {
    if (!lastCompleted) return;
    setLoading(true);
    setError('');
    try {
      await addFeedback({
        routineId:      lastCompleted.id,
        patientId:      currentUserId!,
        painLevel,
        emotionalState,
        audioRecordUrl: audioRecordUrl || undefined,
        transcript:     transcript     || undefined,
        aiSummary:      aiSummary      || undefined,
      });
      navigate('/patient');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('patient.feedback.submitError'));
    } finally {
      setLoading(false);
    }
  };

  if (!lastCompleted) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <p className="text-on-surface-variant font-body">{t('patient.feedback.noRoutine')}</p>
        <Button className="mt-4" onClick={() => navigate('/patient')}>{t('patient.feedback.back')}</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <header>
        <h1 className="text-3xl font-display font-bold text-on-surface mb-2">{t('patient.feedback.sessionComplete')}</h1>
        <p className="text-on-surface-variant font-body mb-1">{t('patient.feedback.tellTherapist')}</p>
        <p className="text-xs text-primary font-bold">{lastCompleted.title}</p>
      </header>

      <Card className="space-y-4">
        <h2 className="text-lg font-display font-bold">{t('patient.feedback.howFeel')}</h2>
        <div className="flex justify-between">
          {EMOTIONAL_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setEmotionalState(opt.value)}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                emotionalState === opt.value ? 'bg-primary-container/30 scale-110' : 'hover:bg-surface-container'
              }`}
            >
              <span className="text-2xl">{opt.emoji}</span>
              <span className="text-[10px] font-bold text-on-surface-variant">{t(opt.labelKey)}</span>
            </button>
          ))}
        </div>
      </Card>

      <Card className="space-y-4">
        <h2 className="text-lg font-display font-bold">{t('patient.feedback.painLevel')}</h2>
        <p className="text-sm text-on-surface-variant">{t('patient.feedback.painQuestion')}</p>
        <div className="flex justify-between items-center px-2">
          <span className="text-sm font-bold text-secondary">{t('patient.feedback.painNone')}</span>
          <span className="text-sm font-bold text-error">{t('patient.feedback.painSevere')}</span>
        </div>
        <input
          type="range" min="1" max="10"
          value={painLevel}
          onChange={e => setPainLevel(parseInt(e.target.value))}
          className="w-full accent-primary bg-surface-container h-2 rounded-full outline-none appearance-none cursor-pointer"
        />
        <div className="text-center">
          <span className="text-4xl font-display font-bold text-primary">{painLevel}</span>
        </div>
      </Card>

      <Card level={2} className="space-y-4">
        <div>
          <h2 className="text-lg font-display font-bold">{t('patient.feedback.voiceNote')}</h2>
          <p className="text-sm text-on-surface-variant">{t('patient.feedback.voiceNoteDesc')}</p>
        </div>

        <div className="flex flex-col items-center gap-3 py-2">
          {recordState === 'IDLE' && (
            <button
              onClick={startRecording}
              className="w-20 h-20 rounded-full bg-primary text-white flex items-center justify-center shadow-ambient hover:scale-105 transition-transform"
            >
              <Mic size={36} />
            </button>
          )}
          {recordState === 'RECORDING' && (
            <button
              onClick={stopRecording}
              className="w-20 h-20 rounded-full bg-error text-white flex items-center justify-center shadow-ambient animate-pulse"
            >
              <Square size={36} />
            </button>
          )}
          {recordState === 'PROCESSING' && (
            <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center">
              <Loader2 size={36} className="text-primary animate-spin" />
            </div>
          )}
          {recordState === 'DONE' && (
            <div className="w-20 h-20 rounded-full bg-surface-container text-secondary flex items-center justify-center">
              <CheckCircle size={36} />
            </div>
          )}

          <p className="font-bold text-on-surface text-sm text-center">
            {recordState === 'IDLE'       && t('patient.feedback.recordIdle')}
            {recordState === 'RECORDING'  && t('patient.feedback.recordRecording')}
            {recordState === 'PROCESSING' && t('patient.feedback.recordProcessing')}
            {recordState === 'DONE'       && t('patient.feedback.recordDone')}
          </p>
        </div>

        {previewUrl && recordState === 'DONE' && (
          <audio controls src={previewUrl} className="w-full rounded-xl" />
        )}

        {recordState === 'DONE' && (transcript || aiSummary) && (
          <div className="space-y-2">
            {transcript && (
              <div className="bg-surface-container rounded-xl p-3">
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1">{t('patient.feedback.transcriptLabel')}</p>
                <p className="text-sm text-on-surface">{transcript}</p>
              </div>
            )}
            {aiSummary && (
              <div className="bg-primary/8 rounded-xl p-3 flex gap-2">
                <Sparkles size={16} className="text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-primary uppercase tracking-wide mb-1">{t('patient.feedback.clinicalSummaryLabel')}</p>
                  <p className="text-sm text-on-surface">{aiSummary}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {recordState === 'DONE' && !transcript && !aiSummary && (
          <p className="text-xs text-on-surface-variant text-center">
            {t('patient.feedback.aiUnavailable')}
          </p>
        )}

        {micError && (
          <div className="flex items-center gap-2 text-error text-sm">
            <AlertCircle size={16} /> {micError}
          </div>
        )}

        {recordState === 'DONE' && (
          <button
            onClick={() => { setRecordState('IDLE'); setPreviewUrl(null); setTranscript(''); setAiSummary(''); }}
            className="text-xs text-on-surface-variant hover:text-primary underline transition-colors w-full text-center"
          >
            {t('patient.feedback.recordAgain')}
          </button>
        )}
      </Card>

      {error && (
        <p className="text-sm text-error bg-error-container/30 px-4 py-2 rounded-lg">{error}</p>
      )}

      <Button
        fullWidth
        className="flex justify-center gap-2 items-center"
        onClick={handleSubmit}
        disabled={recordState === 'RECORDING' || recordState === 'PROCESSING' || loading}
      >
        {loading ? t('patient.feedback.sending') : t('patient.feedback.submit')} <ArrowRight size={20} />
      </Button>

      {showConsent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-sm space-y-4">
            <h2 className="text-lg font-display font-bold">{t('patient.feedback.consentTitle')}</h2>
            <p className="text-sm text-on-surface-variant">
              {t('patient.feedback.consentBody')}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowConsent(false)}
                className="flex-1 py-2.5 rounded-xl border border-surface-container-high text-sm hover:bg-surface-container transition-colors">
                {t('common.cancel')}
              </button>
              <Button onClick={acceptConsentAndRecord} className="flex-1">{t('patient.feedback.consentAccept')}</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
