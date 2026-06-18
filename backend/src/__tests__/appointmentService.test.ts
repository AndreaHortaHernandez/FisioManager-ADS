import { appointmentRepository } from '../repositories/appointment.repository';
import { appointmentService } from '../services/appointment.service';
import { AppError } from '../errors/AppError';

jest.mock('../repositories/appointment.repository');
jest.mock('../repositories/availability.repository');
jest.mock('../services/email.service');

const mockedApptRepo = appointmentRepository as jest.Mocked<typeof appointmentRepository>;

describe('appointmentService.confirm', () => {
  it('confirma una cita que está en estado SCHEDULED', async () => {
    mockedApptRepo.findById.mockResolvedValue({ id: 'a1', status: 'SCHEDULED' } as never);
    mockedApptRepo.update.mockResolvedValue({ id: 'a1', status: 'CONFIRMED' } as never);

    const result = await appointmentService.confirm('a1');

    expect(result.status).toBe('CONFIRMED');
    expect(mockedApptRepo.update).toHaveBeenCalledWith('a1', { status: 'CONFIRMED' });
  });

  it('rechaza confirmar una cita que ya está cancelada', async () => {
    mockedApptRepo.findById.mockResolvedValue({ id: 'a1', status: 'CANCELLED' } as never);
    await expect(appointmentService.confirm('a1')).rejects.toThrow(AppError);
  });

  it('rechaza confirmar una cita que no existe', async () => {
    mockedApptRepo.findById.mockResolvedValue(null);
    await expect(appointmentService.confirm('no-existe')).rejects.toThrow(AppError);
  });
});
