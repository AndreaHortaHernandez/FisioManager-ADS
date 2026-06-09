import { Request, Response } from 'express';
import { feedbackService } from '../services/feedback.service';
import { catchAsync } from '../utils/catchAsync';
import { ok, created } from '../utils/response';

export const getFeedbacks = catchAsync(async (req: Request, res: Response) => {
  const feedbacks = await feedbackService.getForUser(req.user!.id, req.user!.role);
  ok(res, feedbacks);
});

export const createFeedback = catchAsync(async (req: Request, res: Response) => {
  const feedback = await feedbackService.create({
    ...req.body,
    patientId: req.user!.id,
  });
  created(res, feedback);
});
