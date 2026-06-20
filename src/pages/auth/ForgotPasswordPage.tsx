import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authApi } from '../../services/auth.api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.recover(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.genericError'));
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
          <p className="text-on-surface-variant mt-1 font-body">{t('auth.forgotSubtitle')}</p>
        </div>

        {sent ? (
          <div className="bg-surface-container rounded-xl p-4 text-sm text-on-surface font-body space-y-3">
            <p>{t('auth.recoverSentMessage')}</p>
            <Link to="/login" className="text-primary font-bold hover:underline">{t('auth.backToLogin')}</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={t('auth.email')}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="usuario@ejemplo.com"
              required
            />

            {error && (
              <p className="text-sm text-error font-body bg-error-container/30 px-4 py-2 rounded-lg">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full mt-2" disabled={loading}>
              {loading ? t('auth.sending') : t('auth.sendInstructions')}
            </Button>

            <p className="text-center text-sm text-on-surface-variant font-body">
              <Link to="/login" className="text-primary font-bold hover:underline">{t('auth.backToLogin')}</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
