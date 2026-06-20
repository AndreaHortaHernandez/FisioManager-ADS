import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarPlus, Clock, X, CheckCircle2, Hourglass } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useStore } from '../../store/useStore';
import { availabilityApi, type FreeSlot } from '../../services/availability.api';
import { appointmentsApi } from '../../services/appointments.api';
import { waitlistApi, type WaitlistEntry } from '../../services/waitlist.api';
import type { Appointment } from '../../types';

function toDateInput(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function BookAppointment() {
  const { t } = useTranslation();
  const authUser = useStore(s => s.authUser);
  const currentUserId = useStore(s => s.currentUser);
  const therapistId = authUser?.patientProfile?.therapistId;

  const [slots, setSlots] = useState<FreeSlot[]>([]);
  const [mine, setMine] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [booking, setBooking] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [wFrom, setWFrom] = useState('');
  const [wTo, setWTo] = useState('');

  function loadMine() {
    appointmentsApi.getAll({ status: 'SCHEDULED' }).then(setMine).catch(() => {});
  }

  function loadWaitlist() {
    waitlistApi.list().then(setWaitlist).catch(() => {});
  }

  async function joinWaitlist() {
    if (!therapistId || !wFrom || !wTo) { setError(t('patient.book.waitlistRangeError')); return; }
    setError('');
    try {
      await waitlistApi.join({ therapistId, desiredFrom: new Date(wFrom).toISOString(), desiredTo: new Date(wTo + 'T23:59:59').toISOString() });
      setWFrom(''); setWTo('');
      loadWaitlist();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function leaveWaitlist(id: string) {
    await waitlistApi.leave(id).catch(() => {});
    loadWaitlist();
  }

  function loadSlots() {
    if (!therapistId) return;
    setLoading(true);
    setError('');
    const today = new Date();
    const to = new Date(today.getTime() + 14 * 86_400_000);
    availabilityApi.slots(therapistId, toDateInput(today), toDateInput(to))
      .then(setSlots)
      .catch(e => setError((e as Error).message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadSlots();
    loadMine();
    loadWaitlist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [therapistId]);

  async function book(dateTime: string) {
    if (!therapistId || !currentUserId) return;
    setBooking(dateTime);
    setError('');
    try {
      await appointmentsApi.create({ patientId: currentUserId, therapistId, dateTime });
      setSuccess(true);
      loadSlots();
      loadMine();
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBooking(null);
    }
  }

  async function cancel(id: string) {
    try {
      await appointmentsApi.cancel(id);
      loadMine();
      loadSlots();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const byDay = slots.reduce<Record<string, FreeSlot[]>>((acc, s) => {
    const day = new Date(s.dateTime).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
    (acc[day] ??= []).push(s);
    return acc;
  }, {});

  if (!therapistId) {
    return (
      <div className="animate-fade-in">
        <h1 className="text-2xl font-display font-bold mb-4">{t('patient.book.title')}</h1>
        <Card className="text-center text-on-surface-variant py-10">
          {t('patient.book.noTherapist')}
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-display font-bold flex items-center gap-3">
        <CalendarPlus className="text-primary" /> {t('patient.book.title')}
      </h1>

      {success && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-primary-fixed/20 text-primary text-sm">
          <CheckCircle2 size={18} /> {t('patient.book.bookSuccess')}
        </div>
      )}
      {error && <p className="text-sm text-error">{error}</p>}

      {mine.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-on-surface-variant">{t('patient.book.yourAppointments')}</h2>
          {mine.map(a => (
            <Card key={a.id} level={2} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Clock size={18} className="text-primary" />
                <span className="text-sm">{new Date(a.dateTime).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}</span>
              </div>
              <button onClick={() => cancel(a.id)} className="text-error text-sm flex items-center gap-1 hover:underline">
                <X size={14} /> {t('common.cancel')}
              </button>
            </Card>
          ))}
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-on-surface-variant">{t('patient.book.availableSlots')}</h2>
        {loading && <p className="text-sm text-on-surface-variant">{t('patient.book.searchingSlots')}</p>}
        {!loading && slots.length === 0 && (
          <Card className="text-center text-on-surface-variant py-8">
            {t('patient.book.noSlots')}
          </Card>
        )}
        {Object.entries(byDay).map(([day, daySlots]) => (
          <Card key={day} level={1} className="space-y-3">
            <p className="text-sm font-bold capitalize">{day}</p>
            <div className="flex flex-wrap gap-2">
              {daySlots.map(s => {
                const time = new Date(s.dateTime).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
                return (
                  <Button
                    key={s.dateTime}
                    variant="secondary"
                    onClick={() => book(s.dateTime)}
                    disabled={booking === s.dateTime}
                    className="px-4 py-2 text-sm"
                  >
                    {booking === s.dateTime ? '…' : time}
                  </Button>
                );
              })}
            </div>
          </Card>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-on-surface-variant flex items-center gap-2">
          <Hourglass size={16} /> {t('patient.book.waitlist')}
        </h2>
        <p className="text-xs text-on-surface-variant">
          {t('patient.book.waitlistDesc')}
        </p>
        <Card level={2} className="space-y-3">
          <div className="flex flex-wrap gap-3 items-end">
            <label className="text-xs text-on-surface-variant">
              {t('patient.book.from')}
              <input type="date" value={wFrom} onChange={e => setWFrom(e.target.value)}
                className="block bg-surface-container rounded-lg px-3 py-2 text-sm mt-1" />
            </label>
            <label className="text-xs text-on-surface-variant">
              {t('patient.book.to')}
              <input type="date" value={wTo} onChange={e => setWTo(e.target.value)}
                className="block bg-surface-container rounded-lg px-3 py-2 text-sm mt-1" />
            </label>
            <Button variant="primary" onClick={joinWaitlist} className="px-4 py-2 text-sm">{t('patient.book.joinWaitlist')}</Button>
          </div>

          {waitlist.filter(w => w.status === 'WAITING' || w.status === 'NOTIFIED').map(w => (
            <div key={w.id} className="flex items-center justify-between text-sm border-t border-surface-container-high pt-2">
              <span>
                {new Date(w.desiredFrom).toLocaleDateString('es-MX')} – {new Date(w.desiredTo).toLocaleDateString('es-MX')}
                <span className="ml-2 text-xs text-on-surface-variant">({w.status === 'NOTIFIED' ? t('patient.book.statusNotified') : t('patient.book.statusWaiting')})</span>
              </span>
              <button onClick={() => leaveWaitlist(w.id)} className="text-error text-xs flex items-center gap-1 hover:underline">
                <X size={12} /> {t('patient.book.leaveWaitlist')}
              </button>
            </div>
          ))}
        </Card>
      </section>
    </div>
  );
}
