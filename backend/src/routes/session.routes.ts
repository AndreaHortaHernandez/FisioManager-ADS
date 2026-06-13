import { Router } from 'express';
import { startSession, trackExercise, finalizeSession } from '../controllers/session.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';

const router = Router();

router.use(authMiddleware);
router.use(requireRole('PATIENT'));

router.post('/', startSession);
router.patch('/:id/ejercicios', trackExercise);
router.post('/:id/finalizar', finalizeSession);

export { router as sessionRouter };
