import { prisma } from '../lib/prisma';
import { userRepository } from '../repositories/user.repository';
import { AppError } from '../errors/AppError';

export const gdprService = {
  async deleteUser(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError('Usuario no encontrado', 404);

    await prisma.$transaction(async tx => {
      const sessions = await tx.session.findMany({ where: { patientId: userId }, select: { id: true } });
      const sessionIds = sessions.map(s => s.id);

      if (sessionIds.length > 0) {
        await tx.sessionExercise.deleteMany({ where: { sessionId: { in: sessionIds } } });
      }
      await tx.session.deleteMany({ where: { patientId: userId } });
      await tx.feedback.deleteMany({ where: { patientId: userId } });
      await tx.routineAssignment.deleteMany({ where: { OR: [{ patientId: userId }, { therapistId: userId }] } });
      await tx.routine.deleteMany({ where: { patientId: userId } });
      await tx.appointment.deleteMany({ where: { OR: [{ patientId: userId }, { therapistId: userId }] } });
      await tx.clinicalNote.deleteMany({ where: { authorId: userId } });
      await tx.clinicalHistory.deleteMany({ where: { patientId: userId } }); 
      await tx.treatmentPlan.deleteMany({ where: { OR: [{ patientId: userId }, { therapistId: userId }] } });
      await tx.therapistAvailability.deleteMany({ where: { therapistId: userId } });

      await tx.user.delete({ where: { id: userId } });
    });

    return { message: 'Usuario y todos sus datos asociados fueron eliminados permanentemente' };
  },
};
