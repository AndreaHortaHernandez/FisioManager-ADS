import { Request, Response } from 'express';
import { patientService } from '../services/patient.service';
import { catchAsync } from '../utils/catchAsync';
import { ok } from '../utils/response';

export const getPatients = catchAsync(async (req: Request, res: Response) => {
  const patients = await patientService.getAll(req.user!.id);
  ok(res, patients);
});

export const getPatientById = catchAsync(async (req: Request, res: Response) => {
  const patient = await patientService.getById(req.params.id);
  ok(res, patient);
});
