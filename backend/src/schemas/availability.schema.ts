import { z } from 'zod';

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export const setAvailabilitySchema = z.object({
  slots: z
    .array(
      z
        .object({
          dayOfWeek: z.number().int().min(0).max(6),
          startTime: z.string().regex(TIME, 'Formato de hora inválido (HH:MM)'),
          endTime: z.string().regex(TIME, 'Formato de hora inválido (HH:MM)'),
        })
        .refine(s => s.startTime < s.endTime, {
          message: 'La hora de inicio debe ser anterior a la de fin',
        }),
    )
    .max(7),
});
