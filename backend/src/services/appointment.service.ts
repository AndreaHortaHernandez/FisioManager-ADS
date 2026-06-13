import { appointmentRepository } from '../repositories/appointment.repository';
import { emailService } from './email.service';
import { AppError } from '../errors/AppError';

export const appointmentService = {
  async getAll(filters: { date?: string; therapistId?: string; patientId?: string; status?: string }) {
    return appointmentRepository.findAll(filters);
  },

  async getById(id: string) {
    const appt = await appointmentRepository.findById(id);
    if (!appt) throw new AppError('Cita no encontrada', 404);
    return appt;
  },

  async create(data: { patientId: string; therapistId: string; dateTime: string; notes?: string }) {
    const dt = new Date(data.dateTime);

    const conflict = await appointmentRepository.findConflict(data.therapistId, dt);
    if (conflict) {
      const time = new Date(conflict.dateTime).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
      throw new AppError(`El terapeuta ya tiene una cita programada a las ${time}. Por favor elige otro horario.`, 409);
    }

    const appt = await appointmentRepository.create({ ...data, dateTime: dt });

    // Recordatorio automático — no bloquea si falla el correo
    emailService.sendAppointmentReminder({
      patientName:   appt.patient.name,
      patientEmail:  appt.patient.email,
      therapistName: appt.therapist.name,
      dateTime:      appt.dateTime,
      notes:         appt.notes ?? undefined,
    }).catch(err => console.error('[Email] Error al enviar recordatorio automático:', err));

    return appt;
  },

  async update(id: string, data: { dateTime?: string; status?: string; notes?: string }) {
    const existing = await this.getById(id);

    if (data.dateTime && existing.status !== 'CANCELLED') {
      const dt = new Date(data.dateTime);
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
