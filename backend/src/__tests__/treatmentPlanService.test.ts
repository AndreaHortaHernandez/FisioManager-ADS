import { treatmentPlanRepository } from '../repositories/treatmentPlan.repository';
import { userRepository } from '../repositories/user.repository';
import { treatmentPlanService } from '../services/treatmentPlan.service';
import { AppError } from '../errors/AppError';

jest.mock('../repositories/treatmentPlan.repository');
jest.mock('../repositories/user.repository');

const mockedPlanRepo = treatmentPlanRepository as jest.Mocked<typeof treatmentPlanRepository>;
const mockedUserRepo = userRepository as jest.Mocked<typeof userRepository>;

describe('treatmentPlanService.create', () => {
  it('rechaza crear un plan para un usuario que no es paciente', async () => {
    mockedUserRepo.findById.mockResolvedValue({ id: 'u1', role: 'THERAPIST' } as never);

    await expect(
      treatmentPlanService.create('u1', 't1', { name: 'Plan', startDate: '2026-01-01' }),
    ).rejects.toThrow(AppError);
  });

  it('crea el plan cuando el paciente existe', async () => {
    mockedUserRepo.findById.mockResolvedValue({ id: 'p1', role: 'PATIENT' } as never);
    mockedPlanRepo.create.mockResolvedValue({ id: 'plan1', name: 'Plan' } as never);

    const result = await treatmentPlanService.create('p1', 't1', { name: 'Plan', startDate: '2026-01-01' });

    expect(result).toEqual({ id: 'plan1', name: 'Plan' });
    expect(mockedPlanRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ patientId: 'p1', therapistId: 't1', name: 'Plan' }),
    );
  });
});

describe('treatmentPlanService.addPhase', () => {
  it('lanza un error si el plan no existe', async () => {
    mockedPlanRepo.findById.mockResolvedValue(null);

    await expect(
      treatmentPlanService.addPhase('plan-inexistente', { name: 'Fase 1', order: 1, durationWeeks: 2 }),
    ).rejects.toThrow(AppError);
  });

  it('agrega la fase cuando el plan existe', async () => {
    mockedPlanRepo.findById.mockResolvedValue({ id: 'plan1' } as never);
    mockedPlanRepo.createPhase.mockResolvedValue({ id: 'phase1', name: 'Fase 1' } as never);

    const result = await treatmentPlanService.addPhase('plan1', { name: 'Fase 1', order: 1, durationWeeks: 2 });

    expect(result).toEqual({ id: 'phase1', name: 'Fase 1' });
  });
});
