import { Request, Response } from 'express';
import { appointmentRepository } from '../repositories/appointment.repository';
import { progressService } from '../services/progress.service';
import { catchAsync } from '../utils/catchAsync';
import { ok } from '../utils/response';

export const getProgreso = catchAsync(async (req: Request, res: Response) => {
  const progreso = await progressService.computeForPatient(req.user!.id);
  ok(res, progreso);
});

export const getProximaCita = catchAsync(async (req: Request, res: Response) => {
  const appt = await appointmentRepository.findNextForPatient(req.user!.id);
  ok(res, appt ?? null);
});
