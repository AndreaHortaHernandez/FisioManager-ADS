import { availabilityRepository } from '../repositories/availability.repository';
import { userRepository } from '../repositories/user.repository';
import { AppError } from '../errors/AppError';

interface Slot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

async function ensureTherapist(therapistId: string) {
  const t = await userRepository.findById(therapistId);
  if (!t || t.role !== 'THERAPIST') throw new AppError('Terapeuta no encontrado', 404);
  return t;
}

export const availabilityService = {
  async getForTherapist(therapistId: string) {
    await ensureTherapist(therapistId);
    return availabilityRepository.findByTherapist(therapistId);
  },

  async setForTherapist(therapistId: string, slots: Slot[]) {
    await ensureTherapist(therapistId);
    const days = slots.map(s => s.dayOfWeek);
    if (new Set(days).size !== days.length) {
      throw new AppError('No puede haber días repetidos en el horario', 422);
    }
    return availabilityRepository.replaceForTherapist(therapistId, slots);
  },
};
