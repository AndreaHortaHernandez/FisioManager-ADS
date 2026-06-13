import { Router } from 'express';
import { getProgreso, getProximaCita } from '../controllers/me.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';

const router = Router();
router.use(authMiddleware, requireRole('PATIENT'));

router.get('/progreso', getProgreso);
router.get('/proxima-cita', getProximaCita);

export { router as meRouter };
