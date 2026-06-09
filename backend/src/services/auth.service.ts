import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { userRepository } from '../repositories/user.repository';
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

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new AppError('Credenciales inválidas', 401);

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
};
