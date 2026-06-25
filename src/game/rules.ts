/**
 * Hearts rules: card validity, scoring, trick resolution.
 *
 * All functions are pure. They take the game state pieces they need and return values
 * without mutating anything. This makes the rules trivial to test and reason about.
 */

import { type Card, type Suit, SUIT_NAMES, cardLabel, handHasSuit, isPointCard } from './Card';
import type { Trick } from './Trick';
import type { PlayerIndex } from './Players';

const TWO_OF_CLUBS = '2♣';

/**
 * Cards the player is legally allowed to play given the current state.
 * Follows standard Hearts rules:
 *   - First trick: must lead 2♣; can't play points (hearts or Q♠) unless that's all you have.
 *   - Leading any trick: can't lead hearts until hearts have been broken (unless that's all you have).
 *   - Following a trick: must follow suit if you can.
 */
export function allowedCards(
  hand: readonly Card[],
  currentTrick: Trick,
  heartsBroken: boolean,
  isFirstTrick: boolean
): Card[] {
  if (currentTrick.length === 0) {
    // Leading a trick.
    if (isFirstTrick) {
      return hand.filter((c) => c.id === TWO_OF_CLUBS);
    }
    const nonHearts = hand.filter((c) => c.suit !== '♥');
    if (!heartsBroken && nonHearts.length > 0) return nonHearts;
    return [...hand];
  }

  // Following a trick.
  const leadSuit = currentTrick[0].card.suit;
  const followSuit = hand.filter((c) => c.suit === leadSuit);
  if (followSuit.length > 0) return followSuit;

  // Can't follow suit. On the first trick, dump non-point cards if possible.
  if (isFirstTrick) {
    const nonPoint = hand.filter((c) => !isPointCard(c));
    if (nonPoint.length > 0) return nonPoint;
  }
  return [...hand];
}

/**
 * If the human tried to play an illegal card, return a friendly explanation.
 * Returns an empty string when the play is legal.
 */
export function badPlayReason(
  card: Card,
  hand: readonly Card[],
  currentTrick: Trick,
  heartsBroken: boolean,
  isFirstTrick: boolean
): string {
  const legal = allowedCards(hand, currentTrick, heartsBroken, isFirstTrick);
  if (legal.some((x) => x.id === card.id)) return '';

  if (isFirstTrick && currentTrick.length === 0) {
    return `Can't play ${cardLabel(card)}. The first trick must start with 2 ♣.`;
  }
  if (
    currentTrick.length === 0 &&
    card.suit === '♥' &&
    !heartsBroken &&
    hand.some((c) => c.suit !== '♥')
  ) {
    return `Can't lead ${cardLabel(card)} yet. Hearts have not been broken, so lead a non-heart card.`;
  }

  if (currentTrick.length > 0) {
    const leadSuit = currentTrick[0].card.suit;
    if (handHasSuit(hand, leadSuit) && card.suit !== leadSuit) {
      return `Can't play ${cardLabel(card)}. The current suit is ${SUIT_NAMES[leadSuit as Suit]}, so you must play a ${leadSuit}.`;
    }
    if (isFirstTrick && isPointCard(card) && hand.some((c) => !isPointCard(c))) {
      return `Can't play ${cardLabel(card)} on the first trick. Play a non-point card if you have one.`;
    }
  }

  return `Can't play ${cardLabel(card)} right now. Choose a valid card for this trick.`;
}

/** Points scored by the trick: 1 per heart, 13 for the queen of spades. */
export function trickPoints(trick: Trick): number {
  return trick.reduce((sum, play) => {
    if (play.card.suit === '♥') return sum + 1;
    if (play.card.id === 'Q♠') return sum + 13;
    return sum;
  }, 0);
}

/** Index of the player who wins the trick (the highest card of the lead suit). */
export function trickWinner(trick: Trick): PlayerIndex {
  const leadSuit = trick[0].card.suit;
  const eligible = trick.filter((p) => p.card.suit === leadSuit);
  return eligible.reduce((best, p) => (p.card.value > best.card.value ? p : best), eligible[0]).player;
}

/** A round is complete when every hand is empty. */
export function isRoundComplete(hands: ReadonlyArray<readonly Card[]>): boolean {
  return hands.every((h) => h.length === 0);
}

/**
 * If anyone shot the moon this round, return the shooter's index. Otherwise null.
 * "Shooting the moon" = taking all 26 points in a single round.
 */
export function shotTheMoon(roundPoints: readonly number[]): PlayerIndex | null {
  const idx = roundPoints.findIndex((p) => p === 26);
  return idx === -1 ? null : (idx as PlayerIndex);
}

/** Game ends when any player reaches 100. */
export function isGameOver(totalScores: readonly number[]): boolean {
  return totalScores.some((s) => s >= 100);
}

/** Returns a friendly result string given final scores. */
export function gameResult(totalScores: readonly number[], names: readonly string[]): string {
  const lo = Math.min(...totalScores);
  const winners = totalScores.map((v, i) => (v === lo ? names[i] : null)).filter(Boolean) as string[];
  return winners.length === 1 ? `${winners[0]} wins!` : `${winners.join(' and ')} tie!`;
}
