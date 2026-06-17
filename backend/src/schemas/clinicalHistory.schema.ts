import { z } from 'zod';

export const upsertHistorySchema = z.object({
  bloodType:  z.string().max(10).optional(),
  allergies:  z.string().optional(),
  background: z.string().optional(),
});

export const createDiagnosisSchema = z.object({
  cie10Code:   z.string().min(1).max(20),
  description: z.string().min(1),
  status:      z.enum(['ACTIVE', 'RESOLVED']).optional(),
});

export const updateDiagnosisSchema = z
  .object({
    cie10Code:   z.string().min(1).max(20).optional(),
    description: z.string().min(1).optional(),
    status:      z.enum(['ACTIVE', 'RESOLVED']).optional(),
  })
  .refine(d => Object.keys(d).length > 0, { message: 'No hay campos para actualizar' });

export const createNoteSchema = z.object({
  content: z.string().min(1),
});
