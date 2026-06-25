/**
 * @module hearts
 * The center play zone: cards that have been played in the current trick,
 * plus the resolution animation that flies them to the winner's pile.
 *
 * Each card animates from its origin (hand fan position) to the trick drop slot
 * for its seat. Face and rotation changes snap immediately, so movement stays
 * readable without a 3D flip or spin. When the trick resolves, all four cards
 * animate offscreen toward the winner's pile.
 *
 * All durations come from SPEED_PROFILE so the player's speed setting governs
 * every transition uniformly.
 */

import { motion } from 'framer-motion';
import { Box } from '@mui/material';
import { SPEED_PROFILE, playAnimationStart, takenPilePosition, trickDropPosition } from '@/game/layout';
import { trickWinner } from '@/game/rules';
import { MAIN_PLAYER } from '@/game/Players';
import { useGameStore } from '@/state/useGameStore';
import { CardAnim } from '@/components/ui/CardAnim';

export function TrickArea() {
  const trick = useGameStore((s) => s.currentTrick);
  const hands = useGameStore((s) => s.hands);
  const phase = useGameStore((s) => s.phase);
  const cpuSpeed = useGameStore((s) => s.cpuSpeed);

  const profile = SPEED_PROFILE[cpuSpeed];
  const isResolving = phase === 'trickResolving';
  const winnerIdx = isResolving && trick.length === 4 ? trickWinner(trick) : null;
  const winnerOffset = winnerIdx !== null ? takenPilePosition(winnerIdx) : null;

  // Convert ms-based timings into the seconds framer-motion expects.
  const cardAnimSec = profile.cardAnim / 1000;
  const resolveAnimSec = profile.trickResolve / 1000;

  return (
    <Box sx={{ position: 'relative', width: 288, height: 288 }}>
      {trick.map((play, i) => {
        const drop = trickDropPosition(play.player);
        const handCountWhenPlayed = hands[play.player].length + 1;
        const cardIndex = play.animationCardIndex ?? handCountWhenPlayed - 1;
        const start = playAnimationStart(play.player, handCountWhenPlayed, play.animationStart, cardIndex);
        const target = winnerOffset ? { x: winnerOffset.x + i * 4, y: winnerOffset.y + i * 3 } : drop;
        const isCpu = play.player !== MAIN_PLAYER;

        // Face and rotation snap immediately; only position/scale/opacity tween.
        const animateProps = winnerOffset
          ? { x: target.x, y: target.y, rotate: 0, scale: 0.45, opacity: 1 }
          : isCpu
            ? {
                x: target.x,
                y: target.y,
                rotate: 0,
                scale: 1,
                opacity: 1,
              }
            : { x: target.x, y: target.y, rotate: 0, scale: 1, opacity: 1 };

        const transition = winnerOffset
          ? { duration: resolveAnimSec, ease: 'easeOut' as const }
          : isCpu
            ? { duration: cardAnimSec, ease: 'easeOut' as const }
            : { duration: cardAnimSec, ease: 'easeOut' as const };

        return (
          <motion.div
            key={`${play.player}-${play.card.id}`}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              marginLeft: -40,
              marginTop: -56,
              transformStyle: 'preserve-3d',
              zIndex: 1000 + i,
            }}
            initial={{ x: start.x, y: start.y, rotate: 0, scale: 1, opacity: 1 }}
            animate={animateProps}
            transition={transition}
          >
            <CardAnim card={play.card} showBack={false} />
          </motion.div>
        );
      })}
    </Box>
  );
}
