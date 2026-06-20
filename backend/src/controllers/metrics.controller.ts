import { Request, Response } from 'express';
import { outcomeMeasureService } from '../services/outcomeMeasure.service';
import { feedbackService } from '../services/feedback.service';
import { catchAsync } from '../utils/catchAsync';
import { ok, created } from '../utils/response';

function actor(req: Request) {
  return { id: req.user!.id, role: req.user!.role };
}

export const createOutcomeMeasure = catchAsync(async (req: Request, res: Response) => {
  created(res, await outcomeMeasureService.create(actor(req), req.body));
});

export const listOutcomeMeasures = catchAsync(async (req: Request, res: Response) => {
  const type = typeof req.query.type === 'string' ? req.query.type : undefined;
  ok(res, await outcomeMeasureService.list(actor(req), req.params.patientId, type));
});

export const deleteOutcomeMeasure = catchAsync(async (req: Request, res: Response) => {
  ok(res, await outcomeMeasureService.remove(actor(req), req.params.id));
});

export const listPainPoints = catchAsync(async (req: Request, res: Response) => {
  await outcomeMeasureService.assertCanAccessPatient(actor(req), req.params.patientId);
  ok(res, await feedbackService.getPainPoints(req.params.patientId));
});
