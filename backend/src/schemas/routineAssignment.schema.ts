import { z } from 'zod';

export const createAssignmentSchema = z.object({
  routineId:   z.string().min(1),
  patientId:   z.string().min(1),
  startDate:   z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  endDate:     z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  frequency:   z.enum(['DAILY', 'EVERY_OTHER_DAY', 'WEEKLY']),
});

export const updateAssignmentSchema = z.object({
  status: z.enum(['ACTIVE', 'PAUSED', 'CANCELLED']),
});
