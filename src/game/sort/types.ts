/**
 * Configuration types for the player's hand sort preferences.
 *
 * Three independent dimensions fully describe a sort:
 *   - suitOrder    — the suits in the user's preferred priority (left → right
 *                    in the suit-preferences UI)
 *   - numberOrder  — asc, desc, or random (the latter applies Fisher–Yates and
 *                    relies on the stable sort below to preserve the shuffle
 *                    within any tied groups)
 *   - sortFirstBy  — whether suit or number is the primary key
 *
 * Together they cover every sort the player can build through the sidebar UI.
 */

import type { Suit } from '@/game/Card';

export type NumberOrder = 'asc' | 'desc' | 'random';
export type SortFirstBy = 'number' | 'suit';

export type HandSortConfig = {
  /** Suits ordered by user preference (leftmost = first). Must contain all four. */
  readonly suitOrder: readonly Suit[];
  readonly numberOrder: NumberOrder;
  readonly sortFirstBy: SortFirstBy;
};

export const DEFAULT_HAND_SORT_CONFIG: HandSortConfig = {
  suitOrder: ['♣', '♦', '♠', '♥'],
  numberOrder: 'asc',
  sortFirstBy: 'suit',
};
