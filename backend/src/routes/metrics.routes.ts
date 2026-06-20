import { Router } from 'express';
import {
  createOutcomeMeasure, listOutcomeMeasures, deleteOutcomeMeasure, listPainPoints,
} from '../controllers/metrics.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createOutcomeMeasureSchema } from '../schemas/outcomeMeasure.schema';

const outcomeMeasureRouter = Router();
outcomeMeasureRouter.use(authMiddleware);

/**
 * @swagger
 * /outcome-measures:
 *   post:
 *     tags: [Escalas de resultado]
 *     summary: Registra una medición de resultado (ROM, fuerza, funcional, VAS)
 *     responses:
 *       201: { description: Medición registrada }
 */
outcomeMeasureRouter.post('/', requireRole('THERAPIST', 'ADMIN'), validate(createOutcomeMeasureSchema), createOutcomeMeasure);

/**
 * @swagger
 * /outcome-measures/{patientId}:
 *   get:
 *     tags: [Escalas de resultado]
 *     summary: Lista las mediciones de un paciente (opcional ?type=)
 *     responses:
 *       200: { description: Mediciones }
 */
outcomeMeasureRouter.get('/:patientId', listOutcomeMeasures);

outcomeMeasureRouter.delete('/:id', requireRole('THERAPIST', 'ADMIN'), deleteOutcomeMeasure);

const painPointRouter = Router();
painPointRouter.use(authMiddleware);

/**
 * @swagger
 * /pain-points/{patientId}:
 *   get:
 *     tags: [Mapa corporal]
 *     summary: Lista los puntos de dolor marcados por un paciente
 *     responses:
 *       200: { description: Puntos de dolor }
 */
painPointRouter.get('/:patientId', listPainPoints);

export { outcomeMeasureRouter, painPointRouter };
