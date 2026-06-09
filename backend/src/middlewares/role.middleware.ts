import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('No tienes permiso para esta acción', 403));
    }
    next();
  };
}
