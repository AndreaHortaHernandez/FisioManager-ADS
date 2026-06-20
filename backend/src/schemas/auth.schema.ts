import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export const verifySchema = z.object({
  token: z.string().min(1, 'Token requerido'),
});

export const recoverSchema = z.object({
  email: z.string().email('Email inválido'),
});

export const resetSchema = z.object({
  token: z.string().min(1, 'Token requerido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Contraseña actual requerida'),
  newPassword: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token requerido'),
});

export const updateProfileSchema = z
  .object({
    phone: z.string().max(20).optional(),
    avatarUrl: z.string().url().optional(),
  })
  .refine(d => Object.keys(d).length > 0, { message: 'No hay campos para actualizar' });
