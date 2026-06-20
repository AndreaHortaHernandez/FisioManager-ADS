import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { catchAsync } from '../utils/catchAsync';
import { ok } from '../utils/response';
import { AppError } from '../errors/AppError';

export const login = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.login(req.body.email, req.body.password);
  ok(res, result);
});

export const getMe = catchAsync(async (req: Request, res: Response) => {
  const user = await authService.getProfile(req.user!.id);
  ok(res, user);
});

export const logout = catchAsync(async (req: Request, res: Response) => {
  const token = req.headers.authorization!.slice(7);
  const result = await authService.logout(token, req.body?.refreshToken);
  ok(res, result);
});

export const refresh = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.refresh(req.body.refreshToken);
  ok(res, result);
});

export const recover = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.requestRecovery(req.body.email);
  ok(res, result);
});

export const reset = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.resetPassword(req.body.token, req.body.password);
  ok(res, result);
});

export const changePassword = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.changePassword(req.user!.id, req.body.currentPassword, req.body.newPassword);
  ok(res, result);
});

export const giveConsent = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.giveAudioConsent(req.user!.id);
  ok(res, result);
});

export const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.updateProfile(req.user!.id, req.body);
  ok(res, result);
});

export const uploadAvatar = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) throw new AppError('No se recibió ningún archivo de imagen', 400);
  const avatarUrl = `/uploads/${req.file.filename}`;
  const result = await authService.updateProfile(req.user!.id, { avatarUrl });
  ok(res, result);
});
