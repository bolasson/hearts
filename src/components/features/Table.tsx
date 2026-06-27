/**
 * @module hearts
 * The game table: the green felt with amber border. Composes the seats around
 * the edges, the trick area in the middle, the pass overlay, the pass-submit
 * button (visible during the choose-pass phase), and the player's hand at the
 * bottom.
 *
 * Subscribes to the store for phase-driven UI (the pass button is only visible
 * during the choosing-pass phase, etc.) but defers all game-state reading to
 * its children.
 */

import { useEffect, useRef, useState } from 'react';
import { Box, Button } from '@mui/material';
import { useGameStore } from '@/state/useGameStore';
import { passButtonLabel } from '@/game/passing';
import { Seat } from './Seat';
import { TrickArea } from './TrickArea';
import { PassLayer } from './PassLayer';
import { Hand } from './Hand';

const TABLE_SIZE = 760;
const TABLE_LAYOUT = {
  // Current phone-first layout: board gets the upper portion, hand sits below it.
  mobilePortrait: {
    rootGap: 1.25,
    boardWidth:
      'min(calc(100vw - 16px - env(safe-area-inset-left) - env(safe-area-inset-right)), calc(100dvh - 280px - env(safe-area-inset-top) - env(safe-area-inset-bottom)), 760px)',
  },
  // Original desktop feel: large square board centered with room for the classic table layout.
  desktop: {
    rootGap: 2,
    boardWidth: 'min(calc(100vw - 32px), calc(100dvh - 220px), 760px)',
  },
  // Landscape gets its own pass later.
} as const;

export function Table() {
  const shellRef = useRef<HTMLDivElement | null>(null);
  const [tableScale, setTableScale] = useState(1);
  const phase = useGameStore((s) => s.phase);
  const hands = useGameStore((s) => s.hands);
  const passDirection = useGameStore((s) => s.passDirection);
  const selectedPassCount = useGameStore((s) => s.selectedPassCards.length);
  const submitPass = useGameStore((s) => s.submitPass);

  const isChoosingPass = phase === 'choosingPass';
  const canSubmit = isChoosingPass && selectedPassCount === 3;

  useEffect(() => {
    const el = shellRef.current;
    if (!el) return;

    const updateScale = () => {
      setTableScale(el.clientWidth / TABLE_SIZE);
    };

    updateScale();
    const resizeObserver = new ResizeObserver(updateScale);
    resizeObserver.observe(el);
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        mx: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: { xs: TABLE_LAYOUT.mobilePortrait.rootGap, sm: TABLE_LAYOUT.desktop.rootGap },
        minWidth: 0,
      }}
    >
      <Box
        ref={shellRef}
        sx={{
          position: 'relative',
          aspectRatio: '1 / 1',
          width: {
            xs: TABLE_LAYOUT.mobilePortrait.boardWidth,
            sm: TABLE_LAYOUT.desktop.boardWidth,
          },
          minWidth: 0,
          overflow: 'hidden',
          borderRadius: '32px',
          border: '8px solid #451a03',
          background: '#15803d',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          outline: '4px solid rgba(146,64,14,0.4)',
          outlineOffset: 0,
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: TABLE_SIZE,
            height: TABLE_SIZE,
            transform: `scale(${tableScale})`,
            transformOrigin: 'top left',
          }}
        >
        <Box
          sx={{
            position: 'absolute',
            inset: 20,
            borderRadius: '24px',
            border: '1px solid rgba(255,255,255,0.15)',
          }}
        />

        <Seat cardCount={hands[2].length} position="top" />
        <Seat cardCount={hands[3].length} position="left" />
        <Seat cardCount={hands[1].length} position="right" />

        <Box
          sx={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            zIndex: 25,
            width: 288,
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            p: 1.5,
            color: '#ffffff',
          }}
        >
          <TrickArea />
        </Box>

        <PassLayer />

        {isChoosingPass && (
          <Box
            sx={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              zIndex: 40,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <Button
              size="large"
              onClick={submitPass}
              disabled={!canSubmit}
              sx={{
                px: 3.5,
                py: 1.75,
                fontSize: 16,
                fontWeight: 700,
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                transition: 'all 150ms',
                background: canSubmit ? '#fbbf24' : 'rgba(255,255,255,0.9)',
                color: canSubmit ? '#020617' : '#64748b',
                outline: canSubmit ? '4px solid #fef3c7' : 'none',
                outlineOffset: 0,
                transform: canSubmit ? 'scale(1.05)' : 'scale(1)',
                '&:hover': { background: canSubmit ? '#fcd34d' : 'rgba(255,255,255,0.9)' },
                '&.Mui-disabled': {
                  background: 'rgba(255,255,255,0.9)',
                  color: '#64748b',
                },
              }}
            >
              {passButtonLabel(passDirection, selectedPassCount)}
            </Button>
          </Box>
        )}

        </Box>
      </Box>
      <Hand />
    </Box>
  );
}
