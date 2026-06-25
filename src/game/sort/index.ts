/**
 * Hand sort engine.
 *
 * Strategy pattern, but the "strategy" is built dynamically from a config
 * object rather than picked from a registry. The player edits three
 * independent settings in the sidebar (suit order, number order, sort-first-by)
 * and the store passes the resulting config to `sortHandWith` whenever it
 * needs to re-sort the player's hand.
 *
 * Implementation notes:
 *  - Suits unknown to `suitOrder` are pushed to the end (defensive: prevents
 *    crashes if a stale config lacks a suit).
 *  - `numberOrder === 'random'` uses Fisher–Yates on the whole hand first and
 *    relies on `Array.prototype.sort` being stable (ES2019+) to preserve the
 *    random order within tied groups. So sortFirstBy === 'suit' + random
 *    yields "grouped by suit, shuffled within group"; sortFirstBy === 'number'
 *    + random reduces to "fully shuffled" since there are no primary ties.
 */

import { SUITS, type Card, type Suit } from '@/game/Card';
import { type HandSortConfig } from './types';

export type { HandSortConfig, NumberOrder, SortFirstBy } from './types';
export { DEFAULT_HAND_SORT_CONFIG } from './types';

export function sortHandWith(hand: readonly Card[], config: HandSortConfig): Card[] {
  const { suitOrder, numberOrder, sortFirstBy } = config;

  const suitIndex = new Map<Suit, number>();
  suitOrder.forEach((s, i) => suitIndex.set(s, i));
  SUITS.forEach((s, i) => {
    if (!suitIndex.has(s)) suitIndex.set(s, suitOrder.length + i);
  });

  const out = [...hand];

  if (numberOrder === 'random') {
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = out[i];
      out[i] = out[j];
      out[j] = tmp;
    }
  }

  out.sort((a, b) => {
    const suitCmp = (suitIndex.get(a.suit) ?? 0) - (suitIndex.get(b.suit) ?? 0);
    const numberCmp =
      numberOrder === 'asc'
        ? a.value - b.value
        : numberOrder === 'desc'
          ? b.value - a.value
          : 0;
    if (sortFirstBy === 'suit') {
      if (suitCmp !== 0) return suitCmp;
      return numberCmp;
    }
    if (numberCmp !== 0) return numberCmp;
    return suitCmp;
  });

  return out;
}
