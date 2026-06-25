/**
 * Abstract Factory for DAOs.
 *
 * The factory is the single point of swap for persistence. When the application
 * moves from LocalStorage to a real backend, you implement a new factory
 * (e.g., `HttpDaoFactory`) and change the `daoFactory` export below to point at it.
 * No consumer code changes.
 *
 * Each DAO created here returns Promises — even the LocalStorage default — so
 * consumers are written async-first and migration is painless.
 *
 * As the `dao` skill adds entities, both `DaoFactory` (interface) and
 * `LocalStorageDaoFactory` (default impl) grow methods like `recipes(): IRecipeDao`.
 */

import type { ILogger } from '@/logger';
import { logger } from '@/logger';

export interface DaoFactory {
  readonly factoryName: string;
  readonly logger: ILogger;
}

export class LocalStorageDaoFactory implements DaoFactory {
  readonly factoryName = 'LocalStorageDaoFactory';
  readonly logger = logger;
}

/**
 * The application-wide DAO factory singleton.
 *
 * Swap this line (and import a different class above) to change the persistence
 * implementation. Nothing else in the application needs to change.
 */
export const daoFactory: DaoFactory = new LocalStorageDaoFactory();
