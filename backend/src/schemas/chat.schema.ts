import { z } from 'zod';

export const createConversationSchema = z.object({
  userId: z.string().min(1),
});

export const sendMessageSchema = z.object({
  content: z.string().min(1).max(2000),
});
