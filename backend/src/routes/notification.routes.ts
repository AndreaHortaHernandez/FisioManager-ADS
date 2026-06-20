import { Router } from 'express';
import { listNotifications, getUnreadCount, markRead, markAllRead } from '../controllers/notification.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
router.use(authMiddleware);

/**
 * @swagger
 * /notifications:
 *   get:
 *     tags: [Notificaciones]
 *     summary: Lista las notificaciones in-app del usuario autenticado
 *     responses:
 *       200: { description: Lista de notificaciones }
 */
router.get('/', listNotifications);

/**
 * @swagger
 * /notifications/unread-count:
 *   get:
 *     tags: [Notificaciones]
 *     summary: Número de notificaciones sin leer
 *     responses:
 *       200: { description: Conteo de no leídas }
 */
router.get('/unread-count', getUnreadCount);

/**
 * @swagger
 * /notifications/read-all:
 *   patch:
 *     tags: [Notificaciones]
 *     summary: Marca todas las notificaciones como leídas
 *     responses:
 *       200: { description: Notificaciones marcadas }
 */
router.patch('/read-all', markAllRead);

/**
 * @swagger
 * /notifications/{id}/read:
 *   patch:
 *     tags: [Notificaciones]
 *     summary: Marca una notificación como leída
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Notificación marcada }
 */
router.patch('/:id/read', markRead);

export { router as notificationRouter };
