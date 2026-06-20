import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../../services/auth.api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      await authApi.reset(token, password);
      navigate('/login', { replace: true });
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
          <p className="text-on-surface-variant mt-1 font-body">Establece tu nueva contraseña</p>
        </div>

        {!token ? (
          <div className="bg-error-container/30 rounded-xl p-4 text-sm text-error font-body space-y-3">
            <p>El enlace de recuperación no es válido. Solicita uno nuevo.</p>
            <Link to="/forgot-password" className="text-primary font-bold hover:underline">Solicitar enlace</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nueva contraseña"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
            <Input
              label="Confirmar contraseña"
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />

            {error && (
              <p className="text-sm text-error font-body bg-error-container/30 px-4 py-2 rounded-lg">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full mt-2" disabled={loading}>
              {loading ? 'Guardando...' : 'Restablecer contraseña'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
