import { Router } from 'express';
import { listRooms, createRoom, updateRoom, deleteRoom } from '../controllers/room.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createRoomSchema, updateRoomSchema } from '../schemas/room.schema';

const router = Router();
router.use(authMiddleware, requireRole('ADMIN'));

/**
 * @swagger
 * /admin/salas:
 *   get:
 *     tags: [Salas]
 *     summary: Lista las salas/consultorios de la clínica
 *     responses:
 *       200: { description: Lista de salas }
 */
router.get('/', listRooms);

/**
 * @swagger
 * /admin/salas:
 *   post:
 *     tags: [Salas]
 *     summary: Registra una nueva sala
 *     responses:
 *       201: { description: Sala creada }
 */
router.post('/', validate(createRoomSchema), createRoom);

/**
 * @swagger
 * /admin/salas/{id}:
 *   patch:
 *     tags: [Salas]
 *     summary: Actualiza una sala
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Sala actualizada }
 */
router.patch('/:id', validate(updateRoomSchema), updateRoom);

/**
 * @swagger
 * /admin/salas/{id}:
 *   delete:
 *     tags: [Salas]
 *     summary: Elimina una sala
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Sala eliminada }
 */
router.delete('/:id', deleteRoom);

export { router as roomRouter };
