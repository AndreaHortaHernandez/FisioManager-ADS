import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import rateLimit from 'express-rate-limit';
import { router } from './routes';
import { errorMiddleware } from './middlewares/error.middleware';
import { requestLoggerMiddleware } from './middlewares/requestLogger.middleware';
import { mountApiDocs } from './lib/swagger';
import { prisma } from './lib/prisma';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pkg = require('../package.json') as { version: string };

const app = express();

app.set('trust proxy', 1);

const isDev = process.env.NODE_ENV !== 'production';

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: isDev
    ? (origin, cb) => cb(null, true)
    : process.env.CORS_ORIGIN,
  credentials: true,
}));

app.use(express.json());
app.use(requestLoggerMiddleware);

mountApiDocs(app);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', version: pkg.version, uptime: process.uptime() });
});

app.get('/health/ready', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', version: pkg.version, uptime: process.uptime(), db: 'ok' });
  } catch {
    res.status(503).json({ status: 'degraded', db: 'down' });
  }
});

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Demasiadas peticiones. Intenta de nuevo en un minuto.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { success: false, message: 'Demasiados intentos. Intenta de nuevo en 15 minutos.' },
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/recover', authLimiter);
app.use('/api/auth/reset', authLimiter);

app.use('/api', apiLimiter, router);

app.use(errorMiddleware);

export { app };
