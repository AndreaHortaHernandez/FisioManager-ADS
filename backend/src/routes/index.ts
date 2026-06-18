import { Router } from 'express';
import { authRouter } from './auth.routes';
import { patientRouter } from './patient.routes';
import { routineRouter } from './routine.routes';
import { feedbackRouter } from './feedback.routes';
import { activityTemplateRouter } from './activityTemplate.routes';
import { appointmentRouter } from './appointment.routes';
import { adminRouter } from './admin.routes';
import { routineAssignmentRouter } from './routineAssignment.routes';
import { sessionRouter } from './session.routes';
import { meRouter } from './me.routes';
import { usuariosRouter } from './usuarios.routes';
import { asignacionesRouter } from './asignaciones.routes';
import {
  pacientesRouter, historialRouter, diagnosticosRouter, notasRouter, ownHistoryRouter,
} from './clinicalHistory.routes';
import { availabilityRouter } from './availability.routes';
import { patientPlansRouter, plansRouter, phasesRouter } from './treatmentPlan.routes';
import { roomRouter } from './room.routes';
import { notificationPreferenceRouter } from './notificationPreference.routes';
import { analyticsRouter } from './analytics.routes';

const router = Router();

router.use('/auth', authRouter);
router.use('/patients', patientRouter);
router.use('/routines', routineRouter);
router.use('/routine-assignments', routineAssignmentRouter);
router.use('/feedback', feedbackRouter);
router.use('/activity-templates', activityTemplateRouter);
router.use('/appointments', appointmentRouter);
router.use('/admin', adminRouter);
router.use('/admin/salas', roomRouter);
router.use('/admin/analytics', analyticsRouter);
router.use('/sesiones', sessionRouter);
router.use('/me', meRouter);
router.use('/me/historial', ownHistoryRouter);
router.use('/notificaciones', notificationPreferenceRouter);
router.use('/usuarios', usuariosRouter);
router.use('/asignaciones', asignacionesRouter);
router.use('/citas', appointmentRouter);
router.use('/pacientes', pacientesRouter);
router.use('/pacientes', patientPlansRouter);
router.use('/historial', historialRouter);
router.use('/diagnosticos', diagnosticosRouter);
router.use('/notas', notasRouter);
router.use('/disponibilidad', availabilityRouter);
router.use('/planes', plansRouter);
router.use('/fases', phasesRouter);

export { router };
