/**
 * @module hearts
 * Dialog shown when a round ends (but the game isn't over).
 *
 * The dialog Paper sizes to its content. Title hosts the round summary
 * (centered). Body is the scoreboard table. Actions are centered as a group
 * and include "Finish Game" (which opens the results dialog and hides this
 * one) plus "Next Round". Outside-click and Escape advance the round so the
 * player can never get stuck.
 *
 * Punctuation in the summary is emphatic ("!") when the human (you) was part
 * of the winning side or when anyone shot the moon; otherwise a plain ".".
 */

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import { MAIN_PLAYER, PLAYER_NAMES } from '@/game/Players';
import type { ScoreTuple } from '@/state/useGameStore';
import { useGameStore } from '@/state/useGameStore';
import { ScoreTable } from './ScoreTable';

const WOOD_DARK = '#451a03';
const WOOD_MID = '#78350f';
const CREAM = '#fffaf0';
const FELT = '#15803d';
const FELT_HOVER = '#166534';

function roundSummary(lastRound: ScoreTuple): string {
  const zeros = lastRound.filter((p) => p === 0).length;
  const twentySixes = lastRound.filter((p) => p === 26).length;
  if (zeros === 1 && twentySixes === 3) {
    const shooter = lastRound.indexOf(0);
    return `${PLAYER_NAMES[shooter]} shot the moon!`;
  }
  const min = Math.min(...lastRound);
  const winners: string[] = [];
  let humanWon = false;
  lastRound.forEach((p, i) => {
    if (p === min) {
      winners.push(PLAYER_NAMES[i]);
      if (i === MAIN_PLAYER) humanWon = true;
    }
  });
  const punct = humanWon ? '!' : '.';
  if (winners.length === 1) return `${winners[0]} won this round${punct}`;
  return `${winners.join(' and ')} tied this round${punct}`;
}

export function RoundEndDialog() {
  const phase = useGameStore((s) => s.phase);
  const roundHistory = useGameStore((s) => s.roundHistory);
  const newRound = useGameStore((s) => s.newRound);
  const finishGame = useGameStore((s) => s.finishGame);

  // Naturally hidden when finishGame() flips phase to 'gameOver' — phases
  // are mutually exclusive, so this dialog disappears the moment the results
  // dialog should take over.
  const open = phase === 'roundOver';
  const lastRound = roundHistory[roundHistory.length - 1];
  const summary = lastRound ? roundSummary(lastRound) : '';

  return (
    <Dialog
      open={open}
      onClose={newRound}
      maxWidth={false}
      PaperProps={{
        sx: {
          background: CREAM,
          // Match the table's chunky double-border treatment.
          border: { xs: `4px solid ${WOOD_DARK}`, sm: `6px solid ${WOOD_DARK}` },
          outline: { xs: `2px solid rgba(146, 64, 14, 0.4)`, sm: `3px solid rgba(146, 64, 14, 0.4)` },
          outlineOffset: 0,
          borderRadius: { xs: '18px', sm: '24px' },
          color: WOOD_DARK,
          width: { xs: 'calc(100vw - 24px)', sm: 'fit-content' },
          maxWidth: 'calc(100vw - 24px)',
          m: 0,
        },
      }}
    >
      <DialogTitle
        sx={{
          fontWeight: 700,
          color: WOOD_DARK,
          textAlign: 'center',
          py: { xs: 2, sm: 2.5 },
          px: { xs: 2, sm: 3 },
          fontSize: { xs: 20, sm: 22 },
        }}
      >
        {summary}
      </DialogTitle>
      <DialogContent sx={{ px: { xs: 1.5, sm: 3 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <ScoreTable />
        </Box>
      </DialogContent>
      <Box sx={{ mx: 3, borderTop: `1px solid ${WOOD_MID}` }} />
      <DialogActions
        sx={{
          px: { xs: 2, sm: 3 },
          py: 2,
          justifyContent: 'center',
          gap: 1,
          '& .MuiButton-root': {
            minHeight: 48,
            flex: { xs: '1 1 0', sm: '0 0 auto' },
          },
        }}
      >
        <Button
          variant="outlined"
          startIcon={<EmojiEventsIcon />}
          onClick={finishGame}
          sx={{
            borderColor: WOOD_MID,
            color: WOOD_DARK,
            textTransform: 'none',
            fontWeight: 600,
            '&:hover': { borderColor: WOOD_DARK, background: 'rgba(120, 53, 15, 0.06)' },
          }}
        >
          Finish Game
        </Button>
        <Button
          variant="contained"
          size="large"
          startIcon={<SkipNextIcon />}
          onClick={newRound}
          autoFocus
          sx={{
            background: FELT,
            color: '#ffffff',
            textTransform: 'none',
            fontWeight: 600,
            px: 3,
            '&:hover': { background: FELT_HOVER },
          }}
        >
          Next Round
        </Button>
      </DialogActions>
    </Dialog>
  );
}
