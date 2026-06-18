import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, User, Stethoscope, CheckCircle2, XCircle, Mail, Plus, Users, Activity, TrendingUp } from 'lucide-react';
import { appointmentsApi } from '../../services/appointments.api';
import { analyticsApi, type ClinicOverview, type TherapistComparisonRow } from '../../services/analytics.api';
import type { Appointment } from '../../types';
import { cn } from '../../utils/cn';
import { toLocalDateString } from '../../utils/date';

const statusLabel: Record<string, string> = {
  SCHEDULED: 'Programada',
  CONFIRMED: 'Confirmada',
  CANCELLED: 'Cancelada',
  COMPLETED: 'Completada',
};

const statusColor: Record<string, string> = {
  SCHEDULED: 'bg-primary-container text-primary',
  CONFIRMED: 'bg-secondary-container text-secondary',
  CANCELLED: 'bg-error-container text-error',
  COMPLETED: 'bg-surface-container text-on-surface-variant',
};

export function AdminDashboard() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [reminderMsg, setReminderMsg] = useState<Record<string, { text: string; preview?: string | null }>>({});
  const [overview, setOverview] = useState<ClinicOverview | null>(null);
  const [therapistRows, setTherapistRows] = useState<TherapistComparisonRow[]>([]);

  const today = toLocalDateString(new Date());

  useEffect(() => {
    appointmentsApi.getAll({ date: today })
      .then(setAppointments)
      .finally(() => setLoading(false));
    analyticsApi.getOverview().then(setOverview).catch(() => {});
    analyticsApi.getTherapistComparison().then(setTherapistRows).catch(() => {});
  }, [today]);

  async function handleReminder(appt: Appointment) {
    try {
      const res = await appointmentsApi.sendReminder(appt.id);
      const msg = res.preview ? 'Correo de prueba generado:' : 'Correo enviado correctamente';
      setReminderMsg(prev => ({ ...prev, [appt.id]: { text: msg, preview: res.preview } }));
    } catch (e: unknown) {
      setReminderMsg(prev => ({ ...prev, [appt.id]: { text: (e as Error).message } }));
    }
  }

  async function handleCancel(id: string) {
    await appointmentsApi.cancel(id);
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'CANCELLED' } : a));
  }

  async function handleConfirm(id: string) {
    await appointmentsApi.confirm(id);
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'CONFIRMED' } : a));
  }

  async function handleComplete(id: string) {
    await appointmentsApi.update(id, { status: 'COMPLETED' });
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'COMPLETED' } : a));
  }

  const scheduled = appointments.filter(a => a.status === 'SCHEDULED');
  const total = appointments.length;

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold mb-1">Agenda del Día</h1>
          <p className="text-on-surface-variant">
            {new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button
          onClick={() => navigate('/admin/citas')}
          className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2.5 rounded-xl font-medium hover:opacity-90 transition-opacity shrink-0">
          <Plus size={18} /> Nueva cita
        </button>
      </div>

      {}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total citas', value: total, color: 'text-on-surface' },
          { label: 'Programadas', value: scheduled.length, color: 'text-primary' },
          { label: 'Completadas / Canceladas', value: total - scheduled.length, color: 'text-on-surface-variant' },
        ].map(s => (
          <div key={s.label} className="bg-surface-container rounded-2xl p-5">
            <p className="text-sm text-on-surface-variant">{s.label}</p>
            <p className={cn('text-4xl font-display font-bold mt-1', s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      {}
      {overview && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-surface-container rounded-2xl p-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><Users size={18} /></div>
            <div>
              <p className="text-xs text-on-surface-variant">Pacientes activos</p>
              <p className="text-2xl font-display font-bold">{overview.activePatients}</p>
            </div>
          </div>
          <div className="bg-surface-container rounded-2xl p-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center"><Activity size={18} /></div>
            <div>
              <p className="text-xs text-on-surface-variant">Sesiones completadas</p>
              <p className="text-2xl font-display font-bold">{overview.sessionsCompleted}</p>
            </div>
          </div>
          <div className="bg-surface-container rounded-2xl p-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-tertiary/10 text-tertiary flex items-center justify-center"><TrendingUp size={18} /></div>
            <div>
              <p className="text-xs text-on-surface-variant">Adherencia promedio</p>
              <p className="text-2xl font-display font-bold">{overview.avgAdherence !== null ? `${Math.round(overview.avgAdherence * 100)}%` : '—'}</p>
            </div>
          </div>
        </div>
      )}

      {}
      {therapistRows.length > 0 && (
        <div className="bg-surface-container rounded-2xl p-5 mb-8 overflow-x-auto">
          <h2 className="text-lg font-display font-bold mb-3">Comparativo de terapeutas</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-on-surface-variant border-b border-surface-container-high">
                <th className="py-2 pr-4">Terapeuta</th>
                <th className="py-2 pr-4">Pacientes activos</th>
                <th className="py-2 pr-4">Sesiones completadas</th>
                <th className="py-2 pr-4">Adherencia promedio</th>
              </tr>
            </thead>
            <tbody>
              {therapistRows.map(t => (
                <tr key={t.therapistId} className="border-b border-surface-container-high last:border-0">
                  <td className="py-2 pr-4 font-medium">{t.therapistName}</td>
                  <td className="py-2 pr-4">{t.activePatients}</td>
                  <td className="py-2 pr-4">{t.sessionsCompleted}</td>
                  <td className="py-2 pr-4">{t.avgAdherence !== null ? `${Math.round(t.avgAdherence * 100)}%` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {loading && <p className="text-on-surface-variant">Cargando citas...</p>}

      {!loading && appointments.length === 0 && (
        <div className="bg-surface-container rounded-2xl p-12 text-center text-on-surface-variant">
          No hay citas programadas para hoy.
        </div>
      )}

      <div className="space-y-4">
        {appointments.map(appt => (
          <div key={appt.id} className="bg-surface-container rounded-2xl p-5 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center shrink-0">
                  <Clock size={18} className="text-primary" />
                </div>
                <div>
                  <p className="font-bold text-lg">
                    {new Date(appt.dateTime).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', statusColor[appt.status])}>
                    {statusLabel[appt.status]}
                  </span>
                </div>
              </div>

              {(appt.status === 'SCHEDULED' || appt.status === 'CONFIRMED') && (
                <div className="flex gap-2 shrink-0">
                  {appt.status === 'SCHEDULED' && (
                    <button
                      onClick={() => handleConfirm(appt.id)}
                      className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-surface hover:bg-secondary-container text-on-surface hover:text-secondary transition-colors"
                    >
                      <CheckCircle2 size={14} /> Confirmar
                    </button>
                  )}
                  <button
                    onClick={() => handleComplete(appt.id)}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-surface hover:bg-primary-container text-on-surface hover:text-primary transition-colors"
                  >
                    <CheckCircle2 size={14} /> Completar
                  </button>
                  <button
                    onClick={() => handleCancel(appt.id)}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-surface hover:bg-error-container text-on-surface hover:text-error transition-colors"
                  >
                    <XCircle size={14} /> Cancelar
                  </button>
                  <button
                    onClick={() => handleReminder(appt)}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-container-high text-on-surface transition-colors"
                  >
                    <Mail size={14} /> Recordatorio
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 pl-13">
              <div className="flex items-center gap-2">
                <User size={14} className="text-on-surface-variant" />
                <span className="text-sm"><span className="text-on-surface-variant">Paciente:</span> {appt.patient.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Stethoscope size={14} className="text-on-surface-variant" />
                <span className="text-sm"><span className="text-on-surface-variant">Terapeuta:</span> {appt.therapist.name}</span>
              </div>
            </div>

            {appt.notes && (
              <p className="text-sm text-on-surface-variant pl-13 italic">"{appt.notes}"</p>
            )}

            {reminderMsg[appt.id] && (
              <div className="text-xs bg-surface-container-low text-on-surface rounded-lg px-3 py-2 border border-outline-variant/30">
                <p>{reminderMsg[appt.id].text}</p>
                {reminderMsg[appt.id].preview && (
                  <a href={reminderMsg[appt.id].preview!} target="_blank" rel="noopener noreferrer"
                    className="text-primary underline break-all">
                    {reminderMsg[appt.id].preview}
                  </a>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
