import express from 'express';
import cors from 'cors';
import path from 'path';
import rateLimit from 'express-rate-limit';
import { router } from './routes';
import { errorMiddleware } from './middlewares/error.middleware';
import { requestLoggerMiddleware } from './middlewares/requestLogger.middleware';
import { mountApiDocs } from './lib/swagger';

const app = express();

const isDev = process.env.NODE_ENV !== 'production';

app.use(cors({
  origin: isDev
    ? (origin, cb) => cb(null, true)  
    : process.env.CORS_ORIGIN,
  credentials: true,
}));

app.use(express.json());
app.use(requestLoggerMiddleware);

mountApiDocs(app);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Demasiadas peticiones. Intenta de nuevo en un minuto.' },
});

app.use('/api', apiLimiter, router);

app.use(errorMiddleware);

export { app };
