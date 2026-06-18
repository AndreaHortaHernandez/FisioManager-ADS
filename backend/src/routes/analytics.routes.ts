import { Router } from 'express';
import { getOverview, getTherapistComparison } from '../controllers/analytics.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';

const router = Router();
router.use(authMiddleware, requireRole('ADMIN'));

router.get('/overview', getOverview);
router.get('/therapists', getTherapistComparison);

export { router as analyticsRouter };
