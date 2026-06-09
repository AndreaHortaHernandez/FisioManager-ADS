import { Response } from 'express';

export function ok<T>(res: Response, data: T, statusCode = 200): void {
  res.status(statusCode).json({ success: true, data });
}

export function created<T>(res: Response, data: T): void {
  ok(res, data, 201);
}
