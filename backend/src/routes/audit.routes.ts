import { Router } from 'express';
import { listAuditLogs } from '../controllers/audit.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';

const router = Router();
router.use(authMiddleware, requireRole('ADMIN'));

/**
 * @swagger
 * /audit:
 *   get:
 *     tags: [Auditoría]
 *     summary: Lista la bitácora de auditoría (solo ADMIN)
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema: { type: string }
 *       - in: query
 *         name: entity
 *         schema: { type: string }
 *       - in: query
 *         name: action
 *         schema: { type: string }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Lista de entradas de auditoría }
 */
router.get('/', listAuditLogs);

export { router as auditRouter };
