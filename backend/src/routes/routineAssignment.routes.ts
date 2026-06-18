import { Router } from 'express';
import {
  getAssignments,
  getAssignmentsByPatient,
  createAssignment,
  updateAssignment,
} from '../controllers/routineAssignment.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createAssignmentSchema, updateAssignmentSchema } from '../schemas/routineAssignment.schema';

const router = Router();

router.use(authMiddleware);

router.get('/', requireRole('THERAPIST'), getAssignments);
router.get('/patient/:patientId', getAssignmentsByPatient);
router.post('/', requireRole('THERAPIST'), validate(createAssignmentSchema), createAssignment);
router.patch('/:id', requireRole('THERAPIST'), validate(updateAssignmentSchema), updateAssignment);

export { router as routineAssignmentRouter };
