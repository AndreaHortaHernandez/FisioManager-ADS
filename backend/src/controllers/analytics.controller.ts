import { Request, Response } from 'express';
import { analyticsService } from '../services/analytics.service';
import { catchAsync } from '../utils/catchAsync';
import { ok } from '../utils/response';

export const getOverview = catchAsync(async (_req: Request, res: Response) => {
  ok(res, await analyticsService.getClinicOverview());
});

export const getTherapistComparison = catchAsync(async (_req: Request, res: Response) => {
  ok(res, await analyticsService.getTherapistComparison());
});
