import { useEffect, useState } from 'react';
import { Clock, User, Stethoscope, CheckCircle2, XCircle, Mail } from 'lucide-react';
import { appointmentsApi } from '../../services/appointments.api';
import type { Appointment } from '../../types';
import { cn } from '../../utils/cn';

const statusLabel: Record<string, string> = {
  SCHEDULED: 'Programada',
  CANCELLED: 'Cancelada',
  COMPLETED: 'Completada',
};

const statusColor: Record<string, string> = {
  SCHEDULED: 'bg-primary-container text-primary',
  CANCELLED: 'bg-error-container text-error',
  COMPLETED: 'bg-surface-container text-on-surface-variant',
};

export function AdminDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [reminderMsg, setReminderMsg] = useState<Record<string, string>>({});

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    appointmentsApi.getAll({ date: today })
      .then(setAppointments)
      .finally(() => setLoading(false));
  }, [today]);

  async function handleReminder(appt: Appointment) {
    try {
      const res = await appointmentsApi.sendReminder(appt.id);
      const msg = res.preview ? `Correo enviado. Vista previa: ${res.preview}` : 'Correo enviado correctamente';
      setReminderMsg(prev => ({ ...prev, [appt.id]: msg }));
    } catch (e: unknown) {
      setReminderMsg(prev => ({ ...prev, [appt.id]: (e as Error).message }));
    }
  }

  async function handleCancel(id: string) {
    await appointmentsApi.cancel(id);
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'CANCELLED' } : a));
  }

  async function handleComplete(id: string) {
    await appointmentsApi.update(id, { status: 'COMPLETED' });
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'COMPLETED' } : a));
  }

  const scheduled = appointments.filter(a => a.status === 'SCHEDULED');
  const total = appointments.length;

  return (
    <div>
      <h1 className="text-3xl font-display font-bold mb-1">Agenda del Día</h1>
      <p className="text-on-surface-variant mb-8">
        {new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </p>

      {/* Stats */}
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

              {appt.status === 'SCHEDULED' && (
                <div className="flex gap-2 shrink-0">
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
              <p className="text-xs text-primary bg-primary-container rounded-lg px-3 py-2">{reminderMsg[appt.id]}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
