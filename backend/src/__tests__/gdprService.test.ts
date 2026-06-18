import { userRepository } from '../repositories/user.repository';
import { AppError } from '../errors/AppError';

jest.mock('../repositories/user.repository');
jest.mock('../lib/prisma', () => ({ prisma: { $transaction: jest.fn() } }));

import { gdprService } from '../services/gdpr.service';

const mockedUserRepo = userRepository as jest.Mocked<typeof userRepository>;

describe('gdprService.deleteUser', () => {
  it('lanza un error si el usuario no existe (no toca la base de datos)', async () => {
    mockedUserRepo.findById.mockResolvedValue(null);
    await expect(gdprService.deleteUser('no-existe')).rejects.toThrow(AppError);
  });
});
