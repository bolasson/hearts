import { Box } from '@mui/material';
import type { Card } from '@/game/Card';
import { PlayingCard } from './PlayingCard';
import { BackCard } from './BackCard';

export type CardAnimProps = {
  card: Card;
  /** When true, render with both faces in a 3D-ready container so a rotateY parent
   *  animation flips the card from back to face. When false, render face-up directly. */
  showBack: boolean;
};

/**
 * A flip-ready card wrapper.
 *
 * When `showBack` is true, the element is a small 3D scene with the back on the
 * front face and the playing card on the back face. The parent animates rotateY
 * from 0 to 180 to flip it. When false, just renders the face-up card.
 *
 * Kept as its own component (rather than inlined in the trick area) because the
 * 3D-flip dance is fiddly and is genuinely reusable — any future "reveal" effect
 * for cards can use this same primitive.
 */
export function CardAnim({ card, showBack }: CardAnimProps) {
  if (!showBack) {
    return <PlayingCard card={card} size="tableLarge" noEntrance />;
  }
  return (
    <Box sx={{ position: 'relative', width: 80, height: 112, transformStyle: 'preserve-3d' }}>
      <Box sx={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden' }}>
        <BackCard />
      </Box>
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          backfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
        }}
      >
        <PlayingCard card={card} size="tableLarge" noEntrance />
      </Box>
    </Box>
  );
}
