import { Request, Response } from 'express';
import { availabilityService } from '../services/availability.service';
import { catchAsync } from '../utils/catchAsync';
import { ok } from '../utils/response';
import { AppError } from '../errors/AppError';

export const getAvailability = catchAsync(async (req: Request, res: Response) => {
  const slots = await availabilityService.getForTherapist(req.params.therapistId);
  ok(res, slots);
});

export const setAvailability = catchAsync(async (req: Request, res: Response) => {
  const slots = await availabilityService.setForTherapist(req.params.therapistId, req.body.slots);
  ok(res, slots);
});

export const getAvailableSlots = catchAsync(async (req: Request, res: Response) => {
  const { from, to } = req.query as Record<string, string>;
  if (!from || !to) throw new AppError('Debes indicar el rango de fechas (from, to)', 422);
  const slots = await availabilityService.getAvailableSlots(req.params.therapistId, from, to);
  ok(res, slots);
});
