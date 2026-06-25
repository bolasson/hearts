/**
 * @module hearts
 * Dialog shown when someone reaches the game target (100 by default). Displays
 * the final scoreboard with the winner's column highlighted and a "New Game"
 * button to start over.
 *
 * Outside-click and Escape advance to a new game so the user can't get stuck.
 */

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { PLAYER_NAMES } from '@/game/Players';
import { gameResult } from '@/game/rules';
import { useGameStore } from '@/state/useGameStore';
import { ScoreTable } from './ScoreTable';

const WOOD_DARK = '#451a03';
const WOOD_MID = '#78350f';
const WOOD_TRIM = '#fde68a';
const CREAM = '#fffaf0';
const FELT = '#15803d';
const FELT_HOVER = '#166534';

export function GameOverDialog() {
  const phase = useGameStore((s) => s.phase);
  const totalScores = useGameStore((s) => s.totalScores);
  const newGame = useGameStore((s) => s.newGame);

  const open = phase === 'gameOver';
  const result = gameResult(totalScores, PLAYER_NAMES);

  return (
    <Dialog
      open={open}
      onClose={newGame}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          background: CREAM,
          border: `2px solid ${WOOD_DARK}`,
          color: WOOD_DARK,
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 700, color: WOOD_DARK, pb: 1 }}>Game over</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Typography sx={{ color: WOOD_DARK, fontSize: 18, fontWeight: 600 }}>{result}</Typography>
          <Typography sx={{ color: WOOD_MID, fontSize: 13 }}>
            Lowest total score wins. Full round-by-round breakdown below.
          </Typography>
          <ScoreTable highlightLeader />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${WOOD_TRIM}` }}>
        <Button
          variant="contained"
          size="large"
          startIcon={<RestartAltIcon />}
          onClick={newGame}
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
          New Game
        </Button>
      </DialogActions>
    </Dialog>
  );
}
