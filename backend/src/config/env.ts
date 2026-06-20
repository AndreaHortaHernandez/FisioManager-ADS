import { z } from 'zod';
import { logger } from '../lib/logger';

const INSECURE_SECRETS = [
  'cambia-esto-por-un-secreto-seguro-en-produccion',
  'dev-secret-local-fisiomanager-cambia-en-produccion',
  'devsecret',
  'secret',
  'changeme',
];

const schema = z.object({
  NODE_ENV: z.string().default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL es obligatoria'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET es obligatoria'),
  PORT: z.string().optional(),
  CORS_ORIGIN: z.string().optional(),
});

export function validateEnv() {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const msg = parsed.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
    logger.error('env_validation_failed', { errors: msg });
    throw new Error(`Configuración de entorno inválida: ${msg}`);
  }

  const env = parsed.data;
  const isProd = env.NODE_ENV === 'production';
  const problems: string[] = [];

  if (INSECURE_SECRETS.includes(env.JWT_SECRET) || env.JWT_SECRET.length < 32) {
    problems.push('JWT_SECRET es inseguro o demasiado corto (usa ≥ 32 caracteres aleatorios).');
  }
  if (isProd && !env.CORS_ORIGIN) {
    problems.push('CORS_ORIGIN debe apuntar al dominio del frontend en producción.');
  }
  if (isProd && !process.env.EMAIL_HOST) {
    logger.warn('email_not_configured', { hint: 'Define EMAIL_HOST/EMAIL_USER/EMAIL_PASS para enviar correos reales.' });
  }

  if (problems.length > 0) {
    if (isProd) {
      logger.error('env_insecure', { problems });
      throw new Error(`Configuración insegura para producción:\n - ${problems.join('\n - ')}`);
    }
    logger.warn('env_insecure_dev', { problems });
  }

  return env;
}
