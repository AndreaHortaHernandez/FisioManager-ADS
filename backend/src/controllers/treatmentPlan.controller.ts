import { Request, Response } from 'express';
import { treatmentPlanService } from '../services/treatmentPlan.service';
import { routineAssignmentService } from '../services/routineAssignment.service';
import { catchAsync } from '../utils/catchAsync';
import { ok, created } from '../utils/response';

export const getPlansByPatient = catchAsync(async (req: Request, res: Response) => {
  const plans = await treatmentPlanService.getByPatient(req.params.id);
  ok(res, plans);
});

export const getPlan = catchAsync(async (req: Request, res: Response) => {
  const plan = await treatmentPlanService.getById(req.params.id);
  ok(res, plan);
});

export const createPlan = catchAsync(async (req: Request, res: Response) => {
  const plan = await treatmentPlanService.create(req.params.id, req.user!.id, req.body);
  created(res, plan);
});

export const updatePlan = catchAsync(async (req: Request, res: Response) => {
  const plan = await treatmentPlanService.update(req.params.id, req.body);
  ok(res, plan);
});

export const addPhase = catchAsync(async (req: Request, res: Response) => {
  const phase = await treatmentPlanService.addPhase(req.params.id, req.body);
  created(res, phase);
});

export const updatePhase = catchAsync(async (req: Request, res: Response) => {
  const phase = await treatmentPlanService.updatePhase(req.params.id, req.body);
  ok(res, phase);
});

export const deletePhase = catchAsync(async (req: Request, res: Response) => {
  await treatmentPlanService.deletePhase(req.params.id);
  ok(res, { message: 'Fase eliminada' });
});

export const getAssignmentsByPhase = catchAsync(async (req: Request, res: Response) => {
  const assignments = await routineAssignmentService.getByPhase(req.params.id);
  ok(res, assignments);
});
