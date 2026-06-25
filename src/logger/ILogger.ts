/**
 * The universal logger interface.
 *
 * Use this interface everywhere you want to log. The default implementation
 * (`ConsoleLogger`) writes to the browser console and keeps a ring buffer
 * of recent entries accessible via `window.__logs` in development.
 *
 * To swap implementations (e.g., to send logs to a remote service), implement
 * `ILogger` and replace the `logger` export in `./index.ts`. No consumer code
 * changes.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  /** The component, module, or subsystem the log originates from. */
  module: string;
  /** Optional: the specific action being performed (e.g., "submit", "load"). */
  action?: string;
  /** Optional: arbitrary metadata. Sensitive keys (password, token, etc.) are auto-redacted. */
  meta?: Record<string, unknown>;
}

export interface ILogger {
  debug(context: LogContext, message: string): void;
  info(context: LogContext, message: string): void;
  warn(context: LogContext, message: string): void;
  error(context: LogContext, message: string, error?: Error): void;
}
