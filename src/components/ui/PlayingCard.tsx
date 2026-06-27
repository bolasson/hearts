import { motion } from 'framer-motion';
import { Box } from '@mui/material';
import type { Card } from '@/game/Card';
import { logger } from '@/logger';

export type PlayingCardSize = 'player' | 'playerLarge' | 'tableLarge' | 'small';
export type PlayingCardHighlight = 'none' | 'selected';

export type PlayingCardProps = {
  card: Card;
  size?: PlayingCardSize;
  highlight?: PlayingCardHighlight;
  /** When true, suppress the entrance scale/opacity animation. Useful when the card
   *  is the target of its own framer-motion transition outside this component. */
  noEntrance?: boolean;
};

const SIZES: Record<PlayingCardSize, { width: number; height: number }> = {
  // Original desktop hand card.
  player: { width: 88, height: 128 },
  // Current mobile portrait hand card.
  playerLarge: { width: 96, height: 140 },
  tableLarge: { width: 80, height: 112 },
  small: { width: 80, height: 112 },
};

const CORNER_FONT: Record<PlayingCardSize, { fontSize: number; lineHeight: number }> = {
  player: { fontSize: 26, lineHeight: 0.78 },
  playerLarge: { fontSize: 20, lineHeight: 0.78 },
  tableLarge: { fontSize: 20, lineHeight: 0.85 },
  small: { fontSize: 12, lineHeight: 1 },
};

const CENTER_FONT: Record<PlayingCardSize, number> = {
  player: 48,
  playerLarge: 52,
  tableLarge: 36,
  small: 24,
};

/**
 * A single playing card rendered face-up. Used in the player's hand, in the trick
 * area, and (after a flip) when a CPU's card lands face-up on the table.
 *
 * Visuals are intentionally inlined here (hex colors, pixel sizes) rather than going
 * through a theme — the card look is the game's signature and the magic numbers
 * make sense to keep co-located.
 */
export function PlayingCard({
  card,
  size = 'small',
  highlight = 'none',
  noEntrance = false,
}: PlayingCardProps) {
  logger.debug({ module: 'PlayingCard', action: 'render', meta: { id: card.id } }, 'Rendering');

  const isRed = card.suit === '♥' || card.suit === '♦';
  const { width, height } = SIZES[size];
  const corner = CORNER_FONT[size];
  const centerFontSize = CENTER_FONT[size];
  const isLarge = size === 'tableLarge' || size === 'playerLarge';
  const cornerInset = size === 'playerLarge' ? 4 : isLarge ? 8 : 6;

  return (
    <motion.div
      initial={noEntrance ? false : { scale: 0.9, opacity: 0 }}
      animate={noEntrance ? undefined : { scale: 1, opacity: 1 }}
      style={{
        position: 'relative',
        width,
        height,
        borderRadius: 12,
        border: '1px solid #cbd5e1',
        background: '#ffffff',
        color: isRed ? '#dc2626' : '#020617',
        boxShadow:
          highlight === 'selected'
            ? '0 0 0 5px #fbbf24, 0 0 0 7px #15803d, 0 10px 15px -3px rgba(0,0,0,0.1)'
            : '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
        transition: 'box-shadow 75ms',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          left: 0,
          top: 8,
          zIndex: 10,
          width: 24,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          fontWeight: 700,
          fontSize: corner.fontSize,
          lineHeight: corner.lineHeight,
          textAlign: 'center',
        }}
      >
        <Box
          component="span"
          sx={{
            display: 'inline-block',
            width: '100%',
            transformOrigin: 'center',
            transform: 'scaleX(0.9)',
            letterSpacing: '-0.08em',
          }}
        >
          {card.rank}
        </Box>
        <Box component="span" sx={{ width: '100%' }}>
          {card.suit}
        </Box>
      </Box>

      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: centerFontSize,
        }}
      >
        {card.suit}
      </Box>

      <Box
        sx={{
          position: 'absolute',
          right: cornerInset,
          bottom: cornerInset,
          zIndex: 10,
          width: 24,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          fontWeight: 700,
          fontSize: corner.fontSize,
          lineHeight: corner.lineHeight,
          textAlign: 'center',
          transform: 'rotate(180deg)',
        }}
      >
        <Box
          component="span"
          sx={{
            display: 'inline-block',
            width: '100%',
            transformOrigin: 'center',
            transform: 'scaleX(0.9)',
            letterSpacing: '-0.08em',
          }}
        >
          {card.rank}
        </Box>
        <Box component="span" sx={{ width: '100%' }}>
          {card.suit}
        </Box>
      </Box>
    </motion.div>
  );
}
