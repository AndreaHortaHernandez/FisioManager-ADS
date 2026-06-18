import { Router } from 'express';
import {
  getPlansByPatient, getPlan, createPlan, updatePlan,
  addPhase, updatePhase, deletePhase, getAssignmentsByPhase,
} from '../controllers/treatmentPlan.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createPlanSchema, updatePlanSchema, createPhaseSchema, updatePhaseSchema,
} from '../schemas/treatmentPlan.schema';

const patientPlansRouter = Router();
patientPlansRouter.use(authMiddleware, requireRole('THERAPIST', 'ADMIN'));

/**
 * @swagger
 * /pacientes/{id}/planes:
 *   get:
 *     tags: [Plan de Tratamiento]
 *     summary: Lista los planes de tratamiento de un paciente
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Lista de planes }
 *   post:
 *     tags: [Plan de Tratamiento]
 *     summary: Crea un plan de tratamiento para un paciente
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       201: { description: Plan creado }
 */
patientPlansRouter.get('/:id/planes', getPlansByPatient);
patientPlansRouter.post('/:id/planes', validate(createPlanSchema), createPlan);

const plansRouter = Router();
plansRouter.use(authMiddleware, requireRole('THERAPIST', 'ADMIN'));

/**
 * @swagger
 * /planes/{id}:
 *   get:
 *     tags: [Plan de Tratamiento]
 *     summary: Obtiene un plan de tratamiento con sus fases
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Plan con fases }
 *   patch:
 *     tags: [Plan de Tratamiento]
 *     summary: Actualiza nombre, objetivo, fechas o estado del plan
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Plan actualizado }
 */
plansRouter.get('/:id', getPlan);
plansRouter.patch('/:id', validate(updatePlanSchema), updatePlan);

/**
 * @swagger
 * /planes/{id}/fases:
 *   post:
 *     tags: [Plan de Tratamiento]
 *     summary: Agrega una fase secuencial al plan
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       201: { description: Fase creada }
 */
plansRouter.post('/:id/fases', validate(createPhaseSchema), addPhase);

const phasesRouter = Router();
phasesRouter.use(authMiddleware, requireRole('THERAPIST', 'ADMIN'));

/**
 * @swagger
 * /fases/{id}:
 *   patch:
 *     tags: [Plan de Tratamiento]
 *     summary: Actualiza una fase del plan
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Fase actualizada }
 *   delete:
 *     tags: [Plan de Tratamiento]
 *     summary: Elimina una fase del plan
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Fase eliminada }
 */
phasesRouter.patch('/:id', validate(updatePhaseSchema), updatePhase);
phasesRouter.delete('/:id', deletePhase);

/**
 * @swagger
 * /fases/{id}/asignaciones:
 *   get:
 *     tags: [Plan de Tratamiento]
 *     summary: Lista las asignaciones de rutina prescritas en esta fase
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Lista de asignaciones }
 */
phasesRouter.get('/:id/asignaciones', getAssignmentsByPhase);

export { patientPlansRouter, plansRouter, phasesRouter };
