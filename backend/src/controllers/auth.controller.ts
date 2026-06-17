import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { catchAsync } from '../utils/catchAsync';
import { ok, created } from '../utils/response';

export const login = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.login(req.body.email, req.body.password);
  ok(res, result);
});

export const register = catchAsync(async (req: Request, res: Response) => {
  const { name, email, password, role, age, condition, therapistId, avatarUrl } = req.body;
  const patientProfile =
    role === 'PATIENT' && age && condition && therapistId
      ? { age, condition, therapistId }
      : undefined;

  const result = await authService.register({ name, email, password, role, avatarUrl, patientProfile });
  created(res, result);
});

export const getMe = catchAsync(async (req: Request, res: Response) => {
  const user = await authService.getProfile(req.user!.id);
  ok(res, user);
});

export const signup = catchAsync(async (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  const result = await authService.signup({ name, email, password });
  created(res, result);
});

export const logout = catchAsync(async (req: Request, res: Response) => {
  const token = req.headers.authorization!.slice(7);
  const result = await authService.logout(token);
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
