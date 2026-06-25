/**
 * CPU strategy interface — the Strategy pattern for AI behavior.
 *
 * The game state asks a strategy two questions:
 *   1) Which 3 cards do you pass at the start of a passing round?
 *   2) Which card do you play next, given the current trick?
 *
 * Implementations can range from random (the default) to clever (point-counting,
 * tracking played cards, refusing the queen, etc.). Adding a difficulty selector
 * means writing a new implementation and registering it in `index.ts` — no other
 * code changes.
 */

import type { Card } from '@/game/Card';
import type { Trick } from '@/game/Trick';

export interface CpuStrategy {
  /** Name shown in the UI when this strategy is selected. */
  readonly name: string;

  /** Pick exactly 3 cards from `hand` to pass. */
  choosePassCards(hand: readonly Card[]): Card[];

  /**
   * Pick the next card to play given the current trick state.
   * Must return a card from the returned set of legal plays — this contract
   * lets the caller validate plays and detect strategy bugs.
   */
  chooseCardToPlay(
    hand: readonly Card[],
    currentTrick: Trick,
    heartsBroken: boolean,
    isFirstTrick: boolean
  ): Card | null;
}
