import { notificationPreferenceRepository } from '../repositories/notificationPreference.repository';

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
    return true;
  },
};
