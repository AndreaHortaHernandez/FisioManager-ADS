import { Request, Response } from 'express';
import { availabilityService } from '../services/availability.service';
import { catchAsync } from '../utils/catchAsync';
import { ok } from '../utils/response';

export const getAvailability = catchAsync(async (req: Request, res: Response) => {
  const slots = await availabilityService.getForTherapist(req.params.therapistId);
  ok(res, slots);
});

export const setAvailability = catchAsync(async (req: Request, res: Response) => {
  const slots = await availabilityService.setForTherapist(req.params.therapistId, req.body.slots);
  ok(res, slots);
});
