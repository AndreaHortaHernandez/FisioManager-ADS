import { randomUUID } from 'crypto';
import { appointmentRepository } from '../repositories/appointment.repository';
import { availabilityRepository } from '../repositories/availability.repository';
import { userRepository } from '../repositories/user.repository';
import { emailService } from './email.service';
import { notificationService } from './notification.service';
import { waitlistService } from './waitlist.service';
import { AppError } from '../errors/AppError';
import { logger } from '../lib/logger';

interface Actor {
  id: string;
  role: string;
}

interface Recurrence {
  frequency: 'WEEKLY' | 'BIWEEKLY';
  count: number;
}

const RECURRENCE_DAYS: Record<Recurrence['frequency'], number> = { WEEKLY: 7, BIWEEKLY: 14 };

const CLINIC_TZ = process.env.CLINIC_TZ ?? 'America/Mexico_City';
const WEEKDAYS: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

function zonedParts(date: Date): { dayOfWeek: number; hhmm: string } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: CLINIC_TZ,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const get = (t: string) => parts.find(p => p.type === t)?.value ?? '';
  const hour = get('hour') === '24' ? '00' : get('hour');
  return { dayOfWeek: WEEKDAYS[get('weekday')], hhmm: `${hour}:${get('minute')}` };
}

async function assertWithinAvailability(therapistId: string, dt: Date) {
  const slots = await availabilityRepository.findByTherapist(therapistId);
  if (slots.length === 0) return;

  const { dayOfWeek, hhmm } = zonedParts(dt);

  const slot = slots.find(s => s.dayOfWeek === dayOfWeek);
  if (!slot) {
    throw new AppError('El terapeuta no atiende ese día de la semana.', 409);
  }

  if (hhmm < slot.startTime || hhmm >= slot.endTime) {
    throw new AppError(`El terapeuta atiende de ${slot.startTime} a ${slot.endTime} ese día.`, 409);
  }
}

export const appointmentService = {
  async getAll(filters: { date?: string; therapistId?: string; patientId?: string; status?: string }) {
    return appointmentRepository.findAll(filters);
  },

  async getById(id: string) {
    const appt = await appointmentRepository.findById(id);
    if (!appt) throw new AppError('Cita no encontrada', 404);
    return appt;
  },

  async create(
    data: { patientId: string; therapistId: string; dateTime: string; roomId?: string; treatmentPlanId?: string; notes?: string; recurrence?: Recurrence },
    actor?: Actor,
  ) {
    const { recurrence, ...base } = data;

    if (actor?.role === 'PATIENT') {
      if (base.patientId !== actor.id) {
        throw new AppError('Solo puedes agendar citas para ti mismo', 403);
      }
      const patient = await userRepository.findById(actor.id);
      const assignedTherapistId = patient?.patientProfile?.therapistId;
      if (!assignedTherapistId) throw new AppError('Aún no tienes un terapeuta asignado', 409);
      if (base.therapistId !== assignedTherapistId) {
        throw new AppError('Solo puedes agendar con tu terapeuta asignado', 403);
      }
    }

    const useRecurrence = recurrence && actor?.role !== 'PATIENT';

    const baseDt = new Date(base.dateTime);
    const dateTimes = [baseDt];
    if (useRecurrence) {
      const stepMs = RECURRENCE_DAYS[recurrence.frequency] * 86_400_000;
      for (let k = 1; k < recurrence.count; k++) {
        dateTimes.push(new Date(baseDt.getTime() + k * stepMs));
      }
    }

    for (const dt of dateTimes) {
      await assertWithinAvailability(base.therapistId, dt);
      const conflict = await appointmentRepository.findConflict(base.therapistId, dt);
      if (conflict) {
        const time = new Date(conflict.dateTime).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });
        throw new AppError(`El terapeuta ya tiene una cita el ${time}. Ajusta el horario de la serie.`, 409);
      }
    }

    const recurrenceGroupId = useRecurrence ? randomUUID() : undefined;
    const created = [];
    for (const dt of dateTimes) {
      created.push(await appointmentRepository.create({ ...base, dateTime: dt, recurrenceGroupId }));
    }
    const appt = created[0];

    emailService.sendAppointmentReminder({
      patientName:   appt.patient.name,
      patientEmail:  appt.patient.email,
      therapistName: appt.therapist.name,
      dateTime:      appt.dateTime,
      notes:         appt.notes ?? undefined,
    }).catch(err => logger.error('appointment_confirmation_email_failed', { appointmentId: appt.id, error: err.message }));

    if (actor?.role === 'PATIENT') {
      notificationService.createInApp(
        appt.therapistId,
        'APPOINTMENT',
        'Nueva cita agendada',
        `${appt.patient.name} agendó una cita para el ${appt.dateTime.toLocaleString('es-MX')}.`,
        '/therapist',
      );
    }

    return appt;
  },

  async update(id: string, data: { dateTime?: string; status?: string; roomId?: string | null; treatmentPlanId?: string | null; notes?: string }) {
    const existing = await this.getById(id);

    if (data.dateTime && existing.status !== 'CANCELLED') {
      const dt = new Date(data.dateTime);
      await assertWithinAvailability(existing.therapistId, dt);
      const conflict = await appointmentRepository.findConflict(existing.therapistId, dt, id);
      if (conflict) {
        const time = new Date(conflict.dateTime).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
        throw new AppError(`El terapeuta ya tiene una cita programada a las ${time}. Por favor elige otro horario.`, 409);
      }
    }

    return appointmentRepository.update(id, {
      ...data,
      dateTime: data.dateTime ? new Date(data.dateTime) : undefined,
    });
  },

  async cancel(id: string, actor?: Actor, scope: 'one' | 'series' = 'one') {
    const appt = await this.getById(id);
    if (actor?.role === 'PATIENT' && appt.patientId !== actor.id) {
      throw new AppError('Solo puedes cancelar tus propias citas', 403);
    }

    if (scope === 'series' && appt.recurrenceGroupId) {
      await appointmentRepository.cancelFutureInGroup(appt.recurrenceGroupId, appt.dateTime);
    } else {
      await appointmentRepository.update(id, { status: 'CANCELLED' });
    }

    waitlistService.notifySlotFreed(appt.therapistId, appt.dateTime)
      .catch(err => logger.error('waitlist_notify_failed', { appointmentId: id, error: (err as Error).message }));

    return this.getById(id);
  },

  async confirm(id: string) {
    const appt = await this.getById(id);
    if (appt.status !== 'SCHEDULED') {
      throw new AppError('Solo se pueden confirmar citas en estado Programada', 409);
    }
    return appointmentRepository.update(id, { status: 'CONFIRMED' });
  },

  async sendReminder(id: string) {
    const appt = await this.getById(id);
    if (appt.status === 'CANCELLED') throw new AppError('No se puede enviar recordatorio a una cita cancelada', 400);

    const result = await emailService.sendAppointmentReminder({
      patientName: appt.patient.name,
      patientEmail: appt.patient.email,
      therapistName: appt.therapist.name,
      dateTime: appt.dateTime,
      notes: appt.notes ?? undefined,
    });

    return result;
  },
};
