/**
 * Player identity and seating.
 *
 * Players are indexed 0..3. The human is always seat 0. Seats 1, 2, 3 are CPUs.
 * Seat 0 (you) is at the bottom; play moves clockwise (0 → 3 → 2 → 1 → 0).
 *
 * Positional helpers (top/left/right of the table) live in layout.ts.
 */

export type PlayerIndex = 0 | 1 | 2 | 3;

export const PLAYER_NAMES: readonly string[] = ['You', 'CPU 1', 'CPU 2', 'CPU 3'];

/**
 * The player whose perspective the UI is rendered from. Always seat 0 — the
 * bottom-of-table viewer. In single-player this is the human; in a future
 * multiplayer build, each connected client sees themselves as MAIN_PLAYER
 * (the other three players, human or CPU, occupy the other seats).
 */
export const MAIN_PLAYER: PlayerIndex = 0;

/** Returns the player to the left (clockwise) of `i`. */
export function nextClockwise(i: PlayerIndex): PlayerIndex {
  return ((i + 3) % 4) as PlayerIndex;
}

/** Returns the player to the right (counter-clockwise) of `i`. */
export function nextCounterClockwise(i: PlayerIndex): PlayerIndex {
  return ((i + 1) % 4) as PlayerIndex;
}
