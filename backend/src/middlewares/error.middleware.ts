import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { logger } from '../lib/logger';

export function errorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error('app_error', { correlationId: req.correlationId, message: err.message, code: err.code });
    }
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.code ? { code: err.code } : {}),
    });
    return;
  }

  logger.error('unhandled_error', { correlationId: req.correlationId, message: err.message, stack: err.stack });
  res.status(500).json({ success: false, message: 'Error interno del servidor' });
}
