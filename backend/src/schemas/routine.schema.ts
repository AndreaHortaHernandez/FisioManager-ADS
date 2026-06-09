import { z } from 'zod';

const activitySchema = z.object({
  templateId: z.string().optional(),
  title: z.string().min(1),
  description: z.string().min(1),
  durationMinutes: z.number().int().positive(),
  restSeconds: z.number().int().min(0).optional(),
  repetitions: z.number().int().positive(),
  type: z.enum(['PHYSICAL', 'BREATHING']),
  order: z.number().int().min(1),
  videoUrl: z.string().optional(),
});

export const createRoutineSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio'),
  type: z.enum(['TREATMENT', 'RELAXATION']),
  patientId: z.string().nullable().optional(),
  activities: z.array(activitySchema).min(1, 'Debe tener al menos una actividad'),
});

export const assignRoutineSchema = z.object({
  patientIds: z.array(z.string()).min(1, 'Selecciona al menos un paciente'),
});
