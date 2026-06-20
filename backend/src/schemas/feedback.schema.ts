import { z } from 'zod';

export const painPointSchema = z.object({
  bodyPart:  z.enum(['KNEE', 'BACK', 'SHOULDER', 'NECK', 'ARM', 'HIP', 'ANKLE', 'OTHER']),
  side:      z.enum(['LEFT', 'RIGHT', 'CENTER']).optional(),
  intensity: z.number().int().min(1).max(10),
  note:      z.string().optional(),
});

export const createFeedbackSchema = z.object({
  routineId:      z.string().optional(),
  painLevel:      z.number().int().min(1).max(10),
  emotionalState: z.enum(['GREAT', 'GOOD', 'OK', 'BAD', 'TERRIBLE']),
  audioRecordUrl: z.string().optional(),
  transcript:     z.string().optional(),
  aiSummary:      z.string().optional(),
  painPoints:     z.array(painPointSchema).optional(),
});
