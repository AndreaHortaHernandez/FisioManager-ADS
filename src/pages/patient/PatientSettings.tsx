import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { KeyRound, Bell, Check, Loader2, ShieldCheck, UserCircle } from 'lucide-react';
import { authApi } from '../../services/auth.api';
import { notificationPreferenceApi, type NotificationPreference } from '../../services/notificationPreference.api';
import { useStore } from '../../store/useStore';
import { AvatarUploadField } from '../../components/AvatarUploadField';
import { LanguageSelector } from '../../components/LanguageSelector';
import { ThemeSelector } from '../../components/ThemeToggle';

const inputCls =
  'w-full px-3 py-2.5 rounded-xl bg-surface-container border border-outline-variant/40 text-sm ' +
  'text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40';

export function PatientSettings() {
  const { t } = useTranslation();
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
        <h1 className="text-3xl font-display font-bold text-on-surface mb-1">{t('patient.settings.title')}</h1>
        <p className="text-on-surface-variant font-body text-sm">{t('patient.settings.subtitle')}</p>
      </header>

      <Card className="border-ghost space-y-4">
        <LanguageSelector />
        <ThemeSelector />
      </Card>

      <Card className="space-y-4 border-ghost">
        <div className="flex items-center gap-2">
          <UserCircle size={18} className="text-primary" />
          <h2 className="font-display font-bold">{t('patient.settings.myProfile')}</h2>
        </div>
        <AvatarUploadField avatarUrl={authUser?.avatarUrl} name={authUser?.name} onUpload={uploadAvatar} />
        <input type="tel" placeholder={t('patient.settings.phone')} value={phone}
          onChange={e => setPhone(e.target.value)} className={inputCls} />
        {profileError && <p className="text-sm text-error">{profileError}</p>}
        <div className="flex items-center gap-3">
          <Button onClick={saveProfile} disabled={profileSaving}>
            {profileSaving ? t('patient.settings.saving') : t('patient.settings.saveProfile')}
          </Button>
          {profileOk && <span className="flex items-center gap-1 text-sm text-secondary font-bold"><Check size={16} /> {t('patient.settings.saved')}</span>}
        </div>
      </Card>

      <Card className="space-y-3 border-ghost">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-primary" />
          <h2 className="font-display font-bold">{t('patient.settings.audioConsent')}</h2>
        </div>
        <p className="text-sm text-on-surface-variant">
          {authUser?.audioConsentAt
            ? t('patient.settings.audioConsentAccepted', { date: new Date(authUser.audioConsentAt).toLocaleDateString('es-MX') })
            : t('patient.settings.audioConsentPending')}
        </p>
      </Card>

      <Card className="space-y-4 border-ghost">
        <div className="flex items-center gap-2">
          <KeyRound size={18} className="text-primary" />
          <h2 className="font-display font-bold">{t('patient.settings.changePassword')}</h2>
        </div>
        <input type="password" placeholder={t('patient.settings.currentPassword')} value={currentPassword}
          onChange={e => setCurrentPassword(e.target.value)} className={inputCls} />
        <input type="password" placeholder={t('patient.settings.newPassword')} value={newPassword}
          onChange={e => setNewPassword(e.target.value)} className={inputCls} />
        {pwError && <p className="text-sm text-error">{pwError}</p>}
        <div className="flex items-center gap-3">
          <Button onClick={changePassword} disabled={pwSaving || !currentPassword || !newPassword}>
            {pwSaving ? t('patient.settings.saving') : t('patient.settings.updatePassword')}
          </Button>
          {pwOk && <span className="flex items-center gap-1 text-sm text-secondary font-bold"><Check size={16} /> {t('patient.settings.updated')}</span>}
        </div>
      </Card>

      <Card className="space-y-4 border-ghost">
        <div className="flex items-center gap-2">
          <Bell size={18} className="text-primary" />
          <h2 className="font-display font-bold">{t('patient.settings.notificationPrefs')}</h2>
        </div>
        {!prefs ? (
          <div className="flex justify-center py-4"><Loader2 className="animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={prefs.emailEnabled} onChange={e => updatePrefs({ emailEnabled: e.target.checked })} className="w-4 h-4 accent-primary" />
              <span className="text-sm">{t('patient.settings.emailNotifications')}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={prefs.routineReminders} onChange={e => updatePrefs({ routineReminders: e.target.checked })} className="w-4 h-4 accent-primary" />
              <span className="text-sm">{t('patient.settings.routineReminders')}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={prefs.appointmentReminders} onChange={e => updatePrefs({ appointmentReminders: e.target.checked })} className="w-4 h-4 accent-primary" />
              <span className="text-sm">{t('patient.settings.appointmentReminders')}</span>
            </label>
            {prefsSaving && <p className="text-xs text-on-surface-variant">{t('patient.settings.saving')}</p>}
          </div>
        )}
      </Card>
    </div>
  );
}
