import 'dotenv/config';
import { app } from './app';
import { prisma } from './lib/prisma';
import { notificationService } from './services/notification.service';

const PORT = process.env.PORT ?? 3001;

async function main() {
  await prisma.$connect();
  console.log('✅ Base de datos conectada');

  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  });

  // Scheduler de recordatorios de cita 24h antes.
  notificationService.startReminderScheduler();
}

main().catch(err => {
  console.error('❌ Error al iniciar el servidor:', err);
  process.exit(1);
});
