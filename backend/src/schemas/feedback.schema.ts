import { z } from 'zod';

export const createFeedbackSchema = z.object({
  routineId:      z.string().optional(),
  painLevel:      z.number().int().min(1).max(10),
  emotionalState: z.enum(['GREAT', 'GOOD', 'OK', 'BAD', 'TERRIBLE']),
  audioRecordUrl: z.string().optional(),
  transcript:     z.string().optional(),
  aiSummary:      z.string().optional(),
});
