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

const router = Router();

router.use('/auth', authRouter);
router.use('/patients', patientRouter);
router.use('/routines', routineRouter);
router.use('/routine-assignments', routineAssignmentRouter);
router.use('/feedback', feedbackRouter);
router.use('/activity-templates', activityTemplateRouter);
router.use('/appointments', appointmentRouter);
router.use('/admin', adminRouter);
router.use('/sesiones', sessionRouter);
router.use('/me', meRouter);
router.use('/usuarios', usuariosRouter);
router.use('/asignaciones', asignacionesRouter);

export { router };
