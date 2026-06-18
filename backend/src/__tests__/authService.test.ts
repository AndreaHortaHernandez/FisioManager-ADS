import bcrypt from 'bcryptjs';
import { userRepository } from '../repositories/user.repository';
import { refreshTokenRepository } from '../repositories/refreshToken.repository';
import { authService } from '../services/auth.service';
import { AppError } from '../errors/AppError';

jest.mock('../repositories/user.repository');
jest.mock('../repositories/token.repository');
jest.mock('../repositories/refreshToken.repository');
jest.mock('../services/email.service');

const mockedUserRepo = userRepository as jest.Mocked<typeof userRepository>;
const mockedRefreshRepo = refreshTokenRepository as jest.Mocked<typeof refreshTokenRepository>;

describe('authService.changePassword', () => {
  const userId = 'u1';
  const storedHash = bcrypt.hashSync('correcta123', 10);

  it('rechaza si la contraseña actual no coincide', async () => {
    mockedUserRepo.findById.mockResolvedValue({ id: userId, password: storedHash } as never);

    await expect(authService.changePassword(userId, 'incorrecta', 'nuevaClave1')).rejects.toThrow(AppError);
    expect(mockedUserRepo.updatePassword).not.toHaveBeenCalled();
  });

  it('actualiza la contraseña cuando la actual es correcta', async () => {
    mockedUserRepo.findById.mockResolvedValue({ id: userId, password: storedHash } as never);
    mockedUserRepo.updatePassword.mockResolvedValue({} as never);

    const result = await authService.changePassword(userId, 'correcta123', 'nuevaClave1');

    expect(result.message).toMatch(/actualizada/i);
    expect(mockedUserRepo.updatePassword).toHaveBeenCalledWith(userId, expect.any(String));
  });

  it('lanza un error si el usuario no existe', async () => {
    mockedUserRepo.findById.mockResolvedValue(null);
    await expect(authService.changePassword('no-existe', 'a', 'nuevaClave1')).rejects.toThrow(AppError);
  });
});

describe('authService.refresh', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
  });

  it('rechaza un refresh token que no existe o ya expiró', async () => {
    mockedRefreshRepo.findValid.mockResolvedValue(null);
    await expect(authService.refresh('token-invalido')).rejects.toThrow(AppError);
  });

  it('rechaza si el usuario asociado está inactivo', async () => {
    mockedRefreshRepo.findValid.mockResolvedValue({ id: 'rt1', token: 'tok', userId: 'u1', expiresAt: new Date() } as never);
    mockedUserRepo.findById.mockResolvedValue({ id: 'u1', isActive: false } as never);
    await expect(authService.refresh('tok')).rejects.toThrow(AppError);
  });

  it('rota el refresh token y emite un nuevo access token', async () => {
    mockedRefreshRepo.findValid.mockResolvedValue({ id: 'rt1', token: 'tok-viejo', userId: 'u1', expiresAt: new Date() } as never);
    mockedUserRepo.findById.mockResolvedValue({ id: 'u1', role: 'PATIENT', name: 'Ana', isActive: true } as never);
    mockedRefreshRepo.deleteByToken.mockResolvedValue({ count: 1 } as never);
    mockedRefreshRepo.create.mockResolvedValue({} as never);

    const result = await authService.refresh('tok-viejo');

    expect(mockedRefreshRepo.deleteByToken).toHaveBeenCalledWith('tok-viejo');
    expect(typeof result.token).toBe('string');
    expect(typeof result.refreshToken).toBe('string');
    expect(result.refreshToken).not.toBe('tok-viejo');
  });
});
