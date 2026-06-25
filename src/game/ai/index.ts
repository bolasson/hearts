/**
 * CPU strategy registry.
 *
 * The store imports `getCpuStrategy()` and uses whatever it returns. To swap
 * strategies later (difficulty selector, A/B test), change this file — nothing else.
 */

import { RandomCpu } from './RandomCpu';
import type { CpuStrategy } from './CpuStrategy';

export type { CpuStrategy } from './CpuStrategy';

let activeStrategy: CpuStrategy = new RandomCpu();

export function getCpuStrategy(): CpuStrategy {
  return activeStrategy;
}

/** Replace the active CPU strategy. Useful for tests and future difficulty selection. */
export function setCpuStrategy(strategy: CpuStrategy): void {
  activeStrategy = strategy;
}
