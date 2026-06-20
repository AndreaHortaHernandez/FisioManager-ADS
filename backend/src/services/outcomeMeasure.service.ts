import { outcomeMeasureRepository } from '../repositories/outcomeMeasure.repository';
import { userRepository } from '../repositories/user.repository';
import { AppError } from '../errors/AppError';

interface Actor {
  id: string;
  role: string;
}

const TYPES = ['ROM', 'STRENGTH', 'FUNCTIONAL', 'VAS'];

async function assertCanAccessPatient(actor: Actor, patientId: string) {
  if (actor.role === 'PATIENT') {
    if (actor.id !== patientId) throw new AppError('Sin permiso', 403);
    return;
  }
  if (actor.role === 'THERAPIST') {
    const patient = await userRepository.findById(patientId);
    if (patient?.patientProfile?.therapistId !== actor.id) throw new AppError('Este paciente no está a tu cargo', 403);
    return;
  }
}

export const outcomeMeasureService = {
  async create(actor: Actor, data: { patientId: string; type: string; label?: string; value: number; unit?: string; measuredAt?: string }) {
    if (actor.role !== 'THERAPIST' && actor.role !== 'ADMIN') throw new AppError('Solo el personal puede registrar mediciones', 403);
    if (!TYPES.includes(data.type)) throw new AppError('Tipo de medición inválido', 422);
    await assertCanAccessPatient(actor, data.patientId);
    return outcomeMeasureRepository.create({
      patientId: data.patientId,
      therapistId: actor.id,
      type: data.type,
      label: data.label,
      value: data.value,
      unit: data.unit,
      measuredAt: data.measuredAt ? new Date(data.measuredAt) : undefined,
    });
  },

  async list(actor: Actor, patientId: string, type?: string) {
    await assertCanAccessPatient(actor, patientId);
    return outcomeMeasureRepository.findByPatient(patientId, type);
  },

  async remove(actor: Actor, id: string) {
    const m = await outcomeMeasureRepository.findById(id);
    if (!m) throw new AppError('Medición no encontrada', 404);
    await assertCanAccessPatient(actor, m.patientId);
    await outcomeMeasureRepository.delete(id);
    return { message: 'Medición eliminada' };
  },

  assertCanAccessPatient,
};
