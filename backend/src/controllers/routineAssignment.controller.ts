import { Request, Response } from 'express';
import { routineAssignmentService } from '../services/routineAssignment.service';
import { catchAsync } from '../utils/catchAsync';
import { ok, created } from '../utils/response';

export const getAssignments = catchAsync(async (req: Request, res: Response) => {
  const assignments = await routineAssignmentService.getAll(req.user!.id);
  ok(res, assignments);
});

export const getAssignmentsByPatient = catchAsync(async (req: Request, res: Response) => {
  const assignments = await routineAssignmentService.getByPatient(req.params.patientId);
  ok(res, assignments);
});

export const createAssignment = catchAsync(async (req: Request, res: Response) => {
  const assignment = await routineAssignmentService.create({
    ...req.body,
    therapistId: req.user!.id,
  });
  created(res, assignment);
});

export const updateAssignment = catchAsync(async (req: Request, res: Response) => {
  const assignment = await routineAssignmentService.update(
    req.params.id,
    req.body,
    req.user!.id,
  );
  ok(res, assignment);
});
