/**
 * Deck creation and shuffling.
 *
 * A deck is just an array of Card. Operations are pure — they return new arrays.
 * Shuffling uses a Fisher–Yates shuffle with Math.random; for production use against
 * humans (not just CPU opponents) we'd swap to crypto.getRandomValues, but for
 * casual play this is fine.
 */

import { RANKS, SUITS, type Card } from './Card';

/** Build a fresh, ordered 52-card deck. */
export function makeDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (let i = 0; i < RANKS.length; i++) {
      deck.push({
        id: `${RANKS[i]}${suit}`,
        rank: RANKS[i],
        suit,
        value: i + 2,
      });
    }
  }
  return deck;
}

/** Return a shuffled copy of the array (Fisher–Yates). Does not mutate the input. */
export function shuffle<T>(arr: readonly T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}

/** Deal a shuffled deck into four equal hands of 13 cards each. */
export function dealHands(): [Card[], Card[], Card[], Card[]] {
  const deck = shuffle(makeDeck());
  const hands: [Card[], Card[], Card[], Card[]] = [[], [], [], []];
  deck.forEach((c, i) => hands[i % 4].push(c));
  return hands;
}
