import { z } from 'zod';

export const createWaitlistSchema = z.object({
  therapistId: z.string().min(1),
  desiredFrom: z.string().min(1),
  desiredTo: z.string().min(1),
});
