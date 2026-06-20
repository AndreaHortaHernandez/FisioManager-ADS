import { appointmentService } from '../services/appointment.service';
import { userRepository } from '../repositories/user.repository';
import { AppError } from '../errors/AppError';

jest.mock('../repositories/user.repository');
jest.mock('../repositories/appointment.repository');
jest.mock('../repositories/availability.repository');
jest.mock('../services/email.service');
jest.mock('../services/notification.service');
jest.mock('../services/waitlist.service');

const mockedUserRepo = userRepository as jest.Mocked<typeof userRepository>;

describe('appointmentService.create — reglas de auto-agendamiento del paciente', () => {
  const base = { patientId: 'p1', therapistId: 't1', dateTime: '2030-01-01T10:00:00.000Z' };

  it('rechaza que un paciente agende para otra persona', async () => {
    await expect(
      appointmentService.create({ ...base, patientId: 'otro' }, { id: 'p1', role: 'PATIENT' }),
    ).rejects.toThrow(AppError);
  });

  it('rechaza agendar con un terapeuta que no es el asignado', async () => {
    mockedUserRepo.findById.mockResolvedValue({
      id: 'p1', role: 'PATIENT', patientProfile: { therapistId: 't1' },
    } as never);

    await expect(
      appointmentService.create({ ...base, therapistId: 'otro-terapeuta' }, { id: 'p1', role: 'PATIENT' }),
    ).rejects.toThrow('Solo puedes agendar con tu terapeuta asignado');
  });

  it('rechaza si el paciente no tiene terapeuta asignado', async () => {
    mockedUserRepo.findById.mockResolvedValue({
      id: 'p1', role: 'PATIENT', patientProfile: null,
    } as never);

    await expect(
      appointmentService.create(base, { id: 'p1', role: 'PATIENT' }),
    ).rejects.toThrow('Aún no tienes un terapeuta asignado');
  });
});
