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

export const createAssignmentSchema = z.object({
  patientId: z.string().min(1),
  therapistId: z.string().min(1),
});

export const updateUserSchema = z
  .object({
    name:         z.string().min(2).optional(),
    phone:        z.string().optional(),
    avatarUrl:    z.string().url().optional(),

    age:          z.number().int().min(1).max(120).optional(),
    condition:    z.string().min(2).optional(),
    therapistId:  z.string().min(1).optional(),

    cedula:       z.string().optional(),
    especialidad: z.string().optional(),
  })
  .refine(d => Object.keys(d).length > 0, { message: 'No hay campos para actualizar' });
