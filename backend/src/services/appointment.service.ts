import { appointmentRepository } from '../repositories/appointment.repository';
import { availabilityRepository } from '../repositories/availability.repository';
import { emailService } from './email.service';
import { AppError } from '../errors/AppError';
import { logger } from '../lib/logger';

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

  async create(data: { patientId: string; therapistId: string; dateTime: string; roomId?: string; treatmentPlanId?: string; notes?: string }) {
    const dt = new Date(data.dateTime);

    await assertWithinAvailability(data.therapistId, dt);

    const conflict = await appointmentRepository.findConflict(data.therapistId, dt);
    if (conflict) {
      const time = new Date(conflict.dateTime).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
      throw new AppError(`El terapeuta ya tiene una cita programada a las ${time}. Por favor elige otro horario.`, 409);
    }

    const appt = await appointmentRepository.create({ ...data, dateTime: dt });

    emailService.sendAppointmentReminder({
      patientName:   appt.patient.name,
      patientEmail:  appt.patient.email,
      therapistName: appt.therapist.name,
      dateTime:      appt.dateTime,
      notes:         appt.notes ?? undefined,
    }).catch(err => logger.error('appointment_confirmation_email_failed', { appointmentId: appt.id, error: err.message }));

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

  async cancel(id: string) {
    await this.getById(id);
    return appointmentRepository.update(id, { status: 'CANCELLED' });
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
