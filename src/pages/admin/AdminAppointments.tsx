import { useEffect, useState } from 'react';
import { Plus, Calendar, Clock, User, Mail, XCircle, Pencil, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { appointmentsApi } from '../../services/appointments.api';
import { adminApi } from '../../services/admin.api';
import { roomsApi, type Room } from '../../services/rooms.api';
import { treatmentPlanApi, type TreatmentPlan } from '../../services/treatmentPlan.api';
import type { Appointment, Therapist } from '../../types';
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

type PatientOpt = { id: string; name: string; email?: string };

function toDatetimeLocal(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AdminAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [patients, setPatients] = useState<PatientOpt[]>([]);
  const [filterDate, setFilterDate] = useState('');
  const [filterTherapist, setFilterTherapist] = useState('');
  const [filterPatient, setFilterPatient] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editAppt, setEditAppt] = useState<Appointment | null>(null);
  const [form, setForm] = useState({ patientId: '', therapistId: '', dateTime: '', roomId: '', treatmentPlanId: '', notes: '' });
  const [reminderMsg, setReminderMsg] = useState<Record<string, { text: string; preview?: string | null }>>({});
  const [rooms, setRooms] = useState<Room[]>([]);
  const [patientPlans, setPatientPlans] = useState<TreatmentPlan[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAppointments();
    adminApi.getTherapists().then(setTherapists);
    adminApi.getPatients().then(setPatients);
    roomsApi.getAll().then(setRooms).catch(() => {});
  }, []);

  useEffect(() => {
    if (!form.patientId) { setPatientPlans([]); return; }
    treatmentPlanApi.getByPatient(form.patientId).then(setPatientPlans).catch(() => setPatientPlans([]));
  }, [form.patientId]);

  function loadAppointments() {
    setLoading(true);
    appointmentsApi.getAll({
      date:        filterDate      || undefined,
      therapistId: filterTherapist || undefined,
      patientId:   filterPatient   || undefined,
      status:      filterStatus    || undefined,
    }).then(setAppointments).finally(() => setLoading(false));
  }

  function changeDay(delta: number) {
    const base = filterDate ? new Date(filterDate + 'T00:00:00') : new Date();
    base.setDate(base.getDate() + delta);
    const d = toLocalDateString(base);
    setFilterDate(d);
  }

  useEffect(() => { loadAppointments(); }, [filterDate, filterTherapist, filterPatient, filterStatus]);

  function openCreate() {
    setEditAppt(null);
    setForm({ patientId: '', therapistId: '', dateTime: '', roomId: '', treatmentPlanId: '', notes: '' });
    setError('');
    setShowForm(true);
  }

  function openEdit(appt: Appointment) {
    setEditAppt(appt);
    setForm({
      patientId: appt.patientId,
      therapistId: appt.therapistId,
      dateTime: toDatetimeLocal(appt.dateTime),
      roomId: appt.roomId ?? '',
      treatmentPlanId: appt.treatmentPlanId ?? '',
      notes: appt.notes ?? '',
    });
    setError('');
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const dateTimeISO = new Date(form.dateTime).toISOString();
      if (editAppt) {
        const updated = await appointmentsApi.update(editAppt.id, {
          dateTime: dateTimeISO,
          roomId: form.roomId || null,
          treatmentPlanId: form.treatmentPlanId || null,
          notes: form.notes || undefined,
        });
        setAppointments(prev => prev.map(a => a.id === updated.id ? updated : a));
      } else {
        const created = await appointmentsApi.create({
          patientId: form.patientId, therapistId: form.therapistId,
          dateTime: dateTimeISO,
          roomId: form.roomId || undefined,
          treatmentPlanId: form.treatmentPlanId || undefined,
          notes: form.notes || undefined,
        });
        setAppointments(prev => [created, ...prev]);
      }
      setShowForm(false);
    } catch (e: unknown) {
      setError((e as Error).message);
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

  async function handleReminder(appt: Appointment) {
    try {
      const res = await appointmentsApi.sendReminder(appt.id);
      const msg = res.preview ? 'Correo de prueba generado:' : 'Correo enviado';
      setReminderMsg(prev => ({ ...prev, [appt.id]: { text: msg, preview: res.preview } }));
    } catch (e: unknown) {
      setReminderMsg(prev => ({ ...prev, [appt.id]: { text: (e as Error).message } }));
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold">Citas</h1>
          <p className="text-on-surface-variant">Gestión de agenda y citas</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2.5 rounded-xl font-medium hover:opacity-90 transition-opacity">
          <Plus size={18} /> Agendar cita
        </button>
      </div>

      {}
      <div className="bg-surface-container rounded-2xl p-4 mb-6 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-1">
          <button onClick={() => changeDay(-1)} className="p-1.5 rounded-lg hover:bg-surface transition-colors">
            <ChevronLeft size={18} />
          </button>
          <input type="date" value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
            className="bg-surface border border-surface-container-high rounded-lg px-3 py-1.5 text-sm" />
          <button onClick={() => changeDay(1)} className="p-1.5 rounded-lg hover:bg-surface transition-colors">
            <ChevronRight size={18} />
          </button>
          {filterDate && (
            <button onClick={() => setFilterDate('')} className="text-xs text-on-surface-variant hover:text-error transition-colors ml-1">
              Limpiar
            </button>
          )}
        </div>

        <select value={filterTherapist} onChange={e => setFilterTherapist(e.target.value)}
          className="bg-surface border border-surface-container-high rounded-lg px-3 py-1.5 text-sm">
          <option value="">Todos los terapeutas</option>
          {therapists.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>

        <select value={filterPatient} onChange={e => setFilterPatient(e.target.value)}
          className="bg-surface border border-surface-container-high rounded-lg px-3 py-1.5 text-sm">
          <option value="">Todos los pacientes</option>
          {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>

        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="bg-surface border border-surface-container-high rounded-lg px-3 py-1.5 text-sm">
          <option value="">Todos los estados</option>
          <option value="SCHEDULED">Programadas</option>
          <option value="CONFIRMED">Confirmadas</option>
          <option value="COMPLETED">Completadas</option>
          <option value="CANCELLED">Canceladas</option>
        </select>
      </div>

      {}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-display font-bold mb-4">
              {editAppt ? 'Reprogramar cita' : 'Nueva cita'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editAppt && (
                <>
                  <div>
                    <label className="text-sm text-on-surface-variant mb-1 block">Paciente</label>
                    <select required value={form.patientId}
                      onChange={e => setForm(f => ({ ...f, patientId: e.target.value }))}
                      className="w-full bg-surface-container border border-surface-container-high rounded-xl px-3 py-2.5 text-sm">
                      <option value="">Seleccionar paciente...</option>
                      {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-on-surface-variant mb-1 block">Terapeuta</label>
                    <select required value={form.therapistId}
                      onChange={e => setForm(f => ({ ...f, therapistId: e.target.value }))}
                      className="w-full bg-surface-container border border-surface-container-high rounded-xl px-3 py-2.5 text-sm">
                      <option value="">Seleccionar terapeuta...</option>
                      {therapists.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                </>
              )}
              <div>
                <label className="text-sm text-on-surface-variant mb-1 block">Fecha y hora</label>
                <input required type="datetime-local" value={form.dateTime}
                  onChange={e => setForm(f => ({ ...f, dateTime: e.target.value }))}
                  className="w-full bg-surface-container border border-surface-container-high rounded-xl px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="text-sm text-on-surface-variant mb-1 block">Sala (opcional)</label>
                <select value={form.roomId}
                  onChange={e => setForm(f => ({ ...f, roomId: e.target.value }))}
                  className="w-full bg-surface-container border border-surface-container-high rounded-xl px-3 py-2.5 text-sm">
                  <option value="">Sin sala asignada</option>
                  {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              {patientPlans.length > 0 && (
                <div>
                  <label className="text-sm text-on-surface-variant mb-1 block">Plan de tratamiento (opcional)</label>
                  <select value={form.treatmentPlanId}
                    onChange={e => setForm(f => ({ ...f, treatmentPlanId: e.target.value }))}
                    className="w-full bg-surface-container border border-surface-container-high rounded-xl px-3 py-2.5 text-sm">
                    <option value="">Sin vincular</option>
                    {patientPlans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="text-sm text-on-surface-variant mb-1 block">Notas (opcional)</label>
                <textarea rows={3} value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full bg-surface-container border border-surface-container-high rounded-xl px-3 py-2.5 text-sm resize-none" />
              </div>
              {error && <p className="text-sm text-error">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-surface-container-high text-sm hover:bg-surface-container transition-colors">
                  Cancelar
                </button>
                <button type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-medium hover:opacity-90 transition-opacity">
                  {editAppt ? 'Reprogramar' : 'Agendar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {}
      {loading && <p className="text-on-surface-variant">Cargando...</p>}
      {!loading && appointments.length === 0 && (
        <div className="bg-surface-container rounded-2xl p-12 text-center text-on-surface-variant">
          No se encontraron citas con los filtros seleccionados.
        </div>
      )}

      <div className="space-y-4">
        {appointments.map(appt => (
          <div key={appt.id} className="bg-surface-container rounded-2xl p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center shrink-0">
                  <Calendar size={16} className="text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold">
                      {new Date(appt.dateTime).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                    <p className="flex items-center gap-1 text-sm text-on-surface-variant">
                      <Clock size={12} />
                      {new Date(appt.dateTime).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', statusColor[appt.status])}>
                      {statusLabel[appt.status]}
                    </span>
                  </div>
                  <div className="flex gap-4 mt-1 text-sm text-on-surface-variant flex-wrap">
                    <span className="flex items-center gap-1"><User size={12} /> {appt.patient.name}</span>
                    <span className="flex items-center gap-1">{'🩺'} {appt.therapist.name}</span>
                    {appt.room && <span className="flex items-center gap-1">{'📍'} {appt.room.name}</span>}
                    {appt.treatmentPlan && <span className="flex items-center gap-1">{'🗂️'} {appt.treatmentPlan.name}</span>}
                  </div>
                  {appt.notes && <p className="text-xs text-on-surface-variant mt-1 italic">"{appt.notes}"</p>}
                </div>
              </div>

              {(appt.status === 'SCHEDULED' || appt.status === 'CONFIRMED') && (
                <div className="flex gap-2 shrink-0 flex-wrap">
                  {appt.status === 'SCHEDULED' && (
                    <button onClick={() => handleConfirm(appt.id)}
                      className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-surface hover:bg-secondary-container hover:text-secondary transition-colors">
                      <CheckCircle2 size={13} /> Confirmar
                    </button>
                  )}
                  <button onClick={() => openEdit(appt)}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-container-high transition-colors">
                    <Pencil size={13} /> Reprogramar
                  </button>
                  <button onClick={() => handleCancel(appt.id)}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-surface hover:bg-error-container hover:text-error transition-colors">
                    <XCircle size={13} /> Cancelar
                  </button>
                  <button onClick={() => handleReminder(appt)}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-surface hover:bg-primary-container hover:text-primary transition-colors">
                    <Mail size={13} /> Recordatorio
                  </button>
                </div>
              )}
            </div>
            {reminderMsg[appt.id] && (
              <div className="text-xs bg-surface-container-low text-on-surface rounded-lg px-3 py-2 mt-3 border border-outline-variant/30">
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
