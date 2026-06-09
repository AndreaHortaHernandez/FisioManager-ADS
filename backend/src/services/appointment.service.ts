import { appointmentRepository } from '../repositories/appointment.repository';
import { emailService } from './email.service';
import { AppError } from '../errors/AppError';

export const appointmentService = {
  async getAll(filters: { date?: string; therapistId?: string; status?: string }) {
    return appointmentRepository.findAll(filters);
  },

  async getById(id: string) {
    const appt = await appointmentRepository.findById(id);
    if (!appt) throw new AppError('Cita no encontrada', 404);
    return appt;
  },

  async create(data: { patientId: string; therapistId: string; dateTime: string; notes?: string }) {
    return appointmentRepository.create({
      ...data,
      dateTime: new Date(data.dateTime),
    });
  },

  async update(id: string, data: { dateTime?: string; status?: string; notes?: string }) {
    await this.getById(id);
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
