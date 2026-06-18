import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

type Mode = 'login' | 'signup';

export function LoginPage() {
  const navigate = useNavigate();
  const login = useStore(state => state.login);
  const signup = useStore(state => state.signup);

  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function switchMode(next: Mode) {
    setMode(next);
    setError('');
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await signup(name, email, password);
      }
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-100px] left-[-100px] w-96 h-96 bg-primary-fixed-dim rounded-full mix-blend-multiply filter blur-3xl opacity-20 pointer-events-none" />
      <div className="absolute bottom-[-100px] right-[-100px] w-80 h-80 bg-secondary-fixed-dim rounded-full mix-blend-multiply filter blur-3xl opacity-20 pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4 shadow-ambient">
            <div className="w-7 h-7 rounded-full bg-white opacity-80" />
          </div>
          <h1 className="text-3xl font-display font-bold text-on-surface">FisioManager</h1>
          <p className="text-on-surface-variant mt-1 font-body">
            {mode === 'login' ? 'Inicia sesión para continuar' : 'Crea tu cuenta de paciente'}
          </p>
        </div>

        {}
        <div className="flex gap-1 bg-surface-container-low rounded-2xl p-1 mb-6">
          {(['login', 'signup'] as Mode[]).map(m => (
            <button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${
                mode === m ? 'bg-primary text-white shadow-ambient' : 'text-on-surface-variant hover:bg-surface-variant'
              }`}
            >
              {m === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <Input
              label="Nombre completo"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Tu nombre"
              required
            />
          )}
          <Input
            label="Correo electrónico"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="usuario@ejemplo.com"
            required
          />
          <Input
            label="Contraseña"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          {error && (
            <p className="text-sm text-error font-body bg-error-container/30 px-4 py-2 rounded-lg">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full mt-2" disabled={loading}>
            {loading
              ? (mode === 'login' ? 'Ingresando...' : 'Creando cuenta...')
              : (mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta')}
          </Button>
        </form>

        {mode === 'login' && (
          <div className="mt-8 p-4 bg-surface-container rounded-xl border-ghost text-xs text-on-surface-variant font-body space-y-1">
            <p className="font-bold text-on-surface mb-2">Cuentas de prueba:</p>
            <p>👩‍⚕️ sarah@fisiomanager.com / therapist123</p>
            <p>🧑 michael@fisiomanager.com / patient123</p>
            <p>👩 elena@fisiomanager.com / patient123</p>
          </div>
        )}
      </div>
    </div>
  );
}
