import * as Sentry from '@sentry/node';
import { logger } from './logger';

let enabled = false;

export function initObservability() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    logger.info('observability_local_only', { hint: 'Define SENTRY_DSN para enviar errores a Sentry.' });
    return;
  }
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0'),
  });
  enabled = true;
  logger.info('observability_sentry_enabled');
}

export function captureException(err: unknown, context?: Record<string, unknown>) {
  if (enabled) {
    Sentry.captureException(err, context ? { extra: context } : undefined);
  }
}
