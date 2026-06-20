import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import { userRepository } from '../repositories/user.repository';
import { tokenRepository } from '../repositories/token.repository';
import { refreshTokenRepository } from '../repositories/refreshToken.repository';
import { emailService } from './email.service';
import { AppError } from '../errors/AppError';
import { logger } from '../lib/logger';

const ACCESS_TOKEN_TTL = '60m';
const REFRESH_TOKEN_TTL_MS = 7 * 86_400_000; 

function signToken(userId: string, role: string, name: string): string {
  return jwt.sign(
    { sub: userId, role, name },
    process.env.JWT_SECRET!,
    { expiresIn: ACCESS_TOKEN_TTL }
  );
}

async function issueRefreshToken(userId: string): Promise<string> {
  const token = randomBytes(48).toString('hex');
  await refreshTokenRepository.create(userId, token, new Date(Date.now() + REFRESH_TOKEN_TTL_MS));
  return token;
}

function sanitize<T extends { password: string }>(user: T) {
  const { password: _p, ...rest } = user;
  return rest;
}

export const authService = {
  async login(email: string, password: string) {
    const user = await userRepository.findByEmail(email);
    if (!user) throw new AppError('Credenciales inválidas', 401);
    if (!user.isActive) throw new AppError('Tu cuenta está desactivada. Contacta al administrador.', 403);

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new AppError('Credenciales inválidas', 401);

    const token = signToken(user.id, user.role, user.name);
    const refreshToken = await issueRefreshToken(user.id);
    return { token, refreshToken, user: sanitize(user) };
  },

  async getProfile(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError('Usuario no encontrado', 404);
    return sanitize(user);
  },

  async refresh(refreshToken: string) {
    const stored = await refreshTokenRepository.findValid(refreshToken);
    if (!stored) throw new AppError('Refresh token inválido o expirado', 401);

    const user = await userRepository.findById(stored.userId);
    if (!user || !user.isActive) throw new AppError('Usuario no encontrado o inactivo', 401);

    await refreshTokenRepository.deleteByToken(refreshToken);

    const token = signToken(user.id, user.role, user.name);
    const newRefreshToken = await issueRefreshToken(user.id);
    return { token, refreshToken: newRefreshToken };
  },

  async logout(token: string, refreshToken?: string) {
    const decoded = jwt.decode(token) as { exp?: number } | null;
    const expiresAt = decoded?.exp ? new Date(decoded.exp * 1000) : new Date(Date.now() + 86_400_000);
    await tokenRepository.revoke(token, expiresAt);
    if (refreshToken) await refreshTokenRepository.deleteByToken(refreshToken);
    return { message: 'Sesión cerrada correctamente' };
  },

  async requestRecovery(email: string) {
    const user = await userRepository.findByEmail(email);

    if (user) {
      const resetToken = jwt.sign(
        { sub: user.id, purpose: 'reset' },
        process.env.JWT_SECRET!,
        { expiresIn: '1h' },
      );
      const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:8080';
      const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

      emailService
        .sendPasswordRecovery({ name: user.name, email: user.email, resetUrl, token: resetToken })
        .catch(err => logger.error('password_recovery_email_failed', { userId: user.id, error: err.message }));
    }

    return { message: 'Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña.' };
  },

  async resetPassword(token: string, newPassword: string) {
    let payload: { sub: string; purpose?: string };
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET!) as { sub: string; purpose?: string };
    } catch {
      throw new AppError('El enlace de recuperación es inválido o ha expirado', 400);
    }
    if (payload.purpose !== 'reset') throw new AppError('Token de recuperación inválido', 400);

    const user = await userRepository.findById(payload.sub);
    if (!user) throw new AppError('Usuario no encontrado', 404);

    const hashed = await bcrypt.hash(newPassword, 10);
    await userRepository.updatePassword(user.id, hashed);

    return { message: 'Contraseña actualizada correctamente' };
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError('Usuario no encontrado', 404);

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) throw new AppError('La contraseña actual es incorrecta', 401);

    const hashed = await bcrypt.hash(newPassword, 10);
    await userRepository.updatePassword(user.id, hashed);

    return { message: 'Contraseña actualizada correctamente' };
  },

  async giveAudioConsent(userId: string) {
    const user = await userRepository.setAudioConsent(userId, new Date());
    return { audioConsentAt: user.audioConsentAt };
  },

  async updateProfile(userId: string, data: { phone?: string; avatarUrl?: string }) {
    const user = await userRepository.updateProfile(userId, data);
    return sanitize(user);
  },
};
