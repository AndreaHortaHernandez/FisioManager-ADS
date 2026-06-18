import { randomUUID } from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger';

export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  req.correlationId = req.headers['x-correlation-id']?.toString() ?? randomUUID();
  res.setHeader('X-Correlation-Id', req.correlationId);

  const start = Date.now();
  res.on('finish', () => {
    logger.info('http_request', {
      correlationId: req.correlationId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - start,
    });
  });

  next();
}
