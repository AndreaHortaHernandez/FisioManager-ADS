import { api } from './api';
import type { ActivityTemplate } from '../types';

export const activityTemplatesApi = {
  getAll: () => api.get<ActivityTemplate[]>('/activity-templates'),

  create: (formData: FormData) =>
    api.postForm<ActivityTemplate>('/activity-templates', formData),
};
