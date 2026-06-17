import { Router } from 'express';
import {
  listUsers, registerPatient, registerTherapist, toggleUserActive,
} from '../controllers/admin.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import { registerTherapistSchema, registerPatientSchema } from '../schemas/admin.schema';

const router = Router();
router.use(authMiddleware, requireRole('ADMIN'));

router.get('/', listUsers);
router.post('/pacientes', validate(registerPatientSchema), registerPatient);
router.post('/terapeutas', validate(registerTherapistSchema), registerTherapist);
router.patch('/:id/activo', toggleUserActive);

export { router as usuariosRouter };
