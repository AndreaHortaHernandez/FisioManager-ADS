import { z } from 'zod';

export const createPlanSchema = z.object({
  name:         z.string().min(2),
  clinicalGoal: z.string().optional(),
  startDate:    z.string().min(1),
  endDate:      z.string().optional(),
  status:       z.enum(['ACTIVE', 'COMPLETED', 'SUSPENDED']).optional(),
});

export const updatePlanSchema = z
  .object({
    name:         z.string().min(2).optional(),
    clinicalGoal: z.string().optional(),
    startDate:    z.string().min(1).optional(),
    endDate:      z.string().nullable().optional(),
    status:       z.enum(['ACTIVE', 'COMPLETED', 'SUSPENDED']).optional(),
  })
  .refine(d => Object.keys(d).length > 0, { message: 'No hay campos para actualizar' });

export const createPhaseSchema = z.object({
  name:          z.string().min(2),
  order:         z.number().int().min(1),
  durationWeeks: z.number().int().min(1),
  objectives:    z.string().optional(),
});

export const updatePhaseSchema = z
  .object({
    name:          z.string().min(2).optional(),
    order:         z.number().int().min(1).optional(),
    durationWeeks: z.number().int().min(1).optional(),
    objectives:    z.string().optional(),
  })
  .refine(d => Object.keys(d).length > 0, { message: 'No hay campos para actualizar' });
