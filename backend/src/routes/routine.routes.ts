import { Router } from 'express';
import {
  getRoutines,
  getLibrary,
  getRoutineById,
  createRoutine,
  markComplete,
  assignRoutine,
} from '../controllers/routine.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createRoutineSchema, assignRoutineSchema } from '../schemas/routine.schema';

const router = Router();

router.use(authMiddleware);

router.get('/', getRoutines);
router.get('/library', getLibrary);
router.get('/:id', getRoutineById);
router.post('/', requireRole('THERAPIST'), validate(createRoutineSchema), createRoutine);
router.patch('/:id/complete', markComplete);
router.post('/:id/assign', requireRole('THERAPIST'), validate(assignRoutineSchema), assignRoutine);

export { router as routineRouter };
