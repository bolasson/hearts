/**
 * @module hearts
 * A CPU player's seat — a fan of card backs along one edge of the table.
 *
 * Three positions: top, left, right. The fan is built with motion divs so cards
 * spring back smoothly when one leaves (gets played).
 */

import { motion } from 'framer-motion';
import { Box } from '@mui/material';
import { CARD_OVERLAP } from '@/game/layout';
import { BackCard } from '@/components/ui/BackCard';

export type SeatPosition = 'top' | 'left' | 'right';

export type SeatProps = {
  cardCount: number;
  position: SeatPosition;
};

const STACK_DIMENSIONS: Record<SeatPosition, { width: number; height: number }> = {
  top: { width: 620, height: 112 },
  left: { width: 112, height: 620 },
  right: { width: 112, height: 620 },
};

const STACK_POSITION: Record<SeatPosition, Record<string, string | number>> = {
  top: { left: '50%', top: 8, transform: 'translateX(-50%)' },
  left: { left: 8, top: '50%', transform: 'translateY(-50%)' },
  right: { right: 8, top: '50%', transform: 'translateY(-50%)' },
};

export function Seat({ cardCount, position }: SeatProps) {
  const dims = STACK_DIMENSIONS[position];
  const isSide = position === 'left' || position === 'right';
  const rotate = position === 'left' ? 90 : position === 'right' ? -90 : 0;

  return (
    <Box
      sx={{
        position: 'absolute',
        zIndex: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 0.5,
        ...STACK_POSITION[position],
      }}
    >
      <Box sx={{ position: 'relative', width: dims.width, height: dims.height, zIndex: 20 }}>
        {Array.from({ length: cardCount }).map((_, i) => {
          const offset = i * CARD_OVERLAP;
          const total = Math.max(0, cardCount - 1) * CARD_OVERLAP;
          const x = isSide ? 0 : offset - total / 2;
          const y = isSide ? (position === 'left' ? total / 2 - offset : offset - total / 2) : 0;
          return (
            <motion.div
              key={`seat-${position}-${i}`}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                marginLeft: -40,
                marginTop: -56,
                zIndex: i,
              }}
              initial={false}
              animate={{ x, y, rotate }}
              transition={{ type: 'spring', stiffness: 300, damping: 38, mass: 0.8 }}
            >
              <BackCard />
            </motion.div>
          );
        })}
      </Box>
    </Box>
  );
}
