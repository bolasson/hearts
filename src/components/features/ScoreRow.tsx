/**
 * @module hearts
 * One row in the sidebar's scoreboard.
 *
 * Themed to match the sidebar's wood-and-felt palette. Default rows sit on a
 * cream surface; the current player's row gets an amber wash and outline so
 * it pops against the cream background without breaking the warm palette.
 */

import { Chip, Paper, Stack, Typography } from '@mui/material';

// Palette tokens — kept in sync with Sidebar.tsx. If these get touched in two
// places, lift them into a shared `src/theme.ts` palette extension.
const WOOD_DARK = '#451a03';
const WOOD_MID = '#78350f';
const CREAM = '#fffaf0';
const AMBER_GLOW = '#fef3c7';   // amber-100: active row background
const AMBER_RING = '#fcd34d';   // amber-300: active row outline

export type ScoreRowProps = {
  name: string;
  score: number;
  roundPoints: number;
  cardCount: number;
  active: boolean;
};

export function ScoreRow({ name, score, roundPoints, cardCount, active }: ScoreRowProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: '12px',
        px: 1.5,
        py: 1,
        boxShadow: '0 1px 2px 0 rgba(69, 26, 3, 0.08)',
        background: active ? AMBER_GLOW : CREAM,
        color: WOOD_DARK,
        outline: active ? `2px solid ${AMBER_RING}` : 'none',
        outlineOffset: active ? '-2px' : 0,
        transition: 'background 150ms, outline-color 150ms',
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
        <Typography component="span" sx={{ fontWeight: 700, fontSize: 12, color: WOOD_DARK }}>
          {name}
        </Typography>
        <Chip
          label={score}
          size="small"
          sx={{
            height: 'auto',
            borderRadius: 999,
            background: WOOD_DARK,
            color: '#ffffff',
            fontWeight: 700,
            fontSize: 12,
            '& .MuiChip-label': { px: 1, py: 0.25 },
          }}
        />
      </Stack>
      <Stack
        direction="row"
        justifyContent="space-between"
        sx={{ mt: 0.5, fontSize: 11, color: WOOD_MID, opacity: 0.85 }}
      >
        <Typography component="span" sx={{ fontSize: 11 }}>
          {roundPoints} round
        </Typography>
        <Typography component="span" sx={{ fontSize: 11 }}>
          {cardCount} cards
        </Typography>
      </Stack>
    </Paper>
  );
}
