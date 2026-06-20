import { Server as HttpServer } from 'http';
import { Server as IOServer, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';
import jwt from 'jsonwebtoken';
import { tokenRepository } from '../repositories/token.repository';
import { logger } from './logger';

interface JwtPayload {
  sub: string;
  role: string;
  name: string;
}

let io: IOServer | null = null;

export function initSocket(httpServer: HttpServer): IOServer {
  const isDev = process.env.NODE_ENV !== 'production';
  io = new IOServer(httpServer, {
    cors: {
      origin: isDev ? true : process.env.CORS_ORIGIN,
      credentials: true,
    },
  });

  if (process.env.REDIS_URL) {
    const pub = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null });
    const sub = pub.duplicate();
    pub.on('error', e => logger.error('redis_pub_error', { error: e.message }));
    sub.on('error', e => logger.error('redis_sub_error', { error: e.message }));
    io.adapter(createAdapter(pub, sub));
    logger.info('socket_redis_adapter_enabled');
  }

  io.use(async (socket: Socket, next) => {
    try {
      const token = socket.handshake.auth?.token as string | undefined;
      if (!token) return next(new Error('Token no proporcionado'));

      const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
      if (await tokenRepository.isRevoked(token)) return next(new Error('Sesión finalizada'));

      socket.data.userId = payload.sub;
      socket.data.role = payload.role;
      next();
    } catch {
      next(new Error('Token inválido o expirado'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId as string;
    socket.join(`user:${userId}`);
    logger.info('socket_connected', { userId });

    socket.on('disconnect', () => logger.info('socket_disconnected', { userId }));
  });

  logger.info('socket_initialized');
  return io;
}

export function emitToUser(userId: string, event: string, payload: unknown): void {
  io?.to(`user:${userId}`).emit(event, payload);
}
