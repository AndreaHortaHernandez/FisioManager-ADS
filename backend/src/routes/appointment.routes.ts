import { Router } from 'express';
import {
  getAppointments, getAppointmentById, createAppointment,
  updateAppointment, cancelAppointment, confirmAppointment, sendReminder,
} from '../controllers/appointment.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createAppointmentSchema, updateAppointmentSchema } from '../schemas/appointment.schema';

const router = Router();
router.use(authMiddleware);

/**
 * @swagger
 * /appointments:
 *   get:
 *     tags: [Citas]
 *     summary: Lista citas, con filtros opcionales de fecha/terapeuta/paciente/estado
 *     parameters:
 *       - in: query
 *         name: date
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: therapistId
 *         schema: { type: string }
 *       - in: query
 *         name: patientId
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [SCHEDULED, CANCELLED, COMPLETED] }
 *     responses:
 *       200: { description: Lista de citas }
 */
router.get('/', requireRole('ADMIN', 'PATIENT', 'THERAPIST'), getAppointments);

/**
 * @swagger
 * /appointments/{id}:
 *   get:
 *     tags: [Citas]
 *     summary: Obtiene una cita por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Cita encontrada }
 *       404: { description: Cita no encontrada }
 */
router.get('/:id', requireRole('ADMIN'), getAppointmentById);

/**
 * @swagger
 * /appointments:
 *   post:
 *     tags: [Citas]
 *     summary: Agenda una nueva cita (valida disponibilidad y colisiones)
 *     responses:
 *       201: { description: Cita creada }
 *       409: { description: Conflicto de horario }
 */
router.post('/', requireRole('ADMIN', 'PATIENT'), validate(createAppointmentSchema), createAppointment);

/**
 * @swagger
 * /appointments/{id}:
 *   patch:
 *     tags: [Citas]
 *     summary: Reprograma o actualiza una cita
 *     responses:
 *       200: { description: Cita actualizada }
 */
router.patch('/:id', requireRole('ADMIN'), validate(updateAppointmentSchema), updateAppointment);

/**
 * @swagger
 * /appointments/{id}/cancel:
 *   patch:
 *     tags: [Citas]
 *     summary: Cancela una cita
 *     responses:
 *       200: { description: Cita cancelada }
 */
router.patch('/:id/cancel', requireRole('ADMIN', 'PATIENT'), cancelAppointment);

/**
 * @swagger
 * /appointments/{id}/confirm:
 *   patch:
 *     tags: [Citas]
 *     summary: Confirma una cita previamente agendada
 *     responses:
 *       200: { description: Cita confirmada }
 *       409: { description: La cita no está en estado Programada }
 */
router.patch('/:id/confirm', requireRole('ADMIN'), confirmAppointment);

/**
 * @swagger
 * /appointments/{id}/reminder:
 *   post:
 *     tags: [Citas]
 *     summary: Envía manualmente el recordatorio de la cita
 *     responses:
 *       200: { description: Recordatorio enviado }
 */
router.post('/:id/reminder', requireRole('ADMIN'), sendReminder);

export { router as appointmentRouter };
