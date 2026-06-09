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

  getMe: () => api.get<AuthUser>('/auth/me'),
};
