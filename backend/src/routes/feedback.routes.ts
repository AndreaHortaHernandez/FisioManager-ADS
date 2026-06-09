import { Router } from 'express';
import { getFeedbacks, createFeedback } from '../controllers/feedback.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createFeedbackSchema } from '../schemas/feedback.schema';

const router = Router();

router.use(authMiddleware);

router.get('/', getFeedbacks);
router.post('/', requireRole('PATIENT'), validate(createFeedbackSchema), createFeedback);

export { router as feedbackRouter };
