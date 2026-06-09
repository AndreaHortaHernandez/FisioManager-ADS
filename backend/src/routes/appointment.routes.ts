import { Router } from 'express';
import {
  getAppointments, getAppointmentById, createAppointment,
  updateAppointment, cancelAppointment, sendReminder,
} from '../controllers/appointment.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createAppointmentSchema, updateAppointmentSchema } from '../schemas/appointment.schema';

const router = Router();
router.use(authMiddleware, requireRole('ADMIN'));

router.get('/', getAppointments);
router.get('/:id', getAppointmentById);
router.post('/', validate(createAppointmentSchema), createAppointment);
router.patch('/:id', validate(updateAppointmentSchema), updateAppointment);
router.patch('/:id/cancel', cancelAppointment);
router.post('/:id/reminder', sendReminder);

export { router as appointmentRouter };
