import { activityTemplateRepository } from '../repositories/activityTemplate.repository';

export const activityTemplateService = {
  getAll() {
    return activityTemplateRepository.findAll();
  },

  create(data: { title: string; description: string; type: string; bodyPart?: string; videoUrl?: string; imageUrl?: string }) {
    return activityTemplateRepository.create(data);
  },

  delete(id: string) {
    return activityTemplateRepository.delete(id);
  },
};
