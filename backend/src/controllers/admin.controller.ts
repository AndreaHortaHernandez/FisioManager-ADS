import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { userRepository } from '../repositories/user.repository';
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
  const { name, email, password, phone, avatarUrl } = req.body;
  const exists = await userRepository.findByEmail(email);
  if (exists) throw new AppError('El email ya está registrado', 409);

  const hashed = await bcrypt.hash(password, 10);
  const user = await userRepository.create({ name, email, password: hashed, role: 'THERAPIST', phone, avatarUrl });
  created(res, sanitize(user));
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
