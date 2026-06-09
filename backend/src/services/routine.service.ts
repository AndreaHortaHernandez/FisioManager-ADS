import { routineRepository } from '../repositories/routine.repository';
import { AppError } from '../errors/AppError';

export const routineService = {
  async getForUser(userId: string, role: string) {
    if (role === 'THERAPIST') return routineRepository.findAll();
    return routineRepository.findByPatientId(userId);
  },

  async getLibrary() {
    return routineRepository.findLibrary();
  },

  async getById(id: string) {
    const routine = await routineRepository.findById(id);
    if (!routine) throw new AppError('Rutina no encontrada', 404);
    return routine;
  },

  async create(data: {
    title: string;
    type: string;
    patientId?: string | null;
    activities: {
      templateId?: string;
      title: string;
      description: string;
      durationMinutes: number;
      restSeconds?: number;
      repetitions: number;
      type: string;
      order: number;
      videoUrl?: string;
    }[];
  }) {
    return routineRepository.create(data);
  },

  async markComplete(id: string, requesterId: string, role: string) {
    const routine = await routineRepository.findById(id);
    if (!routine) throw new AppError('Rutina no encontrada', 404);

    if (role === 'PATIENT' && routine.patientId !== requesterId) {
      throw new AppError('No autorizado', 403);
    }

    return routineRepository.markComplete(id);
  },

  async assignToPatients(routineId: string, patientIds: string[]) {
    const template = await routineRepository.findById(routineId);
    if (!template) throw new AppError('Rutina no encontrada', 404);
    if (template.patientId !== null) {
      throw new AppError('Solo se pueden asignar rutinas de la biblioteca', 400);
    }

    const created = await Promise.all(
      patientIds.map(patientId =>
        routineRepository.create({
          title: template.title,
          type: template.type,
          patientId,
          assignedDate: new Date(),
          activities: template.activities.map(a => ({
            templateId: a.templateId ?? a.id,
            title: a.title,
            description: a.description,
            durationMinutes: a.durationMinutes,
            restSeconds: a.restSeconds ?? undefined,
            repetitions: a.repetitions,
            type: a.type,
            order: a.order,
            videoUrl: a.videoUrl ?? undefined,
          })),
        })
      )
    );

    return created;
  },
};
