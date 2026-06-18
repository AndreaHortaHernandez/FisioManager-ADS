import { treatmentPlanRepository } from '../repositories/treatmentPlan.repository';
import { userRepository } from '../repositories/user.repository';
import { AppError } from '../errors/AppError';

async function ensurePatient(patientId: string) {
  const patient = await userRepository.findById(patientId);
  if (!patient || patient.role !== 'PATIENT') throw new AppError('Paciente no encontrado', 404);
  return patient;
}

export const treatmentPlanService = {
  async getByPatient(patientId: string) {
    await ensurePatient(patientId);
    return treatmentPlanRepository.findByPatientId(patientId);
  },

  async getById(id: string) {
    const plan = await treatmentPlanRepository.findById(id);
    if (!plan) throw new AppError('Plan de tratamiento no encontrado', 404);
    return plan;
  },

  async create(patientId: string, therapistId: string, data: {
    name: string;
    clinicalGoal?: string;
    startDate: string;
    endDate?: string;
    status?: string;
  }) {
    await ensurePatient(patientId);
    return treatmentPlanRepository.create({
      patientId,
      therapistId,
      name: data.name,
      clinicalGoal: data.clinicalGoal,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      status: data.status,
    });
  },

  async update(id: string, data: {
    name?: string;
    clinicalGoal?: string;
    startDate?: string;
    endDate?: string | null;
    status?: string;
  }) {
    await this.getById(id);
    return treatmentPlanRepository.update(id, {
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate === null ? null : data.endDate ? new Date(data.endDate) : undefined,
    });
  },

  async addPhase(planId: string, data: { name: string; order: number; durationWeeks: number; objectives?: string }) {
    await this.getById(planId);
    return treatmentPlanRepository.createPhase(planId, data);
  },

  async updatePhase(id: string, data: { name?: string; order?: number; durationWeeks?: number; objectives?: string }) {
    const phase = await treatmentPlanRepository.findPhaseById(id);
    if (!phase) throw new AppError('Fase no encontrada', 404);
    return treatmentPlanRepository.updatePhase(id, data);
  },

  async deletePhase(id: string) {
    const phase = await treatmentPlanRepository.findPhaseById(id);
    if (!phase) throw new AppError('Fase no encontrada', 404);
    return treatmentPlanRepository.deletePhase(id);
  },
};
