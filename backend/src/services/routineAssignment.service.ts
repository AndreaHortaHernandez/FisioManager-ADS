import { routineAssignmentRepository } from '../repositories/routineAssignment.repository';
import { routineRepository } from '../repositories/routine.repository';
import { notificationService } from './notification.service';
import { AppError } from '../errors/AppError';
import { logger } from '../lib/logger';

export const routineAssignmentService = {
  getAll(therapistId: string) {
    return routineAssignmentRepository.findAll(therapistId);
  },

  getByPatient(patientId: string) {
    return routineAssignmentRepository.findByPatient(patientId);
  },

  getByPhase(phaseId: string) {
    return routineAssignmentRepository.findByPhase(phaseId);
  },

  async create(data: {
    routineId: string;
    patientId: string;
    therapistId: string;
    phaseId?: string;
    startDate: string;
    endDate?: string;
    frequency: string;
  }) {

    const template = await routineRepository.findById(data.routineId);
    if (!template) throw new AppError('Rutina no encontrada', 404);

    await routineRepository.create({
      title:       template.title,
      type:        template.type,
      patientId:   data.patientId,
      assignedDate: new Date(data.startDate),
      activities:  template.activities.map(a => ({
        templateId:      a.templateId ?? undefined,
        title:           a.title,
        description:     a.description,
        durationMinutes: a.durationMinutes,
        restSeconds:     a.restSeconds  ?? undefined,
        repetitions:     a.repetitions,
        type:            a.type,
        order:           a.order,
        videoUrl:        a.videoUrl     ?? undefined,
      })),
    });

    const assignment = await routineAssignmentRepository.create({
      ...data,
      startDate: new Date(data.startDate),
      endDate:   data.endDate ? new Date(data.endDate) : undefined,
    });

    notificationService
      .notifyRoutineAssigned(data.patientId, data.therapistId, template.title)
      .catch(err => logger.error('routine_assigned_notification_failed', { patientId: data.patientId, error: err.message }));

    return assignment;
  },

  async update(id: string, data: { status?: string; phaseId?: string | null }, therapistId: string) {
    const assignment = await routineAssignmentRepository.findById(id);
    if (!assignment) throw new AppError('Asignación no encontrada', 404);
    if (assignment.therapistId !== therapistId) throw new AppError('Sin permiso', 403);
    return routineAssignmentRepository.update(id, data);
  },
};
