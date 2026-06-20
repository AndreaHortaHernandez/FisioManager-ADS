import 'dotenv/config';
import { createServer } from 'http';
import { app } from './app';
import { prisma } from './lib/prisma';
import { notificationService } from './services/notification.service';
import { initSocket } from './lib/socket';
import { initObservability, captureException } from './lib/observability';
import { validateEnv } from './config/env';
import { logger } from './lib/logger';

const PORT = process.env.PORT ?? 3001;

async function main() {
  validateEnv();
  initObservability();

  await prisma.$connect();
  logger.info('database_connected');

  const httpServer = createServer(app);
  const io = initSocket(httpServer);

  httpServer.listen(PORT, () => {
    logger.info('server_started', { port: PORT });
  });

  notificationService.startReminderScheduler();

  let shuttingDown = false;
  async function shutdown(signal: string) {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info('shutdown_started', { signal });

    const timer = setTimeout(() => {
      logger.error('shutdown_forced', { reason: 'timeout' });
      process.exit(1);
    }, 10_000);
    timer.unref();

    try {
      io.close();
      await new Promise<void>(resolve => httpServer.close(() => resolve()));
      await prisma.$disconnect();
      logger.info('shutdown_complete');
      process.exit(0);
    } catch (err) {
      logger.error('shutdown_error', { error: err instanceof Error ? err.message : String(err) });
      process.exit(1);
    }
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

process.on('unhandledRejection', (reason) => {
  logger.error('unhandled_rejection', { reason: reason instanceof Error ? reason.message : String(reason) });
  captureException(reason);
});
process.on('uncaughtException', (err) => {
  logger.error('uncaught_exception', { error: err.message, stack: err.stack });
  captureException(err);
  process.exit(1);
});

main().catch(err => {
  logger.error('server_start_failed', { error: err instanceof Error ? err.message : String(err) });
  process.exit(1);
});
