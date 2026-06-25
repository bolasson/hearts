import type { ILogger, LogContext, LogLevel } from './ILogger';

const SENSITIVE_KEY_FRAGMENTS = ['password', 'token', 'apikey', 'secret', 'auth', 'cookie'];

function sanitize(meta: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!meta) return undefined;
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(meta)) {
    const isSensitive = SENSITIVE_KEY_FRAGMENTS.some((fragment) =>
      key.toLowerCase().includes(fragment)
    );
    cleaned[key] = isSensitive ? '[REDACTED]' : value;
  }
  return cleaned;
}

interface LogEntry {
  level: LogLevel;
  timestamp: string;
  module: string;
  action: string | undefined;
  message: string;
  meta: Record<string, unknown> | undefined;
}

const RING_BUFFER_SIZE = 200;

/**
 * Default ILogger implementation.
 *
 * - Writes to the browser console (debug suppressed in production builds).
 * - Keeps the last 200 entries in a ring buffer.
 * - In development, exposes the ring buffer at `window.__logs` so users can paste
 *   it into bug reports.
 * - Auto-redacts keys whose names look sensitive (password, token, apiKey, etc.).
 */
export class ConsoleLogger implements ILogger {
  private ring: LogEntry[] = [];

  private record(level: LogLevel, context: LogContext, message: string): LogEntry {
    const entry: LogEntry = {
      level,
      timestamp: new Date().toISOString(),
      module: context.module,
      action: context.action,
      message,
      meta: sanitize(context.meta),
    };
    this.ring.push(entry);
    if (this.ring.length > RING_BUFFER_SIZE) {
      this.ring.shift();
    }
    if (import.meta.env.DEV) {
      (window as unknown as { __logs?: LogEntry[] }).__logs = this.ring;
    }
    return entry;
  }

  private format(entry: LogEntry): string {
    const tag = entry.action ? `${entry.module}/${entry.action}` : entry.module;
    return `[${entry.level.toUpperCase()}] [${tag}] ${entry.message}`;
  }

  debug(context: LogContext, message: string): void {
    const entry = this.record('debug', context, message);
    if (import.meta.env.DEV) {
      console.debug(this.format(entry), entry.meta ?? '');
    }
  }

  info(context: LogContext, message: string): void {
    const entry = this.record('info', context, message);
    console.info(this.format(entry), entry.meta ?? '');
  }

  warn(context: LogContext, message: string): void {
    const entry = this.record('warn', context, message);
    console.warn(this.format(entry), entry.meta ?? '');
  }

  error(context: LogContext, message: string, error?: Error): void {
    const entry = this.record('error', context, message);
    console.error(this.format(entry), entry.meta ?? '', error ?? '');
  }
}
