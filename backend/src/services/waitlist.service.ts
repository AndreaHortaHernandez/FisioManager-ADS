import { waitlistRepository } from '../repositories/waitlist.repository';
import { userRepository } from '../repositories/user.repository';
import { notificationService } from './notification.service';
import { AppError } from '../errors/AppError';

interface Actor {
  id: string;
  role: string;
}

export const waitlistService = {
  async join(actor: Actor, data: { therapistId: string; desiredFrom: string; desiredTo: string }) {
    const patient = await userRepository.findById(actor.id);
    if (!patient || patient.role !== 'PATIENT') throw new AppError('Solo los pacientes pueden unirse a la lista de espera', 403);
    if (patient.patientProfile?.therapistId !== data.therapistId) {
      throw new AppError('Solo puedes unirte a la lista de espera de tu terapeuta asignado', 403);
    }
    const from = new Date(data.desiredFrom);
    const to = new Date(data.desiredTo);
    if (isNaN(from.getTime()) || isNaN(to.getTime()) || to < from) {
      throw new AppError('Rango de fechas inválido', 422);
    }
    return waitlistRepository.create({ patientId: actor.id, therapistId: data.therapistId, desiredFrom: from, desiredTo: to });
  },

  listForPatient(patientId: string) {
    return waitlistRepository.findForUser(patientId);
  },

  listForTherapist(therapistId: string) {
    return waitlistRepository.findByTherapist(therapistId);
  },

  async remove(actor: Actor, id: string) {
    const entry = await waitlistRepository.findById(id);
    if (!entry) throw new AppError('Entrada no encontrada', 404);
    if (actor.role === 'PATIENT' && entry.patientId !== actor.id) {
      throw new AppError('No puedes eliminar esta entrada', 403);
    }
    await waitlistRepository.delete(id);
    return { message: 'Saliste de la lista de espera' };
  },

  async notifySlotFreed(therapistId: string, when: Date) {
    const matches = await waitlistRepository.findMatching(therapistId, when);
    const therapist = await userRepository.findById(therapistId);
    for (const entry of matches) {
      notificationService.createInApp(
        entry.patientId,
        'APPOINTMENT',
        'Se liberó un horario',
        `Se liberó un espacio con ${therapist?.name ?? 'tu terapeuta'} el ${when.toLocaleString('es-MX')}. ¡Agéndalo pronto!`,
        '/patient/book',
      );
      await waitlistRepository.updateStatus(entry.id, 'NOTIFIED');
    }
    return matches.length;
  },
};
