import { Router } from 'express';
import { createAssignment } from '../controllers/admin.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createAssignmentSchema } from '../schemas/admin.schema';

const router = Router();
router.use(authMiddleware, requireRole('ADMIN'));

router.post('/', validate(createAssignmentSchema), createAssignment);

export { router as asignacionesRouter };
