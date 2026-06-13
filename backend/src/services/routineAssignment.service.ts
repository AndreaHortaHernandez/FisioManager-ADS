import { routineAssignmentRepository } from '../repositories/routineAssignment.repository';
import { routineRepository } from '../repositories/routine.repository';
import { AppError } from '../errors/AppError';

export const routineAssignmentService = {
  getAll(therapistId: string) {
    return routineAssignmentRepository.findAll(therapistId);
  },

  getByPatient(patientId: string) {
    return routineAssignmentRepository.findByPatient(patientId);
  },

  async create(data: {
    routineId: string;
    patientId: string;
    therapistId: string;
    startDate: string;
    endDate?: string;
    frequency: string;
  }) {
    // Verificar que la rutina template existe
    const template = await routineRepository.findById(data.routineId);
    if (!template) throw new AppError('Rutina no encontrada', 404);

    // Crear copia de la rutina para el paciente (así la ve en su home)
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

    // Crear el registro de asignación para seguimiento
    return routineAssignmentRepository.create({
      ...data,
      startDate: new Date(data.startDate),
      endDate:   data.endDate ? new Date(data.endDate) : undefined,
    });
  },

  async updateStatus(id: string, status: string, therapistId: string) {
    const assignment = await routineAssignmentRepository.findById(id);
    if (!assignment) throw new AppError('Asignación no encontrada', 404);
    if (assignment.therapistId !== therapistId) throw new AppError('Sin permiso', 403);
    return routineAssignmentRepository.updateStatus(id, status);
  },
};
