import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../errors/AppError';
import { tokenRepository } from '../repositories/token.repository';

interface JwtPayload {
  sub: string;
  role: string;
  name: string;
}

export async function authMiddleware(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new AppError('Token no proporcionado', 401));
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    if (await tokenRepository.isRevoked(token)) {
      return next(new AppError('Sesión finalizada. Inicia sesión nuevamente.', 401));
    }

    req.user = { id: payload.sub, role: payload.role, name: payload.name };
    next();
  } catch (err) {
    if (err instanceof AppError) return next(err);
    next(new AppError('Token inválido o expirado', 401));
  }
}
