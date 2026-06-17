import { userRepository } from '../repositories/user.repository';
import { appointmentRepository } from '../repositories/appointment.repository';
import { emailService } from './email.service';

const HIGH_PAIN_THRESHOLD = 7;
const REMINDER_INTERVAL_MS = 60 * 60 * 1000; // cada hora

export const notificationService = {
  // Alerta al terapeuta cuando el paciente reporta dolor alto.
  async alertHighPain(patientId: string, painLevel: number, emotionalState: string) {
    if (painLevel < HIGH_PAIN_THRESHOLD) return;

    const patient = await userRepository.findById(patientId);
    const therapistId = patient?.patientProfile?.therapistId;
    if (!patient || !therapistId) return;

    const therapist = await userRepository.findById(therapistId);
    if (!therapist?.email) return;

    await emailService.sendHighPainAlert({
      therapistName:  therapist.name,
      therapistEmail: therapist.email,
      patientName:    patient.name,
      painLevel,
      emotionalState,
    });
  },

  // Notifica al paciente cuando se le asigna una rutina.
  async notifyRoutineAssigned(patientId: string, therapistId: string, routineTitle: string) {
    const patient = await userRepository.findById(patientId);
    if (!patient?.email) return;

    const therapist = await userRepository.findById(therapistId);

    await emailService.sendRoutineAssigned({
      patientName:   patient.name,
      patientEmail:  patient.email,
      therapistName: therapist?.name ?? 'tu terapeuta',
      routineTitle,
    });
  },

  // Recordatorio de cita 24h antes.
  async sendDue24hReminders(): Promise<number> {
    const appts = await appointmentRepository.findDueForReminder();
    for (const appt of appts) {
      try {
        await emailService.sendAppointmentReminder({
          patientName:   appt.patient.name,
          patientEmail:  appt.patient.email,
          therapistName: appt.therapist.name,
          dateTime:      appt.dateTime,
          notes:         appt.notes ?? undefined,
        });
        await appointmentRepository.markReminded(appt.id);
      } catch (err) {
        console.error('[Notif] Error al enviar recordatorio 24h:', err);
      }
    }
    if (appts.length > 0) console.log(`[Notif] ${appts.length} recordatorio(s) de cita 24h enviado(s).`);
    return appts.length;
  },

  // Arranca el scheduler que revisa periódicamente las citas próximas.
  startReminderScheduler() {
    this.sendDue24hReminders().catch(err => console.error('[Notif] Scheduler inicial:', err));
    setInterval(() => {
      this.sendDue24hReminders().catch(err => console.error('[Notif] Scheduler:', err));
    }, REMINDER_INTERVAL_MS).unref();
    console.log('[Notif] Scheduler de recordatorios 24h activo (cada hora).');
  },
};
