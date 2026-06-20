import { Request, Response } from 'express';
import { waitlistService } from '../services/waitlist.service';
import { catchAsync } from '../utils/catchAsync';
import { ok, created } from '../utils/response';

export const joinWaitlist = catchAsync(async (req: Request, res: Response) => {
  const entry = await waitlistService.join({ id: req.user!.id, role: req.user!.role }, req.body);
  created(res, entry);
});

export const listWaitlist = catchAsync(async (req: Request, res: Response) => {
  if (req.user!.role === 'PATIENT') {
    ok(res, await waitlistService.listForPatient(req.user!.id));
  } else if (req.user!.role === 'THERAPIST') {
    ok(res, await waitlistService.listForTherapist(req.user!.id));
  } else {
    const therapistId = (req.query.therapistId as string) ?? '';
    ok(res, therapistId ? await waitlistService.listForTherapist(therapistId) : []);
  }
});

export const leaveWaitlist = catchAsync(async (req: Request, res: Response) => {
  ok(res, await waitlistService.remove({ id: req.user!.id, role: req.user!.role }, req.params.id));
});
