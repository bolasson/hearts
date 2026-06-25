/**
 * Positional layout math for the table.
 *
 * Everything here is pure: given a player seat and a card position within a hand,
 * compute where on the table that card should be drawn or animated to/from.
 *
 * Seat 0 (You) sits at the bottom. Seat 1 is on the right, 2 on top, 3 on the left.
 * The table is a square: positive x = right, positive y = down.
 *
 * Magic numbers are kept here (not scattered in components) so layout tweaks
 * are a single-file change.
 */

import type { PlayerIndex } from './Players';

/** Pixel overlap between adjacent cards in a CPU's fan. */
export const CARD_OVERLAP = 24;

/** Distance from center for the trick-area "drop zone" per seat. */
const TRICK_DROP = 74;
const TRICK_DROP_SIDE = 92;

/** Distance offscreen where taken tricks animate to. */
const PILE_DISTANCE = 430;

/** Hand fan offsets. The human hand sits farther out and uses wider spacing. */
const HAND_DISTANCE = 275;
export const HAND_OVERLAP_HUMAN = 36;
const HAND_OVERLAP_CPU = 24;

/** Per-speed timings. Used by both the play-rate and the animation duration. */
export type Speed = 'extraSlow' | 'slow' | 'normal' | 'fast' | 'turbo' | 'instant';

export interface SpeedProfile {
  /** Time the CPU "thinks" before playing a card. */
  cpuDelay: number;
  /** Duration of a single card's flight from hand to trick area. */
  cardAnim: number;
  /** Pause holding the complete 4-card trick before it animates to the pile. */
  trickShow: number;
  /** Duration of the trick-to-pile animation. */
  trickResolve: number;
  /** Duration of the pass-card animation. */
  passAnim: number;
}

/**
 * The single source of truth for every animation-related timing in the game.
 * Tweaking the feel of the game = editing values here.
 */
export const SPEED_PROFILE: Record<Speed, SpeedProfile> = {
  extraSlow: { cpuDelay: 3000, cardAnim: 3000, trickShow: 3000, trickResolve: 3000, passAnim: 3000 },
  slow:    { cpuDelay: 1000, cardAnim: 720, trickShow: 900, trickResolve: 550, passAnim: 1000 },
  normal:  { cpuDelay: 500,  cardAnim: 520, trickShow: 700, trickResolve: 450, passAnim: 800 },
  fast:    { cpuDelay: 200,  cardAnim: 360, trickShow: 500, trickResolve: 320, passAnim: 600 },
  turbo:   { cpuDelay: 80,   cardAnim: 220, trickShow: 350, trickResolve: 200, passAnim: 400 },
  instant: { cpuDelay: 0,    cardAnim: 100, trickShow: 200, trickResolve: 100, passAnim: 200 },
};

export type Position = { x: number; y: number; rotate: number };

/** Offset of the i-th card in a CPU's side-stack of `count` cards. */
function cpuStackOffset(player: PlayerIndex, count: number, i: number): Position {
  const total = Math.max(0, count - 1) * CARD_OVERLAP;
  const offset = i * CARD_OVERLAP - total / 2;
  if (player === 1) return { x: 0, y: offset, rotate: -90 };
  if (player === 2) return { x: offset, y: 0, rotate: 0 };
  if (player === 3) return { x: 0, y: -offset, rotate: 90 };
  return { x: 0, y: 0, rotate: 0 };
}

/**
 * Where a played card's animation should start from.
 * If `override` is provided (e.g., the exact pixel where the human tapped), that wins.
 */
export function playAnimationStart(
  player: PlayerIndex,
  cardCount: number,
  override: { x: number; y: number; rotate?: number } | null,
  cardIndex: number
): Position {
  if (override) return { x: override.x, y: override.y, rotate: override.rotate ?? 0 };

  if (player === 0) return { x: 0, y: HAND_DISTANCE, rotate: 0 };
  const stack = cpuStackOffset(player, cardCount, Math.max(0, cardIndex));
  if (player === 1) return { x: HAND_DISTANCE + stack.x, y: stack.y, rotate: stack.rotate };
  if (player === 2) return { x: stack.x, y: -HAND_DISTANCE + stack.y, rotate: stack.rotate };
  return { x: -HAND_DISTANCE + stack.x, y: stack.y, rotate: stack.rotate };
}

/** Where a card lands in the trick area for the given seat. */
export function trickDropPosition(player: PlayerIndex): { x: number; y: number } {
  if (player === 0) return { x: 0, y: TRICK_DROP };
  if (player === 1) return { x: TRICK_DROP_SIDE, y: 0 };
  if (player === 2) return { x: 0, y: -TRICK_DROP };
  return { x: -TRICK_DROP_SIDE, y: 0 };
}

/** Where won tricks animate offscreen to (per seat). */
export function takenPilePosition(player: PlayerIndex): { x: number; y: number } {
  if (player === 0) return { x: 0, y: PILE_DISTANCE };
  if (player === 1) return { x: PILE_DISTANCE, y: 0 };
  if (player === 2) return { x: 0, y: -PILE_DISTANCE };
  return { x: -PILE_DISTANCE, y: 0 };
}

/**
 * Position of the i-th card in a player's hand fan.
 * The human's hand uses wider spacing (HAND_OVERLAP_HUMAN); CPUs use the tighter one.
 */
export function handCardPosition(player: PlayerIndex, index: number, count: number): Position {
  const overlap = player === 0 ? HAND_OVERLAP_HUMAN : HAND_OVERLAP_CPU;
  const total = Math.max(0, count - 1) * overlap;
  const k = index * overlap;
  if (player === 0) return { x: -total / 2 + k, y: HAND_DISTANCE, rotate: 0 };
  if (player === 2) return { x: -total / 2 + k, y: -HAND_DISTANCE, rotate: 0 };
  if (player === 1) return { x: HAND_DISTANCE, y: k - total / 2, rotate: -90 };
  return { x: -HAND_DISTANCE, y: total / 2 - k, rotate: 90 };
}
