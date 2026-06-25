/**
 * Card-passing rules.
 *
 * In Hearts, every round (except the 4th) players pass 3 cards in a fixed direction
 * before play begins. The direction rotates: left, right, across, none — then repeats.
 */

import { type PlayerIndex, nextClockwise, nextCounterClockwise } from './Players';

export type PassDirection = 'left' | 'right' | 'across' | 'none';

const DIRECTIONS: readonly PassDirection[] = ['left', 'right', 'across', 'none'];

/** The pass direction for a given round number (1-indexed). */
export function passDirection(round: number): PassDirection {
  return DIRECTIONS[(round - 1) % 4];
}

/** Seat receiving cards from `from` for this pass direction. */
export function passTo(from: PlayerIndex, dir: PassDirection): PlayerIndex {
  if (dir === 'left') return nextClockwise(from);
  if (dir === 'right') return nextCounterClockwise(from);
  if (dir === 'across') return ((from + 2) % 4) as PlayerIndex;
  return from;
}

/** Seat that gave cards to `to` for this pass direction. */
export function passFrom(to: PlayerIndex, dir: PassDirection): PlayerIndex {
  if (dir === 'left') return nextCounterClockwise(to);
  if (dir === 'right') return nextClockwise(to);
  if (dir === 'across') return ((to + 2) % 4) as PlayerIndex;
  return to;
}

// User-facing labels. Kept centralized so we can adjust copy without editing components.

export function passShortLabel(dir: PassDirection): string {
  if (dir === 'left') return 'Pass 3 left';
  if (dir === 'right') return 'Pass 3 right';
  if (dir === 'across') return 'Pass 3 across';
  return 'No passing';
}

export function passBoardLabel(dir: PassDirection): string {
  if (dir === 'left') return 'Pass 3 to the Left';
  if (dir === 'right') return 'Pass 3 to the Right';
  if (dir === 'across') return 'Pass 3 Across';
  return 'No Passing';
}

export function passButtonLabel(dir: PassDirection, selectedCount: number): string {
  if (dir === 'left') return `Pass to the left (${selectedCount}/3)`;
  if (dir === 'right') return `Pass to the right (${selectedCount}/3)`;
  if (dir === 'across') return `Pass across (${selectedCount}/3)`;
  return `Pass cards (${selectedCount}/3)`;
}
