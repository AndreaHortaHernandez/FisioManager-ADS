import { api } from './api';

export interface AppNotification {
  id: string;
  userId: string;
  type: 'APPOINTMENT' | 'ROUTINE' | 'HIGH_PAIN' | 'MESSAGE' | 'SYSTEM';
  title: string;
  body: string;
  linkUrl: string | null;
  read: boolean;
  createdAt: string;
}

export const notificationsApi = {
  list: () => api.get<AppNotification[]>('/notifications'),
  unreadCount: () => api.get<{ count: number }>('/notifications/unread-count'),
  markRead: (id: string) => api.patch<{ message: string }>(`/notifications/${id}/read`, {}),
  markAllRead: () => api.patch<{ message: string }>('/notifications/read-all', {}),
};
