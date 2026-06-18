import { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { KeyRound, Bell, Check, Loader2, ShieldCheck, UserCircle } from 'lucide-react';
import { authApi } from '../../services/auth.api';
import { notificationPreferenceApi, type NotificationPreference } from '../../services/notificationPreference.api';
import { useStore } from '../../store/useStore';
import { AvatarUploadField } from '../../components/AvatarUploadField';

const inputCls =
  'w-full px-3 py-2.5 rounded-xl bg-surface-container border border-outline-variant/40 text-sm ' +
  'text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40';

export function PatientSettings() {
  const authUser = useStore(state => state.authUser);
  const updateProfile = useStore(state => state.updateProfile);
  const uploadAvatar = useStore(state => state.uploadAvatar);

  const [phone, setPhone] = useState(authUser?.phone ?? '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileOk, setProfileOk] = useState(false);

  async function saveProfile() {
    setProfileSaving(true);
    setProfileError('');
    setProfileOk(false);
    try {
      await updateProfile({ phone: phone || undefined });
      setProfileOk(true);
    } catch (e) {
      setProfileError((e as Error).message);
    } finally {
      setProfileSaving(false);
    }
  }

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwOk, setPwOk] = useState(false);

  const [prefs, setPrefs] = useState<NotificationPreference | null>(null);
  const [prefsSaving, setPrefsSaving] = useState(false);

  useEffect(() => {
    notificationPreferenceApi.get().then(setPrefs).catch(() => {});
  }, []);

  async function changePassword() {
    setPwSaving(true);
    setPwError('');
    setPwOk(false);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setPwOk(true);
    } catch (e) {
      setPwError((e as Error).message);
    } finally {
      setPwSaving(false);
    }
  }

  async function updatePrefs(patch: Partial<NotificationPreference>) {
    const next = { ...prefs!, ...patch };
    setPrefs(next);
    setPrefsSaving(true);
    try {
      await notificationPreferenceApi.update(patch);
    } finally {
      setPrefsSaving(false);
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <header>
        <h1 className="text-3xl font-display font-bold text-on-surface mb-1">Configuración</h1>
        <p className="text-on-surface-variant font-body text-sm">Tu cuenta y preferencias.</p>
      </header>

      <Card className="space-y-4 border-ghost">
        <div className="flex items-center gap-2">
          <UserCircle size={18} className="text-primary" />
          <h2 className="font-display font-bold">Mi perfil</h2>
        </div>
        <AvatarUploadField avatarUrl={authUser?.avatarUrl} name={authUser?.name} onUpload={uploadAvatar} />
        <input type="tel" placeholder="Teléfono" value={phone}
          onChange={e => setPhone(e.target.value)} className={inputCls} />
        {profileError && <p className="text-sm text-error">{profileError}</p>}
        <div className="flex items-center gap-3">
          <Button onClick={saveProfile} disabled={profileSaving}>
            {profileSaving ? 'Guardando…' : 'Guardar perfil'}
          </Button>
          {profileOk && <span className="flex items-center gap-1 text-sm text-secondary font-bold"><Check size={16} /> Guardado</span>}
        </div>
      </Card>

      <Card className="space-y-3 border-ghost">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-primary" />
          <h2 className="font-display font-bold">Consentimiento de audio</h2>
        </div>
        <p className="text-sm text-on-surface-variant">
          {authUser?.audioConsentAt
            ? `Aceptaste el consentimiento para grabar y procesar audio con IA el ${new Date(authUser.audioConsentAt).toLocaleDateString('es-MX')}.`
            : 'Aún no has aceptado el consentimiento. Se te pedirá la primera vez que grabes una nota de voz.'}
        </p>
      </Card>

      <Card className="space-y-4 border-ghost">
        <div className="flex items-center gap-2">
          <KeyRound size={18} className="text-primary" />
          <h2 className="font-display font-bold">Cambiar contraseña</h2>
        </div>
        <input type="password" placeholder="Contraseña actual" value={currentPassword}
          onChange={e => setCurrentPassword(e.target.value)} className={inputCls} />
        <input type="password" placeholder="Nueva contraseña" value={newPassword}
          onChange={e => setNewPassword(e.target.value)} className={inputCls} />
        {pwError && <p className="text-sm text-error">{pwError}</p>}
        <div className="flex items-center gap-3">
          <Button onClick={changePassword} disabled={pwSaving || !currentPassword || !newPassword}>
            {pwSaving ? 'Guardando…' : 'Actualizar contraseña'}
          </Button>
          {pwOk && <span className="flex items-center gap-1 text-sm text-secondary font-bold"><Check size={16} /> Actualizada</span>}
        </div>
      </Card>

      <Card className="space-y-4 border-ghost">
        <div className="flex items-center gap-2">
          <Bell size={18} className="text-primary" />
          <h2 className="font-display font-bold">Preferencias de notificación</h2>
        </div>
        {!prefs ? (
          <div className="flex justify-center py-4"><Loader2 className="animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={prefs.emailEnabled} onChange={e => updatePrefs({ emailEnabled: e.target.checked })} className="w-4 h-4 accent-primary" />
              <span className="text-sm">Recibir notificaciones por correo</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={prefs.routineReminders} onChange={e => updatePrefs({ routineReminders: e.target.checked })} className="w-4 h-4 accent-primary" />
              <span className="text-sm">Recordatorios de rutinas</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={prefs.appointmentReminders} onChange={e => updatePrefs({ appointmentReminders: e.target.checked })} className="w-4 h-4 accent-primary" />
              <span className="text-sm">Recordatorios de citas</span>
            </label>
            {prefsSaving && <p className="text-xs text-on-surface-variant">Guardando…</p>}
          </div>
        )}
      </Card>
    </div>
  );
}
