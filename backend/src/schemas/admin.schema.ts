import { z } from 'zod';

export const registerTherapistSchema = z.object({
  name:         z.string().min(2),
  email:        z.string().email(),
  password:     z.string().min(6),
  phone:        z.string().optional(),
  avatarUrl:    z.string().url().optional(),
  cedula:       z.string().optional(),
  especialidad: z.string().optional(),
});

export const registerPatientSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  age: z.number().int().min(1).max(120),
  condition: z.string().min(2),
  therapistId: z.string().min(1),
});

export const assignPatientSchema = z.object({
  therapistId: z.string().min(1),
});
