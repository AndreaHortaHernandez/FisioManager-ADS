import { notificationPreferenceRepository } from '../repositories/notificationPreference.repository';
import { notificationPreferenceService } from '../services/notificationPreference.service';

jest.mock('../repositories/notificationPreference.repository');

const mockedRepo = notificationPreferenceRepository as jest.Mocked<typeof notificationPreferenceRepository>;

describe('notificationPreferenceService.isAllowed', () => {
  it('permite el envío cuando el usuario no tiene preferencias configuradas (default)', async () => {
    mockedRepo.findByUserId.mockResolvedValue(null);
    await expect(notificationPreferenceService.isAllowed('u1', 'routine')).resolves.toBe(true);
  });

  it('bloquea todo si emailEnabled está apagado', async () => {
    mockedRepo.findByUserId.mockResolvedValue({
      id: 'pref1', userId: 'u1', emailEnabled: false,
      routineReminders: true, appointmentReminders: true,
      quietHoursStart: null, quietHoursEnd: null,
    });
    await expect(notificationPreferenceService.isAllowed('u1', 'routine')).resolves.toBe(false);
    await expect(notificationPreferenceService.isAllowed('u1', 'appointment')).resolves.toBe(false);
  });

  it('respeta el toggle específico de recordatorios de rutina', async () => {
    mockedRepo.findByUserId.mockResolvedValue({
      id: 'pref1', userId: 'u1', emailEnabled: true,
      routineReminders: false, appointmentReminders: true,
      quietHoursStart: null, quietHoursEnd: null,
    });
    await expect(notificationPreferenceService.isAllowed('u1', 'routine')).resolves.toBe(false);
    await expect(notificationPreferenceService.isAllowed('u1', 'appointment')).resolves.toBe(true);
  });
});
