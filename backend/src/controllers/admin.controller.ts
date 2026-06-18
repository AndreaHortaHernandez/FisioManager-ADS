import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { userRepository } from '../repositories/user.repository';
import { gdprService } from '../services/gdpr.service';
import { catchAsync } from '../utils/catchAsync';
import { ok, created } from '../utils/response';
import { AppError } from '../errors/AppError';

function sanitize<T extends { password: string }>(user: T) {
  const { password: _p, ...rest } = user;
  return rest;
}

export const listTherapists = catchAsync(async (_req: Request, res: Response) => {
  const therapists = await userRepository.findAllByRole('THERAPIST');
  ok(res, therapists.map(sanitize));
});

export const registerTherapist = catchAsync(async (req: Request, res: Response) => {
  const { name, email, password, phone, avatarUrl, cedula, especialidad } = req.body;
  const exists = await userRepository.findByEmail(email);
  if (exists) throw new AppError('El email ya está registrado', 409);

  const hashed = await bcrypt.hash(password, 10);
  const user = await userRepository.create({
    name, email, password: hashed, role: 'THERAPIST', phone, avatarUrl,
    ...(cedula || especialidad ? { therapistProfile: { cedula, especialidad } } : {}),
  });
  created(res, sanitize(user));
});

export const toggleUserActive = catchAsync(async (req: Request, res: Response) => {
  const user = await userRepository.findById(req.params.id);
  if (!user) throw new AppError('Usuario no encontrado', 404);
  const updated = await userRepository.toggleActive(req.params.id, !user.isActive);
  ok(res, sanitize(updated));
});

export const updateUser = catchAsync(async (req: Request, res: Response) => {
  const existing = await userRepository.findById(req.params.id);
  if (!existing) throw new AppError('Usuario no encontrado', 404);

  const { name, phone, avatarUrl, age, condition, therapistId, cedula, especialidad } = req.body;
  const patientProfile =
    existing.role === 'PATIENT' && (age !== undefined || condition !== undefined || therapistId !== undefined)
      ? { age, condition, therapistId }
      : undefined;
  const therapistProfile =
    existing.role === 'THERAPIST' && (cedula !== undefined || especialidad !== undefined)
      ? { cedula, especialidad }
      : undefined;

  const updated = await userRepository.updateUser(req.params.id, {
    name, phone, avatarUrl, patientProfile, therapistProfile,
  });
  ok(res, sanitize(updated));
});

export const uploadUserAvatar = catchAsync(async (req: Request, res: Response) => {
  const existing = await userRepository.findById(req.params.id);
  if (!existing) throw new AppError('Usuario no encontrado', 404);
  if (!req.file) throw new AppError('No se recibió ningún archivo de imagen', 400);

  const avatarUrl = `/uploads/${req.file.filename}`;
  const updated = await userRepository.updateUser(req.params.id, { avatarUrl });
  ok(res, sanitize(updated));
});

export const listPatients = catchAsync(async (_req: Request, res: Response) => {
  const patients = await userRepository.findAllByRole('PATIENT');
  ok(res, patients.map(sanitize));
});

export const registerPatient = catchAsync(async (req: Request, res: Response) => {
  const { name, email, password, phone, avatarUrl, age, condition, therapistId } = req.body;
  const exists = await userRepository.findByEmail(email);
  if (exists) throw new AppError('El email ya está registrado', 409);

  const hashed = await bcrypt.hash(password, 10);
  const user = await userRepository.create({
    name, email, password: hashed, role: 'PATIENT', phone, avatarUrl,
    patientProfile: { age, condition, therapistId },
  });
  created(res, sanitize(user));
});

export const assignPatient = catchAsync(async (req: Request, res: Response) => {
  const { therapistId } = req.body;
  const therapist = await userRepository.findById(therapistId);
  if (!therapist || therapist.role !== 'THERAPIST') throw new AppError('Terapeuta no encontrado', 404);

  await userRepository.updatePatientProfile(req.params.id, therapistId);
  ok(res, { message: 'Asignación actualizada correctamente' });
});

export const listUsers = catchAsync(async (_req: Request, res: Response) => {
  const users = await userRepository.findAll();
  ok(res, users.map(sanitize));
});

export const deleteUserPermanently = catchAsync(async (req: Request, res: Response) => {
  const result = await gdprService.deleteUser(req.params.id);
  ok(res, result);
});

export const createAssignment = catchAsync(async (req: Request, res: Response) => {
  const { patientId, therapistId } = req.body;
  const patient = await userRepository.findById(patientId);
  if (!patient || patient.role !== 'PATIENT') throw new AppError('Paciente no encontrado', 404);

  const therapist = await userRepository.findById(therapistId);
  if (!therapist || therapist.role !== 'THERAPIST') throw new AppError('Terapeuta no encontrado', 404);

  await userRepository.updatePatientProfile(patientId, therapistId);
  ok(res, { message: 'Asignación creada correctamente' });
});
