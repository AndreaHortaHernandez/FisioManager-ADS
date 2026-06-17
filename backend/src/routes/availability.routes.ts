import { Router } from 'express';
import { getAvailability, setAvailability } from '../controllers/availability.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import { setAvailabilitySchema } from '../schemas/availability.schema';

const router = Router();
router.use(authMiddleware, requireRole('ADMIN', 'THERAPIST'));

router.get('/:therapistId', getAvailability);
router.put('/:therapistId', validate(setAvailabilitySchema), setAvailability);

export { router as availabilityRouter };
