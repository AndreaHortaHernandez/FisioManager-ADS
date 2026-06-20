import { userRepository } from '../repositories/user.repository';
import { appointmentRepository } from '../repositories/appointment.repository';
import { routineAssignmentRepository } from '../repositories/routineAssignment.repository';
import { notificationPreferenceService } from './notificationPreference.service';
import { emailService } from './email.service';
import { logger } from '../lib/logger';

const HIGH_PAIN_THRESHOLD = 7;
const REMINDER_INTERVAL_MS = 60 * 60 * 1000; 
const FREQUENCY_DAYS: Record<string, number> = { DAILY: 1, EVERY_OTHER_DAY: 2, WEEKLY: 7 };

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export const notificationService = {

  async alertHighPain(patientId: string, painLevel: number, emotionalState: string) {
    if (painLevel < HIGH_PAIN_THRESHOLD) return;

    const patient = await userRepository.findById(patientId);
    const therapistId = patient?.patientProfile?.therapistId;
    if (!patient || !therapistId) return;

    const therapist = await userRepository.findById(therapistId);
    if (!therapist?.email) return;
    if (!(await notificationPreferenceService.isAllowed(therapistId, 'general'))) return;

    await emailService.sendHighPainAlert({
      therapistName:  therapist.name,
      therapistEmail: therapist.email,
      patientName:    patient.name,
      painLevel,
      emotionalState,
    });
  },

  async notifyRoutineAssigned(patientId: string, therapistId: string, routineTitle: string) {
    const patient = await userRepository.findById(patientId);
    if (!patient?.email) return;
    if (!(await notificationPreferenceService.isAllowed(patientId, 'general'))) return;

    const therapist = await userRepository.findById(therapistId);

    await emailService.sendRoutineAssigned({
      patientName:   patient.name,
      patientEmail:  patient.email,
      therapistName: therapist?.name ?? 'tu terapeuta',
      routineTitle,
    });
  },

  async sendDue24hReminders(): Promise<number> {
    const appts = await appointmentRepository.findDueForReminder();
    let sent = 0;
    for (const appt of appts) {
      try {
        if (!(await notificationPreferenceService.isAllowed(appt.patientId, 'appointment'))) {
          await appointmentRepository.markReminded(appt.id);
          continue;
        }
        await appointmentRepository.markReminded(appt.id);
        await emailService.sendAppointmentReminder({
          patientName:   appt.patient.name,
          patientEmail:  appt.patient.email,
          therapistName: appt.therapist.name,
          dateTime:      appt.dateTime,
          notes:         appt.notes ?? undefined,
        });
        sent++;
      } catch (err) {
        logger.error('appointment_reminder_failed', { appointmentId: appt.id, error: (err as Error).message });
      }
    }
    if (sent > 0) logger.info('appointment_reminders_sent', { count: sent });
    return sent;
  },

  async sendDueRoutineReminders(): Promise<number> {
    const assignments = await routineAssignmentRepository.findActiveForReminders();
    const now = new Date();
    let sent = 0;

    for (const a of assignments) {
      const intervalDays = FREQUENCY_DAYS[a.frequency] ?? 1;
      const daysSinceStart = Math.floor((startOfDay(now).getTime() - startOfDay(a.startDate).getTime()) / 86_400_000);
      const isDueToday = daysSinceStart >= 0 && daysSinceStart % intervalDays === 0;
      if (!isDueToday) continue;

      const alreadyRemindedToday = a.lastReminderAt && startOfDay(a.lastReminderAt).getTime() === startOfDay(now).getTime();
      if (alreadyRemindedToday) continue;

      try {
        if (!(await notificationPreferenceService.isAllowed(a.patientId, 'routine'))) {
          await routineAssignmentRepository.markReminded(a.id, now);
          continue;
        }
        if (!a.patient.email) continue;
        await routineAssignmentRepository.markReminded(a.id, now);
        await emailService.sendRoutineReminder({
          patientName:  a.patient.name,
          patientEmail: a.patient.email,
          routineTitle: a.routine.title,
        });
        sent++;
      } catch (err) {
        logger.error('routine_reminder_failed', { assignmentId: a.id, error: (err as Error).message });
      }
    }
    if (sent > 0) logger.info('routine_reminders_sent', { count: sent });
    return sent;
  },

  startReminderScheduler() {
    const tick = () => {
      this.sendDue24hReminders().catch(err => logger.error('reminder_scheduler_failed', { kind: 'appointment', error: err.message }));
      this.sendDueRoutineReminders().catch(err => logger.error('reminder_scheduler_failed', { kind: 'routine', error: err.message }));
    };
    tick();
    setInterval(tick, REMINDER_INTERVAL_MS).unref();
    logger.info('reminder_scheduler_started', { intervalMs: REMINDER_INTERVAL_MS });
  },
};
