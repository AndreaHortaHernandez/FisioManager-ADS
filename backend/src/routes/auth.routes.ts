import { Router } from 'express';
import { login, register, getMe, logout, recover, reset, signup } from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { loginSchema, registerSchema, recoverSchema, resetSchema, signupSchema } from '../schemas/auth.schema';

const router = Router();

router.post('/login', validate(loginSchema), login);
router.post('/register', validate(registerSchema), register);
router.post('/signup', validate(signupSchema), signup);
router.post('/logout', authMiddleware, logout);
router.post('/recover', validate(recoverSchema), recover);
router.post('/reset', validate(resetSchema), reset);
router.get('/me', authMiddleware, getMe);

export { router as authRouter };
