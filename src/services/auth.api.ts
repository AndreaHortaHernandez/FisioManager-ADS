import { api } from './api';
import type { Role } from '../types';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string;
  patientProfile?: {
    userId: string;
    age: number;
    condition: string;
    therapistId: string;
  } | null;
}

interface LoginResponse {
  token: string;
  user: AuthUser;
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>('/auth/login', { email, password }),

  signup: (name: string, email: string, password: string) =>
    api.post<LoginResponse>('/auth/signup', { name, email, password }),

  logout: () => api.post<{ message: string }>('/auth/logout'),

  recover: (email: string) =>
    api.post<{ message: string }>('/auth/recover', { email }),

  reset: (token: string, password: string) =>
    api.post<{ message: string }>('/auth/reset', { token, password }),

  getMe: () => api.get<AuthUser>('/auth/me'),
};
