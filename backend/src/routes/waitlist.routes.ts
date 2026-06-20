import { Router } from 'express';
import { joinWaitlist, listWaitlist, leaveWaitlist } from '../controllers/waitlist.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createWaitlistSchema } from '../schemas/waitlist.schema';

const router = Router();
router.use(authMiddleware);

/**
 * @swagger
 * /waitlist:
 *   get:
 *     tags: [Lista de espera]
 *     summary: Lista las entradas de lista de espera según el rol
 *     responses:
 *       200: { description: Entradas de lista de espera }
 */
router.get('/', listWaitlist);

/**
 * @swagger
 * /waitlist:
 *   post:
 *     tags: [Lista de espera]
 *     summary: Un paciente se une a la lista de espera de su terapeuta
 *     responses:
 *       201: { description: Inscrito en lista de espera }
 */
router.post('/', requireRole('PATIENT'), validate(createWaitlistSchema), joinWaitlist);

/**
 * @swagger
 * /waitlist/{id}:
 *   delete:
 *     tags: [Lista de espera]
 *     summary: Elimina una entrada de la lista de espera
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Entrada eliminada }
 */
router.delete('/:id', leaveWaitlist);

export { router as waitlistRouter };
