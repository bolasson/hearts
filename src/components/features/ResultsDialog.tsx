/**
 * @module hearts
 * Results dialog. Opens whenever phase becomes 'gameOver' (either because
 * someone hit the target score during play, or because the human tapped
 * "Finish Game" from the settings drawer or the round-end dialog).
 *
 * Layout: a two-line headline at the top (winner declaration + optional
 * taunt when the human lost), the full scoreboard table below, and two
 * centered action buttons — Home on the left, New Game on the right.
 *
 * Backdrop click and Escape do nothing — this is a terminal state. The
 * player must choose New Game (resets phase) or Home (placeholder route).
 */

import { useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Stack,
  Typography,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { useNavigate } from 'react-router-dom';
import { MAIN_PLAYER, PLAYER_NAMES, type PlayerIndex } from '@/game/Players';
import type { ScoreTuple } from '@/state/useGameStore';
import { useGameStore } from '@/state/useGameStore';
import { usePlayerProfilesStore } from '@/state/usePlayerProfilesStore';
import { ScoreTable } from './ScoreTable';

const WOOD_DARK = '#451a03';
const WOOD_MID = '#78350f';
const CREAM = '#fffaf0';
const FELT = '#15803d';
const FELT_HOVER = '#166534';
const TAUNT_GREY = '#44403c'; // stone-700 — darker still for readability

/** Index of the player(s) with the lowest total. */
function gameWinners(totalScores: ScoreTuple): PlayerIndex[] {
  const min = Math.min(...totalScores);
  const winners: PlayerIndex[] = [];
  totalScores.forEach((s, i) => {
    if (s === min) winners.push(i as PlayerIndex);
  });
  return winners;
}

function humanPlace(totalScores: ScoreTuple): 1 | 2 | 3 | 4 {
  const humanScore = totalScores[MAIN_PLAYER];
  const minScore = Math.min(...totalScores);
  const maxScore = Math.max(...totalScores);
  if (humanScore === minScore) return 1;
  if (humanScore === maxScore) return 4;
  const scoresBelowHuman = new Set(totalScores.filter((score) => score < humanScore));
  return Math.min(4, scoresBelowHuman.size + 1) as 1 | 2 | 3 | 4;
}

/** Top headline: "{Winner} wins the game!" — handles ties. The human gets
 *  the second-person verb so it doesn't read as "You wins the game!". */
function winnerHeadline(totalScores: ScoreTuple): string {
  const winners = gameWinners(totalScores);
  if (winners.length === 1) {
    const w = winners[0];
    if (w === MAIN_PLAYER) return 'You win the game!';
    return `${PLAYER_NAMES[w]} wins the game!`;
  }
  if (winners.length === 2) {
    return `${PLAYER_NAMES[winners[0]]} and ${PLAYER_NAMES[winners[1]]} tie!`;
  }
  return `${winners.map((i) => PLAYER_NAMES[i]).join(', ')} tie!`;
}

/**
 * Taunt shown below the headline when the human is not among the winners.
 * Weighted by how badly the human lost.
 *  - Last place by a big margin → sharper taunt
 *  - Trailing pack             → milder line
 */
function tauntForLoser(totalScores: ScoreTuple): string {
  const humanScore = totalScores[MAIN_PLAYER];
  const others: number[] = [];
  totalScores.forEach((s, i) => {
    if (i !== MAIN_PLAYER) others.push(s);
  });
  const sortedOthers = [...others].sort((a, b) => a - b);
  const cpusBetter = others.filter((s) => s < humanScore).length;

  if (cpusBetter === 1) return 'So close — almost yours!';
  if (cpusBetter === 2) return "Couldn't quite seal the deal.";

  // Human is in last place: variants by gap from third place.
  const lossMargin = humanScore - sortedOthers[1];
  if (lossMargin >= 25) return 'Ouch — maybe try again?';
  if (lossMargin >= 10) return 'Better luck next time.';
  return 'Tough finish.';
}

export function ResultsDialog() {
  const navigate = useNavigate();
  const phase = useGameStore((s) => s.phase);
  const activeGameId = useGameStore((s) => s.activeGameId);
  const resultsDismissed = useGameStore((s) => s.resultsDismissed);
  const totalScores = useGameStore((s) => s.totalScores);
  const newGame = useGameStore((s) => s.newGame);
  const dismissResults = useGameStore((s) => s.dismissResults);
  const mainHumanProfileId = usePlayerProfilesStore((s) => s.mainHumanProfileId);
  const recordHumanGame = usePlayerProfilesStore((s) => s.recordHumanGame);
  const recordedGameKeyRef = useRef<string | null>(null);

  const open = phase === 'gameOver' && !resultsDismissed;
  const winners = gameWinners(totalScores);
  const headline = winnerHeadline(totalScores);
  const humanWon = winners.includes(MAIN_PLAYER);
  const taunt = humanWon ? null : tauntForLoser(totalScores);

  useEffect(() => {
    if (phase !== 'gameOver' || !mainHumanProfileId) return;
    const gameKey = activeGameId ?? `scores-${totalScores.join('-')}`;
    if (recordedGameKeyRef.current === gameKey) return;
    recordedGameKeyRef.current = gameKey;
    recordHumanGame(mainHumanProfileId, {
      playedAt: new Date().toISOString(),
      finalScore: totalScores[MAIN_PLAYER],
      place: humanPlace(totalScores),
    });
  }, [activeGameId, mainHumanProfileId, phase, recordHumanGame, totalScores]);

  const onHome = () => {
    dismissResults();
    navigate('/');
  };

  return (
    <Dialog
      open={open}
      onClose={() => { /* terminal state — dismiss via New Game */ }}
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
      <DialogContent sx={{ pt: { xs: 2.5, sm: 3 }, pb: 3, px: { xs: 1.5, sm: 3 } }}>
        <Stack alignItems="center" spacing={2}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              sx={{
                fontWeight: 700,
                color: WOOD_DARK,
                fontSize: { xs: 20, sm: 22 },
              }}
            >
              {headline}
            </Typography>
            {taunt && (
              <Typography
                sx={{
                  mt: 0.5,
                  color: TAUNT_GREY,
                  fontStyle: 'italic',
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                {taunt}
              </Typography>
            )}
          </Box>
          <ScoreTable />
        </Stack>
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
          startIcon={<HomeIcon />}
          onClick={onHome}
          sx={{
            borderColor: WOOD_MID,
            color: WOOD_DARK,
            textTransform: 'none',
            fontWeight: 600,
            '&:hover': { borderColor: WOOD_DARK, background: 'rgba(120, 53, 15, 0.06)' },
          }}
        >
          Home
        </Button>
        <Button
          variant="contained"
          startIcon={<RestartAltIcon />}
          onClick={newGame}
          sx={{
            background: FELT,
            color: '#ffffff',
            textTransform: 'none',
            fontWeight: 600,
            '&:hover': { background: FELT_HOVER },
          }}
        >
          New Game
        </Button>
      </DialogActions>
    </Dialog>
  );
}
