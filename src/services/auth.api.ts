import { api } from './api';
import type { Role } from '../types';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string;
  phone?: string;
  audioConsentAt?: string | null;
  patientProfile?: {
    userId: string;
    age: number;
    condition: string;
    therapistId: string;
  } | null;
}

interface LoginResponse {
  token: string;
  refreshToken: string;
  user: AuthUser;
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>('/auth/login', { email, password }),

  logout: (refreshToken?: string | null) => api.post<{ message: string }>('/auth/logout', { refreshToken }),

  refresh: (refreshToken: string) =>
    api.post<{ token: string; refreshToken: string }>('/auth/refresh', { refreshToken }),

  recover: (email: string) =>
    api.post<{ message: string }>('/auth/recover', { email }),

  reset: (token: string, password: string) =>
    api.post<{ message: string }>('/auth/reset', { token, password }),

  getMe: () => api.get<AuthUser>('/auth/me'),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.patch<{ message: string }>('/auth/password', { currentPassword, newPassword }),

  giveConsent: () => api.post<{ audioConsentAt: string }>('/auth/consent'),

  updateProfile: (data: { phone?: string; avatarUrl?: string }) =>
    api.patch<AuthUser>('/auth/profile', data),

  uploadAvatar: (file: File) => {
    const fd = new FormData();
    fd.append('avatar', file);
    return api.postForm<AuthUser>('/auth/avatar', fd);
  },
};
