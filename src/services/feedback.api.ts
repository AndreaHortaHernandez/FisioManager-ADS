import { api } from './api';
import type { Feedback } from '../types';
import type { PainPointInput } from './metrics.api';

interface CreateFeedbackPayload {
  routineId?:     string;
  painLevel:      number;
  emotionalState: Feedback['emotionalState'];
  audioRecordUrl?: string;
  transcript?:    string;
  aiSummary?:     string;
  painPoints?:    PainPointInput[];
}

export const feedbackApi = {
  getAll: () => api.get<Feedback[]>('/feedback'),
  create: (data: CreateFeedbackPayload) => api.post<Feedback>('/feedback', data),
};
