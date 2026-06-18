import { Router } from 'express';
import {
  login, register, getMe, logout, recover, reset, signup, changePassword, giveConsent,
  refresh, updateProfile, uploadAvatar,
} from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { avatarUpload } from '../middlewares/upload.middleware';
import {
  loginSchema, registerSchema, recoverSchema, resetSchema, signupSchema, changePasswordSchema,
  refreshSchema, updateProfileSchema,
} from '../schemas/auth.schema';

const router = Router();

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Inicia sesión y obtiene un token JWT
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200: { description: Login exitoso, devuelve token y usuario }
 *       401: { description: Credenciales inválidas }
 */
router.post('/login', validate(loginSchema), login);

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Registra un nuevo usuario (paciente o terapeuta)
 *     security: []
 *     requestBody:
 *       required: true
 *     responses:
 *       201: { description: Usuario creado }
 */
router.post('/register', validate(registerSchema), register);

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     tags: [Auth]
 *     summary: Auto-registro público de paciente
 *     security: []
 *     responses:
 *       201: { description: Usuario creado y sesión iniciada }
 */
router.post('/signup', validate(signupSchema), signup);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Cierra la sesión actual invalidando el token
 *     responses:
 *       200: { description: Sesión cerrada }
 */
router.post('/logout', authMiddleware, logout);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Intercambia un refresh token válido por un nuevo access token (rota el refresh token)
 *     security: []
 *     responses:
 *       200: { description: Nuevo access token y refresh token }
 *       401: { description: Refresh token inválido o expirado }
 */
router.post('/refresh', validate(refreshSchema), refresh);

/**
 * @swagger
 * /auth/recover:
 *   post:
 *     tags: [Auth]
 *     summary: Solicita un enlace de recuperación de contraseña por correo
 *     security: []
 *     responses:
 *       200: { description: Instrucciones enviadas (si el correo existe) }
 */
router.post('/recover', validate(recoverSchema), recover);

/**
 * @swagger
 * /auth/reset:
 *   post:
 *     tags: [Auth]
 *     summary: Restablece la contraseña con el token de recuperación
 *     security: []
 *     responses:
 *       200: { description: Contraseña actualizada }
 */
router.post('/reset', validate(resetSchema), reset);

/**
 * @swagger
 * /auth/password:
 *   patch:
 *     tags: [Auth]
 *     summary: Cambia la contraseña del usuario autenticado
 *     responses:
 *       200: { description: Contraseña actualizada }
 *       401: { description: Contraseña actual incorrecta }
 */
router.patch('/password', authMiddleware, validate(changePasswordSchema), changePassword);

/**
 * @swagger
 * /auth/consent:
 *   post:
 *     tags: [Auth]
 *     summary: Registra el consentimiento informado para grabar/procesar audio con IA
 *     responses:
 *       200: { description: Consentimiento registrado }
 */
router.post('/consent', authMiddleware, giveConsent);

/**
 * @swagger
 * /auth/profile:
 *   patch:
 *     tags: [Auth]
 *     summary: Actualiza el teléfono/foto de perfil del usuario autenticado
 *     responses:
 *       200: { description: Perfil actualizado }
 */
router.patch('/profile', authMiddleware, validate(updateProfileSchema), updateProfile);

/**
 * @swagger
 * /auth/avatar:
 *   post:
 *     tags: [Auth]
 *     summary: Sube una foto de perfil desde archivo (multipart/form-data, campo "avatar")
 *     responses:
 *       200: { description: Perfil actualizado con la nueva foto }
 *       400: { description: No se recibió archivo }
 */
router.post('/avatar', authMiddleware, avatarUpload.single('avatar'), uploadAvatar);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Obtiene el perfil del usuario autenticado
 *     responses:
 *       200: { description: Perfil del usuario }
 */
router.get('/me', authMiddleware, getMe);

export { router as authRouter };
