import { notificationPreferenceRepository } from '../repositories/notificationPreference.repository';

const CLINIC_TZ = process.env.CLINIC_TZ ?? 'America/Mexico_City';

function currentClinicTime(): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: CLINIC_TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date());
}

export function isWithinQuietHours(start: string, end: string, now: string): boolean {
  if (start === end) return false;
  if (start < end) return now >= start && now < end;
  return now >= start || now < end;
}

export const notificationPreferenceService = {
  async get(userId: string) {
    const pref = await notificationPreferenceRepository.findByUserId(userId);
    return pref ?? {
      userId,
      emailEnabled: true,
      routineReminders: true,
      appointmentReminders: true,
      quietHoursStart: null,
      quietHoursEnd: null,
    };
  },

  update(userId: string, data: {
    emailEnabled?: boolean;
    routineReminders?: boolean;
    appointmentReminders?: boolean;
    quietHoursStart?: string | null;
    quietHoursEnd?: string | null;
  }) {
    return notificationPreferenceRepository.upsert(userId, data);
  },

  async isAllowed(userId: string, channel: 'routine' | 'appointment' | 'general'): Promise<boolean> {
    const pref = await notificationPreferenceRepository.findByUserId(userId);
    if (!pref) return true;
    if (!pref.emailEnabled) return false;
    if (channel === 'routine' && !pref.routineReminders) return false;
    if (channel === 'appointment' && !pref.appointmentReminders) return false;
    if (pref.quietHoursStart && pref.quietHoursEnd &&
        isWithinQuietHours(pref.quietHoursStart, pref.quietHoursEnd, currentClinicTime())) {
      return false;
    }
    return true;
  },
};
