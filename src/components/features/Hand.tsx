/**
 * @module hearts
 * The human player's hand at the bottom of the table.
 *
 * Performance note: the per-card render lives in a memoized `CardSlot`. The
 * parent `Hand` may re-render whenever any subscribed slice of the store
 * changes (phase, selected pass cards, in-flight ids), but the individual
 * cards skip work unless their own primitive props change. The tap handler
 * is a stable useCallback that reads latest state via `useGameStore.getState()`
 * at call time, so we never have to thread a fresh closure through the memo.
 *
 * During passing: tapping a card toggles its selection (up to 3).
 * During play: tapping a legal card plays it; tapping an illegal card surfaces
 * the inline error message above the hand. No visual treatment distinguishes
 * legal from illegal cards — the game tells you only if you try to play one.
 */

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Box } from '@mui/material';
import { MAIN_PLAYER } from '@/game/Players';
import { cardLabel, type Card } from '@/game/Card';
import { useGameStore } from '@/state/useGameStore';
import { PlayingCard } from '@/components/ui/PlayingCard';

const HAND_LAYOUT = {
  // Current phone portrait hand: larger cards outside the board, full final card visible.
  mobilePortrait: {
    cardWidth: 96,
    cardHeight: 140,
    minOverlap: 26,
    maxOverlap: 44,
    maxWidth: 'calc(100vw - 16px - env(safe-area-inset-left) - env(safe-area-inset-right))',
    animationOriginY: 360,
  },
  // Original desktop hand: smaller cards with a 520px fan inside the table.
  desktop: {
    cardWidth: 88,
    cardHeight: 128,
    minOverlap: 36,
    maxOverlap: 36,
    maxWidth: '520px',
    animationOriginY: 275,
  },
  // Landscape gets its own profile later.
} as const;

const ACTIVE_HAND_LAYOUT = HAND_LAYOUT.mobilePortrait;

type CardSlotProps = {
  card: Card;
  index: number;
  left: number;
  isSelected: boolean;
  isInFlight: boolean;
  canTap: boolean;
  isPassing: boolean;
  onTap: (card: Card, indexInFan: number) => void;
};

/**
 * One playable card in the fan. Wrapped in React.memo so cards whose own
 * props haven't changed skip re-rendering when the parent re-renders. All
 * props are primitives or stable references, so the default shallow
 * comparison is sufficient.
 *
 * Card object identity is stable as long as the store's `hands` array is
 * stable — only actions that actually move cards (play, pass, sort, deal)
 * produce a new hands reference, so a card receives a new `card` prop only
 * when something about its hand actually changed.
 */
const CardSlot = memo(function CardSlot({
  card,
  index,
  left,
  isSelected,
  isInFlight,
  canTap,
  isPassing,
  onTap,
}: CardSlotProps) {
  return (
    <motion.button
      layout="position"
      // Hover only affects unselected cards. A selected card's "hover y" is
      // set equal to its base y (-30), so hovering it is a no-op.
      whileHover={{ y: canTap ? (isSelected ? -30 : -15) : 0 }}
      whileTap={{ scale: 0.96 }}
      transition={{
        type: 'spring',
        stiffness: 700,
        damping: 28,
        mass: 0.45,
        layout: { type: 'spring', stiffness: 520, damping: 34 },
      }}
      onClick={() => onTap(card, index)}
      animate={{ left, y: isPassing && isSelected ? -30 : 0 }}
      style={{
        position: 'absolute',
        top: 0,
        border: 'none',
        background: 'transparent',
        padding: 0,
        cursor: canTap ? 'pointer' : 'default',
        opacity: isInFlight ? 0 : 1,
        zIndex: index,
      }}
      aria-label={`Play ${cardLabel(card)}`}
    >
      <PlayingCard card={card} size="playerLarge" />
    </motion.button>
  );
});

export function Hand() {
  const shellRef = useRef<HTMLDivElement | null>(null);
  const [fanWidth, setFanWidth] = useState(360);
  const hand = useGameStore((s) => s.hands[MAIN_PLAYER]);
  const phase = useGameStore((s) => s.phase);
  const selectedPassCards = useGameStore((s) => s.selectedPassCards);
  const inFlightPassIds = useGameStore((s) => s.inFlightPassIds);
  const inlineMessage = useGameStore((s) => s.inlineMessage);

  const isPassing = phase === 'choosingPass';
  const isHumansTurn = phase === 'awaitingHumanPlay';
  const canTap = isPassing || isHumansTurn;

  useEffect(() => {
    const element = shellRef.current;
    if (!element) return;

    const updateWidth = () => setFanWidth(element.clientWidth);
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const overlap =
    hand.length > 1
      ? Math.max(
          ACTIVE_HAND_LAYOUT.minOverlap,
          Math.min(
            ACTIVE_HAND_LAYOUT.maxOverlap,
            (fanWidth - ACTIVE_HAND_LAYOUT.cardWidth) / Math.max(1, hand.length - 1)
          )
        )
      : 0;
  const total = Math.max(0, hand.length - 1) * overlap;

  // Stable for the lifetime of the component — reads latest state at call time
  // via getState(), so we never have to invalidate the cached callback. Lets
  // CardSlot pass the default React.memo equality check.
  const onTap = useCallback((card: Card, indexInFan: number) => {
    const state = useGameStore.getState();
    if (state.phase === 'choosingPass') {
      state.selectPassCard(card);
      return;
    }
    if (state.phase !== 'awaitingHumanPlay') return;
    const countNow = state.hands[MAIN_PLAYER].length;
    const totalNow = Math.max(0, countNow - 1) * overlap;
    const origin = {
      x: -totalNow / 2 + indexInFan * overlap,
      y: ACTIVE_HAND_LAYOUT.animationOriginY,
      rotate: 0,
    };
    state.playHuman(card, origin);
  }, [overlap]);

  return (
    <Box
      ref={shellRef}
      sx={{
        position: 'relative',
        zIndex: 30,
        width: '100%',
        maxWidth: ACTIVE_HAND_LAYOUT.maxWidth,
        mx: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0.5,
      }}
    >
      {!isPassing && (inlineMessage || isHumansTurn) && (
        <Box
          sx={{
            mb: 1.5,
            minHeight: 26,
            maxWidth: '100%',
            borderRadius: 999,
            background: 'rgba(0,0,0,0.35)',
            backdropFilter: 'blur(4px)',
            px: 2,
            py: 0.75,
            textAlign: 'center',
            fontSize: 14,
            fontWeight: 600,
            color: '#ffffff',
          }}
        >
          {inlineMessage || 'Your turn'}
        </Box>
      )}

      <Box sx={{ position: 'relative', height: ACTIVE_HAND_LAYOUT.cardHeight, width: '100%', overflow: 'visible' }}>
        {hand.map((card, i) => {
          const isSelected = selectedPassCards.some((x) => x.id === card.id);
          const isInFlight = inFlightPassIds.includes(card.id);
          const left = fanWidth / 2 - total / 2 - ACTIVE_HAND_LAYOUT.cardWidth / 2 + i * overlap;
          return (
            <CardSlot
              key={card.id}
              card={card}
              index={i}
              left={left}
              isSelected={isSelected}
              isInFlight={isInFlight}
              canTap={canTap}
              isPassing={isPassing}
              onTap={onTap}
            />
          );
        })}
      </Box>
    </Box>
  );
}
