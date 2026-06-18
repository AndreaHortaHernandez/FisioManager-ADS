import { Router } from 'express';
import { getProgreso, getProximaCita } from '../controllers/me.controller';
import { getProgressReportPdf } from '../controllers/report.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';

const router = Router();
router.use(authMiddleware, requireRole('PATIENT'));

router.get('/progreso', getProgreso);
router.get('/proxima-cita', getProximaCita);
router.get('/reporte', getProgressReportPdf);

export { router as meRouter };
