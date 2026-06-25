/**
 * Card type and basic helpers.
 *
 * A Card is the smallest unit in the game. Cards are immutable.
 * `id` uniquely identifies a card (e.g., "Q♠") and is used as React keys.
 * `value` is a numeric rank (2..14) used by trick-winning logic.
 */

export const SUITS = ['♣', '♦', '♠', '♥'] as const;
export type Suit = (typeof SUITS)[number];

export const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'] as const;
export type Rank = (typeof RANKS)[number];

export const SUIT_NAMES: Record<Suit, string> = {
  '♣': 'clubs',
  '♦': 'diamonds',
  '♠': 'spades',
  '♥': 'hearts',
};

export type Card = {
  readonly id: string;
  readonly rank: Rank;
  readonly suit: Suit;
  readonly value: number;
};

/** Suits visually sorted left-to-right in a hand. */
const SUIT_ORDER: Record<Suit, number> = { '♣': 0, '♦': 1, '♠': 2, '♥': 3 };

/** True if a card scores Hearts points (hearts or the queen of spades). */
export function isPointCard(card: Card): boolean {
  return card.suit === '♥' || card.id === 'Q♠';
}

/** Human-readable label for a card, like "Q ♠". */
export function cardLabel(card: Card): string {
  return `${card.rank} ${card.suit}`;
}

/** True if the hand contains a card with this id. */
export function handHasId(hand: readonly Card[], id: string): boolean {
  return hand.some((c) => c.id === id);
}

/** True if the hand contains any card of this suit. */
export function handHasSuit(hand: readonly Card[], suit: Suit): boolean {
  return hand.some((c) => c.suit === suit);
}

/** Stable sort: by suit (clubs, diamonds, spades, hearts), then by value ascending. */
export function sortHand(hand: readonly Card[]): Card[] {
  return [...hand].sort((a, b) => SUIT_ORDER[a.suit] - SUIT_ORDER[b.suit] || a.value - b.value);
}
