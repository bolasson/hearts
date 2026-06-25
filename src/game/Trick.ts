/**
 * A trick is the set of (up to 4) cards played in one round of the game.
 * Each play records who played the card and where the card's animation should
 * originate from.
 */

import type { Card } from './Card';
import type { PlayerIndex } from './Players';

export type AnimationOrigin = {
  readonly x: number;
  readonly y: number;
  readonly rotate?: number;
};

export type TrickPlay = {
  readonly player: PlayerIndex;
  readonly card: Card;
  /**
   * Optional animation origin override. The layout module computes a sensible default
   * from the player seat; this lets a caller (e.g., the human's tapped card) pin the
   * starting position to where the card actually was.
   */
  readonly animationStart: AnimationOrigin | null;
  /**
   * Index of the card within the player's sorted hand at the moment of play.
   * Used to start the animation from the right fan position for CPU cards.
   */
  readonly animationCardIndex: number | null;
};

export type Trick = readonly TrickPlay[];
