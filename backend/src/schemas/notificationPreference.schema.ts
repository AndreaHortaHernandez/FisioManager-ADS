import { z } from 'zod';

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export const updateNotificationPreferenceSchema = z.object({
  emailEnabled:         z.boolean().optional(),
  routineReminders:     z.boolean().optional(),
  appointmentReminders: z.boolean().optional(),
  quietHoursStart:      z.string().regex(TIME).nullable().optional(),
  quietHoursEnd:        z.string().regex(TIME).nullable().optional(),
});
