import { Request, Response } from 'express';
import { appointmentService } from '../services/appointment.service';
import { catchAsync } from '../utils/catchAsync';
import { ok, created } from '../utils/response';

export const getAppointments = catchAsync(async (req: Request, res: Response) => {
  const { date, therapistId, patientId, status } = req.query as Record<string, string>;
  const appointments = await appointmentService.getAll({ date, therapistId, patientId, status });
  ok(res, appointments);
});

export const getAppointmentById = catchAsync(async (req: Request, res: Response) => {
  const appt = await appointmentService.getById(req.params.id);
  ok(res, appt);
});

export const createAppointment = catchAsync(async (req: Request, res: Response) => {
  const appt = await appointmentService.create(req.body);
  created(res, appt);
});

export const updateAppointment = catchAsync(async (req: Request, res: Response) => {
  const appt = await appointmentService.update(req.params.id, req.body);
  ok(res, appt);
});

export const cancelAppointment = catchAsync(async (req: Request, res: Response) => {
  const appt = await appointmentService.cancel(req.params.id);
  ok(res, appt);
});

export const sendReminder = catchAsync(async (req: Request, res: Response) => {
  const result = await appointmentService.sendReminder(req.params.id);
  ok(res, result);
});
