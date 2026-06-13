import { Request, Response } from 'express';
import { sessionService } from '../services/session.service';
import { catchAsync } from '../utils/catchAsync';
import { ok, created } from '../utils/response';

export const startSession = catchAsync(async (req: Request, res: Response) => {
  const session = await sessionService.start(req.body.routineId, req.user!.id);
  created(res, session);
});

export const trackExercise = catchAsync(async (req: Request, res: Response) => {
  const exercise = await sessionService.trackExercise(
    req.params.id,
    req.user!.id,
    req.body,
  );
  ok(res, exercise);
});

export const finalizeSession = catchAsync(async (req: Request, res: Response) => {
  const session = await sessionService.finalize(req.params.id, req.user!.id);
  ok(res, session);
});
