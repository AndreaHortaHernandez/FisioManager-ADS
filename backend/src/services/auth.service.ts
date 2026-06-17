import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { userRepository } from '../repositories/user.repository';
import { tokenRepository } from '../repositories/token.repository';
import { emailService } from './email.service';
import { AppError } from '../errors/AppError';

function signToken(userId: string, role: string, name: string): string {
  return jwt.sign(
    { sub: userId, role, name },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );
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
    return { token, user: sanitize(user) };
  },

  // Auto-registro público (rol PACIENTE). La cuenta queda activa de inmediato
  // y se devuelve una sesión (auto-login), sin verificación por correo.
  async signup(data: { name: string; email: string; password: string }) {
    const exists = await userRepository.findByEmail(data.email);
    if (exists) throw new AppError('El email ya está registrado', 409);

    const hashed = await bcrypt.hash(data.password, 10);
    const user = await userRepository.create({
      name: data.name,
      email: data.email,
      password: hashed,
      role: 'PATIENT',
    });

    const token = signToken(user.id, user.role, user.name);
    return { token, user: sanitize(user) };
  },

  async register(data: {
    name: string;
    email: string;
    password: string;
    role: string;
    avatarUrl?: string;
    patientProfile?: { age: number; condition: string; therapistId: string };
  }) {
    const exists = await userRepository.findByEmail(data.email);
    if (exists) throw new AppError('El email ya está registrado', 409);

    const hashed = await bcrypt.hash(data.password, 10);
    const user = await userRepository.create({ ...data, password: hashed });

    const token = signToken(user.id, user.role, user.name);
    return { token, user: sanitize(user) };
  },

  async getProfile(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError('Usuario no encontrado', 404);
    return sanitize(user);
  },

  // Invalida el token actual guardándolo en la lista de revocados.
  async logout(token: string) {
    const decoded = jwt.decode(token) as { exp?: number } | null;
    const expiresAt = decoded?.exp ? new Date(decoded.exp * 1000) : new Date(Date.now() + 7 * 86_400_000);
    await tokenRepository.revoke(token, expiresAt);
    return { message: 'Sesión cerrada correctamente' };
  },

  // Envía un correo de recuperación. No revela si el email existe.
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
        .catch(err => console.error('[Email] Error al enviar recuperación:', err));
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
};
