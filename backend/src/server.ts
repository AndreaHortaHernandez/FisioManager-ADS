import 'dotenv/config';
import { app } from './app';
import { prisma } from './lib/prisma';
import { notificationService } from './services/notification.service';
import { logger } from './lib/logger';

const PORT = process.env.PORT ?? 3001;

async function main() {
  await prisma.$connect();
  logger.info('database_connected');

  app.listen(PORT, () => {
    logger.info('server_started', { port: PORT });
  });

  notificationService.startReminderScheduler();
}

main().catch(err => {
  logger.error('server_start_failed', { error: err instanceof Error ? err.message : String(err) });
  process.exit(1);
});
