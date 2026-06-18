import { Request, Response } from 'express';
import { notificationPreferenceService } from '../services/notificationPreference.service';
import { catchAsync } from '../utils/catchAsync';
import { ok } from '../utils/response';

export const getMyPreferences = catchAsync(async (req: Request, res: Response) => {
  ok(res, await notificationPreferenceService.get(req.user!.id));
});

export const updateMyPreferences = catchAsync(async (req: Request, res: Response) => {
  ok(res, await notificationPreferenceService.update(req.user!.id, req.body));
});
