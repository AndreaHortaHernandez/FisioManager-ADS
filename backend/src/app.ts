import express from 'express';
import cors from 'cors';
import path from 'path';
import { router } from './routes';
import { errorMiddleware } from './middlewares/error.middleware';

const app = express();

const isDev = process.env.NODE_ENV !== 'production';

app.use(cors({
  origin: isDev
    ? (origin, cb) => cb(null, true)  // en desarrollo acepta cualquier origen
    : process.env.CORS_ORIGIN,
  credentials: true,
}));

app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api', router);

app.use(errorMiddleware);

export { app };
