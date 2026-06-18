import { api } from './api';

export interface NotificationPreference {
  emailEnabled: boolean;
  routineReminders: boolean;
  appointmentReminders: boolean;
  quietHoursStart?: string | null;
  quietHoursEnd?: string | null;
}

export const notificationPreferenceApi = {
  get: () => api.get<NotificationPreference>('/notificaciones'),

  update: (data: Partial<NotificationPreference>) =>
    api.put<NotificationPreference>('/notificaciones', data),
};
