/**
 * Default CPU strategy.
 *
 * Pass: drop your three highest-pain cards (Q♠ worst, then high hearts, then high cards).
 * Play: pick a uniformly random legal card.
 *
 * This is the baseline. It plays the game correctly but doesn't try to win. A future
 * "skilled" or "evil" strategy can refuse the queen, dump the queen on the leader,
 * or shoot the moon when it has the hand for it.
 */

import { type Card, isPointCard, sortHand } from '@/game/Card';
import type { Trick } from '@/game/Trick';
import { allowedCards } from '@/game/rules';
import type { CpuStrategy } from './CpuStrategy';

export class RandomCpu implements CpuStrategy {
  readonly name = 'Random';

  choosePassCards(hand: readonly Card[]): Card[] {
    // Score each card: queen of spades is the most painful, then hearts, then high values.
    const scored = [...hand].sort((a, b) => {
      const score = (c: Card): number =>
        (c.id === 'Q♠' ? 100 : 0) + (c.suit === '♥' ? 40 : 0) + c.value;
      return score(b) - score(a);
    });
    return scored.slice(0, 3);
  }

  chooseCardToPlay(
    hand: readonly Card[],
    currentTrick: Trick,
    heartsBroken: boolean,
    isFirstTrick: boolean
  ): Card | null {
    // Use the visible sort order (same as what would appear if we showed the CPU's hand)
    // so the animation index lines up if a future UI ever flips a CPU's cards face-up.
    const visible = sortHand(hand);
    const legal = allowedCards(visible, currentTrick, heartsBroken, isFirstTrick);
    if (legal.length === 0) return null;
    // Avoid leading point cards if there's a choice — this keeps even the random
    // strategy from feeling dumb in obvious situations.
    if (currentTrick.length === 0 && legal.length > 1) {
      const safe = legal.filter((c) => !isPointCard(c));
      if (safe.length > 0) return safe[Math.floor(Math.random() * safe.length)];
    }
    return legal[Math.floor(Math.random() * legal.length)];
  }
}
