import { Router } from 'express';
import { getMyPreferences, updateMyPreferences } from '../controllers/notificationPreference.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { updateNotificationPreferenceSchema } from '../schemas/notificationPreference.schema';

const router = Router();
router.use(authMiddleware);

/**
 * @swagger
 * /notificaciones:
 *   get:
 *     tags: [Notificaciones]
 *     summary: Obtiene las preferencias de notificación del usuario autenticado
 *     responses:
 *       200: { description: Preferencias actuales }
 *   put:
 *     tags: [Notificaciones]
 *     summary: Actualiza las preferencias de notificación (canales, horarios)
 *     responses:
 *       200: { description: Preferencias actualizadas }
 */
router.get('/', getMyPreferences);
router.put('/', validate(updateNotificationPreferenceSchema), updateMyPreferences);

export { router as notificationPreferenceRouter };
