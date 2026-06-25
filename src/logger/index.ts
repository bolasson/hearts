import { ConsoleLogger } from './ConsoleLogger';
import type { ILogger } from './ILogger';

export type { ILogger, LogContext, LogLevel } from './ILogger';

/**
 * The application-wide logger singleton.
 *
 * Use this everywhere you want to log:
 *   import { logger } from '@/logger';
 *   logger.info({ module: 'MyComponent', action: 'submit' }, 'Submitted');
 *
 * To replace the implementation (e.g., to add remote logging), construct your
 * own `ILogger` instance and assign it here. Nothing else needs to change.
 */
export const logger: ILogger = new ConsoleLogger();
