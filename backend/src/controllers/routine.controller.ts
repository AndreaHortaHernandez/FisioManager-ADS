import { Request, Response } from 'express';
import { routineService } from '../services/routine.service';
import { catchAsync } from '../utils/catchAsync';
import { ok, created } from '../utils/response';

export const getRoutines = catchAsync(async (req: Request, res: Response) => {
  const routines = await routineService.getForUser(req.user!.id, req.user!.role);
  ok(res, routines);
});

export const getLibrary = catchAsync(async (_req: Request, res: Response) => {
  const routines = await routineService.getLibrary();
  ok(res, routines);
});

export const getRoutineById = catchAsync(async (req: Request, res: Response) => {
  const routine = await routineService.getById(req.params.id);
  ok(res, routine);
});

export const createRoutine = catchAsync(async (req: Request, res: Response) => {
  const routine = await routineService.create(req.body);
  created(res, routine);
});

export const markComplete = catchAsync(async (req: Request, res: Response) => {
  const routine = await routineService.markComplete(
    req.params.id,
    req.user!.id,
    req.user!.role
  );
  ok(res, routine);
});

export const assignRoutine = catchAsync(async (req: Request, res: Response) => {
  const routines = await routineService.assignToPatients(
    req.params.id,
    req.body.patientIds
  );
  created(res, routines);
});

export const cloneRoutine = catchAsync(async (req: Request, res: Response) => {
  const routine = await routineService.clone(req.params.id);
  created(res, routine);
});

export const updateRoutine = catchAsync(async (req: Request, res: Response) => {
  const routine = await routineService.update(req.params.id, req.body);
  ok(res, routine);
});

export const deleteRoutine = catchAsync(async (req: Request, res: Response) => {
  await routineService.delete(req.params.id);
  ok(res, { message: 'Rutina eliminada' });
});
