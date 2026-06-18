import { Request, Response } from 'express';
import { clinicalHistoryService } from '../services/clinicalHistory.service';
import { progressService } from '../services/progress.service';
import { catchAsync } from '../utils/catchAsync';
import { ok, created } from '../utils/response';

export const getPatientProgress = catchAsync(async (req: Request, res: Response) => {
  const progreso = await progressService.computeForPatient(req.params.id);
  ok(res, progreso);
});

export const getHistory = catchAsync(async (req: Request, res: Response) => {
  const history = await clinicalHistoryService.getByPatient(req.params.id);
  ok(res, history);
});

export const upsertHistory = catchAsync(async (req: Request, res: Response) => {
  const history = await clinicalHistoryService.upsertForPatient(req.params.id, req.body);
  created(res, history);
});

export const addDiagnosis = catchAsync(async (req: Request, res: Response) => {
  const diagnosis = await clinicalHistoryService.addDiagnosis(req.params.id, req.body);
  created(res, diagnosis);
});

export const updateDiagnosis = catchAsync(async (req: Request, res: Response) => {
  const diagnosis = await clinicalHistoryService.updateDiagnosis(req.params.id, req.body);
  ok(res, diagnosis);
});

export const addNote = catchAsync(async (req: Request, res: Response) => {
  const note = await clinicalHistoryService.addNote(req.params.id, req.user!.id, req.body.content, req.body.isVisible);
  created(res, note);
});

export const updateNoteVisibility = catchAsync(async (req: Request, res: Response) => {
  const note = await clinicalHistoryService.updateNoteVisibility(req.params.id, req.body.isVisible);
  ok(res, note);
});

export const getOwnHistory = catchAsync(async (req: Request, res: Response) => {
  const history = await clinicalHistoryService.getOwnHistory(req.user!.id);
  ok(res, history);
});
