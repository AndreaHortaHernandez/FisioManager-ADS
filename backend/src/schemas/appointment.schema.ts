import { z } from 'zod';

export const createAppointmentSchema = z.object({
  patientId: z.string().min(1),
  therapistId: z.string().min(1),
  dateTime: z.string().datetime({ offset: true }).or(z.string().min(1)),
  notes: z.string().optional(),
});

export const updateAppointmentSchema = z.object({
  dateTime: z.string().optional(),
  status: z.enum(['SCHEDULED', 'CANCELLED', 'COMPLETED']).optional(),
  notes: z.string().optional(),
});
