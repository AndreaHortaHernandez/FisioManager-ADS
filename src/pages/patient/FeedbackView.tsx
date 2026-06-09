import { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Mic, ArrowRight, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import type { Feedback } from '../../types';

const EMOTIONAL_OPTIONS: { value: Feedback['emotionalState']; label: string; emoji: string }[] = [
  { value: 'GREAT', label: 'Excelente', emoji: '😄' },
  { value: 'GOOD', label: 'Bien', emoji: '🙂' },
  { value: 'OK', label: 'Regular', emoji: '😐' },
  { value: 'BAD', label: 'Mal', emoji: '😟' },
  { value: 'TERRIBLE', label: 'Terrible', emoji: '😣' },
];

export function FeedbackView() {
  const navigate = useNavigate();
  const addFeedback = useStore(state => state.addFeedback);
  const currentUserId = useStore(state => state.currentUser);
  const routines = useStore(state => state.routines);

  const lastCompleted = routines
    .filter(r => r.patientId === currentUserId && r.completed)
    .at(-1);

  const [painLevel, setPainLevel] = useState<number>(5);
  const [emotionalState, setEmotionalState] = useState<Feedback['emotionalState']>('GOOD');
  const [recordingState, setRecordingState] = useState<'IDLE' | 'RECORDING' | 'DONE'>('IDLE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRecord = () => {
    if (recordingState === 'IDLE') {
      setRecordingState('RECORDING');
      setTimeout(() => setRecordingState('DONE'), 3000);
    }
  };

  const handleSubmit = async () => {
    if (!lastCompleted) return;
    setLoading(true);
    setError('');
    try {
      await addFeedback({
        routineId: lastCompleted.id,
        patientId: currentUserId!,
        painLevel,
        emotionalState,
      });
      navigate('/patient');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar feedback');
    } finally {
      setLoading(false);
    }
  };

  if (!lastCompleted) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <p className="text-on-surface-variant font-body">Completa una rutina primero para dejar feedback.</p>
        <Button className="mt-4" onClick={() => navigate('/patient')}>Volver</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <header>
        <h1 className="text-3xl font-display font-bold text-on-surface mb-2">¡Sesión Completada!</h1>
        <p className="text-on-surface-variant font-body mb-1">Cuéntale a tu terapeuta cómo te sentiste.</p>
        <p className="text-xs text-primary font-bold">{lastCompleted.title}</p>
      </header>

      {/* Estado emocional */}
      <Card className="space-y-4">
        <h2 className="text-lg font-display font-bold text-on-surface">¿Cómo te sientes?</h2>
        <div className="flex justify-between">
          {EMOTIONAL_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setEmotionalState(opt.value)}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                emotionalState === opt.value
                  ? 'bg-primary-container/30 scale-110'
                  : 'hover:bg-surface-container'
              }`}
            >
              <span className="text-2xl">{opt.emoji}</span>
              <span className="text-[10px] font-bold text-on-surface-variant">{opt.label}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Nivel de dolor */}
      <Card className="space-y-4">
        <div>
          <h2 className="text-lg font-display font-bold text-on-surface mb-1">Nivel de Dolor</h2>
          <p className="text-sm text-on-surface-variant mb-4">Del 1 al 10, ¿cuánto dolor sentiste?</p>

          <div className="flex justify-between items-center mb-2 px-2">
            <span className="text-sm font-bold text-secondary">1 (Ninguno)</span>
            <span className="text-sm font-bold text-error">10 (Severo)</span>
          </div>

          <input
            type="range"
            min="1" max="10"
            value={painLevel}
            onChange={(e) => setPainLevel(parseInt(e.target.value))}
            className="w-full accent-primary bg-surface-container h-2 rounded-full outline-none appearance-none cursor-pointer"
          />
          <div className="text-center mt-4">
            <span className="text-4xl font-display font-bold text-primary">{painLevel}</span>
          </div>
        </div>
      </Card>

      {/* Nota de voz (simulada) */}
      <Card level={2} className="space-y-6">
        <div>
          <h2 className="text-lg font-display font-bold text-on-surface mb-1">Cuéntanos más</h2>
          <p className="text-sm text-on-surface-variant mb-6">Graba un mensaje de audio sobre tu sesión.</p>

          <div className="flex flex-col items-center justify-center space-y-4 py-4">
            <button
              onClick={handleRecord}
              disabled={recordingState === 'DONE'}
              className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-ambient ${
                recordingState === 'IDLE' ? 'bg-primary text-white hover:scale-105' :
                recordingState === 'RECORDING' ? 'bg-error text-white animate-pulse shadow-error/50' :
                'bg-surface-container text-primary cursor-not-allowed'
              }`}
            >
              {recordingState === 'DONE' ? <CheckCircle size={40} /> : <Mic size={40} />}
            </button>

            <p className="font-bold text-on-surface">
              {recordingState === 'IDLE' && 'Toca para grabar'}
              {recordingState === 'RECORDING' && 'Grabando...'}
              {recordingState === 'DONE' && 'Audio guardado'}
            </p>
          </div>
        </div>
      </Card>

      {error && (
        <p className="text-sm text-error bg-error-container/30 px-4 py-2 rounded-lg">{error}</p>
      )}

      <Button
        fullWidth
        className="flex justify-center gap-2 items-center"
        onClick={handleSubmit}
        disabled={recordingState === 'RECORDING' || loading}
      >
        {loading ? 'Enviando...' : 'Enviar Feedback'} <ArrowRight size={20} />
      </Button>
    </div>
  );
}
