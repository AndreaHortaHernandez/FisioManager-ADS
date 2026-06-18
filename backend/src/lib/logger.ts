

type Level = 'info' | 'warn' | 'error';

function write(level: Level, message: string, context: Record<string, unknown> = {}) {
  const entry = {
    level,
    timestamp: new Date().toISOString(),
    message,
    ...context,
  };
  const line = JSON.stringify(entry);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

export const logger = {
  info: (message: string, context?: Record<string, unknown>) => write('info', message, context),
  warn: (message: string, context?: Record<string, unknown>) => write('warn', message, context),
  error: (message: string, context?: Record<string, unknown>) => write('error', message, context),

  child(correlationId: string) {
    return {
      info: (message: string, context?: Record<string, unknown>) => write('info', message, { correlationId, ...context }),
      warn: (message: string, context?: Record<string, unknown>) => write('warn', message, { correlationId, ...context }),
      error: (message: string, context?: Record<string, unknown>) => write('error', message, { correlationId, ...context }),
    };
  },
};
