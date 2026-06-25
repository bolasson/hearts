/**
 * @module hearts
 * Overlay that renders the pass animation: every chosen card flying from its
 * source hand to its destination hand at the same time. Only visible during the
 * `passAnimating` phase. Duration follows SPEED_PROFILE.
 */

import { motion } from 'framer-motion';
import { Box } from '@mui/material';
import { SPEED_PROFILE } from '@/game/layout';
import { useGameStore } from '@/state/useGameStore';
import { BackCard } from '@/components/ui/BackCard';

export function PassLayer() {
  const phase = useGameStore((s) => s.phase);
  const animations = useGameStore((s) => s.passAnimations);
  const cpuSpeed = useGameStore((s) => s.cpuSpeed);

  if (phase !== 'passAnimating') return null;

  const durationSec = SPEED_PROFILE[cpuSpeed].passAnim / 1000;

  return (
    <Box sx={{ pointerEvents: 'none', position: 'absolute', inset: 0, zIndex: 60 }}>
      {animations.map((anim, i) => (
        <motion.div
          key={`${anim.fromPlayer}-${anim.toPlayer}-${anim.card.id}-${i}`}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            marginLeft: -40,
            marginTop: -56,
            zIndex: 2000 + i,
          }}
          initial={{
            x: anim.start.x,
            y: anim.start.y,
            rotate: anim.target.rotate ?? 0,
            scale: 1,
            opacity: 1,
          }}
          animate={{
            x: anim.target.x,
            y: anim.target.y,
            rotate: anim.target.rotate ?? 0,
            scale: 1,
            opacity: 1,
          }}
          transition={{ duration: durationSec, ease: 'easeInOut' }}
        >
          <BackCard />
        </motion.div>
      ))}
    </Box>
  );
}
