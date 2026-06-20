import { Request, Response } from 'express';
import { appointmentService } from '../services/appointment.service';
import { catchAsync } from '../utils/catchAsync';
import { ok, created } from '../utils/response';

export const getAppointments = catchAsync(async (req: Request, res: Response) => {
  const { date, therapistId, patientId, status } = req.query as Record<string, string>;
  const scoped = { date, therapistId, patientId, status };
  if (req.user!.role === 'PATIENT') scoped.patientId = req.user!.id;
  if (req.user!.role === 'THERAPIST') scoped.therapistId = req.user!.id;
  const appointments = await appointmentService.getAll(scoped);
  ok(res, appointments);
});

export const getAppointmentById = catchAsync(async (req: Request, res: Response) => {
  const appt = await appointmentService.getById(req.params.id);
  ok(res, appt);
});

export const createAppointment = catchAsync(async (req: Request, res: Response) => {
  const appt = await appointmentService.create(req.body, { id: req.user!.id, role: req.user!.role });
  created(res, appt);
});

export const updateAppointment = catchAsync(async (req: Request, res: Response) => {
  const appt = await appointmentService.update(req.params.id, req.body);
  ok(res, appt);
});

export const cancelAppointment = catchAsync(async (req: Request, res: Response) => {
  const scope = req.query.scope === 'series' ? 'series' : 'one';
  const appt = await appointmentService.cancel(req.params.id, { id: req.user!.id, role: req.user!.role }, scope);
  ok(res, appt);
});

export const confirmAppointment = catchAsync(async (req: Request, res: Response) => {
  const appt = await appointmentService.confirm(req.params.id);
  ok(res, appt);
});

export const sendReminder = catchAsync(async (req: Request, res: Response) => {
  const result = await appointmentService.sendReminder(req.params.id);
  ok(res, result);
});
