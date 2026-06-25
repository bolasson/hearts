/**
 * Compute the animation paths for the pass phase.
 *
 * When the human submits their pass, all four players' chosen cards animate from
 * their starting hand fan to their destination hand fan simultaneously. This module
 * computes each card's start position, end position, source and destination seats.
 *
 * Kept separate from layout.ts to keep that file focused on per-seat geometry rather
 * than multi-card choreography.
 */

import type { Card } from './Card';
import { sortHand } from './Card';
import { handCardPosition, type Position } from './layout';
import type { PlayerIndex } from './Players';
import { passTo, type PassDirection } from './passing';

export type PassAnimation = {
  readonly card: Card;
  readonly fromPlayer: PlayerIndex;
  readonly toPlayer: PlayerIndex;
  readonly start: Position;
  readonly target: Position;
};

export type PassAnimationsResult = {
  readonly animations: readonly PassAnimation[];
  /** IDs of cards being passed — used by the source hand to hide them during animation. */
  readonly inFlightIds: readonly string[];
};

/**
 * Build pass animations from each player's old hand to the new final hands.
 *
 * @param prevHands  hands before passing (still containing the cards being passed)
 * @param finalHands hands after passing has resolved (each sorted)
 * @param picks      the 3 cards each player chose to pass, indexed by player
 * @param direction  pass direction for the round
 */
export function makePassAnimations(
  prevHands: ReadonlyArray<readonly Card[]>,
  finalHands: ReadonlyArray<readonly Card[]>,
  picks: ReadonlyArray<readonly Card[]>,
  direction: PassDirection
): PassAnimationsResult {
  const animations: PassAnimation[] = [];
  const inFlightIds: string[] = [];

  picks.forEach((cards, rawFrom) => {
    const from = rawFrom as PlayerIndex;
    // Visible hand order matches what's drawn on the table; sort for non-human players.
    const source = from === 0 ? [...prevHands[from]] : sortHand(prevHands[from]);
    cards.forEach((card) => {
      const to = passTo(from, direction);
      const sourceIdx = source.findIndex((x) => x.id === card.id);
      const targetIdx = finalHands[to].findIndex((x) => x.id === card.id);
      animations.push({
        card,
        fromPlayer: from,
        toPlayer: to,
        start: handCardPosition(from, Math.max(0, sourceIdx), source.length),
        target: handCardPosition(to, Math.max(0, targetIdx), finalHands[to].length),
      });
      inFlightIds.push(card.id);
    });
  });

  return { animations, inFlightIds };
}
