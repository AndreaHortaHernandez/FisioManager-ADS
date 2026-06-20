import { Router } from 'express';
import { listConversations, openConversation, getMessages, sendMessage } from '../controllers/chat.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createConversationSchema, sendMessageSchema } from '../schemas/chat.schema';

const router = Router();
router.use(authMiddleware, requireRole('PATIENT', 'THERAPIST'));

/**
 * @swagger
 * /conversations:
 *   get:
 *     tags: [Mensajería]
 *     summary: Lista las conversaciones del usuario autenticado
 *     responses:
 *       200: { description: Lista de conversaciones }
 */
router.get('/', listConversations);

/**
 * @swagger
 * /conversations:
 *   post:
 *     tags: [Mensajería]
 *     summary: Abre (o crea) una conversación con otro participante vinculado
 *     responses:
 *       201: { description: Conversación }
 */
router.post('/', validate(createConversationSchema), openConversation);

/**
 * @swagger
 * /conversations/{id}/messages:
 *   get:
 *     tags: [Mensajería]
 *     summary: Obtiene los mensajes de una conversación (marca como leídos)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Mensajes }
 */
router.get('/:id/messages', getMessages);

/**
 * @swagger
 * /conversations/{id}/messages:
 *   post:
 *     tags: [Mensajería]
 *     summary: Envía un mensaje en la conversación
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       201: { description: Mensaje enviado }
 */
router.post('/:id/messages', validate(sendMessageSchema), sendMessage);

export { router as chatRouter };
