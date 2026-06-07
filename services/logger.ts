const IS_DEV = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
}

const recentLogs: LogEntry[] = [];
const MAX_LOGS = 100;

function log(level: LogLevel, message: string, context?: Record<string, unknown>) {
  const entry: LogEntry = {
    level,
    message,
    context,
    timestamp: new Date().toISOString(),
  };

  recentLogs.push(entry);
  if (recentLogs.length > MAX_LOGS) recentLogs.shift();

  if (IS_DEV) {
    const prefix = `[NeuralKey:${level.toUpperCase()}]`;
    if (level === 'error') {
      console.error(prefix, message, context ?? '');
    } else if (level === 'warn') {
      console.warn(prefix, message, context ?? '');
    } else {
      console.log(prefix, message, context ?? '');
    }
  }
}

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) => log('debug', message, context),
  info: (message: string, context?: Record<string, unknown>) => log('info', message, context),
  warn: (message: string, context?: Record<string, unknown>) => log('warn', message, context),
  error: (message: string, context?: Record<string, unknown>) => log('error', message, context),
  getLogs: () => [...recentLogs],
  clearLogs: () => recentLogs.splice(0, recentLogs.length),
};
