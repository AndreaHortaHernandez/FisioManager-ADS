import { z } from 'zod';

export const createOutcomeMeasureSchema = z.object({
  patientId: z.string().min(1),
  type: z.enum(['ROM', 'STRENGTH', 'FUNCTIONAL', 'VAS']),
  label: z.string().optional(),
  value: z.number(),
  unit: z.string().optional(),
  measuredAt: z.string().optional(),
});
