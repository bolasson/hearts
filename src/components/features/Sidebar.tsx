/**
 * @module hearts
 * The left-side panel: title, round/trick indicator, controls, CPU speed selector,
 * and the scoreboard. Subscribes to the game store directly.
 *
 * Theming: matches the table's wood-and-felt palette — a warm cream surface
 * with amber-wood trim and emerald-felt accents for active states.
 */

import {
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { PLAYER_NAMES } from '@/game/Players';
import type { Speed } from '@/game/layout';
import { useGameStore } from '@/state/useGameStore';
import { ScoreRow } from './ScoreRow';

// Shared palette tokens for the sidebar surface. Centralized so a future theme
// refactor can lift them into the MUI theme without a per-line rewrite.
const WOOD_DARK = '#451a03';   // amber-950: the table's outer border color
const WOOD_MID = '#78350f';    // amber-900: button outline, divider accent
const WOOD_TRIM = '#fde68a';   // amber-200: warm hairline accents
const CREAM = '#fffaf0';       // floral white: sidebar surface
const FELT = '#15803d';        // emerald-700: the table's felt color
const FELT_LIGHT = '#d1fae5';  // emerald-100: chip background
const FELT_DARK = '#064e3b';   // emerald-900: chip text

const SPEED_OPTIONS: ReadonlyArray<{ key: Speed; label: string; tag: string }> = [
  { key: 'extraSlow', label: 'Extra Slow', tag: '3s' },
  { key: 'slow', label: 'Slow', tag: '1s' },
  { key: 'normal', label: 'Normal', tag: '.5s' },
  { key: 'fast', label: 'Fast', tag: '.2s' },
];

export function Sidebar() {
  const roundNumber = useGameStore((s) => s.roundNumber);
  const trickNumber = useGameStore((s) => s.trickNumber);
  const phase = useGameStore((s) => s.phase);
  const totalScores = useGameStore((s) => s.totalScores);
  const roundPoints = useGameStore((s) => s.roundPoints);
  const hands = useGameStore((s) => s.hands);
  const currentPlayer = useGameStore((s) => s.currentPlayer);
  const cpuSpeed = useGameStore((s) => s.cpuSpeed);

  const newGame = useGameStore((s) => s.newGame);
  const newRound = useGameStore((s) => s.newRound);
  const setSpeed = useGameStore((s) => s.setSpeed);

  const isPassing = phase === 'choosingPass' || phase === 'passAnimating';
  const isRoundOver = phase === 'roundOver';
  const isGameOver = phase === 'gameOver';

  return (
    <Paper
      sx={{
        borderRadius: '16px',
        background: CREAM,
        border: `2px solid ${WOOD_DARK}`,
        boxShadow: '0 4px 12px -2px rgba(69, 26, 3, 0.25)',
      }}
    >
      <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Box>
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, letterSpacing: '-0.025em', fontSize: 20, color: WOOD_DARK }}
          >
            Hearts
          </Typography>
          <Typography sx={{ mt: 0.5, fontSize: 12, color: WOOD_MID, opacity: 0.85 }}>
            Round {roundNumber}
          </Typography>
          <Chip
            label={isPassing ? 'Passing' : `Trick ${Math.min(trickNumber, 13)}`}
            size="small"
            sx={{
              mt: 1,
              width: '100%',
              borderRadius: 999,
              fontWeight: 600,
              fontSize: 12,
              background: FELT_LIGHT,
              color: FELT_DARK,
              border: `1px solid ${FELT}`,
            }}
          />
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={newRound}
            disabled={!isRoundOver || isGameOver}
            sx={{
              borderColor: WOOD_MID,
              color: WOOD_DARK,
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': { borderColor: WOOD_DARK, background: 'rgba(120, 53, 15, 0.04)' },
              '&.Mui-disabled': { borderColor: WOOD_TRIM, color: WOOD_TRIM },
            }}
          >
            Next Round
          </Button>
          <Button
            size="small"
            variant="contained"
            onClick={newGame}
            sx={{
              background: FELT,
              color: '#ffffff',
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
              '&:hover': { background: '#166534' },
            }}
          >
            New Game
          </Button>
        </Box>

        <Box sx={{ borderTop: `1px solid ${WOOD_TRIM}`, pt: 1.5 }}>
          <Typography sx={{ mb: 1, fontSize: 14, fontWeight: 700, color: WOOD_DARK }}>
            CPU speed
          </Typography>
          <ToggleButtonGroup
            value={cpuSpeed}
            exclusive
            onChange={(_, value: Speed | null) => {
              // ToggleButtonGroup fires onChange with null when the user clicks the
              // already-selected button. Ignore that — keeping a selection is the
              // correct UX here.
              if (value) setSpeed(value);
            }}
            fullWidth
            size="small"
            aria-label="CPU speed"
            sx={{
              '& .MuiToggleButton-root': {
                py: 0.5,
                textTransform: 'none',
                lineHeight: 1.1,
                color: WOOD_MID,
                borderColor: WOOD_TRIM,
                background: CREAM,
                '&:hover': { background: 'rgba(120, 53, 15, 0.04)' },
                '&.Mui-selected': {
                  color: FELT_DARK,
                  background: FELT_LIGHT,
                  borderColor: FELT,
                  '&:hover': { background: FELT_LIGHT },
                },
              },
            }}
          >
            {SPEED_OPTIONS.map((opt) => (
              <ToggleButton key={opt.key} value={opt.key} aria-label={`${opt.label} speed`}>
                <Stack alignItems="center" spacing={0}>
                  <Typography component="span" sx={{ fontSize: 11, fontWeight: 600 }}>
                    {opt.label}
                  </Typography>
                  <Typography component="span" sx={{ fontSize: 11, fontWeight: 400, opacity: 0.75 }}>
                    {opt.tag}
                  </Typography>
                </Stack>
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>

        <Box sx={{ borderTop: `1px solid ${WOOD_TRIM}`, pt: 1.5 }}>
          <Typography sx={{ fontSize: 14, fontWeight: 700, color: WOOD_DARK }}>
            Scoreboard
          </Typography>
          <Typography sx={{ mb: 1, fontSize: 11, color: WOOD_MID, opacity: 0.75 }}>
            Total score · round points
          </Typography>
          <Stack spacing={1}>
            {PLAYER_NAMES.map((name, i) => (
              <ScoreRow
                key={name}
                name={name}
                score={totalScores[i]}
                roundPoints={roundPoints[i]}
                cardCount={hands[i].length}
                active={currentPlayer === i && !isPassing && !isRoundOver && !isGameOver}
              />
            ))}
          </Stack>
        </Box>
      </Box>
    </Paper>
  );
}
