import { Router } from 'express';
import { authRouter } from './auth.routes';
import { patientRouter } from './patient.routes';
import { routineRouter } from './routine.routes';
import { feedbackRouter } from './feedback.routes';
import { activityTemplateRouter } from './activityTemplate.routes';
import { appointmentRouter } from './appointment.routes';
import { adminRouter } from './admin.routes';

const router = Router();

router.use('/auth', authRouter);
router.use('/patients', patientRouter);
router.use('/routines', routineRouter);
router.use('/feedback', feedbackRouter);
router.use('/activity-templates', activityTemplateRouter);
router.use('/appointments', appointmentRouter);
router.use('/admin', adminRouter);

export { router };
