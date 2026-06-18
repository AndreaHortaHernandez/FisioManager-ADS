import { sessionRepository } from '../repositories/session.repository';
import { routineRepository } from '../repositories/routine.repository';
import { AppError } from '../errors/AppError';

export const sessionService = {
  async start(routineId: string, patientId: string) {
    const routine = await routineRepository.findById(routineId);
    if (!routine) throw new AppError('Rutina no encontrada', 404);
    return sessionRepository.create({ routineId, patientId });
  },

  async trackExercise(
    sessionId: string,
    patientId: string,
    data: { activityId: string; order: number; status: 'COMPLETED' | 'SKIPPED' | 'NOT_COMPLETED' },
  ) {
    const session = await sessionRepository.findById(sessionId);
    if (!session) throw new AppError('Sesión no encontrada', 404);
    if (session.patientId !== patientId) throw new AppError('Sin permiso', 403);
    if (session.status === 'FINISHED') throw new AppError('La sesión ya fue finalizada', 409);
    return sessionRepository.upsertExercise({ sessionId, ...data });
  },

  async finalize(sessionId: string, patientId: string) {
    const session = await sessionRepository.findById(sessionId);
    if (!session) throw new AppError('Sesión no encontrada', 404);
    if (session.patientId !== patientId) throw new AppError('Sin permiso', 403);
    if (session.status === 'FINISHED') throw new AppError('La sesión ya fue finalizada', 409);

    const total = session.routine.activities.length;
    const completed = session.exercises.filter(e => e.status === 'COMPLETED').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    await routineRepository.markComplete(session.routineId);

    return sessionRepository.finalize(sessionId, completionRate);
  },
};
