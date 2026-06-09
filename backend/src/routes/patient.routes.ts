import { Router } from 'express';
import { getPatients, getPatientById } from '../controllers/patient.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';

const router = Router();

router.use(authMiddleware, requireRole('THERAPIST'));

router.get('/', getPatients);
router.get('/:id', getPatientById);

export { router as patientRouter };
