import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../store/useStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { LanguageSelector } from '../../components/LanguageSelector';
import { ThemeSelector } from '../../components/ThemeToggle';
import { CalendarClock, Check, Loader2, KeyRound, Bell, UserCircle } from 'lucide-react';
import { availabilityApi } from '../../services/availability.api';
import { authApi } from '../../services/auth.api';
import { notificationPreferenceApi, type NotificationPreference } from '../../services/notificationPreference.api';
import { AvatarUploadField } from '../../components/AvatarUploadField';

const DAYS = [
  { dow: 1, labelKey: 'therapist.settings.day.monday' },
  { dow: 2, labelKey: 'therapist.settings.day.tuesday' },
  { dow: 3, labelKey: 'therapist.settings.day.wednesday' },
  { dow: 4, labelKey: 'therapist.settings.day.thursday' },
  { dow: 5, labelKey: 'therapist.settings.day.friday' },
  { dow: 6, labelKey: 'therapist.settings.day.saturday' },
  { dow: 0, labelKey: 'therapist.settings.day.sunday' },
];

interface DayState {
  enabled: boolean;
  startTime: string;
  endTime: string;
}

const inputCls =
  'px-3 py-2 rounded-xl bg-surface-container border border-outline-variant/40 text-sm ' +
  'text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-40';

export function SettingsView() {
  const { t } = useTranslation();
  const authUser = useStore(state => state.authUser);
  const updateProfile = useStore(state => state.updateProfile);
  const uploadAvatar = useStore(state => state.uploadAvatar);
  const therapistId = authUser?.id ?? '';

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

  const [days, setDays] = useState<Record<number, DayState>>(() =>
    Object.fromEntries(DAYS.map(d => [d.dow, { enabled: false, startTime: '09:00', endTime: '17:00' }])),
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedOk, setSavedOk] = useState(false);

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

  useEffect(() => {
    if (!therapistId) return;
    let active = true;
    availabilityApi
      .get(therapistId)
      .then(slots => {
        if (!active) return;
        setDays(prev => {
          const next = { ...prev };
          slots.forEach(s => {
            next[s.dayOfWeek] = { enabled: true, startTime: s.startTime, endTime: s.endTime };
          });
          return next;
        });
      })
      .catch(e => active && setError((e as Error).message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [therapistId]);

  function update(dow: number, patch: Partial<DayState>) {
    setSavedOk(false);
    setDays(prev => ({ ...prev, [dow]: { ...prev[dow], ...patch } }));
  }

  async function save() {
    setSaving(true);
    setError('');
    setSavedOk(false);
    try {
      const slots = DAYS.filter(d => days[d.dow].enabled).map(d => ({
        dayOfWeek: d.dow,
        startTime: days[d.dow].startTime,
        endTime: days[d.dow].endTime,
      }));
      const invalid = slots.find(s => s.startTime >= s.endTime);
      if (invalid) throw new Error(t('therapist.settings.timeValidation'));

      await availabilityApi.set(therapistId, slots);
      setSavedOk(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-on-surface">{t('therapist.settings.title')}</h1>
        <p className="text-on-surface-variant">{t('therapist.settings.subtitle')}</p>
      </div>

      <Card className="border-ghost space-y-4">
        <LanguageSelector />
        <ThemeSelector />
      </Card>

      <Card className="space-y-4 border-ghost">
        <div className="flex items-center gap-2">
          <UserCircle size={18} className="text-primary" />
          <h2 className="font-display font-bold">{t('therapist.settings.profile.title')}</h2>
        </div>
        <AvatarUploadField avatarUrl={authUser?.avatarUrl} name={authUser?.name} onUpload={uploadAvatar} />
        <input type="tel" placeholder={t('therapist.settings.profile.phone')} value={phone}
          onChange={e => setPhone(e.target.value)} className={inputCls + ' w-full'} />
        {profileError && <p className="text-sm text-error">{profileError}</p>}
        <div className="flex items-center gap-3">
          <Button onClick={saveProfile} disabled={profileSaving}>
            {profileSaving ? t('therapist.settings.saving') : t('therapist.settings.profile.save')}
          </Button>
          {profileOk && <span className="flex items-center gap-1 text-sm text-secondary font-bold"><Check size={16} /> {t('therapist.settings.saved')}</span>}
        </div>
      </Card>

      <Card className="space-y-4 border-ghost">
        <div className="flex items-center gap-2">
          <CalendarClock size={18} className="text-primary" />
          <h2 className="font-display font-bold">{t('therapist.settings.availability.title')}</h2>
        </div>
        <p className="text-sm text-on-surface-variant">
          {t('therapist.settings.availability.hint')}
        </p>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-2">
            {DAYS.map(d => {
              const st = days[d.dow];
              return (
                <div key={d.dow} className="flex items-center gap-3 py-1.5">
                  <label className="flex items-center gap-2 w-32 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={st.enabled}
                      onChange={e => update(d.dow, { enabled: e.target.checked })}
                      className="w-4 h-4 accent-primary"
                    />
                    <span className={`text-sm font-bold ${st.enabled ? 'text-on-surface' : 'text-on-surface-variant'}`}>{t(d.labelKey)}</span>
                  </label>
                  <input
                    type="time"
                    value={st.startTime}
                    disabled={!st.enabled}
                    onChange={e => update(d.dow, { startTime: e.target.value })}
                    className={inputCls}
                  />
                  <span className="text-on-surface-variant text-sm">—</span>
                  <input
                    type="time"
                    value={st.endTime}
                    disabled={!st.enabled}
                    onChange={e => update(d.dow, { endTime: e.target.value })}
                    className={inputCls}
                  />
                </div>
              );
            })}
          </div>
        )}

        {error && <p className="text-sm text-error">{error}</p>}

        <div className="flex items-center gap-3 pt-2">
          <Button onClick={save} disabled={saving || loading}>
            {saving ? t('therapist.settings.saving') : t('therapist.settings.availability.save')}
          </Button>
          {savedOk && (
            <span className="flex items-center gap-1 text-sm text-secondary font-bold">
              <Check size={16} /> {t('therapist.settings.saved')}
            </span>
          )}
        </div>
      </Card>

      <Card className="space-y-4 border-ghost">
        <div className="flex items-center gap-2">
          <KeyRound size={18} className="text-primary" />
          <h2 className="font-display font-bold">{t('therapist.settings.password.title')}</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input type="password" placeholder={t('therapist.settings.password.current')} value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)} className={inputCls + ' w-full'} />
          <input type="password" placeholder={t('therapist.settings.password.new')} value={newPassword}
            onChange={e => setNewPassword(e.target.value)} className={inputCls + ' w-full'} />
        </div>
        {pwError && <p className="text-sm text-error">{pwError}</p>}
        <div className="flex items-center gap-3">
          <Button onClick={changePassword} disabled={pwSaving || !currentPassword || !newPassword}>
            {pwSaving ? t('therapist.settings.saving') : t('therapist.settings.password.update')}
          </Button>
          {pwOk && <span className="flex items-center gap-1 text-sm text-secondary font-bold"><Check size={16} /> {t('therapist.settings.password.updated')}</span>}
        </div>
      </Card>

      <Card className="space-y-4 border-ghost">
        <div className="flex items-center gap-2">
          <Bell size={18} className="text-primary" />
          <h2 className="font-display font-bold">{t('therapist.settings.notifications.title')}</h2>
        </div>
        {!prefs ? (
          <div className="flex justify-center py-4"><Loader2 className="animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={prefs.emailEnabled} onChange={e => updatePrefs({ emailEnabled: e.target.checked })} className="w-4 h-4 accent-primary" />
              <span className="text-sm">{t('therapist.settings.notifications.email')}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={prefs.appointmentReminders} onChange={e => updatePrefs({ appointmentReminders: e.target.checked })} className="w-4 h-4 accent-primary" />
              <span className="text-sm">{t('therapist.settings.notifications.appointmentReminders')}</span>
            </label>
            {prefsSaving && <p className="text-xs text-on-surface-variant">{t('therapist.settings.saving')}</p>}
          </div>
        )}
      </Card>
    </div>
  );
}
