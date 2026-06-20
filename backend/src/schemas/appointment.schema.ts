import { z } from 'zod';

export const createAppointmentSchema = z.object({
  patientId: z.string().min(1),
  therapistId: z.string().min(1),
  dateTime: z.string().datetime({ offset: true }).or(z.string().min(1)),
  roomId: z.string().optional(),
  treatmentPlanId: z.string().optional(),
  notes: z.string().optional(),
  recurrence: z
    .object({
      frequency: z.enum(['WEEKLY', 'BIWEEKLY']),
      count: z.number().int().min(2).max(26),
    })
    .optional(),
});

export const updateAppointmentSchema = z.object({
  dateTime: z.string().optional(),
  status: z.enum(['SCHEDULED', 'CONFIRMED', 'CANCELLED', 'COMPLETED']).optional(),
  roomId: z.string().nullable().optional(),
  treatmentPlanId: z.string().nullable().optional(),
  notes: z.string().optional(),
});
